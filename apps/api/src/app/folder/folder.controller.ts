import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  FolderDto,
  NoteDto,
} from '@pretty-notes/shared';
import {
  JwtGuard,
} from '../auth/jwt.guard.js';
import {
  CsrfGuard,
} from '../auth/csrf.guard.js';
import {
  FolderService,
} from './folder.service.js';
import {
  CurrentUser,
} from '../auth/current-user.decorator.js';
import type {
  JwtUser,
} from '../auth/current-user.decorator.js';


@Controller(
  'folders'
)
@UseGuards(
  JwtGuard,
)
export class FolderController
{
  constructor(
    private folderService: FolderService,
  ) {
  }


  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
  ): Promise<FolderDto[]> {
    return this.folderService.findAllForUser(
      user.sub,
    );
  }

  @Get(
    ':id/notes',
  )
  findAllInFolder(
    @CurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
  ): Promise<NoteDto[]> {
    return this.folderService.findAllUsersNotesInFolder(
      user.sub,
      id,
    );
  }

  @Post()
  @UseGuards(
    CsrfGuard,
  )
  create(
    @CurrentUser() user: JwtUser,
    @Body(
      'name',
    ) name: string,
  ): Promise<FolderDto> {
    return this.folderService.create(
      user.sub,
      name,
    );
  }
}
