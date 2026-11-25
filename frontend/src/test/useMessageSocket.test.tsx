import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';

type Handler = (claimId?: unknown) => void;

const handlers: Record<string, Handler> = {};
const fakeSocket = {
  on: vi.fn((event: string, handler: Handler) => {
    handlers[event] = handler;
  }),
  emit: vi.fn(),
  disconnect: vi.fn(),
};
const io = vi.fn(() => fakeSocket);

vi.mock('socket.io-client', () => ({ io }));

// the tests must not depend on the local .env or on the CI environment
vi.mock('@/api/config', () => ({ USE_MOCKS: false }));
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000');

const { useMessageSocket, useMessageListSocket } =
  await import('@/components/messages/useMessageSocket');

const CLAIM_ID = '9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d';

const setup = (claimId = CLAIM_ID, enabled = true) => {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const view = renderHook(() => useMessageSocket(claimId, enabled), {
    wrapper,
  });

  return { ...view, invalidate };
};

describe('useMessageSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(handlers).forEach((key) => delete handlers[key]);
  });

  test('connects with the login cookie', () => {
    setup();

    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith('http://localhost:3000', {
      withCredentials: true,
    });
  });

  test('joins the claim room on every connect, including a reconnect', () => {
    setup();

    handlers['connect']?.();
    handlers['connect']?.();

    expect(fakeSocket.emit).toHaveBeenCalledTimes(2);
    expect(fakeSocket.emit).toHaveBeenCalledWith('join-claim', CLAIM_ID);
  });

  test('refetches the messages of that claim when the server says they changed', () => {
    const { invalidate } = setup();

    handlers['messages-changed']?.();

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['messages', CLAIM_ID],
    });
  });

  test('disconnects when the thread closes', () => {
    const { unmount } = setup();

    unmount();

    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
  });

  test('does not connect for a closed claim', () => {
    setup(CLAIM_ID, false);

    expect(io).not.toHaveBeenCalled();
  });
});

describe('useMessageListSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(handlers).forEach((key) => delete handlers[key]);
  });

  const setupList = () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const view = renderHook(() => useMessageListSocket(), { wrapper });

    return { ...view, invalidate };
  };

  test('refetches the claim named by the server, without joining a room', () => {
    const { invalidate } = setupList();

    handlers['messages-changed']?.(CLAIM_ID);

    expect(fakeSocket.emit).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['messages', CLAIM_ID],
    });
  });

  test('ignores an update without a claim id', () => {
    const { invalidate } = setupList();

    handlers['messages-changed']?.();

    expect(invalidate).not.toHaveBeenCalled();
  });

  test('disconnects when the page closes', () => {
    const { unmount } = setupList();

    unmount();

    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});
