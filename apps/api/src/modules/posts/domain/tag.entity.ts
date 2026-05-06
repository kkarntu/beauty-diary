export interface TagSnapshot {
  id: string;
  slug: string;
  name: string;
}

export class Tag {
  private constructor(private readonly state: TagSnapshot) {}

  static rehydrate(snapshot: TagSnapshot): Tag {
    return new Tag(snapshot);
  }

  static create(input: { id: string; slug: string; name: string }): Tag {
    return new Tag({ id: input.id, slug: input.slug.toLowerCase(), name: input.name });
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

  toSnapshot(): TagSnapshot {
    return { ...this.state };
  }
}
