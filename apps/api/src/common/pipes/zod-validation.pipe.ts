import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors/domain.errors';

/**
 * Validates an incoming payload against a Zod schema.
 *
 * Usage:
 *   @Body(new ZodValidationPipe(RegisterDto)) body: RegisterDto
 *
 * Lets us reuse the schemas from @beauty-diary/shared so client and server
 * validate against the same rules.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _meta: ArgumentMetadata): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      throw new ValidationError(message);
    }
    return parsed.data;
  }
}
