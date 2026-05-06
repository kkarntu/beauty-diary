import { Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'post_tags' })
@Index('idx_post_tags_tag_post', ['tagId', 'postId'])
export class PostTagOrmEntity {
  @PrimaryColumn({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId!: string;
}
