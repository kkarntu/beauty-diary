export class CreateCommentCommand {
  constructor(
    public readonly authorId: string,
    public readonly postId: string,
    public readonly parentId: string | null,
    public readonly content: string,
  ) {}
}

export interface CreateCommentResult {
  id: string;
}
