import type { EventBus } from '@nestjs/cqrs';
import { Comment } from '../../domain/comment.entity';
import { CommentNotFoundError, NotCommentAuthorError } from '../../domain/comment.errors';
import type { CommentRepository } from '../../domain/ports/comment.repository';
import { DeleteCommentCommand } from './delete-comment.command';
import { DeleteCommentHandler } from './delete-comment.handler';
import { UpdateCommentCommand } from './update-comment.command';
import { UpdateCommentHandler } from './update-comment.handler';

const makeRepo = (): jest.Mocked<CommentRepository> => ({
  findById: jest.fn(),
  save: jest.fn(),
  listByPostId: jest.fn(),
});

const makeBus = (): EventBus => ({ publish: jest.fn() }) as unknown as EventBus;

const sample = () =>
  Comment.create({
    id: 'c1',
    postId: 'p1',
    authorId: 'u1',
    parentId: null,
    content: 'original',
  });

describe('UpdateCommentHandler', () => {
  it('edits content as the author', async () => {
    const repo = makeRepo();
    const handler = new UpdateCommentHandler(repo, makeBus());
    repo.findById.mockResolvedValue(sample());
    await handler.execute(new UpdateCommentCommand('c1', 'u1', 'user', 'edited text'));
    const saved = repo.save.mock.calls[0]![0].toSnapshot();
    expect(saved.content).toBe('edited text');
    expect(saved.editedAt).not.toBeNull();
  });

  it('rejects non-author non-admin', async () => {
    const repo = makeRepo();
    const handler = new UpdateCommentHandler(repo, makeBus());
    repo.findById.mockResolvedValue(sample());
    await expect(
      handler.execute(new UpdateCommentCommand('c1', 'attacker', 'user', 'x')),
    ).rejects.toBeInstanceOf(NotCommentAuthorError);
  });

  it('allows admin to edit any comment', async () => {
    const repo = makeRepo();
    const handler = new UpdateCommentHandler(repo, makeBus());
    repo.findById.mockResolvedValue(sample());
    await expect(
      handler.execute(new UpdateCommentCommand('c1', 'admin', 'admin', 'moderated')),
    ).resolves.toBeUndefined();
  });

  it('throws when comment is missing', async () => {
    const repo = makeRepo();
    const handler = new UpdateCommentHandler(repo, makeBus());
    repo.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new UpdateCommentCommand('c1', 'u1', 'user', 'x')),
    ).rejects.toBeInstanceOf(CommentNotFoundError);
  });

  it('throws when comment was already soft-deleted', async () => {
    const repo = makeRepo();
    const handler = new UpdateCommentHandler(repo, makeBus());
    const c = sample();
    c.softDelete();
    repo.findById.mockResolvedValue(c);
    await expect(
      handler.execute(new UpdateCommentCommand('c1', 'u1', 'user', 'x')),
    ).rejects.toBeInstanceOf(CommentNotFoundError);
  });
});

describe('DeleteCommentHandler', () => {
  it('soft-deletes as the author', async () => {
    const repo = makeRepo();
    const handler = new DeleteCommentHandler(repo, makeBus());
    repo.findById.mockResolvedValue(sample());
    await handler.execute(new DeleteCommentCommand('c1', 'u1', 'user'));
    const saved = repo.save.mock.calls[0]![0].toSnapshot();
    expect(saved.deletedAt).not.toBeNull();
  });

  it('rejects non-author non-admin', async () => {
    const repo = makeRepo();
    const handler = new DeleteCommentHandler(repo, makeBus());
    repo.findById.mockResolvedValue(sample());
    await expect(
      handler.execute(new DeleteCommentCommand('c1', 'attacker', 'user')),
    ).rejects.toBeInstanceOf(NotCommentAuthorError);
  });

  it('allows admin', async () => {
    const repo = makeRepo();
    const handler = new DeleteCommentHandler(repo, makeBus());
    repo.findById.mockResolvedValue(sample());
    await expect(
      handler.execute(new DeleteCommentCommand('c1', 'admin', 'admin')),
    ).resolves.toBeUndefined();
  });
});
