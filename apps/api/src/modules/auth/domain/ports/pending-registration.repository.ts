export interface PendingRegistrationRecord {
  id: string;
  email: string;
  nickname: string;
  passwordHash: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  lastResentAt: Date | null;
  createdAt: Date;
}

export interface UpsertPendingRegistrationInput {
  id: string;
  email: string;
  nickname: string;
  passwordHash: string;
  otpHash: string;
  expiresAt: Date;
}

export interface PendingRegistrationRepository {
  /**
   * Replaces any existing pending registration for `email`. Used both on
   * the first /initiate call and on /resend (to rotate the OTP).
   */
  upsert(input: UpsertPendingRegistrationInput): Promise<void>;
  findByEmail(email: string): Promise<PendingRegistrationRecord | null>;
  /** Updates `otp_hash` and `expires_at`, bumps `last_resent_at`, resets attempts. */
  rotateOtp(email: string, otpHash: string, expiresAt: Date, now: Date): Promise<void>;
  incrementAttempts(email: string): Promise<void>;
  deleteByEmail(email: string): Promise<void>;
}

export const PENDING_REGISTRATION_REPOSITORY = Symbol('PENDING_REGISTRATION_REPOSITORY');
