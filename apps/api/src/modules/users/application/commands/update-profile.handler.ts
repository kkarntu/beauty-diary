import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { UserNotFoundError } from '../../domain/user.errors';
import { UpdateProfileCommand } from './update-profile.command';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand, void> {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(cmd: UpdateProfileCommand): Promise<void> {
    const user = await this.users.findById(cmd.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    user.updateProfile(cmd.input);
    await this.users.save(user);
  }
}
