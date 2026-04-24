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
    if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
      setThemeOpen(false);
    }
    if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
      setExportMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (themeOpen || exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [themeOpen, exportMenuOpen, handleClickOutside]);

  return (
    <>
      <header className="h-12 px-6 flex items-center justify-between z-10 bg-transparent gap-3 shrink-0 mt-3 mb-1">
        <div className="flex items-center gap-3 min-w-0 flex-1 bg-white px-4 h-full rounded-xl border border-slate-100 shadow-lg shadow-slate-200/30">
          <button
            onClick={() => router.push('/')}
            className="shrink-0 p-1.5 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
            title={t('generation.backToHome')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-slate-100 mx-0.5" />
          <div className="flex flex-col min-w-0">
            <h1
              className="text-xs font-black text-slate-900 tracking-tight truncate uppercase"
              suppressHydrationWarning
            >
              {currentSceneTitle || t('common.loading')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 h-full rounded-xl border border-slate-100 shrink-0 bg-white shadow-lg shadow-slate-200/30">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live</span>
          </div>

          <div className="w-px h-4 bg-slate-100" />

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
                <button
                  onClick={() => { setTheme('light'); setThemeOpen(false); }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2',
                    theme === 'light' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400',
                  )}
                >
                  <Sun className="w-3 h-3" /> Light
                </button>
                <button
                  onClick={() => { setTheme('dark'); setThemeOpen(false); }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2',
                    theme === 'dark' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400',
                  )}
                >
                  <Moon className="w-3 h-3" /> Dark
                </button>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-90"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Export Button - Compact */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => {
              if (canExport && !isExporting && !isExportingZip) setExportMenuOpen(!exportMenuOpen);
            }}
            disabled={!canExport || isExporting || isExportingZip}
            className={cn(
              'shrink-0 h-full px-4 rounded-xl transition-all flex items-center justify-center gap-2 border shadow-lg active:scale-95',
              canExport && !isExporting && !isExportingZip
                ? 'bg-slate-900 border-slate-900 text-white'
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
        </div>
      </header>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
