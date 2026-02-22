import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LoginDto, NoteDto, RegisterDto } from '@pretty-notes/shared';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'pn-home',
  templateUrl: './home.html',
  imports: [FormsModule],
})
export class HomePage implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  mode: 'login' | 'register' = 'login';
  email = '';
  password = '';
  error = '';

  notes = signal<NoteDto[]>([]);
  newNoteTitle = '';

  ngOnInit(): void {
    if (this.auth.currentUser()) this.loadNotes();
  }

  async submit(): Promise<void> {
    this.error = '';
    const dto: LoginDto | RegisterDto = { email: this.email, password: this.password };
    try {
      if (this.mode === 'login') {
        await this.auth.login(dto);
      } else {
        await this.auth.register(dto);
      }
      this.loadNotes();
    } catch {
      this.error = this.mode === 'login' ? 'Invalid email or password.' : 'Registration failed.';
    }
  }

  loadNotes(): void {
    this.http.get<NoteDto[]>('/api/notes').subscribe((notes) => this.notes.set(notes));
  }

  async createNote(): Promise<void> {
    if (!this.newNoteTitle.trim()) return;
    const note = await firstValueFrom(this.http.post<NoteDto>('/api/notes', { title: this.newNoteTitle }));
    if (note) {
      this.newNoteTitle = '';
      this.router.navigate(['/notes', note.id]);
    }
  }

  openNote(id: number): void {
    this.router.navigate(['/notes', id]);
  }

  logout(): void {
    this.auth.logout();
  }
}
