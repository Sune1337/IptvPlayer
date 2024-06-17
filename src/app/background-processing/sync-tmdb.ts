import { IptvDbService } from '../db/iptv-db-service';
import { TmdbApi } from '../api/tmdb/tmdb-api';
import { AccountSettings } from '../db/models/account-settings';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { FullMatch } from '../utils/full-match';
import { Genre } from '../db/models/genre';
import { tokenize } from '../utils/tokenize';

export class SyncTmdb {

  constructor(
    private iptvDbService: IptvDbService,
    private accountSettings: AccountSettings,
    private abortController: AbortController,
    private abortSubject: Subject<void>
  ) {
  }

  public sync = async (): Promise<void> => {
    // Get all genres.
    postMessage({ type: 'log', message: 'Download genres...' });
    const tmdbApi = new TmdbApi();
    const genres = await tmdbApi.getGenres(this.accountSettings, this.abortController)
    if (!genres) {
      return;
    }

    // Get all current genres.
    const dbGenres = await firstValueFrom(
      this.iptvDbService.genres
        .pipe(takeUntil(this.abortSubject))
    );

    postMessage({ type: 'log', message: 'Save genres...' });
    const genresMatch = new FullMatch(dbGenres, genres, c => c.id);
    const addGenres: Genre[] = [];
    const removeGenres: number[] = [];
    while (genresMatch.moveNext()) {
      if (genresMatch.current[0] == null) {
        // Genre was added.
        addGenres.push(genresMatch.current[1]);
      } else if (genresMatch.current[1] == null) {
        // Genre was removed.
        if (genresMatch.current[0].id != null) {
          removeGenres.push(genresMatch.current[0].id);
        }
      }
    }

    await this.iptvDbService.batchGenres(addGenres, removeGenres);
    this.abortController.signal.throwIfAborted();

    // Get all titles that we have not looked up TMDB information for.
    const titlesWithoutTmdb = await this.iptvDbService.getTitlesWithoutTmdb();
    for (let i = 0; i < titlesWithoutTmdb.length; i++) {
      const titleWithoutTmdb = titlesWithoutTmdb[i];
      const regexMatch = /\[(\d{4})]/.exec(titleWithoutTmdb.name);
      let releaseYear: number | null = null;
      if (regexMatch && regexMatch?.length > 1) {
        releaseYear = parseInt(regexMatch[1]);
      }

      const titleName = this.generateTitleForSearch(titleWithoutTmdb.name);
      postMessage({ type: 'log', message: `Search movie ${i + 1}/${titlesWithoutTmdb.length}: ${titleWithoutTmdb.name} (${titleName})...` });
      const tmdb = await tmdbApi.searchMovie(this.accountSettings, this.abortController, titleName, releaseYear)
      if (!tmdb) {
        // No information found.
        titleWithoutTmdb.tmdb = { tmdbId: 0, addedDateUtc: new Date() };
      } else {
        titleWithoutTmdb.tmdb = { tmdbId: tmdb.id, addedDateUtc: new Date(), genreIds: tmdb.genre_ids, posterPath: tmdb.poster_path };
      }

      await this.iptvDbService.putTitle(titleWithoutTmdb);

      this.abortController.signal.throwIfAborted();
    }
  }

  private generateTitleForSearch = (name: string): string => {
    const removeWords = ['HD', '4K'];
    const tokenized = tokenize(name.replace(/(\[.*?])|(S\d{2})|(E\d{2})/g, ''))
      .filter(s => removeWords.indexOf(s) < 0);
    return tokenized.join(' ');
  }
}
