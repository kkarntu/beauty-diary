import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let queryFn: jest.Mock;

  beforeEach(async () => {
    queryFn = jest.fn();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getDataSourceToken(),
          useValue: { query: queryFn },
        },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('returns ok when the database is reachable', async () => {
    queryFn.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('ok');
    expect(typeof result.uptimeSeconds).toBe('number');
  });

  it('returns degraded when the database is unreachable', async () => {
    queryFn.mockRejectedValue(new Error('connection refused'));

    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('fail');
  });
});
