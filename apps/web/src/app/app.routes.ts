import { Route } from '@angular/router';
import { HomePage } from './pages/home/home';
import { TestPage } from './pages/test/test';
import { NotFoundPage } from './pages/not-found/not-found';

export const appRoutes: Route[] = [
  { path: '', component: HomePage },
  { path: 'test', component: TestPage },
  { path: '**', component: NotFoundPage },
];
