import {
  Injectable,
} from '@nestjs/common';
import {
  Prisma,
  PrismaService,
} from '@pretty-notes/prisma';
import type {
  NoteDto,
  UserDto,
  FolderDto,
} from '@pretty-notes/shared';
import {
  toUserDto,
} from '../mappers';
import {
  NoteService,
} from '../note/note.service';


@Injectable()
export class FolderService
{
  constructor(
    private prisma: PrismaService,
    private noteService: NoteService,
  ) {
  }


  async create(
    userId: number,
    name: string,
  ): Promise<FolderDto> {
    const folder = await this.prisma.folder.create(
      {
        data: {
          name: name,
          userId: userId,
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

    return this.toFolderDto(
      folder,
    );
  }

  async findAllForUser(
    userId: number,
  ): Promise<FolderDto[]> {
    const folders = await this.prisma.folder.findMany(
      {
        where: {
          userId: userId,
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
          name: 'asc',
        },
      },
    );

    return folders.map(
      f => this.toFolderDto(
        f,
      ),
    );
  }

  async findAllUsersNotesInFolder(
    userId: number,
    folderId: number,
  ): Promise<NoteDto[]> {
    return this.noteService.findAllForUser(
      userId,
      folderId,
    );
  }


  private toFolderDto(
    folderPayload: Prisma.FolderGetPayload<{
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          }
        },
      }
    }>,
  ): FolderDto {
    const user: UserDto = toUserDto(
      folderPayload.user,
    );

    return {
      id: folderPayload.id,
      name: folderPayload.name,
      userId: folderPayload.userId,
      user: user,
    };
  }
}
