import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/home-page.component';
import { SessionPageComponent } from './features/session/session-page.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    component: HomePageComponent,
    title: "Erin's Escapades - Home",
  },
  {
    path: 's/:sessionId',
    component: SessionPageComponent,
    title: "Erin's Escapades - Session",
  },
  {
    path: '**',
    redirectTo: '',
  },
];