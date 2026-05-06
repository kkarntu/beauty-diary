import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RequestUploadUrlDto, type UploadUrlResponseDto } from '@beauty-diary/shared';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import {
  RequestUploadUrlCommand,
  type RequestUploadUrlResult,
} from '../application/commands/request-upload-url.command';

@Controller('media')
@UseGuards(AuthGuard)
export class MediaController {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Returns a presigned URL the client can PUT bytes to directly. The
   * server never proxies the file — it just authorises the upload and
   * tells the client where it'll be served from after.
   */
  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(RequestUploadUrlDto)) body: RequestUploadUrlDto,
  ): Promise<UploadUrlResponseDto> {
    return this.commandBus.execute<RequestUploadUrlCommand, RequestUploadUrlResult>(
      new RequestUploadUrlCommand(user.id, body.filename, body.contentType, body.byteSize),
    );
  }
}
