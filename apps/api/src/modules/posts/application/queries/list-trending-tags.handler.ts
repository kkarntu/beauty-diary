import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TAG_REPOSITORY, type TagRepository } from '../../domain/ports/tag.repository';
import {
  ListTrendingTagsQuery,
  type ListTrendingTagsResult,
} from './list-trending-tags.query';

@QueryHandler(ListTrendingTagsQuery)
export class ListTrendingTagsHandler
  implements IQueryHandler<ListTrendingTagsQuery, ListTrendingTagsResult>
{
  constructor(@Inject(TAG_REPOSITORY) private readonly tags: TagRepository) {}

  async execute(query: ListTrendingTagsQuery): Promise<ListTrendingTagsResult> {
    const limit = Math.max(1, Math.min(50, query.limit));
    const rows = await this.tags.findTrending(limit);
    return rows.map((r) => ({ slug: r.slug, name: r.name, postCount: r.postCount }));
  }
}
