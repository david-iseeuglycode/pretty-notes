import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import {
  Request,
} from 'express';


export interface JwtUser
{
  sub: number;
  email: string;
  createdAt: string;
  csrfToken: string;
}


export const CurrentUser = createParamDecorator(
  (
    _: unknown,
    ctx: ExecutionContext
  ) => ctx.switchToHttp(
    ).getRequest<Request & { user: unknown }>(
    ).user
);
