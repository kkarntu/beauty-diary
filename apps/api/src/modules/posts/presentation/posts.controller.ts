import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreatePostDto,
  type PostDetailDto,
  type PostListResponseDto,
  PostListQueryDto,
  UpdatePostDto,
} from '@beauty-diary/shared';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { OptionalAuthGuard } from '../../auth/presentation/guards/optional-auth.guard';
import {
  CreatePostCommand,
  type CreatePostResult,
} from '../application/commands/create-post.command';
import { DeletePostCommand } from '../application/commands/delete-post.command';
import { ArchivePostCommand, PublishPostCommand } from '../application/commands/publish-post.command';
import { UpdatePostCommand } from '../application/commands/update-post.command';
import {
  GetPostBySlugQuery,
  type GetPostBySlugResult,
} from '../application/queries/get-post-by-slug.query';
import { ListPostsQuery, type ListPostsResult } from '../application/queries/list-posts.query';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreatePostDto)) body: CreatePostDto,
  ): Promise<{ id: string; slug: string }> {
    return this.commandBus.execute<CreatePostCommand, CreatePostResult>(
      new CreatePostCommand(
        user.id,
        body.title,
        body.contentHtml,
        body.categoryId,
        body.tagSlugs,
        body.excerpt ?? null,
        body.coverImageUrl ?? null,
        body.status,
        body.allowComments,
        body.showInFeed,
      ),
    );
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  async list(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query(new ZodValidationPipe(PostListQueryDto)) query: PostListQueryDto,
  ): Promise<PostListResponseDto> {
    // `mine` and `status` only take effect for an authenticated viewer
    // and only narrow that viewer's own posts — never another author's.
    const ownAuthorId = query.mine && user ? user.id : undefined;
    const status = ownAuthorId ? query.status : undefined;

    return this.queryBus.execute<ListPostsQuery, ListPostsResult>(
      new ListPostsQuery(
        query.page,
        query.pageSize,
        query.sort,
        query.categorySlug,
        query.tagSlug,
        query.authorNickname,
        user?.id,
        query.q,
        ownAuthorId,
        status,
      ),
    );
  }

  @Get(':slug')
  @UseGuards(OptionalAuthGuard)
  async getBySlug(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('slug') slug: string,
  ): Promise<PostDetailDto> {
    return this.queryBus.execute<GetPostBySlugQuery, GetPostBySlugResult>(
      new GetPostBySlugQuery(slug, user?.id),
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePostDto)) body: UpdatePostDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdatePostCommand(id, user.id, user.role, {
        title: body.title,
        excerpt: body.excerpt,
        contentHtml: body.contentHtml,
        coverImageUrl: body.coverImageUrl,
        categoryId: body.categoryId,
        tagSlugs: body.tagSlugs,
        allowComments: body.allowComments,
        showInFeed: body.showInFeed,
      }),
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeletePostCommand(id, user.id, user.role));
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.commandBus.execute(new PublishPostCommand(id, user.id, user.role));
  }

  @Post(':id/archive')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.commandBus.execute(new ArchivePostCommand(id, user.id, user.role));
  }
}
