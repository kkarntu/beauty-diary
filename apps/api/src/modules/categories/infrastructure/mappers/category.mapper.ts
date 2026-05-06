import { Category } from '../../domain/category.entity';
import { CategoryOrmEntity } from '../persistence/category.orm-entity';

export class CategoryMapper {
  static toDomain(orm: CategoryOrmEntity): Category {
    return Category.rehydrate({
      id: orm.id,
      slug: orm.slug,
      name: orm.name,
      description: orm.description,
      coverImageUrl: orm.coverImageUrl,
      sortOrder: orm.sortOrder,
    });
  }
}
