import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  JwtService,
} from '@nestjs/jwt';
import {
  Socket,
} from 'socket.io';


@Injectable()
export class WsGuard
implements CanActivate
{
  constructor(
    private jwt: JwtService,
  ) {
  }


  canActivate(
    ctx: ExecutionContext,
  ): boolean {
    const socket = ctx.switchToWs(
    ).getClient<Socket>(
    );
    const cookieString: string = socket.handshake.headers.cookie ?? '';
    const ACCESS_TOKEN: string = 'access_token=';
    const accessTokenStart: number = cookieString.indexOf(ACCESS_TOKEN);
    const accessTokenEnd: number = cookieString.indexOf(';', accessTokenStart);
    const token: string | null = accessTokenStart === -1
      ? null
      : cookieString.substring(
          accessTokenStart + ACCESS_TOKEN.length,
          accessTokenEnd === -1
            ? cookieString.length
            : accessTokenEnd,
      );

    if (
      !token
    ) {
      throw new UnauthorizedException();
    }

    try {
      socket.data.user = this.jwt.verify(
        token,
      );

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
