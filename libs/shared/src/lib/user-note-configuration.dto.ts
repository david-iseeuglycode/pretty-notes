export interface UserNoteConfigurationDto {
  userId: number;
  noteId: number;
  folderId: number | null;
}

export interface AssignNoteDto {
  noteId: number;
  folderId?: number;
}
