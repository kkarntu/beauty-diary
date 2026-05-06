'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useCurrentUser } from '@/lib/queries/auth';

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

/**
 * Single Socket.IO client for the whole app.
 *
 * The socket connects unconditionally — anonymous visitors still benefit
 * from real-time comments on post pages they're reading. The handshake
 * tries to read the access cookie; if present and valid, the server
 * joins the user to their `user:{id}` room for notifications. If absent,
 * the socket stays anonymous but can still subscribe to public post rooms.
 *
 * The socket is held in state (not a ref) so a `setSocket` after the
 * effect creates the connection re-renders the provider, which is how
 * consumer hooks (`useSocket`) see the new reference.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Empty string = same-origin; the request rides through Next's
    // /socket.io rewrite, so the handshake carries first-party cookies.
    const url = process.env.NEXT_PUBLIC_API_URL ?? '';
    // `autoConnect: false` + a microtask connect lets a quick mount →
    // cleanup → re-mount cycle (e.g. React Strict Mode in dev) tear
    // down before the WS handshake starts, instead of opening and
    // immediately closing a half-established socket.
    // Long-polling only: Vercel's edge does not proxy WS upgrades through
    // rewrites, so we trade pure-WS for HTTP polling that works first-party.
    const next = io(url, {
      withCredentials: true,
      transports: ['polling'],
      autoConnect: false,
    });
    let cancelled = false;
    const handle = setTimeout(() => {
      if (cancelled) return;
      next.connect();
      setSocket(next);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
      next.disconnect();
      setSocket(null);
    };
    // Re-running this effect when the user identity changes forces a
    // fresh handshake so the server-side cookie check re-evaluates.
  }, [user?.id]);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
}

export function useSocket(): Socket | null {
  return useContext(SocketContext).socket;
}
