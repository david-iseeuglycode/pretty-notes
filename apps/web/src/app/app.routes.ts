import { Route } from '@angular/router';
import { HomePage } from './pages/home/home';
import { NotePage } from './pages/note/note';
import { NotFoundPage } from './pages/not-found/not-found';

export const appRoutes: Route[] = [
  { path: '', component: HomePage },
  { path: 'notes/:id', component: NotePage },
  { path: '**', component: NotFoundPage },
];
