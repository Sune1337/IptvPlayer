import { TitleChannelUrls } from './title-channel-urls';
import { Tmdb } from './tmdb';

export interface Title {
  id?: number;
  addedDateUtc: Date;
  name: string;
  thumbnailUrl?: string;
  titleChannelUrls: TitleChannelUrls[];
  terms: string[];
  tmdb?: Tmdb;
}
