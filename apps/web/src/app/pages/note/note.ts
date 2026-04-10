import {
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormsModule,
} from '@angular/forms';
import {
  HttpClient,
} from '@angular/common/http';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  FolderDto,
  NoteDto,
  UserDto,
} from '@pretty-notes/shared';
import {
  NoteSocketService,
} from '../../shared/services/note-socket.service';
import {
  AuthService,
} from '../../shared/services/auth.service';
import {
  createdBy,
} from '../../shared/utils/note-utils';


@Component(
  {
    selector: 'pn-note',
    templateUrl: './note.html',
    styleUrl: './note.scss',
    imports: [
      FormsModule,
    ],
  },
)
export class NotePage
implements OnInit
, OnDestroy
{
  @ViewChild(
    'titleInput',
  ) titleInput?: ElementRef<HTMLInputElement>;

  note = signal<NoteDto | null>(
    null,
  );
  collaborators = signal<UserDto[]>(
    [],
  );
  folder = signal<FolderDto | null>(
    null,
  );
  error = signal<string | null>(
    null,
  );
  renaming = signal<boolean>(
    false,
  );
  saving = signal<boolean>(
    false,
  );
  deleting = signal<boolean>(
    false,
  );
  collaboratorError = signal<string | null>(
    null,
  );
  deleteError = signal<string | null>(
    null,
  );
  saveError = signal<string | null>(
    null,
  );
  isCreator = computed(
    (): boolean => {
      const user = this.auth.currentUser();
      const note = this.note();

      return !!user
        && !!note
        && note.creator.id === user.id;
    }
  );
  deleteButtonTitle = computed(
    (): string => {
      if (
        this.isCreator()
      ) {
        let title: string = 'Delete';

        if (
          this.collaborators().length > 0
        ) {
          title += ' (for everyone)';
        }

        return title;
      } else {
        return 'Unsubscribe from note';
      }
    }
  );
  displayTitle = computed(
    (): string => {
      const noteTitle: string = this.note()?.title ?? 'unknown title';
      const folderName: string | undefined = this.folder()?.name;

      return `${noteTitle}${folderName === undefined ? '' : ` in ${folderName}`}`;
    }
  );
  newCollaboratorEmail = '';
  newTitle = '';

  private route = inject(
    ActivatedRoute,
  );
  private router = inject(
    Router,
  );
  private http = inject(
    HttpClient,
  );
  private socket = inject(
    NoteSocketService,
  );
  private auth = inject(
    AuthService,
  );
  private cdr = inject(
    ChangeDetectorRef,
  );

  private noteId = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isRemoteUpdate = false;

  protected createdBy = createdBy;


  ngOnInit(): void {
    this.noteId = Number(
      this.route.snapshot.paramMap.get(
        'id',
      ),
    );

    this.http.get<FolderDto>(
      `/api/notes/${this.noteId}/folder`,
    ).subscribe(
      {
        next: (
          f,
        ) => {
          this.folder.set(
            f,
          );
        },
        error: (
          err,
        ) => {
          this.error.set(
            `Failed to load note folder (${err.status}: ${err.message})`,
          )
        }
      },
    );
    this.http.get<NoteDto>(
      `/api/notes/${this.noteId}`,
    ).subscribe(
      {
        next: (
          n,
        ) => {
          this.note.set(
            n,
          );
          this.newTitle = n.title;
          this.socket.joinNote(
            this.noteId,
          );
          this.loadCollaborators();
          window.addEventListener(
            'beforeunload',
            this.beforeUnloadHandler,
          );
        },
        error: (
          err,
        ) => {
          this.error.set(
            `Failed to load note (${err.status}: ${err.message})`,
          );
        },
      },
    );

    this.socket.onNoteUpdated(
      (
        {
          content,
        },
      ) => {
        if (
          this.debounceTimer
        ) {
          return;
        }

        this.isRemoteUpdate = true;
        const current = this.note();

        if (
          current
        ) {
          this.note.set(
            {
              ...current,
              content,
            }
          );
        }
      },
    );
  }

  rename(): void {
    this.saveError.set(
      null,
    );
    this.renaming.set(
      true,
    );
    this.cdr.detectChanges();
    this.titleInput?.nativeElement.focus();
  }

  cancelTitleRenaming(): void {
    this.renaming.set(
      false,
    );
    this.saveError.set(
      null,
    );
    this.newTitle = this.note()?.title ?? '';
  }

  save(): void {
    if (
      !this.isCreator
    ) {
      this.saveError.set(
        'Only the owner of the note can change the title',
      );

      return;
    }

    this.saving.set(
      true,
    );
    this.saveError.set(
      null,
    );

    const newTitle = this.newTitle.trim();

    if (
      !newTitle
    ) {
      this.saveError.set(
        'The title can\'t be empty',
      );
      this.saving.set(
        false,
      );

      return;
    }

    this.http.patch<NoteDto>(
      `/api/notes/${this.noteId}`,
      {
        title: newTitle,
      },
    ).subscribe(
      {
        next: (
          n,
        ) => {
          this.note.set(
            n,
          );
          this.saving.set(
            false,
          );
          this.renaming.set(
            false,
          );
        },
        error: (
          err,
        ) => {
          this.newTitle = this.note()?.title ?? '';
          this.saveError.set(
            err.error?.message ?? 'Failed to save title',
          );
          this.saving.set(
            false,
          );
          this.renaming.set(
            false,
          );
        },
      },
    );
  }

  delete(): void {
    this.deleting.set(
      true,
    );
    this.deleteError.set(
      null,
    );

    if (
      this.isCreator()
    ) {
      this.http.delete(
        `/api/notes/${this.noteId}`,
      ).subscribe(
        {
          next: () => {
            this.router.navigate(
              [
                '/',
              ],
            );
            this.deleting.set(
              false,
            );
          },
          error: (
            err,
          ) => {
            this.deleteError.set(
              err.error?.message ?? 'Failed to delete note',
            );
            this.deleting.set(
              false,
            );
          }
        }
      );
    } else {
      const currentUserId = this.auth.currentUser()?.id;

      this.http.delete(
        `/api/notes/${this.noteId}/collaborators/${currentUserId}`,
      ).subscribe(
        {
          next: () => {
            this.router.navigate(
              [
                '/',
              ],
            );
            this.deleting.set(
              false,
            );
          },
          error: (
            err,
          ) => {
            this.deleteError.set(
              err.error?.message ?? 'Failed to unsubscribe from note',
            );
            this.deleting.set(
              false,
            );
          }
        }
      );
    }
  }

  addCollaborator(): void {
    this.saving.set(
      true,
    );
    const email = this.newCollaboratorEmail.trim();

    if (
      !email
    ) {
      return;
    }

    this.collaboratorError.set(
      null,
    );
    this.http.post(
      `/api/notes/${this.noteId}/collaborators`,
      {
        email,
      },
    ).subscribe(
      {
        next: () => {
          this.newCollaboratorEmail = '';
          this.loadCollaborators();
          this.saving.set(
            false,
          );
        },
        error: (
          err,
        ) => {
          this.collaboratorError.set(
            err.error?.message ?? 'Failed to add collaborator',
          );
          this.saving.set(
            false,
          );
        },
      },
    );
  }

  removeCollaborator(
    userId: number
  ): void {
    this.saving.set(
      true,
    );
    this.collaboratorError.set(
      null,
    );
    this.http.delete(
      `/api/notes/${this.noteId}/collaborators/${userId}`,
    ).subscribe(
      {
        next: () => {
          this.loadCollaborators();
          this.saving.set(
            false,
          );
        },
        error: (
          err,
        ) => {
          this.collaboratorError.set(
            err.error?.message ?? 'Failed to remove collaborator',
          );
          this.saving.set(
            false,
          );
        },
      },
    );
  }

  onContentChange(
    content: string,
  ): void {
    if (
      this.isRemoteUpdate
    ) {
      this.isRemoteUpdate = false;

      return;
    }

    const current = this.note();

    if (
      !current
    ) {
      return;
    }

    this.note.set(
      {
        ...current,
        content,
      },
    );

    if (
      this.debounceTimer
    ) {
      clearTimeout(
        this.debounceTimer,
      );
    }

    this.debounceTimer = setTimeout(
      () => {
        this.debounceTimer = null;
        const n = this.note();

        if (
          n
        ) {
          this.socket.sendUpdate(
            {
              noteId: n.id,
              content: n.content,
            }
          );
        }
      },
      500,
    );
  }

  ngOnDestroy(): void {
    if (
      this.debounceTimer
    ) {
      clearTimeout(
        this.debounceTimer,
      );
    }

    this.socket.offNoteUpdated();
    window.removeEventListener(
      'beforeunload',
      this.beforeUnloadHandler,
    );
  }


  private beforeUnloadHandler = (): void => {
    this.ngOnDestroy();
  };

  private loadCollaborators(): void {
    this.http.get<UserDto[]>(
      `/api/notes/${this.noteId}/collaborators`,
    ).subscribe(
      {
        next: (
          users
        ) => this.collaborators.set(
          users
        ),
      },
    );
  }
}
