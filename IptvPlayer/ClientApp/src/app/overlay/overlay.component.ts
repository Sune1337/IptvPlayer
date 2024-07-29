import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, firstValueFrom, fromEvent, Subject } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MenuItem, SharedModule } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { SidebarModule } from 'primeng/sidebar';
import { Checkbox, CheckboxModule } from 'primeng/checkbox';
import { IInfiniteScrollEvent, InfiniteScrollDirective, InfiniteScrollModule } from 'ngx-infinite-scroll';
import { IptvDbService } from '../db/iptv-db-service';
import { tokenize } from '../utils/tokenize';
import { Channel } from '../db/models/channel';
import { Genre } from '../db/models/genre';
import { Title } from '../db/models/title';
import { WebWorkerService } from '../background-processing/webworker-service';
import { prepareTitle } from "../utils/processTitle";

interface ComponentState {
  sidebarVisible: boolean;
  channels: Channel[];
  genres: Genre[];
  searchResult: Title[];
  infiniteScrollDisabled: boolean;
}

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [
    ButtonModule,
    InputTextModule,
    MenubarModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule,
    CheckboxModule,
    NgForOf,
    SidebarModule,
    InfiniteScrollModule,
    NgIf,
    AsyncPipe
  ],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverlayComponent implements OnDestroy {

  public items: MenuItem[] = [
    { label: "Settings", routerLink: 'settings' }
  ];

  public formGroup: FormGroup;
  public searchControl: FormControl<string | null>;
  public searchResultOffset = 0;
  public searchResultPageSize = 50;
  public webWorkerLog;

  @ViewChild('searchResultContainer')
  private searchResultContainer?: ElementRef;

  @ViewChild(InfiniteScrollDirective)
  infiniteScroll?: InfiniteScrollDirective;

  @ViewChildren('genre')
  private genreCheckBoxes!: Checkbox[];

  @ViewChildren('channel')
  private channelCheckBoxes!: Checkbox[];

  // Keep track of subscriptions to clean up when component destroys.
  private ngUnsubscribe = new Subject<void>();

  /** State variables. */
  private _componentState: ComponentState = { channels: [], genres: [], searchResult: [], sidebarVisible: false, infiniteScrollDisabled: false };
  public componentState = new BehaviorSubject<ComponentState>(this._componentState);

  constructor(
    private iptvDbService: IptvDbService,
    private router: Router,
    private webWorkerService: WebWorkerService
  ) {
    // Setup form-controls.
    this.formGroup = new FormGroup({
      id: new FormControl<number | undefined>(undefined),
      search: this.searchControl = new FormControl('')
    });

    // Subscribe to channels.
    this.iptvDbService.channels
      .subscribe(channels => this.pushComponentState({ channels }));

    // Subscribe to genres.
    this.iptvDbService.genres
      .subscribe(genres => this.pushComponentState({ genres }));

    // Subscribe to clicks in document to close overlays.
    fromEvent(document, 'click')
      .subscribe(this.whenDocumentClick);

    // Make web-worker-log visible to view.
    this.webWorkerLog = webWorkerService.logMessages;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public showSidebar = (): void => {
    this.pushComponentState({ sidebarVisible: true });
  }

  public hideSidebar = (): void => {
    this.pushComponentState({ sidebarVisible: false });
  }

  public whenSearchChange = async ($event?: Event): Promise<void> => {
    const terms = this.searchControl.value ? tokenize(this.searchControl.value) : [];
    const filterChannels = this.channelCheckBoxes.filter(cb => cb.checked()).map(cb => cb.value);
    const filterGenres = this.genreCheckBoxes.filter(cb => cb.checked()).map(cb => cb.value);

    this.searchResultOffset = 0;
    this.pushComponentState({ infiniteScrollDisabled: true, searchResult: await this.search(terms, filterChannels, filterGenres, this.searchResultOffset, this.searchResultPageSize) });

    if (this.searchResultContainer) {
      this.searchResultContainer.nativeElement.scroll({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
          this.pushComponentState({ infiniteScrollDisabled: false });
        }
        // Wait one second so that the smooth scroll finishes scrolling to top before recreating infinite-scroll.
        , 1000);
    }
    this.showSearchResultContainer();
  }

  public whenScrollSearchResult = async (event: IInfiniteScrollEvent): Promise<void> => {
    const terms = this.searchControl.value ? tokenize(this.searchControl.value) : [];
    const filterChannels = this.channelCheckBoxes.filter(cb => cb.checked()).map(cb => cb.value);
    const filterGenres = this.genreCheckBoxes.filter(cb => cb.checked()).map(cb => cb.value);

    this.searchResultOffset += this.searchResultPageSize;
    this.pushComponentState({ searchResult: [...this._componentState.searchResult, ...await this.search(terms, filterChannels, filterGenres, this.searchResultOffset, this.searchResultPageSize)] });
  }

  public whenSearchClick = (event: FocusEvent) => {
    this.showSearchResultContainer();
  }

  public selectTitle = (title: Title): void => {
    this.router.navigate(['watch', title.id]);
    this.hideSearchResultContainer();
    this.hideSidebar();
  }

  public trackSearchResult = (index: number, item: Title): any => {
    return item.id;
  }

  public whenThumbnailError = (event: ErrorEvent, title: Title) => {
    if (event.target instanceof HTMLImageElement) {
      event.target.onerror = null;
      if (title.tmdb?.posterPath) {
        event.target.src = title.tmdb?.posterPath;
      }
    }
  }

  private showSearchResultContainer = (): void => {
    if (!this.searchResultContainer?.nativeElement) {
      return;
    }

    this.searchResultContainer.nativeElement.style.visibility = 'visible';
  }

  private hideSearchResultContainer = (): void => {
    if (!this.searchResultContainer?.nativeElement) {
      return;
    }

    this.searchResultContainer.nativeElement.style.visibility = 'hidden';
  }

  private whenDocumentClick = (event: Event): void => {
    if (event.target instanceof HTMLElement && event.target.closest('.stop-close-overlay')) {
      // Don't close overlay.
      return;
    }

    if (this._componentState.sidebarVisible) {
      this.pushComponentState({ sidebarVisible: false });
      return;
    }

    this.hideSearchResultContainer()
  }

  private pushComponentState(state: Partial<ComponentState>): void {
    this._componentState = { ...this._componentState, ...state };
    this.componentState.next(this._componentState);
  }

  private search = async (terms: string[], channels: number[], genres: number[], offset: number, limit: number): Promise<Title[]> => {

    const accountSettings = await firstValueFrom(this.iptvDbService.accountSettings);
    const searchResult = this.iptvDbService.search(terms, channels, genres, offset, limit);

    // Iterate search-result to process urls.
    const newSearchResult: Title[] = [];
    for (const title of await searchResult) {
      newSearchResult.push(
        prepareTitle(accountSettings, title)
      );
    }

    return newSearchResult;
  }
}
