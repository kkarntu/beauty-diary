import type { UserRole } from '@beauty-diary/shared';

/**
 * Plain domain entity. No framework decorators, no ORM annotations.
 * The infrastructure layer maps this to/from the TypeORM entity.
 */
export interface UserSnapshot {
  id: string;
  email: string;
  nickname: string;
  passwordHash: string;
  role: UserRole;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isBlocked: boolean;
  followersCount: number;
  followingCount: number;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileInput {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export class User {
  private constructor(private readonly state: UserSnapshot) {}

  static rehydrate(snapshot: UserSnapshot): User {
    return new User(snapshot);
  }

  static register(input: {
    id: string;
    email: string;
    nickname: string;
    passwordHash: string;
  }): User {
    const now = new Date();
    return new User({
      id: input.id,
      email: input.email.toLowerCase(),
      nickname: input.nickname,
      passwordHash: input.passwordHash,
      role: 'user',
      displayName: null,
      avatarUrl: null,
      bio: null,
      isBlocked: false,
      followersCount: 0,
      followingCount: 0,
      emailVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this.state.id;
  }

  get email(): string {
    return this.state.email;
  }

  get nickname(): string {
    return this.state.nickname;
  }

  get passwordHash(): string {
    return this.state.passwordHash;
  }

  get role(): UserRole {
    return this.state.role;
  }

  get isBlocked(): boolean {
    return this.state.isBlocked;
  }

  get isEmailVerified(): boolean {
    return this.state.emailVerifiedAt !== null;
  }

  toSnapshot(): UserSnapshot {
    return { ...this.state };
  }

  changePassword(newHash: string): void {
    this.state.passwordHash = newHash;
    this.state.updatedAt = new Date();
  }

  verifyEmail(): void {
    if (this.state.emailVerifiedAt) return;
    this.state.emailVerifiedAt = new Date();
    this.state.updatedAt = new Date();
  }

  block(): void {
    this.state.isBlocked = true;
    this.state.updatedAt = new Date();
  }

  unblock(): void {
    this.state.isBlocked = false;
    this.state.updatedAt = new Date();
  }

  setRole(role: UserRole): void {
    if (this.state.role === role) return;
    this.state.role = role;
    this.state.updatedAt = new Date();
  }

  updateProfile(input: UpdateProfileInput): void {
    let changed = false;
    if (input.displayName !== undefined) {
      this.state.displayName = input.displayName;
      changed = true;
    }
    if (input.bio !== undefined) {
      this.state.bio = input.bio;
      changed = true;
    }
    if (input.avatarUrl !== undefined) {
      this.state.avatarUrl = input.avatarUrl;
      changed = true;
    }
    if (changed) {
      this.state.updatedAt = new Date();
    }
  }
}
