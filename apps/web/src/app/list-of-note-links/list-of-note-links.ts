import {
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
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
import { FormsModule } from "@angular/forms";
import { AuthService } from "../shared/services/auth.service";
import { ToasterComponent, ToasterDto } from "../toaster/toaster";


@Component(
  {
    selector: 'pn-list-of-note-links',
    templateUrl: './list-of-note-links.html',
    styleUrl: './list-of-note-links.scss',
    imports: [
      FormsModule,
      ToasterComponent,
    ],
  },
)
export class ListOfNoteLinksComponent
{
  @ViewChild(
    'noteNameInput',
  ) noteNameInput?: ElementRef<HTMLInputElement>;

  listOfNoteLinks = input.required<NoteDto[]>();
  availableFolders = input.required<FolderDto[]>();
  inRootFolder = input.required<boolean>();
  noteMovedToFolderId = output<number>();
  noteModified = output();
  error = signal<string | null>(
    null,
  );
  renamingNote = signal<NoteDto | null>(
    null,
  );
  savingNote = signal<NoteDto | null>(
    null,
  );
  deletingNote = signal<NoteDto | null>(
    null,
  );
  saveError = signal<string | null>(
    null,
  );
  titleForMoveButton = computed(
    (): string => `Move to ${this.inRootFolder() ? '' : 'other '}folder`
  );
  noteSelectingFolder = signal<number | null>(
    null,
  );
  moving = signal<boolean>(
    false,
  );
  toaster = signal<ToasterDto | null>(
    null,
  );
  renamedNoteTitle = '';

  private cdr = inject(
    ChangeDetectorRef,
  );
  private http = inject(
    HttpClient,
  );
  private router = inject(
    Router,
  );
  private auth = inject(
    AuthService,
  );


  isCreatorOf(
    note: NoteDto,
  ): boolean {
      const user = this.auth.currentUser();

      return !!user
        && !!note
        && note.creator.id === user.id;
  }

  renameButtonTitle(
    note: NoteDto,
  ): string {
    return this.isCreatorOf(
      note,
    )
      ? `Rename ${note.title}`
      : 'Collaborators can\'t rename notes';
  }

  deleteButtonTitle(
    note: NoteDto,
  ): string {
    return this.isCreatorOf(
      note,
    )
      ? `Delete ${note.title}`
      : `Unsubscribe from ${note.title}`;
  }

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
          this.noteMovedToFolderId.emit(
            folderId,
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

  renameNote(
    note: NoteDto,
  ): void {
    this.renamingNote.set(
      note,
    );
    this.renamedNoteTitle = note.title;
    this.cdr.detectChanges();
    this.noteNameInput?.nativeElement.focus();
  }

  saveNote(): void {
    if(
      !this.renamingNote()
    ) {
      return;
    }

    const note = this.renamingNote()!;

    this.savingNote.set(
      note,
    );
    this.saveError.set(
      null,
    );

    const renamedNoteTitle = this.renamedNoteTitle.trim();

    if (
      renamedNoteTitle === note.title
      || !renamedNoteTitle
    ) {
      if (
        !renamedNoteTitle
      ) {
        this.saveError.set(
          'The note title can\'t be empty',
        );
      }

      if (
        renamedNoteTitle === note.title
      ) {
        this.renamingNote.set(
          null,
        );
      }

      this.savingNote.set(
        null,
      );

      return;
    }

    this.http.patch<NoteDto>(
      `/api/notes/${note.id}`,
      {
        title: renamedNoteTitle,
      },
    ).subscribe(
      {
        next: (
          n,
        ) => {
          this.renamingNote.set(
            null,
          );
          this.savingNote.set(
            null,
          );
          this.saveError.set(
            null,
          );
          this.renamedNoteTitle = '';
          this.noteModified.emit();
        },
        error: (
          err,
        ) => {
          this.renamingNote.set(
            null,
          );
          this.savingNote.set(
            null,
          );
          this.saveError.set(
            err.error?.message ?? 'Failed to save note title',
          );
          this.renamedNoteTitle = '';
        },
      },
    );
  }

  cancelNoteRenaming(): void {
    this.renamingNote.set(
      null,
    );
    this.saveError.set(
      null,
    );
  }

  deleteNote(
    note: NoteDto,
  ) {
    this.deletingNote.set(
      note,
    );

    if (
      this.isCreatorOf(
        note,
      )
    ) {
      this.http.delete(
        `/api/notes/${note.id}`,
      ).subscribe(
        {
          next: () => {
            this.noteModified.emit();
            this.deletingNote.set(
              null,
            );
          },
          error: (
            err,
          ) => {
            this.toaster.set(
              {
                message: err.error?.message ?? 'Failed to delete note',
                error: true,
                secondsToLive: 4,
              },
            );
            this.deletingNote.set(
              null,
            );
          },
        },
      );
    } else {
      const currentUserId = this.auth.currentUser()?.id;

      if (currentUserId) {
        this.http.delete(
          `/api/notes/${note.id}/collaborators/${currentUserId}`,
        ).subscribe(
          {
            next: () => {
              this.noteModified.emit();
              this.deletingNote.set(
                null,
              );
            },
            error: (
              err,
            ) => {
              this.toaster.set(
                {
                  message: err.error?.message ?? 'Failed to unsubscribe from note',
                  error: true,
                  secondsToLive: 4,
                },
              );
              this.deletingNote.set(
                null,
              );
            },
          },
        );
      } else {
        this.toaster.set(
          {
            message: 'no current user found',
            error: true,
          },
        );
      }
    }
  }
}
