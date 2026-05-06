import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { TrendingTagDto } from '@beauty-diary/shared';
import {
  ListTrendingTagsQuery,
  type ListTrendingTagsResult,
} from '../application/queries/list-trending-tags.query';

@Controller('tags')
export class TagsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('trending')
  async trending(@Query('limit') limitRaw?: string): Promise<TrendingTagDto[]> {
    const limit = Number(limitRaw) > 0 ? Number(limitRaw) : 8;
    return this.queryBus.execute<ListTrendingTagsQuery, ListTrendingTagsResult>(
      new ListTrendingTagsQuery(limit),
    );
  }
}
