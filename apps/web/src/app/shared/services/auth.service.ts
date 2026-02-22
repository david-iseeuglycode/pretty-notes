import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LoginDto, RegisterDto, UserDto } from '@pretty-notes/shared';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<UserDto | null>(null);

  async login(dto: LoginDto): Promise<void> {
    const user = await firstValueFrom(this.http.post<UserDto>('/api/auth/login', dto));
    this.currentUser.set(user);
  }

  async register(dto: RegisterDto): Promise<void> {
    const user = await firstValueFrom(this.http.post<UserDto>('/api/auth/register', dto));
    this.currentUser.set(user);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/logout', {}));
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  async loadCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(this.http.get<UserDto>('/api/auth/me'));
      this.currentUser.set(user);
    } catch {
      this.currentUser.set(null);
    }
  }
}
