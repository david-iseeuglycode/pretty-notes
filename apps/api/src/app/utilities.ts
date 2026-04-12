import {
  Prisma,
} from '@pretty-notes/prisma';


export function throwCustomIfNotFoundOrRethrow(
  customException: Error,
  exceptionToRethrow: unknown,
): never {
  if (
    exceptionToRethrow instanceof Prisma.PrismaClientKnownRequestError
    && exceptionToRethrow.code === 'P2025'
  ) {
    throw customException;
  }

  throw exceptionToRethrow;
}

export function throwCustomIfDuplicateOrRethrow(
  customException: Error,
  exceptionToRethrow: unknown,
): never {
  if (
    exceptionToRethrow instanceof Prisma.PrismaClientKnownRequestError
    && exceptionToRethrow.code === 'P2002'
  ) {
    throw customException;
  }

  throw exceptionToRethrow;
}
