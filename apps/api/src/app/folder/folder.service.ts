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
  FolderDto,
} from '@pretty-notes/shared';
import {
  NoteService,
} from '../note/note.service';
import { throwCustomIfNotFoundOrRethrow } from '../utilities';


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

  async delete(
    folderId: number,
    requestingUserId: number,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(
        [
          this.prisma.userNoteConfiguration.updateMany(
            {
              where: {
                folderId: folderId,
                userId: requestingUserId,
              },
              data: {
                folderId: null,
              }
            }
          ),
          this.prisma.folder.delete(
            {
              where: {
                id: folderId,
                userId: requestingUserId,
              },
            },
          ),
        ],
      );
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new ForbiddenException(
          'only the creating user can delete a folder',
        ),
        e,
      );
    }
  }

  async findAllForUser(
    userId: number,
  ): Promise<FolderDto[]> {
    const folders = await this.prisma.folder.findMany(
      {
        where: {
          userId: userId,
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

  async updateName(
    folderId: number,
    requestingUserId: number,
    name: string,
  ): Promise<FolderDto> {
    try {
      const updatedFolder = await this.prisma.folder.update(
        {
          where: {
            id: folderId,
            userId: requestingUserId,
          },
          data: {
            name,
          },
        },
      );

      return this.toFolderDto(updatedFolder);
    } catch (e) {
      throwCustomIfNotFoundOrRethrow(
        new NotFoundException(
          'no such folder exists for the user',
        ),
        e,
      );
    }
  }


  private toFolderDto(
    folderPayload: Prisma.FolderGetPayload<{}>,
  ): FolderDto {
    return {
      id: folderPayload.id,
      name: folderPayload.name,
      userId: folderPayload.userId,
    };
  }
}
