import { EGX_STOCKS_UNIVERSE } from '../data/egxStocks.js';
import { LiveMarketSyncService } from './liveMarketSyncService.js';
import { getEgidFeedStatus } from './egidMarketDataService.js';

export interface DataSourceProvider {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'PRICES' | 'OFFICIAL' | 'NEWS' | 'MACRO';
  status: 'ONLINE' | 'DELAYED' | 'STANDBY';
  statusAr: string;
  reliabilityScore: number | null;
  latencyMs: number | null;
  lastSuccessfulUpdate: string;
  updateFrequencyAr: string;
  coveragePct: number;
  discrepanciesCount: number;
  isOfficialSource: boolean;
}

export interface SystemSourcesReport {
  overallHealthScore: number | null;
  connectedProvidersCount: number;
  totalProvidersCount: number;
  activeDiscrepancies: number | null;
  averageLatencyMs: number | null;
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
    const egid = getEgidFeedStatus();
    const connected = egid.status === 'CONNECTED';
    const coveragePct = egid.directoryCount > 0
      ? Number(((egid.quoteCount / egid.directoryCount) * 100).toFixed(1))
      : 0;

    const providers: DataSourceProvider[] = [
      {
        id: 'src-egid',
        nameAr: 'الشركة المصرية لنشر المعلومات (EGID)',
        nameEn: 'EGID — EGX authorized data provider',
        category: 'PRICES',
        status: connected ? 'DELAYED' : 'STANDBY',
        statusAr: connected ? 'متصل — أسعار متأخرة مع توقيت آخر صفقة' : 'لم يتم جلب بيانات بعد',
        reliabilityScore: null,
        latencyMs: null,
        lastSuccessfulUpdate: egid.cachedAt || '',
        updateFrequencyAr: 'تحديث تلقائي كل 3 دقائق عند طلب البيانات',
        coveragePct,
        discrepanciesCount: 0,
        isOfficialSource: true
      },
      ...[
        ['src-egx', 'البورصة المصرية (EGX)', 'Egyptian Exchange', 'OFFICIAL'],
        ['src-directfn', 'DirectFN', 'DirectFN delayed market data', 'PRICES'],
        ['src-mubasher', 'مباشر', 'Mubasher', 'PRICES'],
        ['src-yahoo', 'ياهو فاينانس', 'Yahoo Finance', 'PRICES'],
        ['src-cbe', 'البنك المركزي المصري', 'Central Bank of Egypt', 'MACRO'],
        ['src-fra', 'الهيئة العامة للرقابة المالية', 'Financial Regulatory Authority', 'OFFICIAL']
      ].map(([id, nameAr, nameEn, category]) => ({
        id,
        nameAr,
        nameEn,
        category: category as DataSourceProvider['category'],
        status: 'STANDBY' as const,
        statusAr: 'غير مربوط تقنيًا — لا تُعرض بيانات منه',
        reliabilityScore: 0,
        latencyMs: 0,
        lastSuccessfulUpdate: '',
        updateFrequencyAr: 'غير متاح',
        coveragePct: 0,
        discrepanciesCount: 0,
        isOfficialSource: category === 'OFFICIAL'
      }))
    ];

    return {
      overallHealthScore: null,
      connectedProvidersCount: connected ? 1 : 0,
      totalProvidersCount: providers.length,
      activeDiscrepancies: null,
      averageLatencyMs: null,
      lastMarketSync: egid.cachedAt || live.lastSyncedAt,
      lastMarketSessionDate: LiveMarketSyncService.getLatestEgxSessionDate(),
      syncedStocksCount: egid.quoteCount,
      totalUniverseCount: egid.directoryCount || EGX_STOCKS_UNIVERSE.length,
      providers,
      recentDiscrepancyLogs: []
    };
  }
}
