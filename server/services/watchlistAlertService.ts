import { getEGXStock } from '../data/egxStocks.js';

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
  private static watchlist: string[] = ['COMI', 'TMGH', 'SWDY', 'MFPC', 'ETEL', 'FWRY', 'GBCO'];
  private static readIds = new Set<string>(['alt-3', 'alt-4']);

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
    const comi = getEGXStock('COMI');
    const tmgh = getEGXStock('TMGH');
    const swdy = getEGXStock('SWDY');
    const etel = getEGXStock('ETEL');

    const comiPrice = comi?.currentPrice ?? 128.75;
    const tmghPrice = tmgh?.currentPrice ?? 83.95;
    const swdyPrice = swdy?.currentPrice ?? 114.2;
    const etelPrice = etel?.currentPrice ?? 133.0;

    return [
      {
        id: 'alt-1',
        ticker: 'COMI',
        companyNameAr: comi?.nameAr || 'البنك التجاري الدولي',
        type: 'ENTRY_ZONE',
        typeAr: 'دخول منطقة الشراء المثالية',
        severity: 'SUCCESS',
        triggerPrice: comiPrice,
        messageAr: `سهم CIB يتداول الآن عند ${comiPrice} جم داخل نطاق التجميع التكتيكي المفضل (${(comiPrice * 0.985).toFixed(2)} - ${(comiPrice * 1.005).toFixed(2)} جم) مع ثبات أعلى متوسط 20 يوماً.`,
        timestamp: 'منذ 15 دقيقة',
        isRead: this.readIds.has('alt-1')
      },
      {
        id: 'alt-2',
        ticker: 'TMGH',
        companyNameAr: tmgh?.nameAr || 'مجموعة طلعت مصطفى القابضة',
        type: 'VOLUME_SPIKE',
        typeAr: 'طفرة سيولة استثنائية (RVOL > 1.8)',
        severity: 'INFO',
        triggerPrice: tmghPrice,
        messageAr: `نشاط سيولة ملحوظ على سهم طلعت مصطفى عند ${tmghPrice} جم بدعم من زخم مبيعات مشروعي ساوث ميد وبنان.`,
        timestamp: 'منذ 45 دقيقة',
        isRead: this.readIds.has('alt-2')
      },
      {
        id: 'alt-3',
        ticker: 'SWDY',
        companyNameAr: swdy?.nameAr || 'السويدي إليكتريك',
        type: 'BREAKOUT',
        typeAr: 'اختراق مستوى مقاومة رئيسي',
        severity: 'SUCCESS',
        triggerPrice: swdyPrice,
        messageAr: `السهم يتماسك عند ${swdyPrice} جم بعد اختراق المقاومة الأسبوعية (${(swdyPrice * 0.98).toFixed(2)} جم) متجهاً نحو مستهدف ${(swdyPrice * 1.08).toFixed(2)} جم.`,
        timestamp: 'منذ ساعتين',
        isRead: this.readIds.has('alt-3')
      },
      {
        id: 'alt-4',
        ticker: 'ETEL',
        companyNameAr: etel?.nameAr || 'المصرية للاتصالات (وي)',
        type: 'DISCLOSURE',
        typeAr: 'سيولة مؤسسية وتدفقات قوية',
        severity: 'INFO',
        triggerPrice: etelPrice,
        messageAr: `يتصدر سهم المصرية للاتصالات قيم التداول عند ${etelPrice} جم بسيولة يومية مرتفعة تتجاوز ${Math.round((etel?.valueTraded || 600000000) / 1000000)} مليون جم.`,
        timestamp: 'اليوم',
        isRead: this.readIds.has('alt-4')
      }
    ];
  }

  public static markAsRead(id: string) {
    this.readIds.add(id);
  }
}
