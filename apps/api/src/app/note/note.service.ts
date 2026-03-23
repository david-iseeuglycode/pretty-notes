import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaService,
} from '@pretty-notes/prisma';
import type {
  NoteDto,
} from '@pretty-notes/shared';

@Injectable()
export class NoteService
{
  constructor(
    private prisma: PrismaService,
  ) {}

  async findOne(
    id: number,
    userId: number,
  ) {
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

    return note;
  }

  async findAllForUser(
    userId: number,
  ) {
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

    return notes;
  }

  create(
    userId: number,
    title: string,
  ) {
    return this.prisma.note.create(
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
  }

  updateContent(
    id: number,
    content: string,
  ) {
    return this.prisma.note.update(
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
  ) {
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
      (
        c: {
          user: {
            id: number;
            email: string;
            createdAt: Date;
          };
        }
      ) => c.user,
    );
  }

  async addCollaborator(
    noteId: number,
    requestingUserId: number,
    email: string,
  ) {
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

    return this.prisma.userNoteConfiguration.create(
      {
        data: {
          userId: newUser.id,
          noteId,
        },
      },
    );
  }
}
