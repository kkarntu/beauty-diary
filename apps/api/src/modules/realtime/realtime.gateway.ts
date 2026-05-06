import { Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  type OnGatewayConnection,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type WsResponse,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { EnvService } from '../../config/env.service';
import { TOKEN_SERVICE, type TokenService } from '../auth/domain/ports/token-service';
import { ACCESS_COOKIE_NAME } from '../auth/presentation/cookies/auth-cookies';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    role?: 'user' | 'admin';
  };
}

/**
 * Single Socket.IO gateway carrying every realtime channel:
 *   - post-room  `post:{id}`  — comment.created broadcasts to everyone watching the post
 *   - user-room  `user:{id}`  — per-user notifications
 *
 * Authentication runs once on connect: we read the access-token cookie
 * from the handshake and verify with the same `TokenService` the REST
 * layer uses. Anonymous connections are allowed but only see post rooms
 * — they can't subscribe to a user channel.
 *
 * CORS uses the configured `webOrigin` rather than a wildcard because
 * the handshake carries the access-token cookie (`credentials: true`).
 */
@WebSocketGateway({
  cors: {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:23000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    private readonly env: EnvService,
  ) {}

  afterInit(): void {
    this.logger.log(`Socket.IO gateway ready (origin: ${this.env.webOrigin})`);
  }

  handleConnection(client: AuthenticatedSocket): void {
    const cookies = parseCookieHeader(client.handshake.headers.cookie ?? '');
    const token = cookies[ACCESS_COOKIE_NAME];
    if (!token) return;
    try {
      const payload = this.tokens.verifyAccessToken(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      // Each user gets their own private room for notifications.
      void client.join(`user:${payload.sub}`);
    } catch {
      // Invalid token — leave the socket anonymous. Client may re-connect
      // after refreshing the access cookie.
    }
  }

  /** Client tells us "I'm reading post X" so we can route comment pushes there. */
  @SubscribeMessage('subscribe:post')
  onSubscribePost(client: AuthenticatedSocket, postId: string): WsResponse<{ ok: true }> {
    if (typeof postId !== 'string' || postId.length === 0) {
      return { event: 'subscribe:post:ack', data: { ok: true } };
    }
    void client.join(`post:${postId}`);
    return { event: 'subscribe:post:ack', data: { ok: true } };
  }

  @SubscribeMessage('unsubscribe:post')
  onUnsubscribePost(client: AuthenticatedSocket, postId: string): void {
    if (typeof postId !== 'string') return;
    void client.leave(`post:${postId}`);
  }

  emitToPost(postId: string, event: string, payload: unknown): void {
    this.server.to(`post:${postId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  // EventEmitter2 bridge — application-layer code dispatches events into
  // this listener so it doesn't need to import the gateway directly.
  @OnEvent('realtime.post')
  handleRealtimePost({
    postId,
    event,
    data,
  }: {
    postId: string;
    event: string;
    data: unknown;
  }): void {
    this.emitToPost(postId, event, data);
  }

  @OnEvent('realtime.user')
  handleRealtimeUser({
    userId,
    event,
    data,
  }: {
    userId: string;
    event: string;
    data: unknown;
  }): void {
    this.emitToUser(userId, event, data);
  }
}

function parseCookieHeader(header: string): Record<string, string> {
  return header
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return acc;
      const k = pair.slice(0, idx);
      const v = decodeURIComponent(pair.slice(idx + 1));
      acc[k] = v;
      return acc;
    }, {});
}
