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
  NoteDto,
  UserDto,
  UserNoteConfigurationDto,
} from '@pretty-notes/shared';


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

    if (!note) {
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
  ): Promise<NoteDto[]> {
    const notes = await this.prisma.note.findMany(
      {
        where: {
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

    if (!note) {
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
    id: number,
    content: string,
  ): Promise<void> {
    await this.prisma.note.update(
      {
        where: {
          id,
        },
        data: {
          content,
        },
      },
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

    if (!note) {
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
      },
    );

    return configs.map(
      c => this.toUserDto(
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

    if (!note) {
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

    if (!newUser) {
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
    const user: UserDto = this.toUserDto(
      notePayload.creator,
    );

    return {
      id: notePayload.id,
      title: notePayload.title,
      content: notePayload.content,
      createdAt: notePayload.createdAt.toISOString(
      ),
      updatedAt: notePayload.updatedAt.toISOString(
      ),
      creator: user,
    };
  }

  private toUserDto(
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
      createdAt: userPayload.createdAt.toISOString(
      ),
    }
  }
}
