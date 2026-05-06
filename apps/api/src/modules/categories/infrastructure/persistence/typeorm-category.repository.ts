import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../domain/category.entity';
import type { CategoryRepository } from '../../domain/ports/category.repository';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryOrmEntity } from './category.orm-entity';

@Injectable()
export class TypeOrmCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
  ) {}

  async findAll(): Promise<Category[]> {
    const rows = await this.repo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
    return rows.map(CategoryMapper.toDomain);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.repo.findOne({ where: { slug } });
    return row ? CategoryMapper.toDomain(row) : null;
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? CategoryMapper.toDomain(row) : null;
  }
}
