import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { PostsModule } from '../posts/posts.module';
import { CreateCommentHandler } from './application/commands/create-comment.handler';
import { DeleteCommentHandler } from './application/commands/delete-comment.handler';
import { UpdateCommentHandler } from './application/commands/update-comment.handler';
import { CommentCreatedBroadcastHandler } from './application/events/comment-created-broadcast.handler';
import { ListCommentsByPostHandler } from './application/queries/list-comments-by-post.handler';
import { COMMENT_REPOSITORY } from './domain/ports/comment.repository';
import { CommentOrmEntity } from './infrastructure/persistence/comment.orm-entity';
import { TypeOrmCommentRepository } from './infrastructure/persistence/typeorm-comment.repository';
import { CommentsController } from './presentation/comments.controller';

const commandHandlers = [CreateCommentHandler, UpdateCommentHandler, DeleteCommentHandler];
const queryHandlers = [ListCommentsByPostHandler];

@Module({
  imports: [
    CqrsModule,
    AuthSharedModule,
    PostsModule,
    TypeOrmModule.forFeature([CommentOrmEntity]),
  ],
  controllers: [CommentsController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    CommentCreatedBroadcastHandler,
    { provide: COMMENT_REPOSITORY, useClass: TypeOrmCommentRepository },
  ],
  exports: [COMMENT_REPOSITORY],
})
export class CommentsModule {}
