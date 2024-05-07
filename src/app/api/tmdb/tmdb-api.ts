import { Genre } from '../../db/models/genre';
import { AccountSettings } from '../../db/models/account-settings';
import { SearchMovieResult } from './models/search-movie-result';

export class TmdbApi {

  public getGenres = async (accountSettings: AccountSettings, abortController: AbortController): Promise<Genre[] | undefined> => {
    if (!accountSettings.tmdbAccessToken) {
      return;
    }

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accountSettings.tmdbAccessToken}`
      },
      signal: abortController.signal
    };
    const genresResponse = await fetch('https://api.themoviedb.org/3/genre/movie/list?language=en', options);
    if (!genresResponse.ok) {
      return;
    }

    return (await genresResponse.json() as any)?.genres;
  }

  public searchMovie = async (accountSettings: AccountSettings, abortController: AbortController, name: string, releaseYear: null | number): Promise<SearchMovieResult | undefined> => {
    if (!accountSettings.tmdbAccessToken) {
      return;
    }

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accountSettings.tmdbAccessToken}`
      },
      signal: abortController.signal
    };

    let url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(name)}&page=1`;
    if (releaseYear) {
      url += '&primary_release_year=' + releaseYear;
    }
    const genresResponse = await fetch(url, options);
    if (!genresResponse.ok) {
      if (genresResponse.status == 429) {
        throw new Error('Rate limit exceeded.');
      }

      return;
    }

    const response = await genresResponse.json() as { results: any[] };
    if (response.results.length < 1) {
      return undefined;
    }

    // We got multiple results. Return the one with highest vote-count.
    let maxVoteCount = 0;
    let result: any;
    for (const r of response.results) {
      if (r.vote_count > maxVoteCount) {
        maxVoteCount = r.vote_count;
        result = r;
      }
    }

    return result;
  }
}
