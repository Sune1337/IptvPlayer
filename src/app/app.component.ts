import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WebWorkerService } from './background-processing/webworker-service';
import { OverlayComponent } from './overlay/overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, OverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor(
    // Referencing the web-worker makes it start.
    private webWorkerService: WebWorkerService
  ) {

  }
}
