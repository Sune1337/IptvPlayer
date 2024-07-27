import Dexie, { Table } from 'dexie';
import { AccountSettings } from './models/account-settings';
import { Channel } from './models/channel';
import { Title } from './models/title';
import { Genre } from './models/genre';

export class IptvDb extends Dexie {
  public accountSettings!: Table<AccountSettings, number>;
  public channels!: Table<Channel, number>;
  public titles!: Table<Title, number>;
  public genres!: Table<Genre, number>;

  constructor() {
    super('IptvDb');

    this.version(1)
      .stores({
        accountSettings: '++id',
        channels: '++id, name',
        titles: '++id, name, *terms, *channelIds, *tmdb.genreIds',
        genres: 'id'
      });
  }
}

export const iptvDb = new IptvDb();
