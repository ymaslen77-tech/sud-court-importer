import { BadRequestException, Controller, Get, Injectable, Module, NotFoundException, Param, Query, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';

type Court = {
  id: string; name: string; slug: string; court_type: string;
  address: string | null; phone: string | null; email: string | null;
  official_url: string | null; verified_at: Date;
};
type SearchCourt = Court & { region_slug: string; region_name: string };
type Region = { slug: string; name: string; court_count: number };
const pool = new Pool({connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000});

@Injectable()
class CourtsService {
  private async query<T>(sql: string, args: unknown[] = []): Promise<T[]> {
    try {
      const {rows}=await pool.query<T>(sql,args);
      return rows;
    } catch {
      throw new ServiceUnavailableException('COURTS_DATA_UNAVAILABLE');
    }
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
  async one(regionSlug:string,courtSlug:string):Promise<Court> {
    const courts=await this.query<Court>(
      'SELECT c.id::text,c.name,c.slug,c.court_type,c.address,c.phone,c.email,c.official_url,c.verified_at ' +
      'FROM courts c JOIN regions r ON r.id=c.region_id ' +
      "WHERE r.slug=$1 AND c.slug=$2 AND c.status='verified' LIMIT 1",
       [regionSlug,courtSlug]
    );
    if(!courts.length)throw new NotFoundException('COURT_NOT_FOUND');
    return courts[0];
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
  @Get('regions') regions(){return this.service.regions();}
  @Get('courts/search') search(@Query('q') q:unknown){return this.service.search(q);}
  @Get('regions/:region/courts') list(@Param('region') region:string){return this.service.list(region);}
  @Get('regions/:region/courts/:court') one(@Param('region') region:string,@Param('court') court:string){
    return this.service.one(region,court);
  }
}
@Module({controllers:[CourtsController],providers:[CourtsService]})
export class AppModule {}
