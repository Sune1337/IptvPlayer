import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebWorkerService {

  private worker?: Worker;

  constructor() {
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.worker = new Worker(new URL('./app.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        console.log(`page got message: ${data}`);
      };
    } else {
      // Web Workers are not supported in this environment.
    }
  }

  public syncChannelList = (): void => {
    this.worker?.postMessage('syncChannelList');
  }
}
