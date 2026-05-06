import type { UpdateProfileInput } from '../../domain/user.entity';

export class UpdateProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly input: UpdateProfileInput,
  ) {}
}
