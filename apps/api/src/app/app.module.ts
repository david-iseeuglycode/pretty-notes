import {
  Module,
} from '@nestjs/common';
import {
  JwtModule,
} from '@nestjs/jwt';
import {
  PrismaModule,
 } from '@pretty-notes/prisma';
import {
  AuthController,
} from './auth/auth.controller.js';
import {
  AuthService,
} from './auth/auth.service.js';
import {
  JwtGuard,
} from './auth/jwt.guard.js';
import {
  CsrfGuard,
} from './auth/csrf.guard.js';
import {
  NoteController,
} from './note/note.controller.js';
import {
  NoteGateway,
} from './note/note.gateway.js';
import {
  NoteService,
} from './note/note.service.js';
import {
  FolderController,
} from './folder/folder.controller.js';
import {
  FolderService,
} from './folder/folder.service.js';


@Module(
  {
    imports: [
      PrismaModule,
      JwtModule.register(
        {
          secret: process.env['JWT_SECRET'],
          signOptions: { expiresIn: '7d' },
        },
      ),
    ],
    controllers: [
      AuthController,
      FolderController,
      NoteController,
    ],
    providers: [
      AuthService,
      CsrfGuard,
      FolderService,
      JwtGuard,
      NoteService,
      NoteGateway,
    ],
  },
)
export class AppModule
{
}
