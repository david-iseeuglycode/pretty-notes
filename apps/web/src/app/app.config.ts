import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  provideRouter,
} from '@angular/router';
import {
  appRoutes,
} from './app.routes';
import {
  csrfInterceptor,
} from './shared/interceptors/csrf.interceptor';
import {
  AuthService,
} from './shared/services/auth.service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(
    ),
    provideRouter(
      appRoutes,
    ),
    provideHttpClient(
      withInterceptors(
        [
          csrfInterceptor,
        ],
      ),
    ),
    provideAppInitializer(
      (
      ) => {
        const auth = inject(
          AuthService,
        );

        return auth.loadCurrentUser(
        );
      },
    ),
  ],
};
