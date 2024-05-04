import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { WebWorkerService } from './background-processing/webworker-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenubarModule, InputTextModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'IPTV player';

  constructor(
    private webWorkerService: WebWorkerService
  ) {
    this.webWorkerService.syncChannelList();
  }

  public items: MenuItem[] = [
    { label: "Watch", routerLink: '/watch' },
    { label: "Settings", routerLink: 'settings' }
  ];
}
