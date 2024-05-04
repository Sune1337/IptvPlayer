import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { WebWorkerService } from './background-processing/webworker-service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { tokenize } from './utils/tokenize';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { IptvDbService } from './db/iptv-db-service';
import { Title } from './db/models/title';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';

interface ComponentState {
  searchResults: Title[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenubarModule, InputTextModule, ReactiveFormsModule, OverlayPanelModule, NgIf, AsyncPipe, NgForOf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  public formGroup: FormGroup;
  public searchControl: FormControl<string | null>;

  @ViewChild('searchPanel')
  private searchPanel!: OverlayPanel;

  /** State variables. */
  private _componentState = { searchResults: [] };
  public componentState = new BehaviorSubject<ComponentState>(this._componentState);

  constructor(
    private iptvDbService: IptvDbService,
    // Referencing the web-worker makes it start.
    private webWorkerService: WebWorkerService
  ) {
    // Setup form-controls.
    this.formGroup = new FormGroup({
      id: new FormControl<number | undefined>(undefined),
      search: this.searchControl = new FormControl('')
    });
  }

  public items: MenuItem[] = [
    { label: "Watch", routerLink: '/watch' },
    { label: "Settings", routerLink: 'settings' }
  ];

  public whenSearchChange = async ($event: Event): Promise<void> => {
    const terms = this.searchControl.value ? tokenize(this.searchControl.value) : [];
    this.pushComponentState({
      searchResults: await this.iptvDbService.search(terms)
    });

    this.searchPanel.show($event);
  }

  public selectTitle = (title: Title): void => {
    this.searchPanel.hide();
  }

  public trackSearchResult = (index: number, item: Title): any => {
    return item.id;
  }

  private pushComponentState(state: Partial<ComponentState>): void {
    this._componentState = Object.assign({}, this._componentState, state);
    this.componentState.next(this._componentState);
  }
}
