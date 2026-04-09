import {
  Prisma,
 } from '@pretty-notes/prisma';
import type {
  UserDto,
} from '@pretty-notes/shared';


export function toUserDto(
  userPayload: Prisma.UserGetPayload<{
    select: {
      id: true;
      email: true;
      createdAt: true;
    };
  }>,
): UserDto {
  return {
    id: userPayload.id,
    email: userPayload.email,
    createdAt: userPayload.createdAt.toISOString(),
  }
}
