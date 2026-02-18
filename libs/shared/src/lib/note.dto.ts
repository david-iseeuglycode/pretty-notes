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
  createdAt: string;
  updatedAt: string;
}
