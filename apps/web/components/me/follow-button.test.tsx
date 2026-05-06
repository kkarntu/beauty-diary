import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { FollowButton } from './follow-button';

const apiMock = { post: vi.fn(), delete: vi.fn() };
vi.mock('@/lib/api', () => ({
  api: {
    post: (...args: unknown[]) => apiMock.post(...args),
    delete: (...args: unknown[]) => apiMock.delete(...args),
  },
}));

vi.mock('@/lib/queries/auth', () => ({
  useCurrentUser: () => ({ data: { id: 'viewer-1', nickname: 'viewer' } }),
}));

const intlPushMock = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: intlPushMock }),
}));

const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const messages = {
  authorProfile: {
    follow: {
      follow: 'Follow',
      unfollow: 'Unfollow',
      saving: 'Saving...',
      error: "Couldn't update follow",
    },
  },
};

function renderButton(props: Parameters<typeof FollowButton>[0]) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <FollowButton {...props} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe('FollowButton', () => {
  it('POSTs to follow endpoint when not yet followed', async () => {
    apiMock.post.mockReset().mockResolvedValue({});
    refreshMock.mockReset();

    renderButton({ nickname: 'alice', initialIsFollowed: false });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Follow' }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledWith('/api/users/alice/follow'));
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it('DELETEs the follow endpoint when already followed', async () => {
    apiMock.delete.mockReset().mockResolvedValue({});
    refreshMock.mockReset();

    renderButton({ nickname: 'alice', initialIsFollowed: true });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Unfollow' }));

    await waitFor(() => expect(apiMock.delete).toHaveBeenCalledWith('/api/users/alice/follow'));
  });

  it('renders nothing when hidden (own profile)', () => {
    const { container } = renderButton({
      nickname: 'viewer',
      initialIsFollowed: false,
      hidden: true,
    });
    expect(container.firstChild).toBeNull();
  });
});
