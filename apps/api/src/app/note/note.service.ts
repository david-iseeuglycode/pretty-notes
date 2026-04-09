import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PrismaService,
} from '@pretty-notes/prisma';
import type {
  FolderDto,
  NoteDto,
  UserDto,
  UserNoteConfigurationDto,
} from '@pretty-notes/shared';
import {
  toUserDto,
} from '../mappers';


@Injectable()
export class NoteService
{
  constructor(
    private prisma: PrismaService,
  ) {
  }


  async findOne(
    id: number,
    userId: number,
  ): Promise<NoteDto> {
    const note = await this.prisma.note.findFirst(
      {
        where: {
          id,
          users: {
            some: {
              userId,
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
        },
      },
    );

    if (
      !note
    ) {
      throw new NotFoundException(
        'Note not found',
      );
    }

    return this.toNoteDto(
      note,
    );
  }

  async findAllForUser(
    userId: number,
    folderId?: number,
  ): Promise<NoteDto[]> {
    const userAndFolderFilter = {
      userId,
      ...(
        folderId === undefined
          ? {
            folderId: null,
          }
          : {
            folderId,
          }
      ),
    };

    const notes = await this.prisma.note.findMany(
      {
        where: {
          users: {
            some: userAndFolderFilter,
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      },
    );

    return notes.map(
      n => this.toNoteDto(
        n,
      ),
    );
  }

  async create(
    userId: number,
    title: string,
  ): Promise<NoteDto> {
    const note = await this.prisma.note.create(
      {
        data: {
          title,
          content: '',
          createdBy: userId,
          users: {
            create: {
              userId,
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
        },
      },
    );

    return this.toNoteDto(
      note,
    );
  }

  async delete(
    noteId: number,
    requestingUserId: number,
  ): Promise<void> {
    const note = await this.prisma.note.findFirst(
      {
        where: {
          id: noteId,
          createdBy: requestingUserId,
        },
      },
    );

    if (
      !note
    ) {
      throw new ForbiddenException(
        'Only the note creator can delete a note',
      );
    }

    await this.prisma.note.delete(
      {
        where: {
          id: noteId,
        }
      }
    );
  }

  async updateContent(
    noteId: number,
    content: string,
  ): Promise<void> {
    await this.prisma.note.update(
      {
        where: {
          id: noteId,
        },
        data: {
          content,
        },
      },
    );
  }

  async updateTitle(
    noteId: number,
    requestingUserId: number,
    title: string,
  ): Promise<NoteDto> {
    const note = await this.prisma.note.findFirst(
      {
        where: {
          id: noteId,
          createdBy: requestingUserId,
        },
      },
    );

    if (
      !note
    ) {
      throw new ForbiddenException(
        'Only the note creator can update the title',
      );
    }

    const updatedNote = await this.prisma.note.update(
      {
        where: {
          id: noteId,
        },
        data: {
          title,
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
        },
      }
    );

    return this.toNoteDto(
      updatedNote,
    );
  }

  async getCollaborators(
    noteId: number,
    userId: number,
  ): Promise<UserDto[]> {
    const note = await this.prisma.note.findFirst(
      {
        where: {
          id: noteId,
          users: {
            some: {
              userId,
            },
          },
        },
      },
    );

    if (
      !note
    ) {
      throw new NotFoundException(
        'Note not found',
      );
    }

    const configs = await this.prisma.userNoteConfiguration.findMany(
      {
        where: {
          noteId,
          NOT: {
            userId: userId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          user: {
            email: 'asc',
          }
        }
      },
    );

    return configs.map(
      c => toUserDto(
        c.user,
      ),
    );
  }

  async addCollaborator(
    noteId: number,
    requestingUserId: number,
    email: string,
  ): Promise<UserNoteConfigurationDto> {
    const note = await this.prisma.note.findFirst(
      {
        where: {
          id: noteId,
          createdBy: requestingUserId,
        },
      },
    );

    if (
      !note
    ) {
      throw new ForbiddenException(
        'Only the note creator can add collaborators',
      );
    }

    const newUser = await this.prisma.user.findUnique(
      {
        where: {
          email,
        },
      },
    );

    if (
      !newUser
    ) {
      throw new NotFoundException(
        `No user found with email ${email}`,
      );
    }

    const userNoteConfig = await this.prisma.userNoteConfiguration.create(
      {
        data: {
          userId: newUser.id,
          noteId,
        },
      },
    );

    return userNoteConfig;
  }

  async removeCollaborator(
    noteId: number,
    requestingUserId: number,
    userId: number,
  ): Promise<void> {
    const note = await this.prisma.note.findFirst(
      {
        where: {
          id: noteId,
        },
      },
    );

    if (
      !note
    ) {
      throw new NotFoundException(
        'unknown note id',
      );
    }

    const requestingUserOwnsNote = note.createdBy === requestingUserId;

    if (
      requestingUserId === userId
      && requestingUserOwnsNote
    ) {
      throw new ForbiddenException(
        'creator can\'t unsubscribe from their own note',
      );
    } else if (
      requestingUserId !== userId
      && !requestingUserOwnsNote
    ) {
      throw new ForbiddenException(
        'only creator can unsubscribe another user from their own note',
      );
    }

    await this.prisma.userNoteConfiguration.delete(
      {
        where: {
          userId_noteId: {
            userId: userId,
            noteId: noteId,
          },
        },
      }
    );
  }

  async addToFolder(
    noteId: number,
    requestingUserId: number,
    folderId: number,
  ): Promise<void> {
    const folder = await this.prisma.folder.findUnique(
      {
        where: {
          id: folderId,
          userId: requestingUserId,
        },
      },
    );

    if (
      !folder
    ) {
      throw new ForbiddenException(
        'Only the folder creator can add notes to it',
      );
    }

    await this.updateFolderIdForUserNote(
      noteId,
      requestingUserId,
      folderId,
    );
  }

  async removeFromFolder(
    noteId: number,
    requestingUserId: number,
  ): Promise<void> {
    await this.updateFolderIdForUserNote(
      noteId,
      requestingUserId,
      null,
    );
  }

  async getFolder(
    noteId: number,
    requestingUserId: number,
  ): Promise<FolderDto | null> {
    const userNoteConfig = await this.prisma.userNoteConfiguration.findUnique(
      {
        where: {
          userId_noteId: {
            userId: requestingUserId,
            noteId: noteId,
          },
        },
      },
    );

    if (
      !userNoteConfig
    ) {
      throw new NotFoundException(
        'unknown note id and user id combination',
      );
    }

    if (
      !userNoteConfig.folderId
    ) {
      return null;
    }

    const folder = await this.prisma.folder.findUnique(
      {
        where: {
          id: userNoteConfig.folderId,
        },
      },
    );

    if (
      !folder
    ) {
      return null;
    }

    return this.toFolderDto(folder);
  }


  private async updateFolderIdForUserNote(
    noteId: number,
    userId: number,
    folderId: number | null,
  ): Promise<void> {
    const newUserNoteConfiguration = await this.prisma.userNoteConfiguration.findUnique(
      {
        where: {
          userId_noteId: {
            userId: userId,
            noteId: noteId,
          },
        },
      },
    );

    if (
      !newUserNoteConfiguration
    ) {
      throw new NotFoundException(
        `The user used for the request can't find a note with id ${noteId}`,
      );
    }

    await this.prisma.userNoteConfiguration.update(
      {
        where: {
          userId_noteId: {
            userId: userId,
            noteId: noteId,
          }
        },
        data: {
          folderId: folderId,
        },
      },
    );
  }

  private toFolderDto(
    folderPayload: Prisma.FolderGetPayload<{
      select: {
        id: true,
        name: true,
        userId: true;
      };
    }>
  ): FolderDto {
    return {
      id: folderPayload.id,
      name: folderPayload.name,
      userId: folderPayload.userId,
    }
  }
  private toNoteDto(
    notePayload: Prisma.NoteGetPayload<{
      include: {
        creator: {
          select: {
            id: true;
            email: true;
            createdAt: true;
          };
        };
      };
    }>,
  ): NoteDto {
    const user: UserDto = toUserDto(
      notePayload.creator,
    );

    return {
      id: notePayload.id,
      title: notePayload.title,
      content: notePayload.content,
      createdAt: notePayload.createdAt.toISOString(),
      updatedAt: notePayload.updatedAt.toISOString(),
      creator: user,
    };
  }
}
