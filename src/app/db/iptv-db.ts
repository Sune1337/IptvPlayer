import Dexie, { Table } from 'dexie';
import { AccountSettings } from './models/account-settings';

export class IptvDb extends Dexie {
  public accountSettings!: Table<AccountSettings, number>;

  constructor() {
    super('IptvDb');

    this.version(1)
      .stores({
        accountSettings: '++id'
      });
  }
}

export const iptvDb = new IptvDb();
