import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { CategoryDto } from '@beauty-diary/shared';
import {
  ListCategoriesQuery,
  type ListCategoriesResult,
} from '../application/queries/list-categories.query';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(): Promise<CategoryDto[]> {
    return this.queryBus.execute<ListCategoriesQuery, ListCategoriesResult>(
      new ListCategoriesQuery(),
    );
  }
}
