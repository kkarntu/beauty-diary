import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { NewsletterSignup } from './newsletter-signup';

const subscribeMock = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    post: (...args: unknown[]) => subscribeMock(...args),
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}));

const messages = {
  feed: {
    sidebar: {
      newsletter: {
        title: 'Newsletter',
        description: '',
        placeholder: 'your@email.com',
        submit: 'Subscribe',
        submitting: 'Subscribing...',
        success: 'Thanks for subscribing!',
        error: "Couldn't subscribe",
      },
    },
  },
};

function renderForm() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <NewsletterSignup />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe('NewsletterSignup', () => {
  it('POSTs to /api/newsletter/subscribe and shows the success toast', async () => {
    subscribeMock.mockReset().mockResolvedValue({});
    toastSuccess.mockReset();

    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('your@email.com'), 'me@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() =>
      expect(subscribeMock).toHaveBeenCalledWith('/api/newsletter/subscribe', {
        email: 'me@example.com',
      }),
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Thanks for subscribing!'));
    expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('');
  });

  it('shows an error toast when the API rejects the request', async () => {
    subscribeMock.mockReset().mockRejectedValue(new Error('boom'));
    toastError.mockReset();

    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('your@email.com'), 'me@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Couldn't subscribe"));
  });
});
