import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { type PostListResponseDto, PostListQueryDto } from '@beauty-diary/shared';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import {
  FavoritePostCommand,
  LikePostCommand,
  UnfavoritePostCommand,
  UnlikePostCommand,
} from '../application/commands/like-post.command';
import {
  ListFavoritesQuery,
  type ListFavoritesResult,
} from '../application/queries/list-favorites.query';

@Controller()
@UseGuards(AuthGuard)
export class ReactionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Put('posts/:id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async like(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') postId: string,
  ): Promise<void> {
    await this.commandBus.execute(new LikePostCommand(user.id, postId));
  }

  @Delete('posts/:id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlike(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') postId: string,
  ): Promise<void> {
    await this.commandBus.execute(new UnlikePostCommand(user.id, postId));
  }

  @Put('posts/:id/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  async favorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') postId: string,
  ): Promise<void> {
    await this.commandBus.execute(new FavoritePostCommand(user.id, postId));
  }

  @Delete('posts/:id/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') postId: string,
  ): Promise<void> {
    await this.commandBus.execute(new UnfavoritePostCommand(user.id, postId));
  }

  @Get('me/favorites')
  async myFavorites(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(PostListQueryDto)) query: PostListQueryDto,
  ): Promise<PostListResponseDto> {
    return this.queryBus.execute<ListFavoritesQuery, ListFavoritesResult>(
      new ListFavoritesQuery(user.id, query.page, query.pageSize),
    );
  }
}
