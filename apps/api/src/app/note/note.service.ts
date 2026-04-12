import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PrismaService,
  User,
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
import {
  throwCustomIfDuplicateOrRethrow,
  throwCustomIfNotFoundOrRethrow,
} from '../utilities';


@Injectable()
export class NoteService
{
  constructor(
    private prisma: PrismaService,
  ) {
  }


  async assertUserCanAccessNote(
    id: number,
    userId: number,
  ): Promise<void> {
    try {
      await this.prisma.note.findFirstOrThrow(
        {
          where: {
            id,
            users: {
              some: {
                userId,
              },
            },
          },
        },
      );
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new NotFoundException(
          'Note not accessible',
        ),
        e
      );
    }
  }

  async findOne(
    id: number,
    userId: number,
  ): Promise<NoteDto> {
    try {
      const note = await this.prisma.note.findFirstOrThrow(
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

      return this.toNoteDto(
        note,
      );
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new NotFoundException(
          'Note not found',
        ),
        e
      );
    }
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
    try {
      await this.prisma.note.delete(
        {
          where: {
            id: noteId,
            createdBy: requestingUserId,
          }
        }
      );
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new ForbiddenException(
          'Only the note creator can delete a note',
        ),
        e,
      );
    }
  }

  async updateContent(
    noteId: number,
    userId: number,
    content: string,
  ): Promise<void> {
    await this.prisma.note.update(
      {
        where: {
          id: noteId,
          users: {
            some: {
              userId,
            },
          },
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
    try {
      const updatedNote = await this.prisma.note.update(
        {
          where: {
            id: noteId,
            createdBy: requestingUserId,
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
    } catch(e) {
      throwCustomIfNotFoundOrRethrow(
        new ForbiddenException(
          'Only the note creator can update the title',
        ),
        e,
      );
    }
  }

  async getCollaborators(
    noteId: number,
    userId: number,
  ): Promise<UserDto[]> {
    this.assertUserCanAccessNote(
      noteId,
      userId,
    );
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
    try {
      await this.prisma.note.findFirstOrThrow(
        {
          where: {
            id: noteId,
            createdBy: requestingUserId,
          },
        },
      );
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new ForbiddenException(
          'Only the note creator can add collaborators',
        ),
        e,
      );
    }

    let newUser: User | null = null;

    try {
      newUser = await this.prisma.user.findUniqueOrThrow(
        {
          where: {
            email,
          },
        },
      );
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new NotFoundException(
          `No user found with email ${email}`,
        ),
        e,
      );
    }

    try {
      const userNoteConfig = await this.prisma.userNoteConfiguration.create(
        {
          data: {
            userId: newUser.id,
            noteId,
          },
        },
      );

      return userNoteConfig;
    } catch (e) {
      throwCustomIfDuplicateOrRethrow(
        new ConflictException(
          'That user is already a collaborator on this note',
        ),
        e,
      );
    }
  }

  async removeCollaborator(
    noteId: number,
    requestingUserId: number,
    userId: number,
  ): Promise<void> {
    let requestingUserOwnsNote: boolean = false;

    try {
      const note = await this.prisma.note.findFirstOrThrow(
        {
          where: {
            id: noteId,
          },
        },
      );

      requestingUserOwnsNote = note.createdBy === requestingUserId;
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new NotFoundException(
          'unknown note id',
        ),
        e,
      );
    }

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
    try {
      await this.prisma.folder.findUniqueOrThrow(
        {
          where: {
            id: folderId,
            userId: requestingUserId,
          },
        },
      );
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new ForbiddenException(
          'Only the folder creator can add notes to it',
        ),
        e,
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
    try {
      const userNoteConfig = await this.prisma.userNoteConfiguration.findUniqueOrThrow(
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
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new NotFoundException(
          'unknown note id and user id combination',
        ),
        e,
      );
    }
  }


  private async updateFolderIdForUserNote(
    noteId: number,
    userId: number,
    folderId: number | null,
  ): Promise<void> {
    try {
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
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new NotFoundException(
          `The user used for the request can't find a note with id ${noteId}`,
        ),
        e,
      );
    }
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
