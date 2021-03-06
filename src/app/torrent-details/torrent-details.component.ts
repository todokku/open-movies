import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ITorrent, ISeason } from '../@core/interfaces/torrent';
import { Spinner } from '../@core/models/spinner';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { TorrentsService } from '../@core/services/torrents.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-torrent-details',
  templateUrl: './torrent-details.component.html',
  styleUrls: ['./torrent-details.component.scss']
})
export class TorrentDetailsComponent implements OnInit {

  @ViewChild('iframe', { static: false }) iframe: ElementRef;

  private sub: any;
  private id: number;

  public torrentType = 'movie';

  public trailer = '';
  public torrent: ITorrent = {};
  public spinner: Spinner = new Spinner();

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private torrentsService: TorrentsService,
  ) { }

  public sanitizeResourceUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  public getItemLink(item: any) {
    return this.sanitizeResourceUrl(item.torrent_url || item.torrent_magnet);
  }

  public getItemSize(bytes: number) {
    let gegaBytes = bytes / 1e9;
    return Math.round(gegaBytes * 100) / 100;
  }

  ngOnInit() {
    this.torrent = this.torrentsService.$currentTorrent;
    this.spinner.$loading = !this.torrent;

    if (!this.sub) {
      this.sub = this.route.params.subscribe(params => {
        this.id = params['id'];

        if (!this.id) { return false; }
  
        this.torrentsService.getTorrentDetails(`${this.id}`).pipe(take(1)).subscribe((response) => {
          this.torrent = response.MovieList[0];
          this.spinner.$loading = false;
          this.torrentsService.lastTorrent = true;
          this.torrentsService.$currentTorrent = { ...this.torrent };
  
          this.torrent.description = decodeURI(this.torrent.description);
  
          this.trailer = `https://youtube.com/embed/${this.torrent.trailer}`;

          this.iframe.nativeElement.contentWindow.location.replace(this.trailer);

          if (!this.torrent.items.length) {
            this.torrentType = 'show';

            this.torrentsService.getShowDataItems(this.torrent.imdb).pipe(take(1)).subscribe((response) => {
              const formatSeasons = (season: any) => ({ episodes: season, number: +season[0].season });
              this.torrent.seasons = Object.values(response).map(formatSeasons);
            });
          }
        });
      });
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }

    this.torrentsService.$currentTorrent = null;
  }

}
