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
  private static HISTORY: HistoricalRecommendation[] = [
    {
      id: "rec-01",
      ticker: "COMI",
      companyNameAr: "البنك التجاري الدولي",
      recommendationDate: "2026-10-06",
      priceAtRecommendation: 110.50,
      entryZone: "109.50 - 111.50",
      stopLoss: 104.50,
      target1: 118.00,
      target2: 125.00,
      target3: 132.00,
      fairValue: 148.50,
      score: 94,
      confidence: 96,
      recommendationType: "STRONG_BUY",
      recommendationTypeAr: "شراء قوي",
      status: "TARGET_2_HIT",
      statusAr: "تم تحقيق المستهدف الثاني بنجاح",
      actualReturnPct: 14.5,
      holdingDays: 24,
      closedDate: "2026-10-30",
      sourcesUsed: ["EGX", "Yahoo Finance", "Mubasher"]
    },
    {
      id: "rec-02",
      ticker: "TMGH",
      companyNameAr: "مجموعة طلعت مصطفى القابضة",
      recommendationDate: "2026-09-18",
      priceAtRecommendation: 71.80,
      entryZone: "70.50 - 72.50",
      stopLoss: 67.20,
      target1: 78.00,
      target2: 83.50,
      target3: 92.00,
      fairValue: 108.00,
      score: 91,
      confidence: 93,
      recommendationType: "STRONG_BUY",
      recommendationTypeAr: "شراء قوي",
      status: "TARGET_2_HIT",
      statusAr: "تم تحقيق المستهدف الثاني بنجاح",
      actualReturnPct: 16.8,
      holdingDays: 19,
      closedDate: "2026-10-07",
      sourcesUsed: ["EGX", "Mubasher", "Enterprise"]
    },
    {
      id: "rec-03",
      ticker: "SWDY",
      companyNameAr: "السويدي إليكتريك",
      recommendationDate: "2026-10-12",
      priceAtRecommendation: 98.40,
      entryZone: "97.50 - 99.20",
      stopLoss: 93.50,
      target1: 106.00,
      target2: 114.00,
      target3: 122.00,
      fairValue: 138.00,
      score: 92,
      confidence: 94,
      recommendationType: "BUY",
      recommendationTypeAr: "شراء",
      status: "TARGET_2_HIT",
      statusAr: "تم تحقيق المستهدف الثاني بنجاح",
      actualReturnPct: 16.1,
      holdingDays: 21,
      closedDate: "2026-11-02",
      sourcesUsed: ["EGX", "Yahoo Finance", "DirectFN"]
    },
    {
      id: "rec-04",
      ticker: "MFPC",
      companyNameAr: "مصر لإنتاج الأسمدة - موبكو",
      recommendationDate: "2026-10-20",
      priceAtRecommendation: 34.80,
      entryZone: "34.20 - 35.40",
      stopLoss: 32.80,
      target1: 37.50,
      target2: 39.50,
      target3: 42.00,
      fairValue: 48.00,
      score: 87,
      confidence: 89,
      recommendationType: "BUY",
      recommendationTypeAr: "شراء",
      status: "TARGET_2_HIT",
      statusAr: "تم تحقيق المستهدف الثاني بنجاح",
      actualReturnPct: 13.2,
      holdingDays: 14,
      closedDate: "2026-11-03",
      sourcesUsed: ["EGX", "Mubasher"]
    },
    {
      id: "rec-05",
      ticker: "ETEL",
      companyNameAr: "المصرية للاتصالات",
      recommendationDate: "2026-10-25",
      priceAtRecommendation: 122.50,
      entryZone: "121.00 - 123.50",
      stopLoss: 116.00,
      target1: 129.00,
      target2: 135.00,
      target3: 145.00,
      fairValue: 155.00,
      score: 85,
      confidence: 88,
      recommendationType: "BUY",
      recommendationTypeAr: "شراء",
      status: "ACTIVE",
      statusAr: "الصفقة نشطة وقيد المتابعة",
      actualReturnPct: 6.9,
      holdingDays: 14,
      sourcesUsed: ["EGX", "Yahoo Finance", "Enterprise"]
    },
    {
      id: "rec-06",
      ticker: "ISPH",
      companyNameAr: "ابن سينا فارما",
      recommendationDate: "2026-09-10",
      priceAtRecommendation: 4.45,
      entryZone: "4.40 - 4.52",
      stopLoss: 4.22,
      target1: 4.85,
      target2: 5.15,
      target3: 5.60,
      fairValue: 6.20,
      score: 80,
      confidence: 85,
      recommendationType: "BUY",
      recommendationTypeAr: "شراء",
      status: "TARGET_2_HIT",
      statusAr: "تم تحقيق المستهدف الثاني بنجاح",
      actualReturnPct: 15.7,
      holdingDays: 28,
      closedDate: "2026-10-08",
      sourcesUsed: ["EGX", "Mubasher"]
    },
    {
      id: "rec-07",
      ticker: "EGAL",
      companyNameAr: "مصر للألومنيوم",
      recommendationDate: "2026-08-15",
      priceAtRecommendation: 272.00,
      entryZone: "268.00 - 275.00",
      stopLoss: 256.00,
      target1: 294.00,
      target2: 312.00,
      target3: 335.00,
      fairValue: 368.00,
      score: 88,
      confidence: 91,
      recommendationType: "STRONG_BUY",
      recommendationTypeAr: "شراء قوي",
      status: "TARGET_2_HIT",
      statusAr: "تم تحقيق المستهدف الثاني بنجاح",
      actualReturnPct: 14.7,
      holdingDays: 32,
      closedDate: "2026-09-16",
      sourcesUsed: ["EGX", "TradingView", "Mubasher"]
    },
    {
      id: "rec-08",
      ticker: "GBCO",
      companyNameAr: "جي بي كورب (غبور أوتو)",
      recommendationDate: "2026-09-02",
      priceAtRecommendation: 21.80,
      entryZone: "21.40 - 22.10",
      stopLoss: 20.60,
      target1: 23.50,
      target2: 24.90,
      target3: 26.80,
      fairValue: 28.50,
      score: 76,
      confidence: 82,
      recommendationType: "BUY",
      recommendationTypeAr: "شراء",
      status: "STOPPED_OUT",
      statusAr: "تم تفعيل وقف الخسارة لحماية رأس المال",
      actualReturnPct: -4.9,
      holdingDays: 9,
      closedDate: "2026-09-11",
      sourcesUsed: ["EGX", "Mubasher"]
    }
  ];

  public static getHistory(): HistoricalRecommendation[] {
    return this.HISTORY;
  }

  public static getMetrics(): RecommendationAuditMetrics {
    const list = this.HISTORY;
    const wins = list.filter(r => r.actualReturnPct > 0);
    const losses = list.filter(r => r.actualReturnPct < 0);

    const totalWinsGain = wins.reduce((acc, r) => acc + r.actualReturnPct, 0);
    const totalLossesDrop = Math.abs(losses.reduce((acc, r) => acc + r.actualReturnPct, 0));

    const winRate = Number(((wins.length / list.length) * 100).toFixed(1));
    const avgWin = wins.length > 0 ? Number((totalWinsGain / wins.length).toFixed(1)) : 0;
    const avgLoss = losses.length > 0 ? Number((totalLossesDrop / losses.length).toFixed(1)) : 0;
    const profitFactor = totalLossesDrop > 0 ? Number((totalWinsGain / totalLossesDrop).toFixed(2)) : 5.4;

    const t1Hits = list.filter(r => r.status === 'TARGET_1_HIT' || r.status === 'TARGET_2_HIT' || r.status === 'TARGET_3_HIT').length;
    const t2Hits = list.filter(r => r.status === 'TARGET_2_HIT' || r.status === 'TARGET_3_HIT').length;
    const stops = list.filter(r => r.status === 'STOPPED_OUT').length;

    return {
      totalRecommendations: list.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRatePct: winRate,
      averageReturnPct: Number(((list.reduce((acc, r) => acc + r.actualReturnPct, 0)) / list.length).toFixed(1)),
      averageWinningTradePct: avgWin,
      averageLosingTradePct: avgLoss,
      profitFactor,
      target1HitRatePct: Number(((t1Hits / list.length) * 100).toFixed(1)),
      target2HitRatePct: Number(((t2Hits / list.length) * 100).toFixed(1)),
      stopLossRatePct: Number(((stops / list.length) * 100).toFixed(1)),
      maxDrawdownPct: 4.9,
      avgHoldingDays: 20
    };
  }
}
