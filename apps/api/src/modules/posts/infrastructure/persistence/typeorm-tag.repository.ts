import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Tag } from '../../domain/tag.entity';
import type { TagRepository, TrendingTagRow } from '../../domain/ports/tag.repository';
import { slugifyTag } from '../slug.util';
import { TagOrmEntity } from './tag.orm-entity';

@Injectable()
export class TypeOrmTagRepository implements TagRepository {
  constructor(
    @InjectRepository(TagOrmEntity)
    private readonly repo: Repository<TagOrmEntity>,
  ) {}

  async findOrCreateMany(slugs: string[]): Promise<Tag[]> {
    const cleaned = Array.from(new Set(slugs.map((s) => slugifyTag(s)).filter(Boolean)));
    if (cleaned.length === 0) return [];

    const existing = await this.repo.find({ where: { slug: In(cleaned) } });
    const existingSlugs = new Set(existing.map((t) => t.slug));

    const toInsert = cleaned
      .filter((s) => !existingSlugs.has(s))
      .map((slug) => {
        const orm = new TagOrmEntity();
        orm.id = uuidv7();
        orm.slug = slug;
        orm.name = slug;
        return orm;
      });

    if (toInsert.length > 0) {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(TagOrmEntity)
        .values(toInsert)
        .orIgnore()
        .execute();
    }

    const all = await this.repo.find({ where: { slug: In(cleaned) } });
    return all.map((row) => Tag.rehydrate({ id: row.id, slug: row.slug, name: row.name }));
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const row = await this.repo.findOne({ where: { slug: slugifyTag(slug) } });
    return row ? Tag.rehydrate({ id: row.id, slug: row.slug, name: row.name }) : null;
  }

  async findTrending(limit: number): Promise<TrendingTagRow[]> {
    const rows = (await this.repo.query(
      `
      SELECT t.slug, t.name, COUNT(pt.post_id)::int AS post_count
      FROM tags t
      INNER JOIN post_tags pt ON pt.tag_id = t.id
      INNER JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
      GROUP BY t.id, t.slug, t.name
      ORDER BY post_count DESC, t.name ASC
      LIMIT $1
    `,
      [limit],
    )) as Array<{ slug: string; name: string; post_count: number }>;

    return rows.map((r) => ({ slug: r.slug, name: r.name, postCount: r.post_count }));
  }
}
