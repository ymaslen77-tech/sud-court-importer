import { BadRequestException, Controller, Get, Headers, Injectable, Module, NotFoundException, Param, Query, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
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
    try {
      const {rows}=await pool.query<T>(sql,args);
      return rows;
    } catch {
      throw new ServiceUnavailableException('COURTS_DATA_UNAVAILABLE');
    }
  }
  async editorOverview() {
    const [verified, queues, sources, byRegion] = await Promise.all([
      this.query<{published:number;stale:number}>(
        "SELECT count(*)::integer AS published," +
        "count(*) FILTER (WHERE verified_at < now()-interval '180 days')::integer AS stale " +
        "FROM courts WHERE status='verified'"),
      this.query<{kind:string;count:number}>(`
        SELECT 'court_profiles' AS kind,count(*)::integer AS count FROM court_profile_candidates WHERE status='pending'
        UNION ALL SELECT 'judge_appointments',count(*)::integer FROM judicial_appointment_candidates WHERE status='pending'
        UNION ALL SELECT 'staff_rosters',count(*)::integer FROM court_staff_roster_rows WHERE review_status='pending'
        UNION ALL SELECT 'registry_diffs',count(*)::integer FROM court_registry_diff_items WHERE review_status='pending'
        UNION ALL SELECT 'source_changes',count(*)::integer FROM court_source_watch_events WHERE status='pending'
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
      `)
    ]);
    return {
      generated_at:new Date().toISOString(),
      public_courts:verified[0]??{published:0,stale:0},
      review_queues:queues, source_monitor:sources[0]??{enabled:0,overdue:0,failed:0,last_checked:null},
      by_region:byRegion,
      warning:'Counts describe editorial workflow, not verified completeness of courts across Russia.'
    };
  }
  async sitemapCourts(){
    return this.query<{region_slug:string;slug:string;updated_at:Date}>(
      'SELECT r.slug AS region_slug,c.slug,c.updated_at FROM courts c ' +
      'JOIN regions r ON r.id=c.region_id ' +
      "WHERE c.status='verified' AND c.address IS NOT NULL AND c.official_url IS NOT NULL " +
      "AND c.verified_at > now()-interval '180 days' " +
      'AND EXISTS (SELECT 1 FROM court_facts f JOIN sources s ON s.id=f.source_id ' +
      'WHERE f.court_id=c.id AND f.is_approved=true AND s.url IS NOT NULL) ' +
      'ORDER BY c.updated_at DESC,c.id LIMIT 5000'
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
    const [fields,judges,photos,changes,contactSources,caseReferences]=await Promise.all([
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
        'ORDER BY verified_at DESC,id DESC LIMIT 20',[court.id])
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
      judges,photo:photos[0]??null,changes,contact_sources:contactSources,cases:caseReferences};
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
    return this.query<SearchCourt>(
      'SELECT c.id::text,c.name,c.slug,c.court_type,c.address,c.phone,c.email,c.official_url,c.verified_at, ' +
      'r.slug AS region_slug,r.name AS region_name ' +
      'FROM courts c JOIN regions r ON r.id=c.region_id ' +
      "WHERE c.status='verified' AND position(lower($1) in lower(c.name))>0 " +
      'ORDER BY c.name,r.name LIMIT 25',
      [term.trim()]
    );
  }
}

@Controller()
class CourtsController {
  constructor(private readonly service:CourtsService) {}
  @Get('health') health(){return {status:'ok'};}
  @Get('internal/editor/overview') overview(@Headers('authorization') authorization:string|undefined){
    editorAuth(authorization);
    return this.service.editorOverview();
  }
  @Get('regions') regions(){return this.service.regions();}
  @Get('courts/sitemap') sitemap(){return this.service.sitemapCourts();}
  @Get('courts/categories/:kind') byKind(@Param('kind') kind:string,@Query('page') page:unknown){return this.service.byKind(kind,page);}
  @Get('courts/search') search(@Query('q') q:unknown){return this.service.search(q);}
  @Get('regions/:region/courts') list(@Param('region') region:string){return this.service.list(region);}
  @Get('regions/:region/courts/:court') one(@Param('region') region:string,@Param('court') court:string){
    return this.service.one(region,court);
  }
}
@Module({controllers:[CourtsController],providers:[CourtsService]})
export class AppModule {}
