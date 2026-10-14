import { BadRequestException, Body, Controller, Get, Headers, Injectable, Module, NotFoundException, Param, Post, Query, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import {createHash, timingSafeEqual} from 'node:crypto';
import { Pool, type QueryResultRow } from 'pg';

type Court = {
  id: string; name: string; slug: string; court_type: string;
  address: string | null; phone: string | null; email: string | null;
  official_url: string | null; verified_at: Date; source_url?: string | null;
};
type SearchCourt = Court & { region_slug: string; region_name: string };
type Region = { slug: string; name: string; court_count: number };
const COURT_KINDS = new Set([
  'constitutional','supreme','general-magistrate','general-district',
  'general-regional','general-appeal','general-cassation','military-garrison',
  'military-district','military-appeal','military-cassation',
  'arbitration-subject','arbitration-appeal','arbitration-district','arbitration-ip'
]);

function editorAuth(header:string|undefined):void {
  const configured=process.env.EDITOR_API_TOKEN;
  if(!configured || configured.length<32 || !header?.startsWith('Bearer ')) {
    throw new UnauthorizedException('EDITOR_ACCESS_DENIED');
  }
  const received=header.slice(7);
  if(received.length>512)throw new UnauthorizedException('EDITOR_ACCESS_DENIED');
  const left=createHash('sha256').update(configured,'utf8').digest();
  const right=createHash('sha256').update(received,'utf8').digest();
  if(!timingSafeEqual(left,right))throw new UnauthorizedException('EDITOR_ACCESS_DENIED');
}

const pool = new Pool({connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000});

@Injectable()
class CourtsService {
  private async query<T extends QueryResultRow>(sql: string, args: unknown[] = []): Promise<T[]> {
    if(!process.env.DATABASE_URL)throw new ServiceUnavailableException('COURTS_DATABASE_NOT_CONFIGURED');
    try {
      const {rows}=await pool.query<T>(sql,args);
      return rows;
    } catch {
      throw new ServiceUnavailableException('COURTS_DATA_UNAVAILABLE');
    }
  }
  async health() {
    await this.query<{value:number}>('SELECT 1::integer AS value');
    return {status:'ok',database:'reachable'};
  }
  async editorOverview() {
    const [verified, queues, sources, byRegion, items, intake, quality] = await Promise.all([
      this.query<{published:number;stale:number}>(
        "SELECT count(*)::integer AS published," +
        "count(*) FILTER (WHERE verified_at < now()-interval '180 days')::integer AS stale " +
        "FROM courts WHERE status='verified'"),
      this.query<{kind:string;count:number}>(`
        SELECT 'court_profiles' AS kind,count(*)::integer AS count FROM court_profile_candidates WHERE status='pending'
        UNION ALL SELECT 'judge_appointments',count(*)::integer FROM judicial_appointment_candidates WHERE status='pending'
        UNION ALL SELECT 'staff_rosters',count(*)::integer FROM court_staff_roster_rows WHERE review_status='pending'
        UNION ALL SELECT 'staff_roster_diffs',count(*)::integer FROM court_staff_roster_diff_items WHERE review_status='pending'
        UNION ALL SELECT 'registry_diffs',count(*)::integer FROM court_registry_diff_items WHERE review_status='pending'
        UNION ALL SELECT 'source_changes',count(*)::integer FROM court_source_watch_events WHERE status='pending'
        UNION ALL SELECT 'contact_deltas',count(*)::integer FROM court_contact_change_events WHERE review_status='pending'
        UNION ALL SELECT 'case_references',count(*)::integer FROM court_case_candidates WHERE status='pending'
      `),
      this.query<{enabled:number;overdue:number;failed:number;last_checked:Date|null}>(`
        SELECT count(*) FILTER(WHERE enabled)::integer AS enabled,
        count(*) FILTER(WHERE enabled AND next_check_at<now())::integer AS overdue,
        count(*) FILTER(WHERE enabled AND last_error IS NOT NULL)::integer AS failed,
        max(checked_at) AS last_checked FROM court_source_watch
      `),
      this.query<{code:string;name:string;published:number}>(`
        SELECT r.code,r.name,count(c.id)::integer AS published
        FROM regions r JOIN courts c ON c.region_id=r.id AND c.status='verified'
        GROUP BY r.code,r.name ORDER BY r.name LIMIT 120
      `),
      this.query<{kind:string;item_id:string;court:string;field:string;value:string;source_url:string;observed_at:Date}>(`
        SELECT * FROM (
          SELECT 'court_profiles'::text AS kind,p.id::text AS item_id,
            c.name::text AS court,p.field_name::text AS field,
            left(p.proposed_value,350)::text AS value,s.url::text AS source_url,
            p.observed_at FROM court_profile_candidates p
            JOIN courts c ON c.id=p.court_id JOIN sources s ON s.id=p.source_id
            WHERE p.status='pending' ORDER BY p.observed_at DESC LIMIT 15
        ) profile
        UNION ALL
        SELECT * FROM (
          SELECT 'judge_appointments'::text, p.id::text,c.name::text,
            p.position::text,left(p.full_name,350)::text,s.url::text,p.observed_at
            FROM judicial_appointment_candidates p
            JOIN courts c ON c.id=p.court_id JOIN sources s ON s.id=p.source_id
            WHERE p.status='pending' ORDER BY p.observed_at DESC LIMIT 15
        ) judge
        UNION ALL
        SELECT * FROM (
          SELECT 'registry_diffs'::text,i.id::text,
            i.external_code::text,i.field_name::text,
            left(COALESCE(i.old_value,'')||' → '||COALESCE(i.new_value,''),350)::text,
            s.url::text,r.created_at
            FROM court_registry_diff_items i
            JOIN court_registry_diff_runs r ON r.id=i.run_id JOIN sources s ON s.id=r.source_id
            WHERE i.review_status='pending' ORDER BY r.created_at DESC LIMIT 15
        ) diff
        UNION ALL
        SELECT * FROM (
          SELECT 'source_changes'::text,e.id::text,c.name::text,
            w.scope::text,left(e.new_sha256,64)::text,w.watch_url::text,e.detected_at
            FROM court_source_watch_events e
            JOIN court_source_watch w ON w.id=e.watch_id JOIN courts c ON c.id=w.court_id
            WHERE e.status='pending' ORDER BY e.detected_at DESC LIMIT 15
        ) source
        UNION ALL
        SELECT * FROM (
          SELECT 'staff_roster_diffs'::text,d.id::text,
            ('Состав судей: '||d.full_name)::text,
            (d.change_kind||' / '||d.field_name)::text,
            left(COALESCE(d.old_value,'')||' → '||COALESCE(d.new_value,''),350)::text,
            s.url::text,r.created_at
            FROM court_staff_roster_diff_items d
            JOIN court_staff_roster_diff_runs r ON r.id=d.run_id
            JOIN court_staff_roster_batches b ON b.id=r.newer_batch_id
            JOIN sources s ON s.id=b.source_id
            WHERE d.review_status='pending' ORDER BY r.created_at DESC LIMIT 15
        ) roster
        UNION ALL
        SELECT * FROM (
          SELECT 'contact_deltas'::text,e.id::text,c.name::text,
            (e.contact_kind||' / '||e.change_kind)::text,
            left(e.contact_key||' — '||COALESCE(e.source_context,''),350)::text,
            s.source_url::text,e.created_at
            FROM court_contact_change_events e
            JOIN court_contact_snapshots s ON s.id=e.newer_snapshot_id
            JOIN court_source_watch w ON w.id=s.watch_id
            JOIN courts c ON c.id=w.court_id
            WHERE e.review_status='pending' ORDER BY e.created_at DESC LIMIT 15
        ) contacts
        ORDER BY observed_at DESC LIMIT 60
      `),
      this.query<{id:string;finished_at:Date;handled:number;failed:number;manifest_count:number}>(`
        SELECT id::text,finished_at,handled,failed,manifest_count
        FROM court_intake_runs ORDER BY id DESC LIMIT 10
      `),
      this.query<{with_identifier:number;with_address:number;with_phone:number;
        with_email:number;with_official_url:number;with_hours:number;with_jurisdiction:number;
        with_current_judge:number;with_case:number;with_facade:number;with_recent_coordinates:number}>(`
        SELECT
          count(*) FILTER(WHERE EXISTS (
            SELECT 1 FROM court_external_identifiers i WHERE i.court_id=c.id))::integer AS with_identifier,
          count(*) FILTER(WHERE c.address IS NOT NULL AND length(trim(c.address))>0)::integer AS with_address,
          count(*) FILTER(WHERE c.phone IS NOT NULL AND length(trim(c.phone))>0)::integer AS with_phone,
          count(*) FILTER(WHERE c.email IS NOT NULL AND length(trim(c.email))>0)::integer AS with_email,
          count(*) FILTER(WHERE c.official_url IS NOT NULL)::integer AS with_official_url,
          count(*) FILTER(WHERE EXISTS (
            SELECT 1 FROM court_profile_fields p
            WHERE p.court_id=c.id AND p.field_name IN ('reception_hours','office_hours')))::integer AS with_hours,
          count(*) FILTER(WHERE EXISTS (
            SELECT 1 FROM court_profile_fields p
            WHERE p.court_id=c.id AND p.field_name='jurisdiction_url'))::integer AS with_jurisdiction,
          count(*) FILTER(WHERE EXISTS (
            SELECT 1 FROM judicial_appointments a JOIN sources s ON s.id=a.source_id
            WHERE a.court_id=c.id AND (a.ends_on IS NULL OR a.ends_on>=CURRENT_DATE)
              AND s.checked_at>now()-interval '90 days'))::integer AS with_current_judge,
          count(*) FILTER(WHERE EXISTS (
            SELECT 1 FROM court_case_references d WHERE d.court_id=c.id))::integer AS with_case,
          count(*) FILTER(WHERE EXISTS (
            SELECT 1 FROM court_facade_media m
            WHERE m.court_id=c.id AND m.status='approved'))::integer AS with_facade,
          count(*) FILTER(WHERE EXISTS (
            SELECT 1 FROM court_profile_fields p
            WHERE p.court_id=c.id AND p.field_name='coordinates'
              AND p.verified_at>now()-interval '180 days'))::integer AS with_recent_coordinates
        FROM courts c WHERE c.status='verified'
      `)
    ]);
    return {
      generated_at:new Date().toISOString(),
      public_courts:verified[0]??{published:0,stale:0},
      review_queues:queues, source_monitor:sources[0]??{enabled:0,overdue:0,failed:0,last_checked:null},
      by_region:byRegion, recent_review_items:items, intake_recent_runs:intake,
      quality_metrics:quality[0]??{
        with_identifier:0,with_address:0,with_phone:0,with_email:0,
        with_official_url:0,with_hours:0,with_jurisdiction:0,
        with_current_judge:0,with_case:0,with_facade:0,with_recent_coordinates:0
      },
      warning:'Counts describe measured verified-card fields, not nationwide completeness or validity of external sources.'
    };
  }
  async pendingDiscoveries(requestedPage:unknown) {
    const rawPage=requestedPage===undefined?'1':requestedPage;
    if(typeof rawPage!=='string' || !/^[1-9][0-9]{0,3}$/.test(rawPage)){
      throw new BadRequestException('INVALID_PAGE_NUMBER');
    }
    const page=Number(rawPage);
    const pageSize=50;
    const rows=await this.query<{total:number;items:unknown[]}>(`
      WITH latest AS (
        SELECT DISTINCT ON (b.registry,r.row_key)
          r.id::text AS discovery_id,b.id::text AS batch_id,b.registry,
          r.row_key,r.court_name,r.court_kind,r.region_code,r.region_name,
          r.external_code,r.official_court_url,r.source_record_url,r.address,
          r.review_status,b.captured_on::text AS captured_on,
          b.created_at,s.url AS list_source_url
        FROM court_discovery_rows r
        JOIN court_discovery_batches b ON b.id=r.batch_id
        JOIN sources s ON s.id=b.source_id
        ORDER BY b.registry,r.row_key,b.created_at DESC,b.id DESC,r.id DESC
      ),
      pending AS (SELECT * FROM latest WHERE review_status='pending'),
      total AS (SELECT count(*)::integer AS count FROM pending),
      selected AS (
        SELECT * FROM pending ORDER BY created_at DESC,discovery_id DESC
        LIMIT $1 OFFSET $2
      )
      SELECT total.count AS total,
        COALESCE(jsonb_agg(to_jsonb(selected)
            ORDER BY selected.created_at DESC,selected.discovery_id DESC)
          FILTER (WHERE selected.discovery_id IS NOT NULL),'[]'::jsonb) AS items
      FROM total LEFT JOIN selected ON TRUE GROUP BY total.count
    `,[pageSize,(page-1)*pageSize]);
    return {items:rows[0]?.items??[],total:rows[0]?.total??0,page,pageSize,
      note:'Unverified preliminary discovery observations; may overlap across registries and snapshots.'};
  }
  async pendingCourtCandidates(requestedPage:unknown) {
    // Latest record for each (source, court code); do not count obsolete
    // historical snapshots as distinct courts or publish candidates here.
    const rawPage=requestedPage===undefined?'1':requestedPage;
    if(typeof rawPage!=='string' || !/^[1-9][0-9]{0,3}$/.test(rawPage)){
      throw new BadRequestException('INVALID_PAGE_NUMBER');
    }
    const page=Number(rawPage);
    const pageSize=50;
    const rows=await this.query<{total:number;items:unknown[]}>(`
      WITH latest AS (
        SELECT DISTINCT ON (b.source_id,i.external_code)
          i.id::text AS candidate_id,b.id::text AS batch_id,
          i.external_code,i.court_name,i.court_type,i.address,
          i.phone,i.email,i.official_url,i.review_status,
          s.url AS source_url,s.source_type,
          b.snapshot_captured_on::text AS captured_on,
          b.primary_snapshot_sha256 AS snapshot_sha256,
          b.snapshot_use_attested AS source_rights_attested,
          b.staged_at
        FROM court_import_rows i
        JOIN court_import_batches b ON b.id=i.batch_id
        JOIN sources s ON s.id=b.source_id
        ORDER BY b.source_id,i.external_code,b.staged_at DESC,b.id DESC,i.id DESC
      ),
      pending AS (
        SELECT * FROM latest WHERE review_status='pending'
      ),
      total AS (SELECT count(*)::integer AS count FROM pending),
      selected AS (
        SELECT * FROM pending ORDER BY staged_at DESC,candidate_id DESC
        LIMIT $1 OFFSET $2
      )
      SELECT total.count AS total,
        COALESCE(jsonb_agg(to_jsonb(selected)
            ORDER BY selected.staged_at DESC,selected.candidate_id DESC)
          FILTER (WHERE selected.candidate_id IS NOT NULL),'[]'::jsonb) AS items
      FROM total LEFT JOIN selected ON TRUE
      GROUP BY total.count
    `,[pageSize,(page-1)*pageSize]);
    return {items:rows[0]?.items??[],total:rows[0]?.total??0,page,pageSize,
      note:'Unverified latest source snapshots only. Read-only; publication requires independent editorial approval.'};
  }
  async acknowledgeEvidenceSignal(kind:string,id:string,body:unknown){
    // This API acknowledges an observation only. It never approves a court,
    // alters an appointment, or applies proposed values to public facts.
    const reviewTables:Record<string,string>={
      staff_roster_diffs:'court_staff_roster_diff_items',
      registry_diffs:'court_registry_diff_items',
      source_changes:'court_source_watch_events',
      contact_deltas:'court_contact_change_events'
    };
    if(!Object.prototype.hasOwnProperty.call(reviewTables,kind)){
      throw new NotFoundException('REVIEW_KIND_UNSUPPORTED');
    }
    if(!/^[1-9][0-9]{0,14}$/.test(id) || !body || typeof body!=='object' || Array.isArray(body)){
      throw new BadRequestException('INVALID_REVIEW_REQUEST');
    }
    const {decision,reviewer,attested}=body as Record<string,unknown>;
    if((decision!=='reviewed' && decision!=='ignored') || attested!==true ||
       typeof reviewer!=='string' || reviewer.trim().length<3 || reviewer.trim().length>120){
      throw new BadRequestException('INVALID_REVIEW_REQUEST');
    }
    // Table names are static server-side literals from the allowlist above.
    // Decision/reviewer/id are bound query parameters.
    const table=reviewTables[kind];
    const statusColumn=kind==='source_changes'?'status':'review_status';
    const result=await this.query<{id:string}>(
      `UPDATE ${table} SET ${statusColumn}=$1,reviewed_by=$2,reviewed_at=now()
       WHERE id=$3 AND ${statusColumn}='pending' RETURNING id::text`,
      [decision,reviewer.trim(),id]
    );
    if(result.length===0)throw new NotFoundException('REVIEW_ITEM_NOT_PENDING');
    return {id:result[0].id,kind,status:decision,publications:0,appointments_mutated:0};
  }
  async sitemapCourts(){
    return this.query<{region_slug:string;slug:string;updated_at:Date}>(
      'SELECT r.slug AS region_slug,c.slug,c.updated_at FROM courts c ' +
      'JOIN regions r ON r.id=c.region_id ' +
      "WHERE c.status='verified' AND c.address IS NOT NULL AND c.official_url IS NOT NULL " +
      "AND c.verified_at > now()-interval '180 days' " +
      'AND EXISTS (SELECT 1 FROM court_facts f JOIN sources s ON s.id=f.source_id ' +
      'WHERE f.court_id=c.id AND f.is_approved=true AND s.url IS NOT NULL) ' +
      'ORDER BY c.updated_at DESC,c.id LIMIT 50000'
    );
  }
  async regions(): Promise<Region[]> {
    return this.query<Region>(
      'SELECT r.slug, r.name, count(c.id)::integer AS court_count ' +
      "FROM regions r INNER JOIN courts c ON c.region_id=r.id AND c.status='verified' " +
      'GROUP BY r.id,r.slug,r.name ORDER BY r.name'
    );
  }
  async list(regionSlug:string):Promise<Court[]> {
    return this.query<Court>(
      'SELECT c.id::text,c.name,c.slug,c.court_type,c.address,c.phone,c.email,c.official_url,c.verified_at ' +
      'FROM courts c JOIN regions r ON r.id=c.region_id ' +
      "WHERE r.slug=$1 AND c.status='verified' ORDER BY c.name LIMIT 500",
      [regionSlug]
    );
  }
  async byRegion(regionSlug:string, requestedPage:unknown) {
    if(!/^[a-z0-9-]{1,100}$/.test(regionSlug)) {
      throw new BadRequestException('INVALID_REGION_SLUG');
    }
    const pageString=requestedPage===undefined?'1':requestedPage;
    if(typeof pageString!=='string' || !/^[1-9][0-9]{0,3}$/.test(pageString)) {
      throw new BadRequestException('INVALID_PAGE_NUMBER');
    }
    const page=Number(pageString);
    const pageSize=50;
    const counts=await this.query<{total:string}>(
      'SELECT count(*)::text AS total FROM courts c ' +
      'JOIN regions r ON r.id=c.region_id ' +
      "WHERE c.status='verified' AND r.slug=$1",
      [regionSlug]
    );
    const total=Number(counts[0]?.total??'0');
    const items=await this.query<Court>(
      'SELECT c.id::text,c.name,c.slug,c.court_type,c.address,c.phone,c.email,c.official_url,c.verified_at ' +
      'FROM courts c JOIN regions r ON r.id=c.region_id ' +
      "WHERE c.status='verified' AND r.slug=$1 " +
      'ORDER BY c.name,c.id LIMIT $2 OFFSET $3',
      [regionSlug,pageSize,(page-1)*pageSize]
    );
    return {items,total,page,pageSize};
  }
  async one(regionSlug:string,courtSlug:string) {
    const courts=await this.query<Court & {region_name:string;court_kind:string}>(
      'SELECT c.id::text,c.name,c.slug,c.court_type,c.court_kind,c.address,c.phone,c.email,c.official_url,c.verified_at, ' +
      'r.name AS region_name, ' +
      '(SELECT s.url FROM court_facts cf JOIN sources s ON s.id=cf.source_id ' +
      'WHERE cf.court_id=c.id AND cf.is_approved=true ORDER BY cf.id DESC LIMIT 1) AS source_url ' +
      'FROM courts c JOIN regions r ON r.id=c.region_id ' +
      "WHERE r.slug=$1 AND c.slug=$2 AND c.status='verified' LIMIT 1",
       [regionSlug,courtSlug]
    );
    if(!courts.length)throw new NotFoundException('COURT_NOT_FOUND');
    const court=courts[0];
    const [fields,judges,photos,changes,contactSources,caseReferences,identifiers]=await Promise.all([
      this.query<{field_name:string;value:string;verified_at:Date;source_url:string}>(
        'SELECT f.field_name,f.value,f.verified_at,s.url AS source_url ' +
        'FROM court_profile_fields f JOIN sources s ON s.id=f.source_id ' +
        'WHERE f.court_id=$1 ORDER BY f.field_name', [court.id]),
      this.query<{full_name:string;position:string;starts_on:string|null;source_url:string}>(
        'SELECT j.full_name,a.position,a.starts_on::text,s.url AS source_url ' +
        'FROM judicial_appointments a JOIN judges j ON j.id=a.judge_id ' +
        'JOIN sources s ON s.id=a.source_id WHERE a.court_id=$1 ' +
        'AND (a.ends_on IS NULL OR a.ends_on>=CURRENT_DATE) ' +
        "AND s.checked_at > now()-interval '90 days' " +
        'ORDER BY a.position,j.full_name LIMIT 80', [court.id]),
      this.query<{image_path:string;author:string;license_name:string;license_url:string;source_url:string}>(
        'SELECT image_path,author,license_name,license_url,source_url ' +
        'FROM court_facade_media WHERE court_id=$1 AND status=$2 ' +
        'ORDER BY verified_at DESC LIMIT 1',[court.id,'approved']),
      this.query<{changed_field:string;old_value:string|null;new_value:string|null;occurred_at:Date}>(
        'SELECT changed_field,old_value,new_value,occurred_at ' +
        'FROM change_events WHERE entity_type=$1 AND entity_id=$2 ' +
        "AND changed_field IN ('name','address','phone','email','official_url','reception_hours','office_hours','transport','accessibility') " +
        'ORDER BY occurred_at DESC LIMIT 12', ['court',court.id]),
      this.query<{field_name:string;source_url:string;retrieved_at:Date}>(
        'SELECT DISTINCT ON(f.field_name) f.field_name,s.url AS source_url,f.retrieved_at ' +
        'FROM court_facts f JOIN sources s ON s.id=f.source_id ' +
        "WHERE f.court_id=$1 AND f.is_approved=true AND f.field_name IN ('name','address','phone','email','official_url') " +
        'ORDER BY f.field_name,f.retrieved_at DESC,f.id DESC', [court.id]),
      this.query<{case_uid:string;case_number:string;page_url:string;verified_at:Date}>(
        'SELECT case_uid,case_number,page_url,verified_at ' +
        'FROM court_case_references WHERE court_id=$1 ' +
        'ORDER BY verified_at DESC,id DESC LIMIT 20',[court.id]),
      this.query<{registry:string;external_code:string}>(
        'SELECT registry,external_code FROM court_external_identifiers ' +
        'WHERE court_id=$1 ORDER BY registry',[court.id])
    ]);
    let coords:{latitude:number;longitude:number}|null=null;
    const rawCoordinates=fields.find(field=>field.field_name==='coordinates');
    if(rawCoordinates){
      try{
        const data=JSON.parse(rawCoordinates.value) as {latitude:number;longitude:number};
        if(Number.isFinite(data.latitude) && Number.isFinite(data.longitude) &&
          data.latitude>=-90 && data.latitude<=90 && data.longitude>=-180 && data.longitude<=180){
          coords={latitude:data.latitude,longitude:data.longitude};
        }
      }catch{ /* Never show location without validated coordinates */ }
    }
    return {...court,fields:fields.filter(f=>f.field_name!=='coordinates'),
      coordinates:coords,coordinate_source_url:rawCoordinates?.source_url??null,
      coordinate_verified_at:rawCoordinates?.verified_at??null,
      judges,photo:photos[0]??null,changes,contact_sources:contactSources,cases:caseReferences,identifiers};
  }
  async byKind(kind:string, requestedPage:unknown) {
    if(!COURT_KINDS.has(kind))throw new NotFoundException('COURT_CATEGORY_NOT_FOUND');
    const pageString=requestedPage===undefined?'1':requestedPage;
    if(typeof pageString!=='string' || !/^[1-9][0-9]{0,3}$/.test(pageString)) {
      throw new BadRequestException('INVALID_PAGE_NUMBER');
    }
    const page=Number(pageString);
    const pageSize=50;
    const totalRows=await this.query<{total:string}>(
      'SELECT count(*)::text AS total FROM courts WHERE status=$1 AND court_kind=$2',
      ['verified',kind]
    );
    const total=Number(totalRows[0]?.total??'0');
    const items=await this.query<SearchCourt>(
      'SELECT c.id::text,c.name,c.slug,c.court_type,c.address,c.phone,c.email,c.official_url,c.verified_at, ' +
      'r.slug AS region_slug,r.name AS region_name ' +
      'FROM courts c JOIN regions r ON r.id=c.region_id ' +
      "WHERE c.status='verified' AND c.court_kind=$1 ORDER BY r.name,c.name,c.id LIMIT $2 OFFSET $3",
      [kind,pageSize,(page-1)*pageSize]
    );
    return {items,total,page,pageSize};
  }
  async search(term:unknown):Promise<SearchCourt[]> {
    if(typeof term!=='string' || term.trim().length<2 || term.trim().length>100) {
      throw new BadRequestException('SEARCH_QUERY_INVALID');
    }
    const needle=term.trim();
    return this.query<SearchCourt>(
      'SELECT c.id::text,c.name,c.slug,c.court_type,c.address,c.phone,c.email,c.official_url,c.verified_at, ' +
      'r.slug AS region_slug,r.name AS region_name ' +
      'FROM courts c JOIN regions r ON r.id=c.region_id ' +
      "WHERE c.status='verified' AND (" +
      'position(lower($1) in lower(c.name))>0 OR ' +
      "position(lower($1) in lower(coalesce(c.address,'')))>0 OR " +
      'position(lower($1) in lower(r.name))>0 OR ' +
      'EXISTS (SELECT 1 FROM court_external_identifiers i ' +
      'WHERE i.court_id=c.id AND position(lower($1) in lower(i.external_code))>0)) ' +
      'ORDER BY CASE ' +
      'WHEN lower(c.name)=lower($1) THEN 0 ' +
      'WHEN EXISTS (SELECT 1 FROM court_external_identifiers i ' +
      'WHERE i.court_id=c.id AND lower(i.external_code)=lower($1)) THEN 1 ' +
      'WHEN position(lower($1) in lower(c.name))=1 THEN 2 ELSE 3 END, ' +
      'c.name,r.name,c.id LIMIT 25',
      [needle]
    );
  }
}

@Controller()
class CourtsController {
  constructor(private readonly service:CourtsService) {}
  @Get('health') health(){return this.service.health();}
  @Get('internal/editor/discoveries') discoveries(
    @Headers('authorization') authorization:string|undefined,
    @Query('page') page:unknown
  ){
    editorAuth(authorization);
    return this.service.pendingDiscoveries(page);
  }
  @Get('internal/editor/court-candidates') courtCandidates(
    @Headers('authorization') authorization:string|undefined,
    @Query('page') page:unknown
  ){
    editorAuth(authorization);
    return this.service.pendingCourtCandidates(page);
  }
  @Get('internal/editor/overview') overview(@Headers('authorization') authorization:string|undefined){
    editorAuth(authorization);
    return this.service.editorOverview();
  }
  @Post('internal/editor/roster-diffs/:id/review')
  rosterReview(@Headers('authorization') auth:string|undefined,@Param('id') id:string,@Body() payload:unknown){
    editorAuth(auth);
    return this.service.acknowledgeEvidenceSignal('staff_roster_diffs',id,payload);
  }
  @Post('internal/editor/signals/:kind/:id/review')
  signalReview(@Headers('authorization') auth:string|undefined,@Param('kind') kind:string,
    @Param('id') id:string,@Body() payload:unknown){
    editorAuth(auth);
    return this.service.acknowledgeEvidenceSignal(kind,id,payload);
  }
  @Get('regions') regions(){return this.service.regions();}
  @Get('courts/sitemap') sitemap(){return this.service.sitemapCourts();}
  @Get('courts/categories/:kind') byKind(@Param('kind') kind:string,@Query('page') page:unknown){return this.service.byKind(kind,page);}
  @Get('courts/search') search(@Query('q') q:unknown){return this.service.search(q);}
  @Get('regions/:region/courts') list(@Param('region') region:string){return this.service.list(region);}
  @Get('regions/:region/courts/page') regionPage(@Param('region') region:string,@Query('page') page:unknown){return this.service.byRegion(region,page);}
  @Get('regions/:region/courts/:court') one(@Param('region') region:string,@Param('court') court:string){
    return this.service.one(region,court);
  }
}
@Module({controllers:[CourtsController],providers:[CourtsService]})
export class AppModule {}
