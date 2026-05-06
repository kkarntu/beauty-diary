export interface PresignedUpload {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  uploadHeaders: Record<string, string>;
  expiresInSeconds: number;
}

export interface CreateUploadInput {
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds: number;
}

export interface MediaStorage {
  createPresignedUpload(input: CreateUploadInput): Promise<PresignedUpload>;
}

export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE');
