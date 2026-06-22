import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { CreateUserDto } from './dto/create-user.dto';

function toSafeUser(user: { id: string; email: string; name: string | null; createdAt?: Date; updatedAt?: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async create(dto: CreateUserDto) {
    const alreadyExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (alreadyExists) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: await this.passwordService.hash(dto.password),
      },
    });

    return toSafeUser(user);
  }

  async findMe(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return toSafeUser(user);
  }
}
