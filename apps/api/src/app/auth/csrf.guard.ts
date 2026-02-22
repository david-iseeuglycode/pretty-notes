import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { user: { csrfToken: string } }>();
    if (req.method === 'GET') return true;
    const header = req.headers['x-csrf-token'];
    if (!header || header !== req.user?.csrfToken) throw new ForbiddenException();
    return true;
  }
}
