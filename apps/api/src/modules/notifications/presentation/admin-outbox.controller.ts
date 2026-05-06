import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import {
  EMAIL_OUTBOX_REPOSITORY,
  type EmailOutboxRepository,
} from '../domain/ports/outbox.repository';

interface FailedOutboxResponse {
  items: Array<{
    id: string;
    toEmail: string;
    subject: string;
    attempts: number;
    lastError: string | null;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

@Controller('admin/email-outbox')
@UseGuards(AuthGuard, RolesGuard)
@Roles(['admin'])
export class AdminOutboxController {
  constructor(@Inject(EMAIL_OUTBOX_REPOSITORY) private readonly outbox: EmailOutboxRepository) {}

  @Get('failed')
  async listFailed(
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ): Promise<FailedOutboxResponse> {
    const page = Math.max(1, Number(pageRaw) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw) || 50));
    const offset = (page - 1) * pageSize;
    const { items, total } = await this.outbox.listFailed(pageSize, offset);
    return {
      items: items.map((r) => ({
        id: r.id,
        toEmail: r.toEmail,
        subject: r.subject,
        attempts: r.attempts,
        lastError: r.lastError,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.NO_CONTENT)
  async retry(@Param('id') id: string): Promise<void> {
    await this.outbox.requeue(id);
  }
}
