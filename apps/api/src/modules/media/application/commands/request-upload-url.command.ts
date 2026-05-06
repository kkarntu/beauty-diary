import type { UploadUrlResponseDto } from '@beauty-diary/shared';

export class RequestUploadUrlCommand {
  constructor(
    public readonly userId: string,
    public readonly filename: string,
    public readonly contentType: string,
    public readonly byteSize: number,
  ) {}
}

export type RequestUploadUrlResult = UploadUrlResponseDto;
