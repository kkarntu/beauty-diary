export interface RefreshTokenSnapshot {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string | null;
  ip: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
  createdAt: Date;
}

export class RefreshToken {
  private constructor(private readonly state: RefreshTokenSnapshot) {}

  static rehydrate(snapshot: RefreshTokenSnapshot): RefreshToken {
    return new RefreshToken(snapshot);
  }

  static issue(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }): RefreshToken {
    return new RefreshToken({
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedBy: null,
      createdAt: new Date(),
    });
  }

  get id(): string {
    return this.state.id;
  }

  get userId(): string {
    return this.state.userId;
  }

  get tokenHash(): string {
    return this.state.tokenHash;
  }

  get isRevoked(): boolean {
    return this.state.revokedAt !== null;
  }

  get isExpired(): boolean {
    return this.state.expiresAt.getTime() <= Date.now();
  }

  get isUsable(): boolean {
    return !this.isRevoked && !this.isExpired;
  }

  toSnapshot(): RefreshTokenSnapshot {
    return { ...this.state };
  }

  revoke(replacedBy: string | null = null): void {
    if (this.state.revokedAt) return;
    this.state.revokedAt = new Date();
    this.state.replacedBy = replacedBy;
  }
}
