import { Controller, Get, Injectable, Module, Param, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';

type Court = { id: string; name: string; slug: string; court_type: string; address: string | null; verified_at: Date };
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });

@Injectable()
class CourtsService {
  async list(regionSlug: string): Promise<Court[]> {
    try {
      const { rows } = await pool.query<Court>(
        `SELECT c.id::text, c.name, c.slug, c.court_type, c.address, c.verified_at
         FROM courts c JOIN regions r ON r.id=c.region_id
         WHERE r.slug=$1 AND c.status='verified' ORDER BY c.name LIMIT 500`, [regionSlug]);
      return rows;
    } catch {
      throw new ServiceUnavailableException('COURTS_DATA_UNAVAILABLE');
    }
  }
  async one(regionSlug: string, courtSlug: string): Promise<Court> {
    try {
      const { rows } = await pool.query<Court>(
        `SELECT c.id::text, c.name, c.slug, c.court_type, c.address, c.verified_at
         FROM courts c JOIN regions r ON r.id=c.region_id
         WHERE r.slug=$1 AND c.slug=$2 AND c.status='verified' LIMIT 1`,
        [regionSlug, courtSlug]);
      if (!rows.length) throw new NotFoundException('COURT_NOT_FOUND');
      return rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException('COURTS_DATA_UNAVAILABLE');
    }
  }
}

@Controller()
class CourtsController {
  constructor(private readonly service: CourtsService) {}
  @Get('health')
  health() { return { status: 'ok' }; }
  @Get('regions/:region/courts')
  list(@Param('region') region: string) { return this.service.list(region); }
  @Get('regions/:region/courts/:court')
  one(@Param('region') region: string, @Param('court') court: string) {
    return this.service.one(region, court);
  }
}
@Module({ controllers: [CourtsController], providers: [CourtsService] })
export class AppModule {}
