import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@pretty-notes/prisma';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { JwtGuard } from './auth/jwt.guard.js';
import { CsrfGuard } from './auth/csrf.guard.js';
import { NoteController } from './note/note.controller.js';
import { NoteGateway } from './note/note.gateway.js';
import { NoteService } from './note/note.service.js';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env['JWT_SECRET'],
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AppController, AuthController, NoteController],
  providers: [AppService, AuthService, JwtGuard, CsrfGuard, NoteService, NoteGateway],
})
export class AppModule {}
