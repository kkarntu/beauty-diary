import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { PostsModule } from '../posts/posts.module';
import {
  FavoritePostHandler,
  LikePostHandler,
  UnfavoritePostHandler,
  UnlikePostHandler,
} from './application/commands/reaction.handlers';
import { ListFavoritesHandler } from './application/queries/list-favorites.handler';
import { REACTION_REPOSITORY } from './domain/ports/reaction.repository';
import { PostFavoriteOrmEntity } from './infrastructure/persistence/post-favorite.orm-entity';
import { PostLikeOrmEntity } from './infrastructure/persistence/post-like.orm-entity';
import { TypeOrmReactionRepository } from './infrastructure/persistence/typeorm-reaction.repository';
import { ReactionsController } from './presentation/reactions.controller';

const commandHandlers = [
  LikePostHandler,
  UnlikePostHandler,
  FavoritePostHandler,
  UnfavoritePostHandler,
];
const queryHandlers = [ListFavoritesHandler];

@Module({
  imports: [
    CqrsModule,
    AuthSharedModule,
    PostsModule,
    TypeOrmModule.forFeature([PostLikeOrmEntity, PostFavoriteOrmEntity]),
  ],
  controllers: [ReactionsController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    { provide: REACTION_REPOSITORY, useClass: TypeOrmReactionRepository },
  ],
})
export class ReactionsModule {}
