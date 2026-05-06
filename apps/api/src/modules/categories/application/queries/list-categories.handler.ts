import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from '../../domain/ports/category.repository';
import { ListCategoriesQuery, type ListCategoriesResult } from './list-categories.query';

@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler
  implements IQueryHandler<ListCategoriesQuery, ListCategoriesResult>
{
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository) {}

  async execute(): Promise<ListCategoriesResult> {
    const all = await this.categories.findAll();
    return all.map((c) => {
      const s = c.toSnapshot();
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        coverImageUrl: s.coverImageUrl,
        sortOrder: s.sortOrder,
      };
    });
  }
}
