import { AccountSettings } from './models/account-settings';
import { ReplaySubject } from 'rxjs';
import { liveQuery } from 'dexie';
import { iptvDb } from './iptv-db';
import { Injectable } from '@angular/core';
import { Channel } from './models/channel';
import { Title } from './models/title';

@Injectable({
  providedIn: 'root'
})
export class IptvDbService {
  public accountSettings = new ReplaySubject<AccountSettings>(1);
  public channels = new ReplaySubject<Channel[]>(1);
  public titles = new ReplaySubject<Title[]>(1);

  // Subscriptions used by the service.
  private accountSettingsSubscription;
  private channelsSubscription;
  private titlesSubscription;

  constructor() {
    this.accountSettingsSubscription = liveQuery(() => iptvDb.accountSettings.orderBy('id').first())
      .subscribe(accountSettings => this.processAccountSettings(accountSettings));

    this.channelsSubscription = liveQuery(() => iptvDb.channels.orderBy('name').toArray())
      .subscribe(channels => this.processChannels(channels));

    this.titlesSubscription = liveQuery(() => iptvDb.titles.orderBy('name').toArray())
      .subscribe(titles => this.processTitles(titles));
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

  public batchTitles = async (add: Title[], update: Title[], remove: number[]): Promise<void> => {
    iptvDb.transaction('rw', iptvDb.titles, async () => {
      await iptvDb.titles.bulkAdd(add);
      await iptvDb.titles.bulkPut(update);
      await iptvDb.titles.bulkDelete(remove);
    });
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

  private processTitles = async (titles: Title[]): Promise<void> => {
    this.titles.next(titles);
  }

  private addAccountSettings = async (accountSettings: AccountSettings): Promise<void> => {
    accountSettings.id = undefined;
    await iptvDb.accountSettings.add(accountSettings);
  }

  private putAccountSettings = async (accountSettings: AccountSettings): Promise<void> => {
    await iptvDb.accountSettings.put(accountSettings);
  }
}
