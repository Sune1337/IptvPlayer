import Dexie, { Table } from 'dexie';
import { AccountSettings } from './models/account-settings';
import { Channel } from './models/channel';
import { Title } from './models/title';

export class IptvDb extends Dexie {
  public accountSettings!: Table<AccountSettings, number>;
  public channels!: Table<Channel, number>;
  public titles!: Table<Title, number>;

  constructor() {
    super('IptvDb');

    this.version(1)
      .stores({
        accountSettings: '++id',
        channels: '++id, name',
        titles: '++id, name, terms'
      });
  }
}

export const iptvDb = new IptvDb();
