import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@pretty-notes/prisma';
import { LoginDto } from '@pretty-notes/shared';
import { User } from '@pretty-notes/prisma';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: LoginDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed },
    });
    return this.buildCookiePayload(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildCookiePayload(user);
  }

  private buildCookiePayload(user: User) {
    const csrfToken = crypto.randomUUID();
    const token = this.jwt.sign({ sub: user.id, email: user.email, csrfToken });
    return { token, csrfToken, user };
  }
}
