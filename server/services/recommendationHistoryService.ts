export interface HistoricalRecommendation {
  id: string;
  ticker: string;
  companyNameAr: string;
  recommendationDate: string;
  priceAtRecommendation: number;
  entryZone: string;
  stopLoss: number;
  target1: number;
  target2: number;
  target3: number;
  fairValue: number;
  score: number;
  confidence: number;
  recommendationType: 'STRONG_BUY' | 'BUY' | 'WAIT';
  recommendationTypeAr: string;
  status: 'TARGET_2_HIT' | 'TARGET_1_HIT' | 'TARGET_3_HIT' | 'ACTIVE' | 'STOPPED_OUT';
  statusAr: string;
  actualReturnPct: number;
  holdingDays: number;
  closedDate?: string;
  sourcesUsed: string[];
}

export interface RecommendationAuditMetrics {
  totalRecommendations: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  averageReturnPct: number;
  averageWinningTradePct: number;
  averageLosingTradePct: number;
  profitFactor: number;
  target1HitRatePct: number;
  target2HitRatePct: number;
  stopLossRatePct: number;
  maxDrawdownPct: number;
  avgHoldingDays: number;
}

export class RecommendationHistoryService {
  private static readonly HISTORY: HistoricalRecommendation[] = [];

  public static getHistory(): HistoricalRecommendation[] {
    return [];
  }

  public static getMetrics(): RecommendationAuditMetrics {
    return {
      totalRecommendations: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRatePct: 0,
      averageReturnPct: 0,
      averageWinningTradePct: 0,
      averageLosingTradePct: 0,
      profitFactor: 0,
      target1HitRatePct: 0,
      target2HitRatePct: 0,
      stopLossRatePct: 0,
      maxDrawdownPct: 0,
      avgHoldingDays: 0
    };
  }
}
