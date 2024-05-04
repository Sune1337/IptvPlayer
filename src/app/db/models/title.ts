import { TitleChannelUrls } from './title-channel-urls';

export interface Title {
  id?: number;
  addedDateUtc: Date;
  name: string;
  thumbnailUrl?: string;
  titleChannelUrls: TitleChannelUrls[];
  terms: string[];
}
