export interface PasswordResetTokenSnapshot {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class PasswordResetToken {
  private constructor(private readonly state: PasswordResetTokenSnapshot) {}

  static rehydrate(snapshot: PasswordResetTokenSnapshot): PasswordResetToken {
    return new PasswordResetToken(snapshot);
  }

  static issue(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): PasswordResetToken {
    return new PasswordResetToken({
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: null,
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

  get isUsed(): boolean {
    return this.state.usedAt !== null;
  }

  get isExpired(): boolean {
    return this.state.expiresAt.getTime() <= Date.now();
  }

  get isUsable(): boolean {
    return !this.isUsed && !this.isExpired;
  }

  toSnapshot(): PasswordResetTokenSnapshot {
    return { ...this.state };
  }

  markUsed(): void {
    if (this.state.usedAt) return;
    this.state.usedAt = new Date();
  }
}
