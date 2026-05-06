'use client';

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  type UploadUrlResponseDto,
} from '@beauty-diary/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/lib/api';

export class UploadValidationError extends Error {
  constructor(public readonly code: 'mime' | 'size') {
    super(code);
  }
}

/**
 * Two-step image upload:
 *   1. POST /api/media/upload-url → backend returns a presigned PUT URL.
 *   2. PUT the file directly to R2 / LocalStack — the browser bypasses our
 *      API entirely, so large files don't tie up the Node process.
 */
export function useImageUpload() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (
        !ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])
      ) {
        throw new UploadValidationError('mime');
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new UploadValidationError('size');
      }

      const res = await api.post<UploadUrlResponseDto>('/api/media/upload-url', {
        filename: file.name,
        contentType: file.type,
        byteSize: file.size,
      });
      const { uploadUrl, publicUrl, uploadHeaders } = res.data;

      // Browsers refuse to let us set Content-Length manually — they
      // compute it themselves. Strip it from the headers we forward.
      const { 'Content-Length': _contentLength, ...safeHeaders } = uploadHeaders;
      void _contentLength;

      // Upload directly to R2 / LocalStack. Don't send our app's cookies.
      await axios.put(uploadUrl, file, {
        headers: safeHeaders,
        withCredentials: false,
      });

      return publicUrl;
    },
  });
}
