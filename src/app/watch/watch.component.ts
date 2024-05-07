import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { IptvDbService } from '../db/iptv-db-service';
import { Title } from '../db/models/title';

declare let shaka: any;

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf
  ],
  templateUrl: './watch.component.html',
  styleUrl: './watch.component.scss'
})
export class WatchComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

  // Component-parameters.
  @Input() titleId!: string;

  public selectedTitle?: Title;

  @ViewChild('videoPlayer') videoElementRef: ElementRef | undefined;
  @ViewChild('videoContainer') videoContainerRef: ElementRef | undefined;

  videoElement: HTMLVideoElement | undefined;
  videoContainerElement: HTMLDivElement | undefined;
  player: any;

  constructor(
    private iptvDbService: IptvDbService
  ) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
      this.videoElement = this.videoElementRef?.nativeElement;
      this.videoContainerElement = this.videoContainerRef?.nativeElement;
      this.initPlayer();
    } else {
      console.error('Browser not supported!');
    }
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    for (const prop in changes) {
      switch (prop) {
        case 'titleId':
          // Load new shop-order.
          this.loadTitle();
          break;
      }
    }
  }

  public openInMPV = (): void => {
    if (!this.selectedTitle) {
      return;
    }

    this.videoElement?.pause();
    window.open(`mpv:${this.selectedTitle.channelUrls[0].url}`);
  }

  private async loadTitle() {
    const id = parseInt(this.titleId);
    if (!id) {
      return;
    }

    const title = await this.iptvDbService.getTitle(id);
    if (!title) {
      return;
    }

    this.selectedTitle = title;

    console.log(`Play: ${title.channelUrls[0].url}`);
    if (this.videoElement) {
      // Set video-src to an empty string to cancel previous video.
      // This seems to help if the previous video did not start playing because of no response from server.
      this.videoElement.src = '';
    }

    this.player
      .load(title.channelUrls[0].url)
      .then(() => {
        this.videoElement?.play();
      })
      .catch((e: any) => {
        console.error(e);
      });
  }

  private initPlayer() {
    this.player = new shaka.Player();
    this.player.attach(this.videoElement);

    const ui = new shaka.ui.Overlay(
      this.player,
      this.videoContainerElement,
      this.videoElement
    );
  }
}
