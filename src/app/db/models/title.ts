import { ChannelUrl } from './channel-url';
import { Tmdb } from './tmdb';

export interface Title {
  id?: number;
  addedDateUtc: Date;
  name: string;
  thumbnailUrl?: string;
  channelUrls: ChannelUrl[];
  channelIds: number[];
  terms: string[];
  tmdb?: Tmdb;
}
