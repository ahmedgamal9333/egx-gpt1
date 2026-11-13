/**
 * Normalizes Arabic text for flexible search:
 * - Removes diacritics (tashkeel)
 * - Normalizes Alef variations (أ, إ, آ, ٱ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Yaa / Alef Maksura (ى -> ي)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();
}

const SEARCH_ALIASES: Record<string, string> = {
  cib: 'COMI',
  we: 'ETEL',
  qnb: 'QNBE',
  mopco: 'MFPC',
  sidpec: 'SKPC',
  sodic: 'OCDI',
  hermes: 'HRHO',
  efg: 'HRHO',
  fawry: 'FWRY',
  efinance: 'EFIH',
  'e-finance': 'EFIH',
  talaat: 'TMGH',
  tmg: 'TMGH',
  elsewedy: 'SWDY',
  sewedy: 'SWDY',
  auto: 'GBCO',
  gb: 'GBCO',
  ghabbour: 'GBCO',
  mnhd: 'MASR',
  ekho: 'VLMRA',
  ekhoa: 'VLMRA',
  valu: 'VALU',
  edita: 'EFID',
  juhayna: 'JUFO',
  abuqir: 'ABUK',
  beltone: 'BTFH',
  qalaa: 'CCAP',
  eastern: 'EAST',
  amoc: 'AMOC',
  // Arabic common shorthand aliases
  'التجاري': 'COMI',
  'سي اي بي': 'COMI',
  'وي': 'ETEL',
  'المصريه للاتصالات': 'ETEL',
  'سوديك': 'OCDI',
  'هيرميس': 'HRHO',
  'هيرمس': 'HRHO',
  'موبكو': 'MFPC',
  'سيدبك': 'SKPC',
  'سيدي كرير': 'SKPC',
  'غبور': 'GBCO',
  'فاليو': 'VALU',
  'فوري': 'FWRY',
  'طلعت': 'TMGH',
  'السويدي': 'SWDY',
  'ابوقير': 'ABUK',
  'ابو قير': 'ABUK',
  'بلتون': 'BTFH',
  'القلعه': 'CCAP',
  'ايسترن': 'EAST',
  'الشرقيه للدخان': 'EAST',
  'اموك': 'AMOC',
  'ايديتا': 'EFID',
  'جهينه': 'JUFO',
  'النساجون': 'ORWE',
  'بالم هيلز': 'PHDC',
  'مدينه مصر': 'MASR',
  'مدينه نصر': 'MASR',
  'مصر الجديده': 'HELI',
  'المونيم': 'EGAL',
  'الالومنيوم': 'EGAL',
  'ابن سينا': 'ISPH',
  'راميدا': 'RMDA',
  'الحاويات': 'ALCN',
  'الومنيوم': 'EGAL',
  'اوراسكوم': 'ORAS',
  'طاقه': 'TAQA',
  'اي فاينانس': 'EFIH'
};

export interface SearchableStock {
  ticker: string;
  yahooTicker?: string;
  isin?: string;
  nameAr: string;
  nameEn: string;
  sectorAr?: string;
  sectorEn?: string;
  valueTraded?: number;
}

export function getSearchRelevanceScore(stock: SearchableStock, query: string): number {
  if (!query || !query.trim()) return 0;
  const rawQuery = query.trim().toLowerCase();
  const cleanQuery = rawQuery.replace(/\.ca$/i, '').replace(/^#/, '');
  const normQ = normalizeArabic(rawQuery);
  const normQNoAl = normQ.replace(/^ال/, '');
  const normQNoSpaces = normQ.replace(/[\s\-_]+/g, '');

  const normTicker = stock.ticker.toLowerCase();
  const normNameAr = normalizeArabic(stock.nameAr);
  const normNameArNoSpaces = normNameAr.replace(/[\s\-_]+/g, '');
  const normNameEn = (stock.nameEn || '').toLowerCase();
  const normIsin = (stock.isin || '').toLowerCase();
  const normSectorAr = normalizeArabic(stock.sectorAr || '');
  const normSectorEn = (stock.sectorEn || '').toLowerCase();

  // 1. Exact ticker match
  if (normTicker === cleanQuery) return 1000;

  // 2. Alias match (e.g., "CIB" -> COMI, "سوديك" -> OCDI, "AUTO" -> GBCO)
  const aliasTarget = SEARCH_ALIASES[cleanQuery] || SEARCH_ALIASES[normQ] || SEARCH_ALIASES[normQNoAl];
  if (aliasTarget && aliasTarget.toLowerCase() === normTicker) {
    return 950;
  }

  // 3. Ticker prefix or substring match
  if (normTicker.startsWith(cleanQuery)) return 880;
  if (cleanQuery.length >= 2 && normTicker.includes(cleanQuery)) return 760;

  // 4. ISIN match
  if (cleanQuery.length >= 3 && normIsin.includes(cleanQuery)) return 740;

  // 5. Name startsWith match
  if (normNameAr.startsWith(normQ) || normNameEn.startsWith(rawQuery)) return 710;
  if (normQNoAl.length >= 2 && normNameAr.replace(/^ال/, '').startsWith(normQNoAl)) return 680;

  // 6. Word boundary match in Arabic or English name
  const arWords = normNameAr.split(/[\s\-()]+/);
  if (arWords.some(w => w.startsWith(normQ) || (normQNoAl.length >= 2 && w.replace(/^ال/, '').startsWith(normQNoAl)))) {
    return 620;
  }
  const enWords = normNameEn.split(/[\s\-()]+/);
  if (enWords.some(w => w.startsWith(rawQuery))) {
    return 600;
  }

  // 7. Substring match in name
  if (
    normNameAr.includes(normQ) ||
    normNameArNoSpaces.includes(normQNoSpaces) ||
    normNameEn.includes(rawQuery) ||
    (normQNoAl.length >= 2 && normNameAr.includes(normQNoAl))
  ) {
    return 520;
  }

  // 8. Multi-token match (every token present somewhere in ticker/name/sector)
  const tokens = normQ.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const combined = `${normTicker} ${normNameAr} ${normNameEn} ${normSectorAr} ${normSectorEn}`;
    const allMatch = tokens.every(tok => {
      const tNoAl = tok.replace(/^ال/, '');
      return combined.includes(tok) || (tNoAl.length >= 2 && combined.includes(tNoAl));
    });
    if (allMatch) return 460;
  }

  // 9. Sector match
  if ((normQ.length >= 2 && normSectorAr.includes(normQ)) || (rawQuery.length >= 3 && normSectorEn.includes(rawQuery))) {
    return 320;
  }

  return 0;
}

export function searchMatchesStock(stock: SearchableStock, query: string): boolean {
  return getSearchRelevanceScore(stock, query) > 0;
}

export function rankSearchResults<T extends SearchableStock>(stocks: T[], query: string): T[] {
  if (!query || !query.trim()) return [];
  const scored: { stock: T; score: number }[] = [];
  for (const stock of stocks) {
    const score = getSearchRelevanceScore(stock, query);
    if (score > 0) {
      scored.push({ stock, score });
    }
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.stock.valueTraded || 0) - (a.stock.valueTraded || 0);
  });
  return scored.map(item => item.stock);
}
