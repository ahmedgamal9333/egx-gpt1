export interface SmartAlert {
  id: string;
  ticker: string;
  companyNameAr: string;
  type: 'ENTRY_ZONE' | 'BREAKOUT' | 'TARGET_HIT' | 'STOP_APPROACH' | 'VOLUME_SPIKE' | 'DISCLOSURE' | 'RECOMMENDATION_CHANGE';
  typeAr: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  triggerPrice: number;
  messageAr: string;
  timestamp: string;
  isRead: boolean;
}

export class WatchlistAlertService {
  private static watchlist: string[] = [];
  private static readIds = new Set<string>();

  public static getWatchlist(): string[] {
    return this.watchlist;
  }

  public static addToWatchlist(ticker: string) {
    const norm = ticker.toUpperCase().replace('.CA', '');
    if (!this.watchlist.includes(norm)) {
      this.watchlist.push(norm);
    }
  }

  public static removeFromWatchlist(ticker: string) {
    const norm = ticker.toUpperCase().replace('.CA', '');
    this.watchlist = this.watchlist.filter(t => t !== norm);
  }

  public static getAlerts(): SmartAlert[] {
    // Alerts are empty until verified price history and rule-based triggers are connected.
    return [];
  }

  public static markAsRead(id: string) {
    this.readIds.add(id);
  }
}
