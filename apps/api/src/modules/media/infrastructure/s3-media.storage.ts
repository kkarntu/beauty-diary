import { Injectable, type OnModuleInit } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EnvService } from '../../../config/env.service';
import type {
  CreateUploadInput,
  MediaStorage,
  PresignedUpload,
} from '../domain/ports/media-storage';

@Injectable()
export class S3MediaStorage implements MediaStorage, OnModuleInit {
  private client!: S3Client;
  private bucket!: string;
  private publicUrlBase!: string;

  constructor(private readonly env: EnvService) {}

  onModuleInit(): void {
    const cfg = this.env.s3;
    this.client = new S3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
      forcePathStyle: cfg.forcePathStyle,
      // AWS SDK v3 defaults to adding x-amz-checksum-* headers to presigned
      // PUTs. The browser cannot reproduce these headers when uploading,
      // so the signed request fails with 400. Opt out for browser uploads.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    this.bucket = cfg.bucket;
    // Trim trailing slash so we can join cleanly with `/${key}`
    this.publicUrlBase = cfg.publicUrl.replace(/\/$/, '');
  }

  async createPresignedUpload(input: CreateUploadInput): Promise<PresignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds,
    });

    return {
      key: input.key,
      uploadUrl,
      publicUrl: `${this.publicUrlBase}/${input.key}`,
      uploadHeaders: {
        'Content-Type': input.contentType,
        'Content-Length': String(input.contentLength),
      },
      expiresInSeconds: input.expiresInSeconds,
    };
  }
}
