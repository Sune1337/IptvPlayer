import { Component, ElementRef, ViewChild, ViewChildren } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { WebWorkerService } from './background-processing/webworker-service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { tokenize } from './utils/tokenize';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { IptvDbService } from './db/iptv-db-service';
import { Title } from './db/models/title';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Genre } from './db/models/genre';
import { MultiSelectModule } from 'primeng/multiselect';
import { Checkbox, CheckboxModule } from 'primeng/checkbox';
import { IInfiniteScrollEvent, InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { Channel } from './db/models/channel';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenubarModule, InputTextModule, ReactiveFormsModule, OverlayPanelModule, NgIf, AsyncPipe, NgForOf, MultiSelectModule, CheckboxModule, InfiniteScrollModule, SidebarModule, ButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  public formGroup: FormGroup;
  public sidebarVisible = false;
  public searchControl: FormControl<string | null>;
  public searchResult: Title[] = [];
  public searchResultOffset = 0;
  public searchResultPageSize = 50;
  public genres: Genre[] = [];
  public channels: Channel[] = [];

  @ViewChild('searchPanel')
  private searchPanel!: OverlayPanel;

  @ViewChild('searchResultContainer')
  private searchResultContainer?: ElementRef;

  @ViewChildren('genre')
  private genreCheckBoxes!: Checkbox[];

  @ViewChildren('channel')
  private channelCheckBoxes!: Checkbox[];

  constructor(
    private router: Router,
    private iptvDbService: IptvDbService,
    // Referencing the web-worker makes it start.
    private webWorkerService: WebWorkerService
  ) {
    // Setup form-controls.
    this.formGroup = new FormGroup({
      id: new FormControl<number | undefined>(undefined),
      search: this.searchControl = new FormControl('')
    });

    // Subscribe to channels.
    this.iptvDbService.channels
      .subscribe(channels => this.channels = channels);

    // Subscribe to genres.
    this.iptvDbService.genres
      .subscribe(genres => this.genres = genres);

    // Subscribe to clicks in document to close overlays.
    fromEvent(document, 'click')
      .subscribe(this.whenDocumentClick);

  }

  public items: MenuItem[] = [
    { label: "Settings", routerLink: 'settings' }
  ];

  public whenSearchChange = async ($event?: Event): Promise<void> => {
    const terms = this.searchControl.value ? tokenize(this.searchControl.value) : [];
    const filterChannels = this.channelCheckBoxes.filter(cb => cb.checked()).map(cb => cb.value);
    const filterGenres = this.genreCheckBoxes.filter(cb => cb.checked()).map(cb => cb.value);

    this.searchResultOffset = 0;
    this.searchResult = await this.iptvDbService.search(terms, filterChannels, filterGenres, this.searchResultOffset, this.searchResultPageSize);

    if ($event) {
      if (this.searchResultContainer) {
        this.searchResultContainer.nativeElement.scroll({ top: 0, behavior: 'smooth' });
      }
      this.searchPanel.show($event);
    }
  }

  public whenScrollSearchResult = async (event: IInfiniteScrollEvent): Promise<void> => {
    const terms = this.searchControl.value ? tokenize(this.searchControl.value) : [];
    const filterChannels = this.channelCheckBoxes.filter(cb => cb.checked()).map(cb => cb.value);
    const filterGenres = this.genreCheckBoxes.filter(cb => cb.checked()).map(cb => cb.value);

    this.searchResultOffset += this.searchResultPageSize;
    this.searchResult = [...this.searchResult, ...await this.iptvDbService.search(terms, filterChannels, filterGenres, this.searchResultOffset, this.searchResultPageSize)];
  }

  public whenSearchFocus = (event: FocusEvent) => {
    if (this.searchResult.length > 0) {
      this.searchPanel.show(event);
    }
  }

  public selectTitle = (title: Title): void => {
    this.router.navigate(['watch', title.id]);
    this.searchPanel.hide();
  }

  public trackSearchResult = (index: number, item: Title): any => {
    return item.id;
  }

  whenThumbnailError(event: ErrorEvent, title: Title) {
    if (event.target instanceof HTMLImageElement) {
      event.target.onerror = null;
      if (title.tmdb?.posterPath) {
        event.target.src = `https://image.tmdb.org/t/p/w200${title.tmdb?.posterPath}`;
      }
    }
  }

  private whenDocumentClick = (event: Event): void => {
    if (event.target instanceof HTMLElement && event.target.closest('.stop-close-overlay')) {
      // Don't close overlay.
      return;
    }

    if (this.sidebarVisible) {
      this.sidebarVisible = false;
      return;
    }

    this.searchPanel.hide();
  }
}
