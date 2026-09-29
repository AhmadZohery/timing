import React from 'react';
import { ExternalLink, ShieldCheck, Zap, Sparkles, Heart } from 'lucide-react';

interface BrandFooterProps {
  language?: 'ar' | 'en';
}

export const BrandFooter: React.FC<BrandFooterProps> = ({ language = 'ar' }) => {
  const isAr = language === 'ar';

  return (
    <footer className="w-full mt-10 pt-8 pb-12 border-t border-slate-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-100/80 dark:via-zinc-950/40 dark:to-zinc-900/60 backdrop-blur-xs transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center space-y-6">
        
        {/* Brand & Subdomain Header Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-black tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>{isAr ? 'منظومة مِضمار المتكاملة • Midmar LifeOS' : 'Midmar Life Operating System'}</span>
          </div>

          <a
            href="https://fikradm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-emerald-600 dark:hover:bg-emerald-400 dark:hover:text-zinc-950 text-xs font-black transition-all active:scale-95 shadow-xs cursor-pointer group"
          >
            <span>FikraDM.com</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Feature & Security Badges Deck */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'خصوصية مطلقة وتشفير محلي (Local-First)' : 'Local-First Privacy & Encryption'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAr ? 'جاهز للعمل بدون إنترنت (Offline PWA)' : 'PWA & Offline Ready'}</span>
          </div>
        </div>

        {/* Official Royal Copyright Line */}
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200">
            {isAr ? (
              <>
                كافة الحقوق محفوظة © {new Date().getFullYear()} لمؤسسة{' '}
                <a
                  href="https://fikradm.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 font-black hover:underline cursor-pointer"
                >
                  فكرة دي إم (FikraDM.com)
                </a>
              </>
            ) : (
              <>
                All Rights Reserved © {new Date().getFullYear()} by{' '}
                <a
                  href="https://fikradm.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 font-black hover:underline cursor-pointer"
                >
                  FikraDM.com
                </a>
              </>
            )}
          </p>
          
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-1.5">
            <span>
              {isAr
                ? 'صُممت المنظومة وطُوّرت بعناية فائقة لتعزيز الإنتاجية والانضباط والإيقاع الحيوي'
                : 'Designed and crafted for peak productivity, discipline & circadian mastery'}
            </span>
            <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500/20" />
          </p>
        </div>

      </div>
    </footer>
  );
};

export default BrandFooter;
