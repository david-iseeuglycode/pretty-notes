import {
  Component,
  computed,
  DOCUMENT,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';
import {
  FormsModule,
} from '@angular/forms';
import {
  RouterModule,
  Router,
  NavigationEnd,
} from '@angular/router';
import {
  AuthService,
} from './shared/services/auth.service';
import {
  LoginDto,
  RegisterDto,
} from '@pretty-notes/shared';
import {
  MenuItem,
  MenuItemComponent,
} from './menu-item/menu-item';


@Component(
  {
    imports: [
      RouterModule,
      FormsModule,
      MenuItemComponent,
    ],
    selector: 'pn-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
  },
)
export class App
{
  auth = inject(
    AuthService,
  );
  darkMode = signal<boolean>(
    false,
  );
  accounting = signal<boolean>(
    false,
  );
  darkModeMenuChoice = computed(
    (): string => this.darkMode()
      ? 'Light'
      : 'Dark'
  );
  private router = inject(
    Router,
  );
  private currentUrl = signal(
    this.router.url,
  );
  onHomePage = computed(
    (): boolean => {
      let currentUrl: string = this.currentUrl();

      return currentUrl === '/';
    }
  );
  private doc = inject(
    DOCUMENT,
  );
  menuItems = computed(
    (): MenuItem[] => {
      const items = [];

      if (
        this.auth.currentUser()
      ) {
        items.push(
          {
            'name': 'Home',
            'callback': (
              e: Event,
            ): void => this.goHome(),
            'active': !this.onHomePage(),
          }
        );
      }

      items.push(
        {
          'name': `${this.darkModeMenuChoice()} theme`,
          'callback': (
            e: Event,
          ): void => this.darkMode.set(
            !this.darkMode(),
          ),
          'active': true,
        },
      );

      return items;
    }
  );
  mode = signal<'login' | 'register'>(
    'login',
  );
  loginRegisterHeader = computed(
    (): string => {
      return this.mode() === 'login'
        ? 'Log in'
        : 'Create account';
    },
  );
  loginRegisterSubmit = computed(
    (): string => {
      return this.mode() === 'login'
        ? 'Log in'
        : 'Register';
    }
  );
  loginRegistrationError = computed(
    (): string => {
      return this.mode() === 'login'
        ? 'Invalid email or password.'
        : 'Registration failed.';
    }
  );
  hideNav = signal<boolean>(
    true,
  );

  email: string = '';
  password: string = '';
  error: string = '';


  constructor() {
    effect(
      () => this.doc.documentElement.setAttribute(
        'data-theme',
        this.darkMode()
          ? 'dark'
          : 'light',
      ),
    );
    this.router.events.pipe(
      takeUntilDestroyed(),
    ).subscribe(
      e => {
        if (
          e instanceof NavigationEnd
        ) {
          this.currentUrl.set(
            e.url
          );
        }
      },
    );
  }


  async submit(): Promise<void> {
    this.accounting.set(
      true,
    );
    this.error = '';
    const dto: LoginDto | RegisterDto = {
      email: this.email,
      password: this.password,
    };

    try {
      if (
        this.mode() === 'login'
      ) {
        await this.auth.login(
          dto,
        );
      } else {
        await this.auth.register(
          dto,
        );
      }
    } catch {
      this.error = this.loginRegistrationError();
    }
    this.accounting.set(
      false,
    );
  }

  logout(): void {
    this.auth.logout();
  }

  goHome(): void {
    this.router.navigate(
      [
        '/',
      ],
    );
  }

  toggleMenu(
    e: Event,
  ): void {
    this.hideNav.set(
      !this.hideNav(),
    );

    e.stopPropagation(
    );
  }

  @HostListener(
    'document:click',
  )
  closeMenu(): void {
    this.hideNav.set(
      true,
    );
  }
}
