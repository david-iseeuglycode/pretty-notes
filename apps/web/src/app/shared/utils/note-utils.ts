import {
    NoteDto,
    UserDto,
} from '@pretty-notes/shared';

export function createdBy(
    note: NoteDto,
    user: UserDto,
): boolean {
  return !!note
    && !!user
    && note.creator.id === user.id;
}
