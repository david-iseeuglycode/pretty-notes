import {
  Component,
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
  NoteDto,
} from '@pretty-notes/shared';
import {
  AuthService,
} from '../../shared/services/auth.service';


@Component(
  {
    selector: 'pn-home',
    templateUrl: './home.html',
    imports: [
      FormsModule,
    ],
  },
)
export class HomePage
{
  auth = inject(
    AuthService,
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
  loading = signal<boolean>(
    false,
  );
  newNoteTitle = '';


  constructor(
  ) {
    effect(
      (
      ) => {
        if (this.auth.currentUser()) {
          this.loadNotes(
          );
        }
      }
    );
  }


  loadNotes(
  ): void {
    this.loading.set(
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
        this.loading.set(
          false,
        );
      }
    );
  }

  async createNote(
  ): Promise<void> {
    if (!this.newNoteTitle.trim()) {
      return;
    }
    const note = await firstValueFrom(
      this.http.post<NoteDto>(
        '/api/notes',
        {
          title: this.newNoteTitle,
        },
      ),
    );

    if (note) {
      this.newNoteTitle = '';
      this.router.navigate(
        [
          '/notes',
          note.id,
        ],
      );
    }
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
}
