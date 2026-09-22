import React from 'react';
import { Smartphone, PlusSquare, Share, CheckCircle2, X, Sparkles } from 'lucide-react';
import type { PwaInstallState } from '../../hooks/usePwaInstall';

interface AddToHomeScreenModalProps {
  pwaState: PwaInstallState;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToHomeScreenModal: React.FC<AddToHomeScreenModalProps> = ({
  pwaState,
  isOpen,
  onClose,
}) => {
  if (!isOpen || pwaState.isStandalone) return null;

  const handleInstallClick = async () => {
    if (pwaState.isInstallable) {
      const success = await pwaState.promptInstall();
      if (success) {
        onClose();
      }
    }
  };

  const handleAlreadyInstalled = () => {
    pwaState.markAsInstalled();
    onClose();
  };

  const handleDismissLater = () => {
    pwaState.dismissForLater(7);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div 
        className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all max-h-[92vh] flex flex-col"
        dir="rtl"
      >
        {/* Mobile Pull Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header with Close */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              تجربة مستخدم أسرع وأسلس
            </span>
          </div>
          <button
            onClick={handleDismissLater}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="إغلاق مؤقت"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 pb-6 pt-2 overflow-y-auto space-y-5">
          {/* App Icon Presentation */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-500 p-1 shadow-xl shadow-emerald-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex flex-col items-center justify-center">
                  <span className="text-2xl">⚡</span>
                  <span className="text-[11px] font-black tracking-tight text-slate-800 dark:text-white mt-0.5">مضمار</span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              أضف أيقونة «مضمار» لشاشتك الرئيسية
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed max-w-xs">
              لفتح التطبيق فوراً بشاشة كاملة مثل التطبيقات الأصلية، مع سرعة فائقة وعمل كامل بدون إنترنت!
            </p>
          </div>

          {/* iOS Specific Instructions */}
          {pwaState.isIos ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span>خطوتان سريعتان في متصفح Safari:</span>
              </div>
              <div className="space-y-2.5 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-start gap-2.5 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <div>
                    اضغط على زر المشاركة <Share className="inline w-3.5 h-3.5 mx-1 text-sky-600" /> في شريط سفاري السفلي.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <div>
                    مرر لأسفل القائمة واضغط على <span className="font-bold underline text-amber-900 dark:text-amber-200">«إضافة إلى الصفحة الرئيسية»</span> <PlusSquare className="inline w-3.5 h-3.5 mx-1 text-slate-700 dark:text-slate-300" />.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Chrome Direct 1-Tap Install */
            pwaState.isInstallable && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-98 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>تثبيت الأيقونة الآن بضغطة واحدة</span>
              </button>
            )
          )}

          {/* Action Buttons: Never Ask Again / Dismiss */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleAlreadyInstalled}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>لدي الأيقونة بالفعل على الشاشة (عدم السؤال ثانية)</span>
            </button>

            <button
              onClick={handleDismissLater}
              className="w-full py-2 px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-medium transition-colors"
            >
              تذكيري لاحقاً بعد أسبوع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
