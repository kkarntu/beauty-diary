export interface CommentSnapshot {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export class Comment {
  private constructor(private readonly state: CommentSnapshot) {}

  static rehydrate(snapshot: CommentSnapshot): Comment {
    return new Comment(snapshot);
  }

  static create(input: {
    id: string;
    postId: string;
    authorId: string;
    parentId: string | null;
    content: string;
  }): Comment {
    return new Comment({
      id: input.id,
      postId: input.postId,
      authorId: input.authorId,
      parentId: input.parentId,
      content: input.content.trim(),
      editedAt: null,
      deletedAt: null,
      createdAt: new Date(),
    });
  }

  get id(): string {
    return this.state.id;
  }

  get postId(): string {
    return this.state.postId;
  }

  get parentId(): string | null {
    return this.state.parentId;
  }

  get authorId(): string {
    return this.state.authorId;
  }

  get isReply(): boolean {
    return this.state.parentId !== null;
  }

  get isDeleted(): boolean {
    return this.state.deletedAt !== null;
  }

  toSnapshot(): CommentSnapshot {
    return { ...this.state };
  }

  isOwnedBy(userId: string): boolean {
    return this.state.authorId === userId;
  }

  editContent(newContent: string): void {
    this.state.content = newContent.trim();
    this.state.editedAt = new Date();
  }

  softDelete(): void {
    if (this.state.deletedAt) return;
    this.state.deletedAt = new Date();
  }
}
