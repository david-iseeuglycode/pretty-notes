import {
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  FormsModule,
} from '@angular/forms';
import {
  RouterModule,
} from '@angular/router';
import {
  AuthService,
} from './shared/services/auth.service';
import {
  LoginDto,
  RegisterDto,
} from '@pretty-notes/shared';


@Component(
  {
    imports: [
      RouterModule,
      FormsModule,
    ],
    selector: 'pn-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
  },
)
export class App
implements OnInit
{
  auth = inject(
    AuthService,
  );

  mode: 'login' | 'register' = 'login';
  email = '';
  password = '';
  error = '';


  ngOnInit(
  ): void {
  }

  async submit(
  ): Promise<void> {
    this.error = '';
    const dto: LoginDto | RegisterDto = {
      email: this.email,
      password: this.password,
    };
    try {
      if (this.mode === 'login') {
        await this.auth.login(
          dto,
        );
      } else {
        await this.auth.register(
          dto,
        );
      }
    } catch {
      this.error = this.mode === 'login'
        ? 'Invalid email or password.'
        : 'Registration failed.';
    }
  }

  logout(
  ): void {
    this.auth.logout(
    );
  }
}
