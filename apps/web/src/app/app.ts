import {
  Component,
  computed,
  DOCUMENT,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
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
implements OnInit
{
  auth = inject(
    AuthService,
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
          new MenuItem(
            'Home',
            (
              e: Event,
            ): void => this.goHome(
            ),
            this.currentUrl(
            ) !== '/',
          )
        );
      }

      items.push(
        new MenuItem(
          `this.otherTheme theme`,
          (
            e: Event,
          ): void => this.switchTheme(
          ),
          true,
        )
      );

      return items;
    }
  );

  mode: 'login' | 'register' = 'login';
  theme: 'light' | 'dark' = 'light';
  hideNav: boolean = true;
  email = '';
  password = '';
  error = '';


  ngOnInit(
  ): void {
    this.router.events.subscribe(
      e => {
        if (
          e instanceof NavigationEnd
        ) {
          this.currentUrl.set(
            e.url
          );
        }
      }
    )
  }

  get otherTheme(
  ): string {
    return this.theme === 'light'
      ? 'Dark'
      : 'Light'
  }

  async submit(
  ): Promise<void> {
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
  }

  logout(
  ): void {
    this.auth.logout(
    );
  }

  goHome(
  ): void {
    this.router.navigate(
      [
        '/',
      ],
    );
  }

  switchTheme(
  ): void {
    this.theme = this.theme === 'light'
      ? 'dark'
      : 'light';

    this.doc.documentElement.setAttribute(
      'data-theme',
      this.theme,
    );
  }

  openMenu(
    e: Event,
  ): void {
    this.hideNav = false;

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
