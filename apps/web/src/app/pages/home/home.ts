import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
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
  Router,
} from '@angular/router';
import {
  firstValueFrom,
} from 'rxjs';
import {
  FolderDto,
  NoteDto,
} from '@pretty-notes/shared';
import {
  AuthService,
} from '../../shared/services/auth.service';
import {
  ListOfNoteLinksComponent,
} from '../../list-of-note-links/list-of-note-links';
import {
  ToasterComponent,
  ToasterDto,
} from '../../toaster/toaster';


@Component(
  {
    selector: 'pn-home',
    templateUrl: './home.html',
    styleUrl: './home.scss',
    imports: [
      FormsModule,
      ListOfNoteLinksComponent,
      ToasterComponent,
    ],
  },
)
export class HomePage
{
  @ViewChild(
    'folderNameInput',
  ) folderNameInput?: ElementRef<HTMLInputElement>;

  auth = inject(
    AuthService,
  );
  creating = signal<boolean>(
    false,
  );
  notes = signal<NoteDto[]>(
    [],
  );
  notesInOpenFolder = signal<NoteDto[]>(
    [],
  );
  folders = signal<FolderDto[]>(
    [],
  );
  loadingNotes = signal<boolean>(
    false,
  );
  loadingFolders = signal<boolean>(
    false,
  );
  renamingFolder = signal<FolderDto | null>(
    null,
  );
  renamingNote = signal<number | null>(
    null,
  );
  savingFolder = signal<FolderDto | null>(
    null,
  );
  savingNote = signal<boolean>(
    false,
  );
  saveError = signal<string | null>(
    null,
  );
  toaster = signal<ToasterDto | null>(
    null,
  );
  loading = computed(
    (): boolean => this.loadingNotes()
      || this.loadingFolders()
  );
  opening = signal<boolean>(
    false,
  );
  currentFolder = signal<number | null>(
    null,
  );
  deletingFolder = signal<FolderDto | null>(
    null,
  );
  newNoteTitle = '';
  newFolderName = '';
  renamedFolderName = '';

  private cdr = inject(
    ChangeDetectorRef,
  );
  private http = inject(
    HttpClient,
  );
  private router = inject(
    Router,
  );


  constructor() {
    effect(
      () => {
        if (
          this.auth.currentUser()
        ) {
          this.loadNotes();
          this.loadFolders();
        }
      },
    );
  }


  loadNotes(): void {
    this.loadingNotes.set(
      true,
    );
    this.http.get<NoteDto[]>(
      '/api/notes',
    ).subscribe(
      (
        notes,
      ) => {
        this.notes.set(
          notes,
        );
        this.loadingNotes.set(
          false,
        );
      },
    );
  }

  loadFolders(): void {
    this.loadingFolders.set(
      true,
    );
    this.http.get<FolderDto[]>(
      '/api/folders',
    ).subscribe(
      (
        folders,
      ) => {
        this.folders.set(
          folders,
        );
        this.loadingFolders.set(
          false,
        );
      },
    );
  }

  async createNote(): Promise<void> {
    if (
      !this.newNoteTitle.trim()
    ) {
      return;
    }

    this.creating.set(
      true,
    );

    const note = await firstValueFrom(
      this.http.post<NoteDto>(
        '/api/notes',
        {
          title: this.newNoteTitle.trim(),
        },
      ),
    );

    if (
      note
    ) {
      this.newNoteTitle = '';
      this.router.navigate(
        [
          '/notes',
          note.id,
        ],
      );
    }

    this.creating.set(
      false,
    );
  }

  async createFolder(): Promise<void> {
    if (
      !this.newFolderName.trim()
    ) {
      return;
    }

    this.creating.set(
      true,
    );

    const folder = await firstValueFrom(
      this.http.post<FolderDto>(
        '/api/folders',
        {
          name: this.newFolderName.trim()
        },
      ),
    );

    if (
      folder
    ) {
      this.newFolderName = '';
      this.loadFolders();
    }

    this.creating.set(
      false,
    );
  }

  deleteFolder(
    folder: FolderDto,
  ):void {
    this.deletingFolder.set(
      folder,
    );
    this.http.delete(
      `/api/folders/${folder.id}`,
    ).subscribe(
      {
        next: () => {
          this.deletingFolder.set(
            null,
          );
          this.loadFolders();
          this.loadNotes();
        },
        error: (
          err,
        ) => {
          this.deletingFolder.set(
            null,
          );
          this.toaster.set(
            {
              message: err.error?.message ?? 'Error deleting folder',
              error: true,
              secondsToLive: 4,
            }
          );
        },
      },
    );
  }

  openFolder(
    id: number,
  ): void {
    this.opening.set(
      true,
    );
    this.currentFolder.set(
      id,
    );
    this.http.get<NoteDto[]>(
      `/api/folders/${id}/notes`,
    ).subscribe(
      (
        notes,
      ) => {
        this.notesInOpenFolder.set(
          notes,
        );
        this.opening.set(
          false,
        );
      },
    );
  }

  closeFolder(): void {
    this.notesInOpenFolder.set(
      [],
    );
    this.currentFolder.set(
      null,
    );
  }

  noteMovedFromRoot(
    targetFolderId: number,
  ): void {
    this.loadNotes();
    this.openFolder(
      targetFolderId,
    );
  }

  renameFolder(
    folder: FolderDto,
  ): void {
    this.renamingFolder.set(
      folder,
    );
    this.renamedFolderName = folder.name;
    this.cdr.detectChanges();
    this.folderNameInput?.nativeElement.focus();
  }

  saveFolder(): void {
    if (
      !this.renamingFolder()
    ) {
      return;
    }

    const folder = this.renamingFolder()!;

    this.savingFolder.set(
      folder,
    );
    this.saveError.set(
      null,
    );

    const renamedFolderName = this.renamedFolderName.trim();

    if (
      renamedFolderName === folder.name
      || !renamedFolderName
    ) {
      if (
        !renamedFolderName
      ) {
        this.saveError.set(
          'The folder name can\'t be empty',
        );
      }

      if (
        renamedFolderName === folder.name
      ) {
        this.renamingFolder.set(
          null,
        );
      }

      this.savingFolder.set(
        null,
      );

      return;
    }

    this.http.patch<FolderDto>(
      `/api/folders/${folder.id}`,
      {
        name: renamedFolderName,
      },
    ).subscribe(
      {
        next: (
          f,
        ) => {
          this.renamingFolder.set(
            null,
          );
          this.savingFolder.set(
            null,
          );
          this.saveError.set(
            null,
          );
          this.renamedFolderName = '';
          this.loadFolders();
        },
        error: (
          err,
        ) => {
          this.renamingFolder.set(
            null,
          );
          this.savingFolder.set(
            null,
          );
          this.saveError.set(
            err.error?.message ?? 'Failed to save folder name',
          );
          this.renamedFolderName = '';
        },
      },
    );
  }

  cancelFolderRenaming(): void {
    this.renamingFolder.set(
      null,
    );
    this.saveError.set(
      null,
    );
  }
}
