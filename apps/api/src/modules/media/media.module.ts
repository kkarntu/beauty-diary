import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { RequestUploadUrlHandler } from './application/commands/request-upload-url.handler';
import { MEDIA_STORAGE } from './domain/ports/media-storage';
import { S3MediaStorage } from './infrastructure/s3-media.storage';
import { MediaController } from './presentation/media.controller';

@Module({
  imports: [CqrsModule, AuthSharedModule],
  controllers: [MediaController],
  providers: [RequestUploadUrlHandler, { provide: MEDIA_STORAGE, useClass: S3MediaStorage }],
})
export class MediaModule {}
