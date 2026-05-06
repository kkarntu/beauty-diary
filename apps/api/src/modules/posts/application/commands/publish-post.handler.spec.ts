import { Post } from '../../domain/post.entity';
import {
  InvalidPostStatusTransitionError,
  NotPostAuthorError,
  PostNotFoundError,
} from '../../domain/post.errors';
import type { PostRepository } from '../../domain/ports/post.repository';
import { ArchivePostCommand, PublishPostCommand } from './publish-post.command';
import { ArchivePostHandler, PublishPostHandler } from './publish-post.handler';

const makeRepo = (): jest.Mocked<PostRepository> => ({
  findById: jest.fn(),
  findBySlug: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  attachTags: jest.fn(),
  detachAllTags: jest.fn(),
  list: jest.fn(),
  detailBySlug: jest.fn(),
});

const draftPost = () =>
  Post.create({
    id: 'p1',
    authorId: 'u1',
    categoryId: 'c1',
    slug: 'sample',
    title: 'Sample',
    excerpt: null,
    contentHtml: '<p>body</p>',
    coverImageUrl: null,
    status: 'draft',
  });

describe('PublishPostHandler', () => {
  it('publishes a draft as the author', async () => {
    const repo = makeRepo();
    const handler = new PublishPostHandler(repo);
    repo.findById.mockResolvedValue(draftPost());
    await handler.execute(new PublishPostCommand('p1', 'u1', 'user'));
    const saved = repo.save.mock.calls[0]![0];
    expect(saved.status).toBe('published');
  });

  it('rejects non-author non-admin', async () => {
    const repo = makeRepo();
    const handler = new PublishPostHandler(repo);
    repo.findById.mockResolvedValue(draftPost());
    await expect(
      handler.execute(new PublishPostCommand('p1', 'someone', 'user')),
    ).rejects.toBeInstanceOf(NotPostAuthorError);
  });

  it('rejects publishing an archived post', async () => {
    const repo = makeRepo();
    const handler = new PublishPostHandler(repo);
    const post = draftPost();
    post.archive();
    repo.findById.mockResolvedValue(post);
    await expect(
      handler.execute(new PublishPostCommand('p1', 'u1', 'user')),
    ).rejects.toBeInstanceOf(InvalidPostStatusTransitionError);
  });

  it('throws when post is missing', async () => {
    const repo = makeRepo();
    const handler = new PublishPostHandler(repo);
    repo.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new PublishPostCommand('p1', 'u1', 'user')),
    ).rejects.toBeInstanceOf(PostNotFoundError);
  });
});

describe('ArchivePostHandler', () => {
  it('archives as the author', async () => {
    const repo = makeRepo();
    const handler = new ArchivePostHandler(repo);
    repo.findById.mockResolvedValue(draftPost());
    await handler.execute(new ArchivePostCommand('p1', 'u1', 'user'));
    expect(repo.save.mock.calls[0]![0].status).toBe('archived');
  });

  it('rejects non-author', async () => {
    const repo = makeRepo();
    const handler = new ArchivePostHandler(repo);
    repo.findById.mockResolvedValue(draftPost());
    await expect(
      handler.execute(new ArchivePostCommand('p1', 'attacker', 'user')),
    ).rejects.toBeInstanceOf(NotPostAuthorError);
  });
});
