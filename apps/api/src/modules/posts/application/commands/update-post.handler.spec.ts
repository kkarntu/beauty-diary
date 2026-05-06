import type { CategoryRepository } from '../../../categories/domain/ports/category.repository';
import type { HtmlSanitizer } from '../../domain/ports/html-sanitizer';
import { Post } from '../../domain/post.entity';
import {
  CategoryNotFoundError,
  NotPostAuthorError,
  PostNotFoundError,
} from '../../domain/post.errors';
import type { PostRepository } from '../../domain/ports/post.repository';
import type { TagRepository } from '../../domain/ports/tag.repository';
import { Tag } from '../../domain/tag.entity';
import { UpdatePostCommand } from './update-post.command';
import { UpdatePostHandler } from './update-post.handler';

describe('UpdatePostHandler', () => {
  const makeHandler = () => {
    const posts: jest.Mocked<PostRepository> = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      attachTags: jest.fn(),
      detachAllTags: jest.fn(),
      list: jest.fn(),
      detailBySlug: jest.fn(),
    };
    const tags: jest.Mocked<TagRepository> = {
      findOrCreateMany: jest.fn(),
      findBySlug: jest.fn(),
      findTrending: jest.fn(),
    };
    const categories: jest.Mocked<CategoryRepository> = {
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
    };
    const sanitizer: jest.Mocked<HtmlSanitizer> = {
      sanitize: jest.fn((html) => html),
      toPlainText: jest.fn((html) => html.replace(/<[^>]*>/g, '')),
    };
    return {
      posts,
      tags,
      categories,
      sanitizer,
      handler: new UpdatePostHandler(posts, tags, categories, sanitizer),
    };
  };

  const samplePost = (authorId: string) =>
    Post.create({
      id: 'p1',
      authorId,
      categoryId: 'c1',
      slug: 'sample',
      title: 'Sample',
      excerpt: null,
      contentHtml: '<p>body</p>',
      coverImageUrl: null,
      status: 'published',
    });

  it('throws when post does not exist', async () => {
    const { handler, posts } = makeHandler();
    posts.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new UpdatePostCommand('missing', 'u1', 'user', { title: 'New title' })),
    ).rejects.toBeInstanceOf(PostNotFoundError);
  });

  it('throws when actor is not the author and not admin', async () => {
    const { handler, posts } = makeHandler();
    posts.findById.mockResolvedValue(samplePost('owner'));
    await expect(
      handler.execute(new UpdatePostCommand('p1', 'someone-else', 'user', { title: 'New title' })),
    ).rejects.toBeInstanceOf(NotPostAuthorError);
  });

  it('allows admin to edit any post', async () => {
    const { handler, posts } = makeHandler();
    posts.findById.mockResolvedValue(samplePost('owner'));
    await expect(
      handler.execute(new UpdatePostCommand('p1', 'admin-id', 'admin', { title: 'edited' })),
    ).resolves.toBeUndefined();
    expect(posts.save).toHaveBeenCalled();
  });

  it('rejects unknown category', async () => {
    const { handler, posts, categories } = makeHandler();
    posts.findById.mockResolvedValue(samplePost('u1'));
    categories.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new UpdatePostCommand('p1', 'u1', 'user', { categoryId: 'bad' })),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('sanitizes HTML before persisting', async () => {
    const { handler, posts, sanitizer } = makeHandler();
    posts.findById.mockResolvedValue(samplePost('u1'));
    sanitizer.sanitize.mockReturnValue('<p>safe</p>');

    await handler.execute(
      new UpdatePostCommand('p1', 'u1', 'user', {
        contentHtml: '<script>alert(1)</script><p>safe</p>',
      }),
    );

    expect(sanitizer.sanitize).toHaveBeenCalledWith('<script>alert(1)</script><p>safe</p>');
    const saved = posts.save.mock.calls[0]![0].toSnapshot();
    expect(saved.contentHtml).toBe('<p>safe</p>');
  });

  it('replaces tags when tagSlugs provided', async () => {
    const { handler, posts, tags } = makeHandler();
    posts.findById.mockResolvedValue(samplePost('u1'));
    tags.findOrCreateMany.mockResolvedValue([Tag.create({ id: 't1', slug: 'new', name: 'new' })]);
    await handler.execute(new UpdatePostCommand('p1', 'u1', 'user', { tagSlugs: ['new'] }));
    expect(posts.detachAllTags).toHaveBeenCalledWith('p1');
    expect(posts.attachTags).toHaveBeenCalledWith('p1', ['t1']);
  });

  it('does not touch tags when tagSlugs is undefined', async () => {
    const { handler, posts } = makeHandler();
    posts.findById.mockResolvedValue(samplePost('u1'));
    await handler.execute(new UpdatePostCommand('p1', 'u1', 'user', { title: 'edited' }));
    expect(posts.detachAllTags).not.toHaveBeenCalled();
    expect(posts.attachTags).not.toHaveBeenCalled();
  });
});
