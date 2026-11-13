export interface NewsItem {
  id: string;
  ticker: string;
  titleAr: string;
  titleEn: string;
  source: 'EGX' | 'Mubasher' | 'Enterprise' | 'CBE' | 'FRA';
  sourceUrl: string;
  publishedAt: string;
  isConfirmed: boolean;
  category: 'DISCLOSURE' | 'EARNINGS' | 'DIVIDEND' | 'ACQUISITION' | 'CONTRACT' | 'BOARD';
  categoryAr: string;
  impact: 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE';
  impactAr: string;
  impactHorizon: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM';
  summaryAr: string;
  significanceScore: number; // 1 to 10
}

export interface UpcomingEvent {
  id: string;
  ticker: string;
  eventNameAr: string;
  eventDate: string;
  category: 'EARNINGS' | 'AGM' | 'DIVIDEND_RECORD' | 'CAPITAL_INCREASE';
  status: 'CONFIRMED' | 'ESTIMATED';
  detailsAr: string;
}

export class NewsDisclosureService {
  private static MOCK_NEWS: NewsItem[] = [
    {
      id: "news-01",
      ticker: "COMI",
      titleAr: "البنك التجاري الدولي (CIB) يعلن نمواً قياسياً في الأرباح الصافية لتصل إلى 58.5 مليار جنيه",
      titleEn: "CIB Reports Record Surge in Net Profit Reaching EGP 58.5 Billion",
      source: "EGX",
      sourceUrl: "https://www.egx.com.eg",
      publishedAt: "2026-11-04 14:35",
      isConfirmed: true,
      category: "EARNINGS",
      categoryAr: "نتائج الأعمال والقوائم المالية المعتمدة",
      impact: "VERY_POSITIVE",
      impactAr: "إيجابي جداً",
      impactHorizon: "MEDIUM_TERM",
      summaryAr: "أظهرت القوائم المالية المجمعة للبنك التجاري الدولي تحقيق أرباح صافية تاريخية مدفوعة بارتفاع صافي الدخل من العائد وتوسع المحفظة الائتمانية للشركات والعمليات الدولية، مع الحفاظ على معدل كفاية رأسمال يتجاوز 26.8%.",
      significanceScore: 9.5
    },
    {
      id: "news-02",
      ticker: "TMGH",
      titleAr: "مجموعة طلعت مصطفى تحقق مبيعات تعاقدية غير مسبوقة تفوق 500 مليار جنيه بمشروعي ساوث ميد وبنان",
      titleEn: "TMG Achieves Record Contracted Sales Exceeding EGP 500 Billion in SouthMED and Banan",
      source: "EGX",
      sourceUrl: "https://www.egx.com.eg",
      publishedAt: "2026-11-06 10:15",
      isConfirmed: true,
      category: "DISCLOSURE",
      categoryAr: "إفصاح جوهري للبورصة المصرية",
      impact: "VERY_POSITIVE",
      impactAr: "إيجابي جداً",
      impactHorizon: "MEDIUM_TERM",
      summaryAr: "أعلنت المجموعة في إفصاح رسمي لإدارة البورصة المصرية عن تحقيق أرقام مبيعات تاريخية وغير مسبوقة في القطاع العقاري المصري والعربي بمشروع ساوث ميد بالساحل الشمالي وبنان بالمملكة العربية السعودية، ما يعزز التدفقات النقدية والأرباح للسنوات الخمس المقبلة.",
      significanceScore: 10
    },
    {
      id: "news-03",
      ticker: "SWDY",
      titleAr: "السويدي إليكتريك تبرم عقود توريد وحلول طاقة جديدة بالخليج العربي وأفريقيا بقيمة 420 مليون دولار",
      titleEn: "Elsewedy Electric Secures USD 420M Energy & Cable Contracts in GCC and Africa",
      source: "Mubasher",
      sourceUrl: "https://www.mubasher.info",
      publishedAt: "2026-11-05 09:40",
      isConfirmed: true,
      category: "CONTRACT",
      categoryAr: "عقود وتوسعات تجارية دولية",
      impact: "POSITIVE",
      impactAr: "إيجابي",
      impactHorizon: "SHORT_TERM",
      summaryAr: "أبرمت شركة السويدي إليكتريك عبر شركاتها التابعة حزمة عقود جديدة لتوريد كابلات الجهد الفائق ومحولات الطاقة وشبكات الربط الكهربائي بالدولار، مما يرفع رصيد الأعمال المتراكمة ويدعم هوامش الربحية الدولية.",
      significanceScore: 8.5
    },
    {
      id: "news-04",
      ticker: "ETEL",
      titleAr: "المصرية للاتصالات تتلقى عوائد توزيعات نقدية تفوق 4.5 مليار جنيه من حصتها في فودافون مصر",
      titleEn: "Telecom Egypt Receives Over EGP 4.5 Billion Dividends from Vodafone Egypt Stake",
      source: "Enterprise",
      sourceUrl: "https://enterprise.press",
      publishedAt: "2026-11-02 11:20",
      isConfirmed: true,
      category: "DIVIDEND",
      categoryAr: "توزيعات نقدية واستثمارات",
      impact: "POSITIVE",
      impactAr: "إيجابي",
      impactHorizon: "SHORT_TERM",
      summaryAr: "صرحت الشركة بحصولها على حصتها في التوزيعات النقدية المقررة من فودافون مصر، مما يسهم مباشرة في خفض معدلات صافي الدين وتعزيز التدفقات النقدية الحرة للشركة الأم.",
      significanceScore: 8.0
    },
    {
      id: "news-05",
      ticker: "MFPC",
      titleAr: "موبكو تعلن استقرار كامل إمدادات الغاز الطبيعي لمصانعها في دمياط وعودة التصدير بالطاقة القصوى",
      titleEn: "MOPCO Announces Full Stability of Natural Gas Feedstock and Maximum Production",
      source: "EGX",
      sourceUrl: "https://www.egx.com.eg",
      publishedAt: "2026-11-01 13:10",
      isConfirmed: true,
      category: "DISCLOSURE",
      categoryAr: "إفصاح تشغيلي",
      impact: "VERY_POSITIVE",
      impactAr: "إيجابي جداً",
      impactHorizon: "SHORT_TERM",
      summaryAr: "أكدت شركة مصر لإنتاج الأسمدة (موبكو) انتظام واستدامة ضخ إمدادات الغاز الطبيعي اللازم لتشغيل مجمعات الأمونيا واليوريا بكامل طاقتها الإنتاجية والتصديرية، مما يدعم هوامش الربحية والتوزيعات النقدية.",
      significanceScore: 8.8
    },
    {
      id: "news-06",
      ticker: "FWRY",
      titleAr: "فوري تعلن نمو حجم المعاملات بنسبة 68% وتوسع خدمات الإقراض الرقمي والتمويل الأصغر",
      titleEn: "Fawry Transaction Volume Surges 68% Driven by Microfinance & Digital Banking",
      source: "Mubasher",
      sourceUrl: "https://www.mubasher.info",
      publishedAt: "2026-10-28 15:00",
      isConfirmed: true,
      category: "EARNINGS",
      categoryAr: "نتائج أعمال ومؤشرات نمو",
      impact: "POSITIVE",
      impactAr: "إيجابي",
      impactHorizon: "MEDIUM_TERM",
      summaryAr: "سجلت منصة فوري للمدفوعات الرقمية قفزة في إجمالي قيم العمليات المنفذة وقاعدة العملاء النشطين وتضاعف أرباح قطاع التمويل الاستهلاكي متناهي الصغر (فوري للتمويل).",
      significanceScore: 7.9
    }
  ];

  private static MOCK_EVENTS: UpcomingEvent[] = [
    {
      id: "ev-1",
      ticker: "COMI",
      eventNameAr: "اجتماع الجمعية العامة العادية للموافقة على التوزيعات النقدية المقترحة",
      eventDate: "2026-12-15",
      category: "AGM",
      status: "CONFIRMED",
      detailsAr: "مناقشة مقترح مجلس الإدارة بتوزيع 7.00 جنيه للسهم عن أرباح العام"
    },
    {
      id: "ev-2",
      ticker: "TMGH",
      eventNameAr: "الإعلان عن نتائج الأعمال الختامية المدققة للسنة المالية",
      eventDate: "2026-12-28",
      category: "EARNINGS",
      status: "ESTIMATED",
      detailsAr: "تسجيل الإيرادات المحققة من تسليمات الوحدات العقارية وطفرة إيرادات الفنادق بالدولار"
    },
    {
      id: "ev-3",
      ticker: "SWDY",
      eventNameAr: "تاريخ استحقاق التوزيع النقدي المؤقت لكوبون السهم",
      eventDate: "2026-12-05",
      category: "DIVIDEND_RECORD",
      status: "CONFIRMED",
      detailsAr: "صرف الكوبون النقدي للمساهمين حاملي السهم حتى نهاية جلسة التداول المقررة"
    }
  ];

  public static getNewsForTicker(_ticker: string): NewsItem[] { return []; }
  public static getAllNews(): NewsItem[] { return []; }
  public static getUpcomingEvents(_ticker?: string): UpcomingEvent[] { return []; }
}