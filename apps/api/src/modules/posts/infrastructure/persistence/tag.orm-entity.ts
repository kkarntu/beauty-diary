import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'tags' })
@Index('uq_tags_slug', ['slug'], { unique: true })
export class TagOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'citext' })
  slug!: string;

  @Column({ type: 'text' })
  name!: string;
}
