export interface CategorySnapshot {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  sortOrder: number;
}

export class Category {
  private constructor(private readonly state: CategorySnapshot) {}

  static rehydrate(snapshot: CategorySnapshot): Category {
    return new Category(snapshot);
  }

  get id(): string {
    return this.state.id;
  }

  get slug(): string {
    return this.state.slug;
  }

  get name(): string {
    return this.state.name;
  }

  toSnapshot(): CategorySnapshot {
    return { ...this.state };
  }
}
