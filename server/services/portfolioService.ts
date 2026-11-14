import { getEgidStockDirectory } from "./egidMarketDataService.js";

export interface PortfolioHolding {
  id: string;
  ticker: string;
  sharesCount: number;
  avgBuyPrice: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPl: number;
  unrealizedPlPct: number;
  allocationPct: number;
  fairValue: number;
  fairValueUpsidePct: number;
  aiAction: 'HOLD' | 'ADD' | 'REDUCE' | 'EXIT';
  aiActionAr: string;
  aiActionReasonAr: string;
  quoteAvailable: boolean;
}

export interface PortfolioSummary {
  totalCost: number;
  totalMarketValue: number;
  totalUnrealizedPl: number;
  totalUnrealizedPlPct: number;
  cashBalance: number;
  totalEquity: number;
  dividendsEarned: number;
  holdings: PortfolioHolding[];
  valuationComplete: boolean;
  unpricedHoldingsCount: number;
}

export class PortfolioService {
  // Start empty. Real user transactions must be entered explicitly and persisted separately.
  private static userHoldings: { ticker: string; shares: number; buyPrice: number }[] = [];

  public static async getPortfolio(): Promise<PortfolioSummary> {
    let totalCost = 0;
    let totalMarketValue = 0;
    let pricedCost = 0;
    const quotes = await getEgidStockDirectory();
    const quoteByTicker = new Map(quotes.map((quote: any) => [quote.ticker, quote]));

    const enrichedHoldings: PortfolioHolding[] = this.userHoldings.map((h, idx) => {
      const quote: any = quoteByTicker.get(h.ticker);
      const quoteAvailable = typeof quote?.currentPrice === 'number' && quote.currentPrice > 0;
      const currentPrice = quoteAvailable ? quote.currentPrice : 0;
      const cost = h.shares * h.buyPrice;
      const val = quoteAvailable ? h.shares * currentPrice : 0;
      const pl = quoteAvailable ? val - cost : 0;
      const plPct = quoteAvailable && cost > 0 ? Number(((pl / cost) * 100).toFixed(2)) : 0;
      const fairValue = 0;
      const fairValueUpsidePct = 0;

      totalCost += cost;
      if (quoteAvailable) {
        totalMarketValue += val;
        pricedCost += cost;
      }

      const aiAction: 'HOLD' | 'ADD' | 'REDUCE' | 'EXIT' = 'HOLD';
      const aiActionAr = 'لا توجد توصية آلية (HOLD)';
      const aiActionReasonAr = quoteAvailable
        ? 'السعر متاح من EGID لكنه متأخر؛ لا تتوفر بيانات تاريخية مرخصة كافية لإصدار قرار آلي.'
        : 'لا يوجد سعر حديث موثق لهذا السهم؛ تقييم المركز والتوصية متوقفان.';


      return {
        id: `hld-${idx + 1}`,
        ticker: h.ticker,
        sharesCount: h.shares,
        avgBuyPrice: h.buyPrice,
        totalCost: cost,
        currentPrice,
        currentValue: val,
        unrealizedPl: pl,
        unrealizedPlPct: plPct,
        allocationPct: 0, // calculated below
        fairValue,
        fairValueUpsidePct,
        aiAction,
        aiActionAr,
        aiActionReasonAr,
        quoteAvailable
      };
    });

    // Calculate allocations
    enrichedHoldings.forEach(h => {
      h.allocationPct = totalMarketValue > 0 && h.quoteAvailable ? Number(((h.currentValue / totalMarketValue) * 100).toFixed(1)) : 0;
    });

    const unpricedHoldingsCount = enrichedHoldings.filter(h => !h.quoteAvailable).length;
    const valuationComplete = unpricedHoldingsCount === 0;
    const totalPl = totalMarketValue - pricedCost;
    const totalPlPct = pricedCost > 0 ? Number(((totalPl / pricedCost) * 100).toFixed(2)) : 0;

    return {
      totalCost,
      totalMarketValue,
      totalUnrealizedPl: totalPl,
      totalUnrealizedPlPct: totalPlPct,
      cashBalance: 0,
      totalEquity: totalMarketValue,
      dividendsEarned: 0,
      holdings: enrichedHoldings,
      valuationComplete,
      unpricedHoldingsCount
    };
  }

  public static addHolding(ticker: string, shares: number, buyPrice: number) {
    const norm = ticker.toUpperCase().replace(".CA", "");
    const existing = this.userHoldings.find(h => h.ticker === norm);
    if (existing) {
      const totalShares = existing.shares + shares;
      const totalCost = (existing.shares * existing.buyPrice) + (shares * buyPrice);
      existing.shares = totalShares;
      existing.buyPrice = Number((totalCost / totalShares).toFixed(2));
    } else {
      this.userHoldings.push({ ticker: norm, shares, buyPrice });
    }
  }

  public static removeHolding(ticker: string) {
    const norm = ticker.toUpperCase().replace(".CA", "");
    this.userHoldings = this.userHoldings.filter(h => h.ticker !== norm);
  }
}
