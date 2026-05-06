import { Reflector } from '@nestjs/core';
import type { UserRole } from '@beauty-diary/shared';

export const Roles = Reflector.createDecorator<UserRole[]>();
