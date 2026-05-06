import { Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import {
  FollowUserCommand,
  UnfollowUserCommand,
} from '../application/commands/follow-user.command';

@Controller('users/:nickname/follow')
@UseGuards(AuthGuard)
export class FollowsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async follow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    await this.commandBus.execute(new FollowUserCommand(user.id, nickname));
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nickname') nickname: string,
  ): Promise<void> {
    await this.commandBus.execute(new UnfollowUserCommand(user.id, nickname));
  }
}
