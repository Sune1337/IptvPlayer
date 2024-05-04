/// <reference lib="webworker" />

import { IptvDbService } from '../db/iptv-db-service';
import { SyncChannelList } from './sync-channel-list';

const iptvDbService = new IptvDbService();
const syncChannelList = new SyncChannelList(iptvDbService);

addEventListener('message', ({ data }) => {
    switch (data) {
        case 'syncChannelList':
            syncChannelList.sync();
            break;
    }

    // const response = `worker response to ${data}`;
    // postMessage(response);
});
