import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { v7 as uuidv7 } from 'uuid';
import * as path from 'node:path';
import { MEDIA_STORAGE, type MediaStorage } from '../../domain/ports/media-storage';
import {
  RequestUploadUrlCommand,
  type RequestUploadUrlResult,
} from './request-upload-url.command';

const UPLOAD_TTL_SECONDS = 600;

function sanitizeFilename(name: string): string {
  // Strip directory traversal, replace whitespace, drop anything not in
  // [A-Za-z0-9._-]. Keep the extension. Tidy up dashes around dots.
  const base = path.basename(name);
  return (
    base
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/-?\.-?/g, '.')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'upload'
  );
}

@CommandHandler(RequestUploadUrlCommand)
export class RequestUploadUrlHandler
  implements ICommandHandler<RequestUploadUrlCommand, RequestUploadUrlResult>
{
  constructor(@Inject(MEDIA_STORAGE) private readonly storage: MediaStorage) {}

  async execute(cmd: RequestUploadUrlCommand): Promise<RequestUploadUrlResult> {
    const safe = sanitizeFilename(cmd.filename);
    const key = `users/${cmd.userId}/${uuidv7()}-${safe}`;

    const upload = await this.storage.createPresignedUpload({
      key,
      contentType: cmd.contentType,
      contentLength: cmd.byteSize,
      expiresInSeconds: UPLOAD_TTL_SECONDS,
    });

    return {
      key: upload.key,
      uploadUrl: upload.uploadUrl,
      publicUrl: upload.publicUrl,
      uploadHeaders: upload.uploadHeaders,
      expiresInSeconds: upload.expiresInSeconds,
    };
  }
}
