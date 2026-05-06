import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  checks: {
    database: 'ok' | 'fail';
  };
}

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async check(): Promise<HealthResponse> {
    let database: 'ok' | 'fail' = 'fail';
    try {
      await this.dataSource.query('SELECT 1');
      database = 'ok';
    } catch {
      database = 'fail';
    }

    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database },
    };
  }
}
