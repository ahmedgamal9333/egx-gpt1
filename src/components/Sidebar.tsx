import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  Filter,
  BarChart3,
  Newspaper,
  PieChart,
  Briefcase,
  Star,
  History,
  TestTube2,
  Database,
  Settings,
  X,
  TrendingUp,
  MessageSquareText
} from 'lucide-react';

export type ActiveTab =
  | 'DASHBOARD'
  | 'AI_CHAT'
  | 'MARKET'
  | 'SCREENER'
  | 'ANALYSIS'
  | 'NEWS'
  | 'SECTORS'
  | 'PORTFOLIO'
  | 'WATCHLIST'
  | 'HISTORY'
  | 'BACKTEST'
  | 'SOURCES'
  | 'SETTINGS';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  marketOverview?: any;
  lang?: 'ar' | 'en';
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  marketOverview,
  lang = 'ar',
  isMobileOpen = false,
  onCloseMobile
}) => {
  const egx30Chg = marketOverview?.egx30?.changePct ?? -0.91;
  const egx30Badge = egx30Chg >= 0 ? `+${egx30Chg}%` : `${egx30Chg}%`;

  const navItems = [
    {
      id: 'DASHBOARD' as ActiveTab,
      labelAr: 'لوحة القيادة',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'النبض'
    },
    {
      id: 'AI_CHAT' as ActiveTab,
      labelAr: 'المحلل الحواري الذكي',
      labelEn: 'AI Analyst Chat',
      icon: MessageSquareText,
      badge: 'AI Chat'
    },
    {
      id: 'MARKET' as ActiveTab,
      labelAr: 'السوق المصري EGX',
      labelEn: 'Egyptian Market',
      icon: LineChart,
      badge: egx30Badge
    },
    {
      id: 'SCREENER' as ActiveTab,
      labelAr: 'الماسح الذكي للأسهم',
      labelEn: 'AI Stock Screener',
      icon: Filter,
      badge: 'فلتر'
    },
    {
      id: 'ANALYSIS' as ActiveTab,
      labelAr: 'تحليل السهم المفصل',
      labelEn: 'Detailed Stock Analysis',
      icon: BarChart3,
      badge: 'عميق'
    },
    {
      id: 'NEWS' as ActiveTab,
      labelAr: 'الأخبار والإفصاحات',
      labelEn: 'News & Disclosures',
      icon: Newspaper,
      badge: 'لحظي'
    },
    {
      id: 'SECTORS' as ActiveTab,
      labelAr: 'تحليل القطاعات',
      labelEn: 'Sector Intelligence',
      icon: PieChart
    },
    {
      id: 'PORTFOLIO' as ActiveTab,
      labelAr: 'إدارة المحفظة',
      labelEn: 'Portfolio Management',
      icon: Briefcase,
      badge: 'AI Advisor'
    },
    {
      id: 'WATCHLIST' as ActiveTab,
      labelAr: 'قائمة المراقبة والتنبيهات',
      labelEn: 'Watchlist & Alerts',
      icon: Star
    },
    {
      id: 'HISTORY' as ActiveTab,
      labelAr: 'سجل التوصيات وتدقيق الأداء',
      labelEn: 'Recommendation History',
      icon: History,
      badge: 'Win 87%'
    },
    {
      id: 'BACKTEST' as ActiveTab,
      labelAr: 'محرك الاختبار التاريخي',
      labelEn: 'Backtesting Engine',
      icon: TestTube2
    },
    {
      id: 'SOURCES' as ActiveTab,
      labelAr: 'مصادر البيانات وجودتها',
      labelEn: 'Data Sources & Quality',
      icon: Database,
      badge: '99%'
    },
    {
      id: 'SETTINGS' as ActiveTab,
      labelAr: 'الإعدادات والخيارات',
      labelEn: 'Settings',
      icon: Settings
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] right-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-57px)] w-72 lg:w-64 bg-slate-950 border-l border-slate-800/90 flex flex-col justify-between p-3.5 overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMobileOpen
            ? 'translate-x-0 shadow-2xl'
            : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-1">
          {/* Mobile Header with close button */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 lg:hidden">
            <span className="font-bold text-sm text-white">
              {lang === 'ar' ? 'القائمة الرئيسية' : 'Menu Navigation'}
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {lang === 'ar' ? 'منصة القرار الاستثماري' : 'Navigation Platform'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  />
                  <span>{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info Box */}
        <div className="pt-3 border-t border-slate-800/80 px-1 text-xs text-slate-400 mt-4">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
              <span className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                {marketOverview?.marketStatusAr
                  ? (lang === 'ar' ? marketOverview.marketStatusAr.split('(')[0].trim() : 'Market Active')
                  : (lang === 'ar' ? 'السوق نشط' : 'Market Active')}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              {lang === 'ar'
                ? `تغطية شاملة لـ ${marketOverview?.totalListedStocksCount || 260} سهماً مدرجاً بمصادر حية وموثقة.`
                : `Full ${marketOverview?.totalListedStocksCount || 260} EGX stock coverage with live validated feeds.`}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
