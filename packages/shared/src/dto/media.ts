import { z } from 'zod';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const RequestUploadUrlDto = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  byteSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});
export type RequestUploadUrlDto = z.infer<typeof RequestUploadUrlDto>;

export const UploadUrlResponseDto = z.object({
  /** Object key inside the bucket. Persist this with the resource. */
  key: z.string(),
  /** Presigned PUT URL — client uploads bytes directly here. */
  uploadUrl: z.string().url(),
  /** Public URL where the asset will be served from after upload. */
  publicUrl: z.string().url(),
  /** Required headers the client must send with the PUT. */
  uploadHeaders: z.record(z.string()),
  expiresInSeconds: z.number().int(),
});
export type UploadUrlResponseDto = z.infer<typeof UploadUrlResponseDto>;
