import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { SignedTokenService } from './signed-token.service';
import { LoginDto } from './dto/login.dto';

function toSafeUser(user: { id: string; email: string; name: string | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly signedTokenService: SignedTokenService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await this.passwordService.verify(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return {
      accessToken: this.signedTokenService.sign({ id: user.id, email: user.email }),
      tokenType: 'Bearer',
      user: toSafeUser(user),
    };
  }
}
