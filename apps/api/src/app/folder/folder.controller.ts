import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
  HttpCurrentUser,
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
    @HttpCurrentUser() user: JwtUser,
  ): Promise<FolderDto[]> {
    return this.folderService.findAllForUser(
      user.sub,
    );
  }

  @Get(
    ':id/notes',
  )
  findAllInFolder(
    @HttpCurrentUser() user: JwtUser,
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
    @HttpCurrentUser() user: JwtUser,
    @Body(
      'name',
    ) name: string,
  ): Promise<FolderDto> {
    return this.folderService.create(
      user.sub,
      name,
    );
  }

  @Delete(
    ':id',
  )
  @UseGuards(
    CsrfGuard,
  )
  delete(
    @HttpCurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
  ): Promise<void> {
    return this.folderService.delete(
      id,
      user.sub,
    );
  }

  @Patch(
    ':id',
  )
  @UseGuards(
    CsrfGuard,
  )
  updateName(
    @HttpCurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
    @Body(
      'name',
    ) newName: string,
  ): Promise<FolderDto> {
    return this.folderService.updateName(
      id,
      user.sub,
      newName,
    );
  }
}
