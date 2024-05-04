import { AccountSettings } from './models/account-settings';
import { ReplaySubject } from 'rxjs';
import { liveQuery } from 'dexie';
import { iptvDb } from './iptv-db';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IptvDbService {
  public accountSettings = new ReplaySubject<AccountSettings>(1);

  // Subscriptions used by the service.
  private accountSettingsSubscription;

  constructor() {
    this.accountSettingsSubscription = liveQuery(() => iptvDb.accountSettings.orderBy('id').first())
      .subscribe(accountSettings => this.processAccountSettings(accountSettings));
  }

  private processAccountSettings = async (accountSettings?: AccountSettings): Promise<void> => {
    if (!accountSettings) {
      return;
    }

    this.accountSettings.next(accountSettings);
  }

  public saveAccountSettings = async (accountSettings: AccountSettings): Promise<void> => {
    if (accountSettings.id == null) {
      await this.addAccountSettings(accountSettings);
    } else {
      await this.putAccountSettings(accountSettings);
    }
  }

  private addAccountSettings = async (accountSettings: AccountSettings): Promise<void> => {
    accountSettings.id = undefined;
    await iptvDb.accountSettings.add(accountSettings);
  }

  private putAccountSettings = async (accountSettings: AccountSettings): Promise<void> => {
    await iptvDb.accountSettings.put(accountSettings);
  }
}
