import {
  Component,
  computed,
  effect,
  inject,
  signal,
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


@Component(
  {
    selector: 'pn-home',
    templateUrl: './home.html',
    styleUrl: './home.scss',
    imports: [
      FormsModule,
      ListOfNoteLinksComponent,
    ],
  },
)
export class HomePage
{
  auth = inject(
    AuthService,
  );
  creating = signal<boolean>(
    false,
  );
  private http = inject(
    HttpClient,
  );
  private router = inject(
    Router,
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
  newNoteTitle = '';
  newFolderName = '';


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
}
