import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebWorkerService {

  private logMessagesSubject = new Subject<string>();
  public logMessages: Observable<string> = this.logMessagesSubject.asObservable();

  private worker?: Worker;

  constructor() {
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.worker = new Worker(new URL('./app.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        if (data.type == 'log' && Object.hasOwn(data, 'message')) {
          this.logMessagesSubject.next(data.message);
        }
      };
    } else {
      // Web Workers are not supported in this environment.
    }
  }

  public syncChannelList = (): void => {
    this.worker?.postMessage('syncChannelList');
  }
}
