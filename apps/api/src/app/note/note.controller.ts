import {
  BadRequestException,
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
  NoteDto,
  UserDto,
  UserNoteConfigurationDto,
  FolderDto,
} from '@pretty-notes/shared';
import {
  JwtGuard,
} from '../auth/jwt.guard.js';
import {
  CsrfGuard,
} from '../auth/csrf.guard.js';
import {
  NoteService,
} from './note.service.js';
import {
  CurrentUser,
} from '../auth/current-user.decorator.js';
import type {
  JwtUser,
} from '../auth/current-user.decorator.js';


@Controller(
  'notes',
)
@UseGuards(
  JwtGuard,
)
export class NoteController
{
  constructor(
    private noteService: NoteService,
  ) {
  }


  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
  ): Promise<NoteDto[]> {
    return this.noteService.findAllForUser(
      user.sub,
    );
  }

  @Delete(
    ':id',
  )
  @UseGuards(
    CsrfGuard,
  )
  delete(
    @CurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
  ): Promise<void> {
    return this.noteService.delete(
      id,
      user.sub,
    );
  }

  @Post()
  @UseGuards(
    CsrfGuard,
  )
  create(
    @CurrentUser() user: JwtUser,
    @Body(
      'title',
    ) title: string,
  ): Promise<NoteDto> {
    return this.noteService.create(
      user.sub,
      title,
    );
  }

  @Patch(
    ':id',
  )
  @UseGuards(
    CsrfGuard,
  )
  updateTitle(
    @CurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
    @Body(
      'title',
    ) newTitle: string,
  ): Promise<NoteDto> {
    return this.noteService.updateTitle(
      id,
      user.sub,
      newTitle,
    )
  }

  @Get(
    ':id',
  )
  findOne(
    @CurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
  ): Promise<NoteDto> {
    return this.noteService.findOne(
      id,
      user.sub,
    );
  }

  @Get(
    ':id/collaborators',
  )
  getCollaborators(
    @CurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
  ): Promise<UserDto[]> {
    return this.noteService.getCollaborators(
      id,
      user.sub,
    );
  }

  @Post(
    ':id/collaborators',
  )
  @UseGuards(
    CsrfGuard,
  )
  addCollaborator(
    @CurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
    @Body(
      'email'
    ) email: string,
  ): Promise<UserNoteConfigurationDto> {
    return this.noteService.addCollaborator(
      id,
      user.sub,
      email,
    );
  }

  @Delete(
    ':id/collaborators/:userId',
  )
  @UseGuards(
    CsrfGuard,
  )
  removeCollaborator(
    @CurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
    @Param(
      'userId',
      ParseIntPipe,
    ) userId: number,
  ): Promise<void> {
    return this.noteService.removeCollaborator(
      id,
      user.sub,
      userId,
    );
  }

  @Get(
    ':id/folder',
  )
  getFolder(
    @CurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
  ): Promise<FolderDto | null> {
    return this.noteService.getFolder(
      id,
      user.sub,
    );
  }

  @Patch(
    ':id/folder',
  )
  @UseGuards(
    CsrfGuard,
  )
  moveToFolder(
    @CurrentUser() user: JwtUser,
    @Param(
      'id',
      ParseIntPipe,
    ) id: number,
    @Body(
      'folderId',
    ) folderId: string | null,
  ): Promise<void> {
    if (folderId === null) {
      return this.noteService.removeFromFolder(
        id,
        user.sub,
      );
    }

    const parsedFolderId: number = Number.parseInt(folderId);

    if (
      Number.isNaN(
        parsedFolderId
      )
    ) {
      throw new BadRequestException(
        'folderId must be an integer'
      );
    }

    return this.noteService.addToFolder(
      id,
      user.sub,
      parsedFolderId,
    );
  }
}
