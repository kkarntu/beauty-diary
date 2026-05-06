import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { type PublicUserDto, UpdateProfileDto } from '@beauty-diary/shared';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { OptionalAuthGuard } from '../../auth/presentation/guards/optional-auth.guard';
import { UpdateProfileCommand } from '../application/commands/update-profile.command';
import {
  GetUserByIdQuery,
  type GetUserByIdResult,
} from '../application/queries/get-user-by-id.query';
import {
  GetUserByNicknameQuery,
  type GetUserByNicknameResult,
} from '../application/queries/get-user-by-nickname.query';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateProfileDto)) body: UpdateProfileDto,
  ): Promise<PublicUserDto> {
    await this.commandBus.execute(new UpdateProfileCommand(user.id, body));
    return this.queryBus.execute<GetUserByIdQuery, GetUserByIdResult>(
      new GetUserByIdQuery(user.id),
    );
  }

  @Get(':nickname')
  @UseGuards(OptionalAuthGuard)
  async getByNickname(
    @CurrentUser() viewer: AuthenticatedUser | undefined,
    @Param('nickname') nickname: string,
  ): Promise<PublicUserDto> {
    return this.queryBus.execute<GetUserByNicknameQuery, GetUserByNicknameResult>(
      new GetUserByNicknameQuery(nickname, viewer?.id),
    );
  }
}
