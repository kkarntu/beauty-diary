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
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { type CommentDto, CreateCommentDto, UpdateCommentDto } from '@beauty-diary/shared';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import {
  CreateCommentCommand,
  type CreateCommentResult,
} from '../application/commands/create-comment.command';
import { DeleteCommentCommand } from '../application/commands/delete-comment.command';
import { UpdateCommentCommand } from '../application/commands/update-comment.command';
import {
  ListCommentsByPostQuery,
  type ListCommentsByPostResult,
} from '../application/queries/list-comments-by-post.query';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
    @Body(new ZodValidationPipe(CreateCommentDto)) body: CreateCommentDto,
  ): Promise<{ id: string }> {
    return this.commandBus.execute<CreateCommentCommand, CreateCommentResult>(
      new CreateCommentCommand(user.id, postId, body.parentId ?? null, body.content),
    );
  }

  @Get()
  async list(@Param('postId') postId: string): Promise<CommentDto[]> {
    return this.queryBus.execute<ListCommentsByPostQuery, ListCommentsByPostResult>(
      new ListCommentsByPostQuery(postId),
    );
  }

  @Patch(':commentId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('commentId') commentId: string,
    @Body(new ZodValidationPipe(UpdateCommentDto)) body: UpdateCommentDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateCommentCommand(commentId, user.id, user.role, body.content),
    );
  }

  @Delete(':commentId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteCommentCommand(commentId, user.id, user.role));
  }
}
