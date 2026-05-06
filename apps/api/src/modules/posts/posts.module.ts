import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { CategoriesModule } from '../categories/categories.module';
import { CreatePostHandler } from './application/commands/create-post.handler';
import { DeletePostHandler } from './application/commands/delete-post.handler';
import { ArchivePostHandler, PublishPostHandler } from './application/commands/publish-post.handler';
import { UpdatePostHandler } from './application/commands/update-post.handler';
import { GetPostBySlugHandler } from './application/queries/get-post-by-slug.handler';
import { ListPostsHandler } from './application/queries/list-posts.handler';
import { PostStatsBroadcastHandler } from './application/events/post-stats-broadcast.handler';
import { ListTrendingTagsHandler } from './application/queries/list-trending-tags.handler';
import { HTML_SANITIZER } from './domain/ports/html-sanitizer';
import { POST_REPOSITORY } from './domain/ports/post.repository';
import { TAG_REPOSITORY } from './domain/ports/tag.repository';
import { SanitizeHtmlSanitizer } from './infrastructure/sanitize-html.sanitizer';
import { PostOrmEntity } from './infrastructure/persistence/post.orm-entity';
import { PostTagOrmEntity } from './infrastructure/persistence/post-tag.orm-entity';
import { TagOrmEntity } from './infrastructure/persistence/tag.orm-entity';
import { TypeOrmPostRepository } from './infrastructure/persistence/typeorm-post.repository';
import { TypeOrmTagRepository } from './infrastructure/persistence/typeorm-tag.repository';
import { PostsController } from './presentation/posts.controller';
import { TagsController } from './presentation/tags.controller';

const commandHandlers = [
  CreatePostHandler,
  UpdatePostHandler,
  DeletePostHandler,
  PublishPostHandler,
  ArchivePostHandler,
];
const queryHandlers = [GetPostBySlugHandler, ListPostsHandler, ListTrendingTagsHandler];

@Module({
  imports: [
    CqrsModule,
    AuthSharedModule,
    CategoriesModule,
    TypeOrmModule.forFeature([PostOrmEntity, TagOrmEntity, PostTagOrmEntity]),
  ],
  controllers: [PostsController, TagsController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    PostStatsBroadcastHandler,
    { provide: POST_REPOSITORY, useClass: TypeOrmPostRepository },
    { provide: TAG_REPOSITORY, useClass: TypeOrmTagRepository },
    { provide: HTML_SANITIZER, useClass: SanitizeHtmlSanitizer },
  ],
  exports: [POST_REPOSITORY],
})
export class PostsModule {}
