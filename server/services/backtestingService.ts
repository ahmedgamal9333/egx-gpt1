import { getEGXStock } from '../data/egxStocks.js';

export interface BacktestParams {
  strategyId: string;
  ticker: string;
  startDate: string;
  endDate: string;
  initialCapitalEgp: number;
  maxRiskPerTradePct: number;
  commissionPct: number;
  slippagePct: number;
  minRewardRiskRatio: number;
}

export interface BacktestTrade {
  tradeId: string;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  grossReturnPct: number;
  netReturnPct: number;
  netProfitEgp: number;
  exitReason: 'TARGET_1' | 'TARGET_2' | 'STOP_LOSS' | 'TIME_EXPIRY';
  exitReasonAr: string;
  holdingDays: number;
}

export interface BacktestResult {
  strategyNameAr: string;
  strategyDescriptionAr: string;
  periodTested: string;
  initialCapitalEgp: number;
  finalEquityEgp: number;
  totalNetProfitEgp: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  benchmarkEgx30ReturnPct: number;
  alphaGeneratedPct: number;
  totalTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  winRatePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  avgTradeReturnPct: number;
  avgWinningTradePct: number;
  avgLosingTradePct: number;
  commissionPaidTotalEgp: number;
  recentTrades: BacktestTrade[];
}

function daysAgoDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export class BacktestingEngine {
  public static runBacktest(_params: Partial<BacktestParams>): BacktestResult {
    throw new Error('Backtesting is disabled: no verified historical dataset and transaction-cost model are connected. No simulated performance is presented as historical results.');
  }

}
