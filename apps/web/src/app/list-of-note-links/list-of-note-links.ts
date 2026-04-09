import {
    Component,
    computed,
    inject,
    input,
    signal,
} from "@angular/core";
import {
  FolderDto,
  NoteDto,
} from "@pretty-notes/shared";
import {
  HttpClient,
} from '@angular/common/http';
import {
  Router,
} from "@angular/router";


@Component(
  {
    selector: 'pn-list-of-note-links',
    templateUrl: './list-of-note-links.html',
    styleUrl: './list-of-note-links.scss',
  },
)
export class ListOfNoteLinksComponent
{
  listOfNoteLinks = input.required<NoteDto[]>();
  availableFolders = input.required<FolderDto[]>();
  inRootFolder = input.required<boolean>();
  error = signal<string | null>(
    null,
  );
  titleForMoveButton = computed(
    (): string => `Move to ${this.inRootFolder() ? '' : 'other '}folder`
  )

  noteSelectingFolder = signal<number | null>(
    null,
  );
  moving = signal<boolean>(
    false,
  );

  private http = inject(
    HttpClient,
  );
  private router = inject(
    Router,
  );


  openNote(
    id: number,
  ): void {
    this.router.navigate(
      [
        '/notes',
        id,
      ],
    );
  }

  preview(
    text: string,
    maxLength: number,
  ): string {
    return text.length === 0
      ? "Empty note"
      : text.length > maxLength
        ? `${text.substring(0, maxLength)}...`
        : text;
  }

  move(
    noteId: number,
  ): void {
    this.noteSelectingFolder.set(
      noteId,
    );
  }

  cancelMove(): void {
    this.noteSelectingFolder.set(
      null,
    );
  }

  selectFolder(
    folderId: number,
  ): void {
    const noteId: number | null = this.noteSelectingFolder();

    this.noteSelectingFolder.set(
      null,
    );

    if (!noteId) {
      return;
    }

    this.moving.set(
      true,
    );
    this.http.patch(
      `/api/notes/${noteId}/folder`,
      {
        folderId: folderId,
      }
    ).subscribe(
      {
        next: () => {
          this.moving.set(
            false,
          );
        },
        error: (
          err,
        ) => {
          this.error.set(
            `Failed to move note (${err.status}: ${err.message})`,
          )
        },
      },
    );
  }
}
