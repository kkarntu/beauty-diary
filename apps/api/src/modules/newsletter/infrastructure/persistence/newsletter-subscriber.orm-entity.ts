import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'newsletter_subscribers' })
export class NewsletterSubscriberOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text', { unique: true })
  email!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
