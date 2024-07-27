import { Routes } from '@angular/router';
import { WatchComponent } from './watch/watch.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  { path: 'watch', redirectTo: 'watch/', pathMatch: 'full' },
  { path: 'watch/:titleId', component: WatchComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: 'watch' }
];
