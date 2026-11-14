import { EGX_STOCKS_UNIVERSE, getEGXStock } from '../data/egxStocks.js';
import { LiveMarketSyncService } from './liveMarketSyncService.js';

export interface DataSourceProvider {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'PRICES' | 'OFFICIAL' | 'NEWS' | 'MACRO';
  status: 'ONLINE' | 'DELAYED_15M' | 'STANDBY';
  statusAr: string;
  reliabilityScore: number; // 0 to 100
  latencyMs: number;
  lastSuccessfulUpdate: string;
  updateFrequencyAr: string;
  coveragePct: number;
  discrepanciesCount: number;
  isOfficialSource: boolean;
}

export interface SystemSourcesReport {
  overallHealthScore: number;
  connectedProvidersCount: number;
  totalProvidersCount: number;
  activeDiscrepancies: number;
  averageLatencyMs: number;
  lastMarketSync: string;
  lastMarketSessionDate: string;
  syncedStocksCount: number;
  totalUniverseCount: number;
  providers: DataSourceProvider[];
  recentDiscrepancyLogs: {
    ticker: string;
    field: string;
    sourceA: string;
    valueA: string;
    sourceB: string;
    valueB: string;
    resolutionAr: string;
    timestamp: string;
  }[];
}

export class SourceIntelligenceService {
  public static getReport(): SystemSourcesReport {
    const live = LiveMarketSyncService.getLiveState();
    const sessionDate = LiveMarketSyncService.getLatestEgxSessionDate();
    const syncTimeDisplay = live.lastSyncedAt ? live.lastSyncedAt.replace('T', ' ').substring(0, 16) : '';
    const providers: DataSourceProvider[] = [
      {
        id: 'src-tradingview', nameAr: 'TradingView Scanner (مصدر غير رسمي)',
        nameEn: 'TradingView public scanner endpoint', category: 'PRICES',
        status: live.tradingViewOnline ? 'ONLINE' : 'STANDBY',
        statusAr: live.tradingViewOnline ? 'تم استلام بيانات من المصدر؛ لم يتم التحقق المستقل منها' : 'غير متصل أو لم يتم استلام بيانات حديثة',
        reliabilityScore: live.tradingViewOnline ? 50 : 0,
        latencyMs: live.tradingViewOnline ? live.tradingViewLatencyMs : 0,
        lastSuccessfulUpdate: live.tradingViewOnline ? syncTimeDisplay : '',
        updateFrequencyAr: 'محاولة مزامنة كل 5 دقائق؛ التغطية والتأخير غير مضمونين',
        coveragePct: 0, discrepanciesCount: 0, isOfficialSource: false
      },
      ...[
        ['src-egx', 'البورصة المصرية (EGX)', 'Egyptian Exchange', 'OFFICIAL'],
        ['src-mubasher', 'مباشر', 'Mubasher', 'PRICES'],
        ['src-investing', 'إنفستنج', 'Investing.com', 'PRICES'],
        ['src-yahoo', 'ياهو فاينانس', 'Yahoo Finance', 'PRICES'],
        ['src-directfn', 'DirectFN', 'DirectFN', 'PRICES'],
        ['src-cbe', 'البنك المركزي المصري', 'Central Bank of Egypt', 'MACRO'],
        ['src-fra', 'الهيئة العامة للرقابة المالية', 'Financial Regulatory Authority', 'OFFICIAL']
      ].map(([id, nameAr, nameEn, category]) => ({
        id, nameAr, nameEn, category: category as DataSourceProvider['category'],
        status: 'STANDBY' as const,
        statusAr: 'غير مربوط تقنيًا - لا توجد بيانات جلب أو تحقق في هذا الإصدار',
        reliabilityScore: 0, latencyMs: 0, lastSuccessfulUpdate: '',
        updateFrequencyAr: 'غير متاح', coveragePct: 0, discrepanciesCount: 0,
        isOfficialSource: category === 'OFFICIAL'
      }))
    ];
    return {
      overallHealthScore: live.tradingViewOnline ? 25 : 0,
      connectedProvidersCount: live.tradingViewOnline ? 1 : 0,
      totalProvidersCount: providers.length,
      activeDiscrepancies: 0,
      averageLatencyMs: live.tradingViewOnline ? live.tradingViewLatencyMs : 0,
      lastMarketSync: live.lastSyncedAt,
      lastMarketSessionDate: sessionDate,
      syncedStocksCount: live.tradingViewOnline ? live.syncedStocksCount : 0,
      totalUniverseCount: EGX_STOCKS_UNIVERSE.length,
      providers,
      recentDiscrepancyLogs: []
    };
  }

}
