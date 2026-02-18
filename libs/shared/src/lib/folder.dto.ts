export interface CreateFolderDto {
  name: string;
}

export interface UpdateFolderDto {
  name?: string;
}

export interface FolderDto {
  id: number;
  name: string;
  userId: number;
}
