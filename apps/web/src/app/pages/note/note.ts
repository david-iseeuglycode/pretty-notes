import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NoteDto, UserDto } from '@pretty-notes/shared';
import { NoteSocketService } from '../../shared/services/note-socket.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'pn-note',
  templateUrl: './note.html',
  imports: [FormsModule],
})

export class NotePage implements OnInit, OnDestroy {
  note = signal<NoteDto | null>(null);
  collaborators = signal<UserDto[]>([]);
  error = signal<string | null>(null);
  newCollaboratorEmail = '';
  collaboratorError = signal<string | null>(null);

  private noteId = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isRemoteUpdate = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private socket: NoteSocketService,
    public auth: AuthService,
  )
  {
  }

  ngOnInit(): void {
    this.noteId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.http.get<NoteDto>(
      `/api/notes/${this.noteId}`
    ).subscribe(
      {
        next: (n) => {
          this.note.set(n);
          this.socket.joinNote(this.noteId);
          this.loadCollaborators();
          window.addEventListener(
            'beforeunload'
            , this.beforeUnloadHandler
          );
        },
        error: (err) => {
          this.error.set(`Failed to load note (${err.status}: ${err.message})`);
        },
      }
    );

    this.socket.onNoteUpdated(({ content }) => {
      if (this.debounceTimer) {
        return;
      }

      this.isRemoteUpdate = true;
      const current = this.note();

      if (current) {
        this.note.set(
          {
            ...current,
            content,
          }
        );
      }
    });
  }

  get isCreator(): boolean {
    const user = this.auth.currentUser();
    const note = this.note();

    return !!user
      && !!note
      && note.creator.id === user.id;
  }

  addCollaborator(): void {
    const email = this.newCollaboratorEmail.trim();
    if (!email) {
      return;
    }

    this.collaboratorError.set(null);
    this.http.post(
      `/api/notes/${this.noteId}/collaborators`,
      { email }
    ).subscribe(
      {
        next: () => {
          this.newCollaboratorEmail = '';
          this.loadCollaborators();
        },
        error: (err) => {
          this.collaboratorError.set(err.error?.message ?? 'Failed to add collaborator');
        },
      }
    );
  }

  onContentChange(content: string): void {
    if (this.isRemoteUpdate) {
      this.isRemoteUpdate = false;

      return;
    }

    const current = this.note();

    if (!current) {
      return;
    }

    this.note.set(
      {
        ...current,
        content,
      }
    );

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(
      () => {
        this.debounceTimer = null;
        const n = this.note();

        if (n) {
          this.socket.sendUpdate(
            {
              noteId: n.id,
              content: n.content,
            }
          );
        }
      }
      , 500
    );
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.socket.offNoteUpdated();
    window.removeEventListener(
      'beforeunload'
      , this.beforeUnloadHandler
    );
  }

  private beforeUnloadHandler = (): void => {
    this.ngOnDestroy();
  }

  private loadCollaborators(): void {
    this.http.get<UserDto[]>(
      `/api/notes/${this.noteId}/collaborators`
    ).subscribe(
      { next: (users) => this.collaborators.set(users) }
    );
  }
}
