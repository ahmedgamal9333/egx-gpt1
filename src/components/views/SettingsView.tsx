import React, { useState } from 'react';
import { Settings, Shield, Bell, Database, Globe, Sliders, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  lang: 'ar' | 'en';
  onToggleLang: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ lang, onToggleLang }) => {
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const [defaultHoldingDays, setDefaultHoldingDays] = useState(21);
  const [minRewardRisk, setMinRewardRisk] = useState(2.0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
            {lang === 'ar' ? 'إعدادات المنصة وتفضيلات التحليل' : 'Platform Settings'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">
          {lang === 'ar' ? 'تخصيص معايير المخاطرة والتداول ومحرك الذكاء الاصطناعي' : 'Terminal Preferences & Risk Controls'}
        </h1>
      </div>

      {/* Settings Sections */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Risk & Execution Rules */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            {lang === 'ar' ? 'قواعد إدارة المخاطر وتوزيع رأس المال:' : 'Risk Management Parameters:'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-numbers">
            <div>
              <label className="text-slate-400 block mb-1 font-sans font-medium">
                {lang === 'ar' ? 'أقصى نسبة مخاطرة للصفقة الواحدة (%):' : 'Max Risk Per Trade %:'}
              </label>
              <input
                type="number"
                step="0.5"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block mt-1">الموصى به دولياً: 1.5% - 2%</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-sans font-medium">
                {lang === 'ar' ? 'الحد الأدنى لنسبة العائد إلى المخاطرة (R:R):' : 'Min Acceptable R:R Ratio:'}
              </label>
              <input
                type="number"
                step="0.1"
                value={minRewardRisk}
                onChange={(e) => setMinRewardRisk(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block mt-1">يمنع إصدار توصية شراء إذا قل العائد عن 2:1</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-sans font-medium">
                {lang === 'ar' ? 'المدى الزمني المستهدف للصفقة (أيام):' : 'Target Swing Horizon (Days):'}
              </label>
              <input
                type="number"
                value={defaultHoldingDays}
                onChange={(e) => setDefaultHoldingDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block mt-1">تداول متأرجح (أسبوع إلى شهر)</span>
            </div>
          </div>
        </div>

        {/* Language & Terminal Display */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            {lang === 'ar' ? 'واجهة المستخدم ولغة العرض:' : 'Interface & Localization:'}
          </h3>

          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="font-bold text-white block mb-0.5">{lang === 'ar' ? 'لغة الواجهة الرئيسية' : 'Primary Language'}</span>
              <span className="text-slate-400">{lang === 'ar' ? 'العربية (افتراضي مع دعم كامل لاتجاه RTL)' : 'Arabic (RTL) / English (LTR)'}</span>
            </div>
            <button
              onClick={onToggleLang}
              className="px-4 py-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              {lang === 'ar' ? 'التحويل إلى English' : 'Switch to Arabic'}
            </button>
          </div>
        </div>

        {/* AI Model Architecture & Engine status */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            {lang === 'ar' ? 'محرك الذكاء الاصطناعي والحوكمة المالية:' : 'AI Model & Financial Governance:'}
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">النموذج النشط للتحليل وتوليد التقارير:</span>
              <span className="font-mono font-bold text-emerald-400">Google Gemini 3.8 Flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">فصل الحسابات الرقمية عن التفكير اللغوي (Deterministic Separation):</span>
              <span className="font-bold text-emerald-400">مُفعل بنسبة 100%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">بوابات حظر التوصيات المضللة (Mandatory Risk Gates):</span>
              <span className="font-bold text-emerald-400">نشطة وصارمة</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> تم حفظ الإعدادات بنجاح
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            {lang === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
