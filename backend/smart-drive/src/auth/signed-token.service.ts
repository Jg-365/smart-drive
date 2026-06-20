import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

function base64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function decodeBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  return Buffer.from(padded, 'base64');
}

function parseExpirationSeconds(value: string | undefined): number {
  if (!value) return 7 * 24 * 60 * 60;

  const match = /^(\d+)([smhd])?$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60;

  const amount = Number(match[1]);
  const unit = match[2] ?? 's';
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return amount * multipliers[unit];
}

@Injectable()
export class SignedTokenService {
  private readonly secret: string;
  private readonly expirationSeconds: number;

  constructor(configService: ConfigService) {
    this.secret = configService.get<string>('JWT_SECRET') ?? 'dev-secret-change-me';
    this.expirationSeconds = parseExpirationSeconds(
      configService.get<string>('JWT_EXPIRATION'),
    );
  }

  sign(user: { id: string; email: string }): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + this.expirationSeconds,
    };

    const encodedHeader = base64Url(JSON.stringify(header));
    const encodedPayload = base64Url(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const signature = this.signature(unsignedToken);

    return `${unsignedToken}.${signature}`;
  }

  verify(token: string): AuthTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Token inválido.');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = this.signature(unsignedToken);

    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signature);

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new UnauthorizedException('Token inválido.');
    }

    let payload: AuthTokenPayload;
    try {
      payload = JSON.parse(decodeBase64Url(encodedPayload).toString('utf8')) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedException('Token inválido.');
    }

    if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expirado ou inválido.');
    }

    return payload;
  }

  private signature(unsignedToken: string): string {
    return base64Url(createHmac('sha256', this.secret).update(unsignedToken).digest());
  }
}
