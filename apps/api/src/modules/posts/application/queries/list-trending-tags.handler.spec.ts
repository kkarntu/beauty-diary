import { ListTrendingTagsHandler } from './list-trending-tags.handler';
import { ListTrendingTagsQuery } from './list-trending-tags.query';
import type { TagRepository } from '../../domain/ports/tag.repository';

describe('ListTrendingTagsHandler', () => {
  function makeHandler(rows: Array<{ slug: string; name: string; postCount: number }>) {
    const tags: Pick<TagRepository, 'findTrending'> = {
      findTrending: jest.fn().mockResolvedValue(rows),
    };
    return {
      handler: new ListTrendingTagsHandler(tags as TagRepository),
      tags,
    };
  }

  it('maps repository rows into DTO shape', async () => {
    const { handler } = makeHandler([
      { slug: 'k-beauty', name: 'K-beauty', postCount: 12 },
      { slug: 'spf', name: 'SPF', postCount: 4 },
    ]);

    const result = await handler.execute(new ListTrendingTagsQuery(8));

    expect(result).toEqual([
      { slug: 'k-beauty', name: 'K-beauty', postCount: 12 },
      { slug: 'spf', name: 'SPF', postCount: 4 },
    ]);
  });

  it('clamps limit to a sane range', async () => {
    const { handler, tags } = makeHandler([]);

    await handler.execute(new ListTrendingTagsQuery(0));
    expect(tags.findTrending).toHaveBeenLastCalledWith(1);

    await handler.execute(new ListTrendingTagsQuery(999));
    expect(tags.findTrending).toHaveBeenLastCalledWith(50);

    await handler.execute(new ListTrendingTagsQuery(8));
    expect(tags.findTrending).toHaveBeenLastCalledWith(8);
  });
});
