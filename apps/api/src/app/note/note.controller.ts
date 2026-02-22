import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from '../auth/jwt.guard.js';
import { CsrfGuard } from '../auth/csrf.guard.js';
import { NoteService } from './note.service.js';

interface JwtUser { sub: number; email: string; csrfToken: string; }

@Controller('notes')
@UseGuards(JwtGuard)
export class NoteController {
  constructor(private noteService: NoteService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as Request & { user: JwtUser }).user;
    return this.noteService.findAllForUser(user.sub);
  }

  @Post()
  @UseGuards(CsrfGuard)
  create(@Req() req: Request, @Body('title') title: string) {
    const user = (req as Request & { user: JwtUser }).user;
    return this.noteService.create(user.sub, title);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = (req as Request & { user: JwtUser }).user;
    return this.noteService.findOne(id, user.sub);
  }

  @Get(':id/collaborators')
  getCollaborators(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = (req as Request & { user: JwtUser }).user;
    return this.noteService.getCollaborators(id, user.sub);
  }

  @Post(':id/collaborators')
  @UseGuards(CsrfGuard)
  addCollaborator(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body('email') email: string,
  ) {
    const user = (req as Request & { user: JwtUser }).user;
    return this.noteService.addCollaborator(id, user.sub, email);
  }
}
