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
    (
    ): string => this.darkMode(
    )
      ? 'Light'
      : 'Dark'
  );
  private router = inject(
    Router,
  );
  private currentUrl = signal(
    this.router.url,
  );
  private doc = inject(
    DOCUMENT,
  );
  menuItems = computed(
    (
    ): MenuItem[] => {
      const items = [
      ];

      if (
        this.auth.currentUser(
        )
      ) {
        items.push(
          {
            'name': 'Home',
            'callback': (
              e: Event,
            ): void => this.goHome(
            ),
            'active': !this.onHomePage,
          }
        );
      }

      items.push(
        {
          'name': `${this.darkModeMenuChoice()} theme`,
          'callback': (
            e: Event,
          ): void => this.darkMode.set(
            !this.darkMode()
          ),
          'active': true,
        }
      );

      return items;
    }
  );

  mode: 'login' | 'register' = 'login';
  hideNav: boolean = true;
  email = '';
  password = '';
  error = '';


  constructor(
  ) {
    effect(
      (
      ) => this.doc.documentElement.setAttribute(
        'data-theme',
        this.darkMode(
        )
          ? 'dark'
          : 'light',
      )
    );
    this.router.events.pipe(
      takeUntilDestroyed(
      ),
    ).subscribe(
      e => {
        if (
          e instanceof NavigationEnd
        ) {
          this.currentUrl.set(
            e.url
          );
        }
      }
    );
  }


  async submit(
  ): Promise<void> {
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
        this.mode === 'login'
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
      this.error = this.mode === 'login'
        ? 'Invalid email or password.'
        : 'Registration failed.';
    }
    this.accounting.set(
      false,
    );
  }

  logout(
  ): void {
    this.auth.logout(
    );
  }

  get onHomePage(
  ): boolean {
    return this.currentUrl(
      ) === '/';
  }

  goHome(
  ): void {
    this.router.navigate(
      [
        '/',
      ],
    );
  }

  toggleMenu(
    e: Event,
  ): void {
    this.hideNav = !this.hideNav;

    e.stopPropagation(
    );
  }

  @HostListener(
    'document:click',
  )
  closeMenu(
  ): void {
    this.hideNav = true;
  }
}
