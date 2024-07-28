import { Title } from "../db/models/title";
import { AccountSettings } from "../db/models/account-settings";
import { deepCopy } from "./deepCopy";

export function prepareTitle(accountSettings: AccountSettings, title: Title): Title {
  const newTitle = deepCopy(title) as Title;

  if (newTitle.tmdb?.posterPath) {
    // Complete the TMDB poster url.
    newTitle.tmdb.posterPath = `https://image.tmdb.org/t/p/w200${newTitle.tmdb?.posterPath}`;
  }

  if (accountSettings.proxyUrl) {
    // Proxy urls.
    if (newTitle.thumbnailUrl) {
      newTitle.thumbnailUrl = accountSettings.proxyUrl + newTitle.thumbnailUrl;
    }

    if (newTitle.tmdb?.posterPath) {
      newTitle.tmdb.posterPath = accountSettings.proxyUrl + newTitle.tmdb.posterPath;
    }

    if (newTitle.channelUrls) {
      for (const channelUrl of newTitle.channelUrls) {
        channelUrl.url = accountSettings.proxyUrl + channelUrl.url;
      }
    }
  }

  return newTitle;
}
