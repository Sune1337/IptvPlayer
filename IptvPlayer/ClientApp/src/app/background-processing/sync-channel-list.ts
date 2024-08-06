import { IptvDbService } from '../db/iptv-db-service';
import { SerialFunction } from '../utils/serial-function';
import { EmptyError, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { AccountSettings } from '../db/models/account-settings';
import { parse } from 'iptv-playlist-parser';
import { Title } from '../db/models/title';
import { Channel } from '../db/models/channel';
import { FullMatch } from '../utils/full-match';
import { tokenize } from '../utils/tokenize';
import { compareArrays } from '../utils/compare-arrays';
import { SyncTmdb } from './sync-tmdb';

export class SyncChannelList {

  private syncSerialFunction;

  constructor(
    private iptvDbService: IptvDbService
  ) {
    this.syncSerialFunction = new SerialFunction(this.doSync, this.errorHandler);

    // Sync playlist when account-settings change.
    this.iptvDbService.accountSettings.subscribe(() => this.sync());
  }


  public sync = async (): Promise<void> => {
    await this.syncSerialFunction.execute();
  }

  private doSync = async (abortController: AbortController): Promise<void> => {
    // Create a subject from AbortController.
    const abortSubject = new Subject<void>();
    abortController.signal.addEventListener('abort', () => abortSubject.next())

    // Get account-settings.
    let accountSettings: AccountSettings;
    try {
      accountSettings = await firstValueFrom(
        this.iptvDbService.accountSettings
          .pipe(takeUntil(abortSubject))
      );
    } catch (error) {
      if (error instanceof EmptyError) {
        // Ignore.
        return;
      }

      throw error;
    }

    if (!accountSettings.playlistUrl) {
      return;
    }

    postMessage({ type: 'log', message: 'Download playlist...' });

    const playlistUrl = accountSettings.proxyUrl ? (accountSettings.proxyUrl + accountSettings.playlistUrl) : accountSettings.playlistUrl;
    const response = await fetch(playlistUrl, { signal: abortController.signal });
    if (!response.ok) {
      throw { message: `Error when download playlist: ${response.statusText ?? 'Unknown error'}` };
    }

    const playlist = parse(await response.text());

    postMessage({ type: 'log', message: 'Save channels...' });

    let channels: { [key: string]: Channel; } = {};
    for (const playlistItem of playlist.items) {
      // Get channel.
      const channelName = playlistItem.group.title;
      let channel = channels[channelName];
      if (!channel) {
        channel = channels[channelName] = { name: channelName, addedDateUtc: new Date() };
      }
    }

    // Get all current channels.
    let dbChannels = await this.iptvDbService.getAllChannels();

    const channelsMatch = new FullMatch(dbChannels, Object.entries(channels).map(([_, channel]) => channel), c => c.name);
    const addChannels: Channel[] = [];
    const removeChannels: number[] = [];
    while (channelsMatch.moveNext()) {
      if (channelsMatch.current[0] == null) {
        // Channel was added.
        addChannels.push(channelsMatch.current[1]);
      } else if (channelsMatch.current[1] == null) {
        // Channel was removed.
        if (channelsMatch.current[0].id != null) {
          removeChannels.push(channelsMatch.current[0].id);
        }
      }
    }

    await this.iptvDbService.batchChannels(addChannels, removeChannels);
    abortController.signal.throwIfAborted();

    // Get channels from DB, so we get the id's.
    dbChannels = await this.iptvDbService.getAllChannels();

    // Convert db-channels to map.
    channels = {};
    dbChannels.forEach(c => channels[c.name] = c);

    postMessage({ type: 'log', message: 'Processing titles...' });

    const titles: { [key: string]: Title; } = {};
    for (const playlistItem of playlist.items) {
      // Get channel.
      let channel = channels[playlistItem.group.title];

      // Get title.
      const titleName = playlistItem.name;
      let title = titles[titleName];
      if (!title) {
        title = titles[titleName] = { name: playlistItem.name, thumbnailUrl: playlistItem.tvg.logo, channelUrls: [], channelIds: [], terms: [], addedDateUtc: new Date() };
      }
      title.terms = tokenize(title.name);
      title.channelUrls.push({ channelName: channel.name, url: playlistItem.url });
      if (channel.id && title.channelIds.indexOf(channel.id) < 0) {
        title.channelIds.push(channel.id);
      }
    }

    // Get all current titles.
    const dbTitles = await this.iptvDbService.getAllTitles();

    const titlesMatch = new FullMatch(dbTitles, Object.entries(titles).map(([_, title]) => title), c => c.name);
    const addTitles: Title[] = [];
    const updateTitles: Title[] = [];
    const removeTitles: number[] = [];
    while (titlesMatch.moveNext()) {
      if (titlesMatch.current[0] == null) {
        // Title was added.
        addTitles.push(titlesMatch.current[1]);
      } else if (titlesMatch.current[1] == null) {
        // Title was removed.
        if (titlesMatch.current[0].id != null) {
          removeTitles.push(titlesMatch.current[0].id);
        }
      } else {
        // Compare items
        const isChanged =
          titlesMatch.current[0].name != titlesMatch.current[1].name ||
          titlesMatch.current[0].thumbnailUrl != titlesMatch.current[1].thumbnailUrl ||
          !compareArrays(titlesMatch.current[0].channelUrls, titlesMatch.current[1].channelUrls, (a, b) => a.url == b.url && a.channelName == b.channelName) ||
          !compareArrays(titlesMatch.current[0].terms, titlesMatch.current[1].terms, (a, b) => a == b) ||
          !compareArrays(titlesMatch.current[0].channelIds, titlesMatch.current[1].channelIds, (a, b) => a == b);

        if (isChanged) {
          // Title was updated.
          titlesMatch.current[1].id = titlesMatch.current[0].id;
          titlesMatch.current[1].tmdb = titlesMatch.current[0].tmdb;
          updateTitles.push(titlesMatch.current[1]);
        }
      }
    }

    postMessage({ type: 'log', message: `Adding ${addTitles.length}, updating ${updateTitles.length} and removing ${removeTitles.length} titles.` });

    await this.iptvDbService.batchTitles(addTitles, updateTitles, removeTitles);
    abortController.signal.throwIfAborted();

    // Sync TMDB information.
    const syncTmdb = new SyncTmdb(this.iptvDbService, accountSettings, abortController, abortSubject);
    await syncTmdb.sync();

    postMessage({ type: 'log', message: '' });
  }

  private errorHandler = (error: any): void => {
    if (error.message) {
      postMessage({ type: 'log', message: error.message });
    }
  }
}
