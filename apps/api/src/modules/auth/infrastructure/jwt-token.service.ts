import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { sign, verify, type SignOptions } from 'jsonwebtoken';
import { v7 as uuidv7 } from 'uuid';
import { EnvService } from '../../../config/env.service';
import type {
  AccessTokenPayload,
  IssuedRefreshToken,
  RefreshTokenPayload,
  TokenService,
} from '../domain/ports/token-service';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly env: EnvService) {}

  issueAccessToken(payload: AccessTokenPayload): string {
    const options: SignOptions = {
      expiresIn: this.env.jwtAccessTtl as SignOptions['expiresIn'],
      algorithm: 'HS256',
    };
    return sign(payload, this.env.jwtAccessSecret, options);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = verify(token, this.env.jwtAccessSecret, { algorithms: ['HS256'] });
    if (typeof decoded === 'string') {
      throw new Error('Unexpected JWT payload');
    }
    return { sub: String(decoded.sub), role: decoded.role };
  }

  issueRefreshToken(userId: string): IssuedRefreshToken {
    const id = uuidv7();
    const payload: RefreshTokenPayload = { sub: userId, jti: id };
    const options: SignOptions = {
      expiresIn: this.env.jwtRefreshTtl as SignOptions['expiresIn'],
      algorithm: 'HS256',
    };
    const rawJwt = sign(payload, this.env.jwtRefreshSecret, options);

    const decoded = verify(rawJwt, this.env.jwtRefreshSecret) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    return {
      id,
      rawJwt,
      tokenHash: this.hashRefreshToken(rawJwt),
      expiresAt,
    };
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const decoded = verify(token, this.env.jwtRefreshSecret, { algorithms: ['HS256'] });
    if (typeof decoded === 'string') {
      throw new Error('Unexpected JWT payload');
    }
    return { sub: String(decoded.sub), jti: String(decoded.jti) };
  }

  hashRefreshToken(rawJwt: string): string {
    return createHash('sha256').update(rawJwt).digest('hex');
  }
}
