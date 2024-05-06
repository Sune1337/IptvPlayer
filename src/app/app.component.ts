import { Component, ViewChild, ViewChildren } from '@angular/core';
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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenubarModule, InputTextModule, ReactiveFormsModule, OverlayPanelModule, NgIf, AsyncPipe, NgForOf, MultiSelectModule, CheckboxModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  public formGroup: FormGroup;
  public searchControl: FormControl<string | null>;
  public searchResult: Title[] = [];
  public genres: Genre[] = [];

  @ViewChild('searchPanel')
  private searchPanel!: OverlayPanel;

  @ViewChildren('genre')
  private genreCheckBoxes!: Checkbox[];

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
  }

  public items: MenuItem[] = [
    { label: "Watch", routerLink: '/watch' },
    { label: "Settings", routerLink: 'settings' }
  ];

  public whenSearchChange = async ($event?: Event): Promise<void> => {
    const terms = this.searchControl.value ? tokenize(this.searchControl.value) : [];
    const filterGenres = this.genreCheckBoxes.filter(cb => cb.checked()).map(cb => cb.value);

    this.searchResult = await this.iptvDbService.search(terms, filterGenres, 0, 100);

    if (filterGenres.length == 0) {
      const genreIds = this.searchResult.reduce((a, b) => {
        if (b.tmdb?.genreIds) {
          b.tmdb.genreIds.forEach(a.add, a);
        }
        return a;
      }, new Set<number>())

      this.genres = await this.iptvDbService.getGenres(Array.from(genreIds));
    }

    if ($event) {
      this.searchPanel.show($event);
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
}
