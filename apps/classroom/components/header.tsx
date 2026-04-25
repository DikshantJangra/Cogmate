'use client';

import {
  Settings,
  Sun,
  Moon,
  Monitor,
  ArrowLeft,
  Loader2,
  Download,
  FileDown,
  Package,
} from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { useTheme } from '@/lib/hooks/use-theme';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStageStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { SettingsDialog } from '@/components/settings';
import { LanguageSwitcher } from './language-switcher';

export function Header({ currentSceneTitle }: { readonly currentSceneTitle: string }) {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { canExport, exportPPTX, exportResourcePack, isExporting, isExportingZip } = useStageStore();

  const [themeOpen, setThemeOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const themeRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportMenuOpen(false);
  }, []);

  useEffect(() => {
    if (themeOpen || exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [themeOpen, exportMenuOpen, handleClickOutside]);

  return (
    <>
      <header className="h-12 px-6 flex items-center justify-between z-10 bg-transparent gap-3 shrink-0 mt-3 mb-1">
        {/* Left: nav + title */}
        <div className="flex items-center gap-3 min-w-0 flex-1 bg-white px-4 h-full rounded-xl border border-slate-100 shadow-lg shadow-slate-200/30">
          <button
            onClick={() => router.push('/')}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
            title={t('generation.backToHome')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-slate-100" />
          <h1
            className="text-xs font-black text-slate-900 tracking-tight truncate uppercase"
            suppressHydrationWarning
          >
            {currentSceneTitle || t('common.loading')}
          </h1>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1 px-2 h-full rounded-xl border border-slate-100 shrink-0 bg-white shadow-lg shadow-slate-200/30">
          {/* Theme Selector */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-90"
            >
              {theme === 'light' && <Sun className="w-3.5 h-3.5" />}
              {theme === 'dark' && <Moon className="w-3.5 h-3.5" />}
              {theme === 'system' && <Monitor className="w-3.5 h-3.5" />}
            </button>
            {themeOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden z-50 min-w-[140px] p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setThemeOpen(false); }}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2',
                      theme === t ? 'bg-slate-900 text-white' : 'text-slate-400',
                    )}
                  >
                    {t === 'light' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-90"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Export */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => {
              if (canExport && !isExporting && !isExportingZip) setExportMenuOpen(!exportMenuOpen);
            }}
            disabled={!canExport || isExporting || isExportingZip}
            className={cn(
              'shrink-0 h-full px-4 rounded-xl transition-all flex items-center justify-center gap-2 border shadow-lg active:scale-95',
              canExport && !isExporting && !isExportingZip
                ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                : 'bg-white border-slate-100 text-slate-200 cursor-not-allowed shadow-none',
            )}
          >
            {isExporting || isExportingZip ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Export</span>
              </>
            )}
          </button>

          {exportMenuOpen && (
            <div className="absolute top-full mt-2 right-0 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden z-50 min-w-[160px] p-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => { exportPPTX(); setExportMenuOpen(false); }}
                className="w-full px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 text-slate-600"
              >
                <FileDown className="w-3.5 h-3.5" /> PowerPoint
              </button>
              <button
                onClick={() => { exportResourcePack(); setExportMenuOpen(false); }}
                className="w-full px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 text-slate-600"
              >
                <Package className="w-3.5 h-3.5" /> Resource Pack
              </button>
            </div>
          )}
        </div>
      </header>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
