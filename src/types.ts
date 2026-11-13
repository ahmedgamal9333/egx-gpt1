export interface EGXStockSummary {
  ticker: string;
  yahooTicker: string;
  isin: string;
  nameAr: string;
  nameEn: string;
  sectorAr: string;
  sectorEn: string;
  industryAr: string;
  currency: 'EGP' | 'USD';
  index: 'EGX30' | 'EGX70' | 'EGX100';
  currentPrice: number;
  prevClose: number;
  changePct: number;
  volume: number;
  valueTraded: number;
  marketCapEgp: number;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
  fairValue: number;
  fairValueUpsidePct: number;
  rsi14: number;
  dailyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  quickScore: number;
  recommendationBadge: 'STRONG_BUY' | 'BUY' | 'WAIT' | 'HOLD' | 'REDUCE';
  recommendationBadgeAr: string;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SupportResistanceZone {
  priceLevel: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: 'STRONG' | 'MODERATE' | 'TESTED';
  touches: number;
  description: string;
}

export interface FibonacciLevel {
  ratio: number;
  level: number;
  label: string;
}

export interface CandleBarReading {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changePct: number;
  volumeRatio: number;
  candleTypeAr: string;
  candleSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  noteAr: string;
}

export interface LastCandlesAnalysis {
  candlesCount: number;
  recentBars: CandleBarReading[];
  dominantPriceActionAr: string;
  candlestickSummaryAr: string;
  shortTermBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  tradingViewRatingAr: string;
  dataSourceLabel: string;
}

export interface TechnicalIndicatorsResult {
  currentPrice: number;
  previousClose: number;
  changePct: number;
  ema9: number;
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;
  sma20: number;
  sma50: number;
  sma100: number;
  sma200: number;
  rsi14: number;
  rsiStatus: 'OVERSOLD' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'OVERBOUGHT';
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    signal: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BULLISH' | 'BEARISH';
  };
  stochastic: {
    k: number;
    d: number;
    status: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  };
  adx14: {
    adx: number;
    plusDI: number;
    minusDI: number;
    trendStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  };
  momentum10: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidthPct: number;
  };
  atr14: number;
  historicalVolatilityPct: number;
  obv: number;
  volumeSma20: number;
  relativeVolume: number;
  volumeSurge: boolean;
  dailyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  weeklyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  monthlyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendAlignmentScore: number;
  trendAlignmentStatusAr: string;
  supportZones: SupportResistanceZone[];
  resistanceZones: SupportResistanceZone[];
  fibonacciLevels: FibonacciLevel[];
  patternsDetected: string[];
  breakoutStatus: 'BREAKOUT_UP' | 'BREAKDOWN' | 'CONSOLIDATING' | 'NEAR_RESISTANCE' | 'NEAR_SUPPORT';
  technicalScore: number;
  lastCandlesAnalysis?: LastCandlesAnalysis;
  pivotPoints?: {
    classic: { s3: number; s2: number; s1: number; p: number; r1: number; r2: number; r3: number };
    high1M?: number;
    low1M?: number;
    high3M?: number;
    low3M?: number;
    high52W?: number;
    low52W?: number;
  };
}

export interface FinancialYearData {
  year: number;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  totalAssets: number;
  totalEquity: number;
  totalDebt: number;
  operatingCashFlow: number;
  freeCashFlow: number;
  dividendPerShare: number;
}

export interface FinancialRatios {
  revenueGrowthYoY: number;
  grossProfitMargin: number;
  operatingMargin: number;
  netProfitMargin: number;
  roe: number;
  roa: number;
  roic: number;
  peRatio: number;
  forwardPe: number;
  pbRatio: number;
  evEbitda: number;
  dividendYield: number;
  fcfYield: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  interestCoverageRatio: number;
  cashFlowCoverage: number;
  revenueCagr3Y: number;
  earningsCagr3Y: number;
  epsGrowthYoY: number;
  bookValuePerShare: number;
  sectorSpecific: {
    label1: string;
    value1: string;
    label2: string;
    value2: string;
    label3: string;
    value3: string;
  };
  fundamentalQualityScore: number;
  earningsQualityStatusAr: string;
  financialRiskStatusAr: string;
}

export interface FundamentalDataResult {
  ticker: string;
  reportingPeriod: string;
  publicationDate: string;
  auditorOpinion: 'UNQUALIFIED' | 'QUALIFIED' | 'EMPHASIS_OF_MATTER';
  auditorName: string;
  historicalYears: FinancialYearData[];
  ratios: FinancialRatios;
}

export interface ValuationMethodItem {
  methodNameAr: string;
  methodNameEn: string;
  weightPct: number;
  calculatedValue: number;
  descriptionAr: string;
}

export interface FairValueResult {
  ticker: string;
  currentPrice: number;
  estimatedFairValue: number;
  conservativeValuation: number;
  optimisticValuation: number;
  upsideDownsidePct: number;
  marginOfSafetyPct: number;
  valuationStatus: 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED';
  valuationStatusAr: string;
  valuationDate: string;
  dataCompletenessPct: number;
  confidenceScore: number;
  methods: ValuationMethodItem[];
  dcfAssumptions: {
    waccDiscountRate: number;
    terminalGrowthRate: number;
    taxRate: number;
    fiveYearRevenueCagr: number;
    operatingMarginAvg: number;
    capexPctRevenue: number;
  };
  summaryAr: string;
}

export interface NewsItem {
  id: string;
  ticker: string;
  titleAr: string;
  titleEn: string;
  source: 'EGX' | 'Mubasher' | 'Enterprise' | 'CBE' | 'FRA';
  sourceUrl: string;
  publishedAt: string;
  isConfirmed: boolean;
  category: string;
  categoryAr: string;
  impact: 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE';
  impactAr: string;
  impactHorizon: string;
  summaryAr: string;
  significanceScore: number;
}

export interface UpcomingEvent {
  id: string;
  ticker: string;
  eventNameAr: string;
  eventDate: string;
  category: string;
  status: 'CONFIRMED' | 'ESTIMATED';
  detailsAr: string;
}

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

export interface InvestmentPlanResult {
  ticker: string;
  companyNameAr: string;
  currentPrice: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'WAIT' | 'HOLD' | 'REDUCE' | 'SELL' | 'AVOID';
  recommendationAr: string;
  recommendationBadgeColor: string;
  holdingPeriodAr: string;
  overallScore: number;
  confidenceScore: number;
  scoreBreakdown: {
    technicalWeight: number;
    technicalScore: number;
    fundamentalWeight: number;
    fundamentalScore: number;
    liquidityWeight: number;
    liquidityScore: number;
    newsWeight: number;
    newsScore: number;
    marketWeight: number;
    marketScore: number;
  };
  preferredEntryZone: { min: number; max: number; labelAr: string };
  alternativeEntryZone: { min: number; max: number; labelAr: string };
  breakoutTriggerPrice: number;
  entryConditionsAr: string[];
  invalidationConditionsAr: string[];
  stopLossPrice: number;
  stopLossPct: number;
  stopLossLogicAr: string;
  target1: { price: number; upsidePct: number; rationaleAr: string };
  target2: { price: number; upsidePct: number; rationaleAr: string };
  target3: { price: number; upsidePct: number; rationaleAr: string };
  rewardRiskRatio: number;
  estimatedFairValue: number;
  fairValueUpsidePct: number;
  marginOfSafetyPct: number;
  currentTrendAr: string;
  expectedTrendAr: string;
  riskGates: { passed: boolean; gateName: string; gateNameAr: string; detailsAr: string }[];
  allGatesPassed: boolean;
  bullishScenario: { directionAr: string; supportingConditionsAr: string[]; keyLevelsAr: string; invalidationTriggerAr: string };
  bearishScenario: { directionAr: string; supportingConditionsAr: string[]; keyLevelsAr: string; invalidationTriggerAr: string };
  neutralScenario: { directionAr: string; supportingConditionsAr: string[]; keyLevelsAr: string; invalidationTriggerAr: string };
  positiveFactorsAr: string[];
  negativeFactorsAr: string[];
  thingsToMonitorAr: string[];
  arabicAiReport: string;
  reportGeneratedAt: string;
  modelUsed: string;
}

export interface DetailedStockPayload {
  stock: any;
  candlesDaily: Candle[];
  candlesWeekly: Candle[];
  candlesMonthly: Candle[];
  multiSourceComparison: any;
  technicalAnalysis: TechnicalIndicatorsResult;
  fundamentalAnalysis: FundamentalDataResult;
  fairValueValuation: FairValueResult;
  newsDisclosures: NewsItem[];
  upcomingEvents: UpcomingEvent[];
  aiDecision: InvestmentPlanResult;
  peers: any[];
}

export interface ChatWebSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  usedTools?: string[];
  webSources?: ChatWebSource[];
  mentionedTickers?: string[];
  isError?: boolean;
}

