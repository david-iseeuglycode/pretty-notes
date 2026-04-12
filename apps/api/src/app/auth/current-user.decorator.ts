import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import {
  Request,
} from 'express';
import {
  Socket,
} from 'socket.io';


export interface JwtUser
{
  sub: number;
  email: string;
  createdAt: string;
  csrfToken: string;
}


export const HttpCurrentUser = createParamDecorator(
  (
    _: unknown,
    ctx: ExecutionContext,
  ) => ctx.switchToHttp(
    ).getRequest<Request & { user: unknown }>(
    ).user
);

export const WsCurrentUser = createParamDecorator(
  (
    _: unknown,
    ctx: ExecutionContext,
  ) => ctx.switchToWs(
    ).getClient<Socket>(
    ).data.user
);
