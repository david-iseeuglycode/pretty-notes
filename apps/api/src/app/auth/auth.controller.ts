import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { LoginDto, UserDto } from '@pretty-notes/shared';
import { AuthService } from './auth.service.js';
import { JwtGuard } from './jwt.guard.js';

const COOKIE_DEFAULTS = { sameSite: 'strict' as const, path: '/' };

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const { token, csrfToken, user } = await this.authService.register(dto);
    this.setCookies(res, token, csrfToken);
    return { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const { token, csrfToken, user } = await this.authService.login(dto);
    this.setCookies(res, token, csrfToken);
    return { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie('access_token', COOKIE_DEFAULTS);
    res.clearCookie('csrf_token', COOKIE_DEFAULTS);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: Request): UserDto {
    const user = (req as Request & { user: { sub: number; email: string; iat: number } }).user;
    return { id: user.sub, email: user.email, createdAt: new Date().toISOString() };
  }

  private setCookies(res: Response, token: string, csrfToken: string): void {
    res.cookie('access_token', token, { ...COOKIE_DEFAULTS, httpOnly: true });
    res.cookie('csrf_token', csrfToken, { ...COOKIE_DEFAULTS, httpOnly: false });
  }
}
