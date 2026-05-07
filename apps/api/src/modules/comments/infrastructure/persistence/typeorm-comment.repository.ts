import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../domain/comment.entity';
import type { CommentListRow, CommentRepository } from '../../domain/ports/comment.repository';
import { CommentMapper } from '../mappers/comment.mapper';
import { CommentOrmEntity } from './comment.orm-entity';

interface ListSqlRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: Date;
  edited_at: Date | null;
  deleted_at: Date | null;
  author_id: string;
  author_nickname: string;
  author_avatar_url: string | null;
}

@Injectable()
export class TypeOrmCommentRepository implements CommentRepository {
  constructor(
    @InjectRepository(CommentOrmEntity)
    private readonly repo: Repository<CommentOrmEntity>,
  ) {}

  async findById(id: string): Promise<Comment | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? CommentMapper.toDomain(row) : null;
  }

  async save(comment: Comment): Promise<void> {
    const s = comment.toSnapshot();
    const orm: CommentOrmEntity = Object.assign(new CommentOrmEntity(), {
      id: s.id,
      postId: s.postId,
      authorId: s.authorId,
      parentId: s.parentId,
      content: s.content,
      editedAt: s.editedAt,
      deletedAt: s.deletedAt,
      createdAt: s.createdAt,
    });
    await this.repo.upsert(orm, ['id']);
  }

  async listByPostId(postId: string): Promise<CommentListRow[]> {
    const sql = `
      SELECT
        c.id, c.post_id, c.parent_id,
        CASE WHEN c.deleted_at IS NULL THEN c.content ELSE '[deleted]' END AS content,
        c.created_at, c.edited_at, c.deleted_at,
        u.id AS author_id, u.nickname AS author_nickname, u.avatar_url AS author_avatar_url
      FROM comments c
      INNER JOIN users u ON u.id = c.author_id
      WHERE c.post_id = $1
      ORDER BY c.created_at DESC
    `;
    const rows = (await this.repo.query(sql, [postId])) as ListSqlRow[];
    return rows.map((row) => ({
      id: row.id,
      postId: row.post_id,
      parentId: row.parent_id,
      content: row.content,
      createdAt: row.created_at,
      editedAt: row.edited_at,
      author: {
        id: row.author_id,
        nickname: row.author_nickname,
        avatarUrl: row.author_avatar_url,
      },
    }));
  }
}
