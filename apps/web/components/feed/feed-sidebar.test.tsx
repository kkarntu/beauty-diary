import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { FeedSidebar } from './feed-sidebar';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('./newsletter-signup', () => ({
  NewsletterSignup: () => <div data-testid="newsletter" />,
}));

const messages = {
  feed: {
    sidebar: {
      trendingTitle: 'Trending topics',
      newsletter: {
        title: 'Newsletter',
        description: '',
        placeholder: '',
        submit: '',
        submitting: '',
        success: '',
      },
    },
  },
};

function renderSidebar(props: Parameters<typeof FeedSidebar>[0]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FeedSidebar {...props} />
    </NextIntlClientProvider>,
  );
}

describe('FeedSidebar', () => {
  it('renders each trending tag with a link to /feed?tag=<slug>', () => {
    renderSidebar({
      trendingTags: [
        { slug: 'k-beauty', name: 'K-beauty', postCount: 12 },
        { slug: 'spf', name: 'SPF', postCount: 4 },
      ],
    });

    expect(screen.getByText('Trending topics')).toBeInTheDocument();
    expect(screen.getByText('#K-beauty').closest('a')).toHaveAttribute(
      'href',
      '/feed?tag=k-beauty',
    );
    expect(screen.getByText('#SPF').closest('a')).toHaveAttribute('href', '/feed?tag=spf');
  });

  it('toggles the active tag link back to /feed', () => {
    renderSidebar({
      activeTag: 'k-beauty',
      trendingTags: [{ slug: 'k-beauty', name: 'K-beauty', postCount: 12 }],
    });
    const link = screen.getByText('#K-beauty').closest('a');
    expect(link).toHaveAttribute('href', '/feed');
  });

  it('hides the trending block when no tags are returned', () => {
    renderSidebar({ trendingTags: [] });
    expect(screen.queryByText('Trending topics')).not.toBeInTheDocument();
    expect(screen.getByTestId('newsletter')).toBeInTheDocument();
  });
});
