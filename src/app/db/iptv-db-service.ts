import { AccountSettings } from './models/account-settings';
import { ReplaySubject } from 'rxjs';
import Dexie, { liveQuery } from 'dexie';
import { iptvDb } from './iptv-db';
import { Injectable } from '@angular/core';
import { Channel } from './models/channel';
import { Title } from './models/title';
import { Genre } from './models/genre';

@Injectable({
  providedIn: 'root'
})
export class IptvDbService {
  public accountSettings = new ReplaySubject<AccountSettings>(1);
  public channels = new ReplaySubject<Channel[]>(1);
  public genres = new ReplaySubject<Genre[]>(1);

  // Subscriptions used by the service.
  private accountSettingsSubscription;
  private channelsSubscription;
  private genresSubscription;

  constructor() {
    this.accountSettingsSubscription = liveQuery(() => iptvDb.accountSettings.orderBy('id').first())
      .subscribe(accountSettings => this.processAccountSettings(accountSettings));

    this.channelsSubscription = liveQuery(() => iptvDb.channels.orderBy('name').toArray())
      .subscribe(channels => this.processChannels(channels));

    this.genresSubscription = liveQuery(() => iptvDb.genres.orderBy('id').toArray())
      .subscribe(genres => this.processGenres(genres));
  }

  public saveAccountSettings = async (accountSettings: AccountSettings): Promise<void> => {
    if (accountSettings.id == null) {
      await this.addAccountSettings(accountSettings);
    } else {
      await this.putAccountSettings(accountSettings);
    }
  }

  public batchChannels = async (add: Channel[], remove: number[]): Promise<void> => {
    iptvDb.transaction('rw', iptvDb.channels, async () => {
      await iptvDb.channels.bulkAdd(add);
      await iptvDb.channels.bulkDelete(remove);
    });
  }

  public getAllChannels = async (): Promise<Channel[]> => {
    return iptvDb.channels.orderBy('id').toArray()
  }

  public batchTitles = async (add: Title[], update: Title[], remove: number[]): Promise<void> => {
    iptvDb.transaction('rw', iptvDb.titles, async () => {
      await iptvDb.titles.bulkAdd(add);
      await iptvDb.titles.bulkPut(update);
      await iptvDb.titles.bulkDelete(remove);
    });
  }

  public putTitle = async (title: Title): Promise<void> => {
    await iptvDb.titles.put(title);
  }

  public batchGenres = async (add: Genre[], remove: number[]): Promise<void> => {
    iptvDb.transaction('rw', iptvDb.genres, async () => {
      await iptvDb.genres.bulkAdd(add);
      await iptvDb.genres.bulkDelete(remove);
    });
  }

  public search = async (terms: string[], channels: number[], genres: number[], offset: number, limit: number): Promise<Title[]> => {
    return iptvDb.transaction('r', iptvDb.titles, async function () {
        let allResults: number[][] = [];

        if (terms.length > 0) {
          // Parallel search for all prefixes - just select resulting primary keys

          const results = await Dexie.Promise.all(
            terms.map(prefix =>
              iptvDb.titles
                .where('terms')
                .startsWith(prefix)
                .primaryKeys())
          );

          results.forEach(r => allResults.push(r))
        }

        if (channels.length > 0) {
          const results = await Dexie.Promise.all(
            channels.map(channelId =>
              iptvDb.titles
                .where('channelIds')
                .equals(channelId)
                .primaryKeys())
          );

          allResults.push(results.flat());
        }

        if (genres.length > 0) {
          const results = await Dexie.Promise.all(
            genres.map(genreId =>
              iptvDb.titles
                .where('tmdb.genreIds')
                .equals(genreId)
                .primaryKeys())
          );

          allResults.push(results.flat());
        }

        if (allResults.length == 0) {
          return [];
        }

        // Intersect result set of primary keys
        const result = allResults
          .reduce((prev, curr) => {
            const set = new Set(curr);
            return prev.filter(k => set.has(k));
          });

        return iptvDb.titles
          .where(':id')
          .anyOf(result)
          .reverse()
          .offset(offset)
          .limit(limit)
          .toArray();
      }
    );
  }

  public getTitle = async (titleId: number): Promise<Title | undefined> => {
    return iptvDb.titles.get(titleId);
  }

  public getAllTitles = async (): Promise<Title[]> => {
    return iptvDb.titles.orderBy('id').toArray()
  }

  public getTitlesWithoutTmdb = async (): Promise<Title[]> => {
    return iptvDb.titles
      .filter(title => title.tmdb == null)
      .toArray();
  }

  public getGenres = async (genreIds: number[]): Promise<Genre[]> => {
    return iptvDb.genres.where('id').anyOf(genreIds).toArray();
  }

  private processAccountSettings = async (accountSettings?: AccountSettings): Promise<void> => {
    if (!accountSettings) {
      return;
    }

    this.accountSettings.next(accountSettings);
  }

  private processChannels = async (channels: Channel[]): Promise<void> => {
    this.channels.next(channels);
  }

  private processGenres = async (genres: Genre[]): Promise<void> => {
    this.genres.next(genres);
  }

  private addAccountSettings = async (accountSettings: AccountSettings): Promise<void> => {
    accountSettings.id = undefined;
    await iptvDb.accountSettings.add(accountSettings);
  }

  private putAccountSettings = async (accountSettings: AccountSettings): Promise<void> => {
    await iptvDb.accountSettings.put(accountSettings);
  }
}
