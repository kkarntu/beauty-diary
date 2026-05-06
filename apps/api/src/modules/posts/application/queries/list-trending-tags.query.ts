import type { TrendingTagDto } from '@beauty-diary/shared';

export class ListTrendingTagsQuery {
  constructor(public readonly limit: number) {}
}

export type ListTrendingTagsResult = TrendingTagDto[];
