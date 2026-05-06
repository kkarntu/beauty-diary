import type { Mailer } from '../../auth/domain/ports/mailer';
import type { EmailOutboxRepository } from '../domain/ports/outbox.repository';
import {
  BACKOFF_MS,
  MAX_ATTEMPTS,
  OutboxProcessorService,
} from './outbox-processor.service';

function makeEnv(isTest = false) {
  return { isTest } as { isTest: boolean };
}

function row(overrides: Partial<{ id: string; attempts: number }> = {}) {
  return {
    id: overrides.id ?? 'a',
    toEmail: 'to@example.com',
    subject: 'Subject',
    text: 'text',
    html: '<p>html</p>',
    attempts: overrides.attempts ?? 0,
  };
}

describe('OutboxProcessorService', () => {
  function setup(envIsTest = false) {
    const outbox: EmailOutboxRepository = {
      enqueue: jest.fn(),
      pickDuePending: jest.fn(),
      markSent: jest.fn().mockResolvedValue(undefined),
      scheduleRetry: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      listFailed: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      requeue: jest.fn().mockResolvedValue(true),
    };
    const mailer: Mailer = { send: jest.fn().mockResolvedValue(undefined) };
    const env = makeEnv(envIsTest);
    const svc = new OutboxProcessorService(
      outbox,
      mailer,
      env as unknown as ConstructorParameters<typeof OutboxProcessorService>[2],
    );
    return { svc, outbox, mailer };
  }

  it('drains due rows, sends each, and marks them sent', async () => {
    const { svc, outbox, mailer } = setup();
    (outbox.pickDuePending as jest.Mock).mockResolvedValueOnce([
      row({ id: 'a' }),
      row({ id: 'b' }),
    ]);

    await svc.tick();

    expect(mailer.send).toHaveBeenCalledTimes(2);
    expect(outbox.markSent).toHaveBeenCalledWith('a');
    expect(outbox.markSent).toHaveBeenCalledWith('b');
    expect(outbox.markFailed).not.toHaveBeenCalled();
    expect(outbox.scheduleRetry).not.toHaveBeenCalled();
  });

  it('schedules a retry on first SMTP failure with the configured backoff', async () => {
    const { svc, outbox, mailer } = setup();
    const before = Date.now();
    (outbox.pickDuePending as jest.Mock).mockResolvedValueOnce([row({ id: 'fail', attempts: 0 })]);
    (mailer.send as jest.Mock).mockRejectedValueOnce(new Error('connection refused'));

    await svc.tick();

    expect(outbox.scheduleRetry).toHaveBeenCalledTimes(1);
    expect(outbox.markFailed).not.toHaveBeenCalled();
    const [id, error, nextAt] = (outbox.scheduleRetry as jest.Mock).mock.calls[0] as [
      string,
      string,
      Date,
    ];
    expect(id).toBe('fail');
    expect(error).toBe('connection refused');
    const delta = nextAt.getTime() - before;
    // Within a generous window of the configured first backoff (1 minute).
    expect(delta).toBeGreaterThanOrEqual(BACKOFF_MS[0]! - 1000);
    expect(delta).toBeLessThanOrEqual(BACKOFF_MS[0]! + 1000);
  });

  it(`marks the row permanently failed after ${MAX_ATTEMPTS} attempts`, async () => {
    const { svc, outbox, mailer } = setup();
    (outbox.pickDuePending as jest.Mock).mockResolvedValueOnce([
      row({ id: 'gone', attempts: MAX_ATTEMPTS - 1 }),
    ]);
    (mailer.send as jest.Mock).mockRejectedValueOnce(new Error('still down'));

    await svc.tick();

    expect(outbox.markFailed).toHaveBeenCalledWith('gone', 'still down');
    expect(outbox.scheduleRetry).not.toHaveBeenCalled();
  });

  it('processes a mix — sends some, retries others — in a single tick', async () => {
    const { svc, outbox, mailer } = setup();
    (outbox.pickDuePending as jest.Mock).mockResolvedValueOnce([
      row({ id: 'fail', attempts: 1 }),
      row({ id: 'ok' }),
    ]);
    (mailer.send as jest.Mock)
      .mockRejectedValueOnce(new Error('temp glitch'))
      .mockResolvedValueOnce(undefined);

    await svc.tick();

    expect(outbox.scheduleRetry).toHaveBeenCalledWith(
      'fail',
      'temp glitch',
      expect.any(Date),
    );
    expect(outbox.markSent).toHaveBeenCalledWith('ok');
    expect(outbox.markFailed).not.toHaveBeenCalled();
  });

  it('is a no-op when NODE_ENV=test', async () => {
    const { svc, outbox, mailer } = setup(true);
    await svc.tick();
    expect(outbox.pickDuePending).not.toHaveBeenCalled();
    expect(mailer.send).not.toHaveBeenCalled();
  });
});
