import { UserDto } from './user.dto.js';

export interface CreateNoteDto {
  title: string;
  content: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
}

export interface NoteDto {
  id: number;
  title: string;
  content: string;
  creator: UserDto;
  createdAt: string;
  updatedAt: string;
}
