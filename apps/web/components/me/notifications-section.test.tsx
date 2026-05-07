import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsSection } from './notifications-section';

const apiMock = { get: vi.fn(), patch: vi.fn() };
vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => apiMock.get(...args),
    patch: (...args: unknown[]) => apiMock.patch(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const messages = {
  profile: {
    notifications: {
      newFollower: 'New followers',
      newFollowerHint: '',
      newComment: 'Comments on my posts',
      newCommentHint: '',
      newLike: 'Likes',
      newLikeHint: '',
      saveError: "Couldn't save preferences",
    },
  },
};

function renderSection() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <NotificationsSection />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe('NotificationsSection', () => {
  it('loads preferences from /api/me/notification-preferences and reflects them in switches', async () => {
    apiMock.get.mockReset().mockResolvedValue({
      data: { newFollower: true, newComment: false, newLike: false },
    });

    renderSection();

    await waitFor(() =>
      expect(apiMock.get).toHaveBeenCalledWith('/api/me/notification-preferences'),
    );
    await waitFor(() => screen.getByText('New followers'));

    // Switches expose their state via aria-checked
    const switches = await screen.findAllByRole('switch');
    expect(switches).toHaveLength(3);
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('PATCHes the new value when a switch is toggled', async () => {
    apiMock.get.mockReset().mockResolvedValue({
      data: { newFollower: true, newComment: true, newLike: false },
    });
    apiMock.patch.mockReset().mockResolvedValue({
      data: { newFollower: false, newComment: true, newLike: false },
    });

    renderSection();
    await waitFor(() => screen.getByText('New followers'));

    const switches = await screen.findAllByRole('switch');
    await userEvent.setup().click(switches[0]!);

    await waitFor(() =>
      expect(apiMock.patch).toHaveBeenCalledWith('/api/me/notification-preferences', {
        newFollower: false,
      }),
    );
  });
});
