import React, { useState } from 'react';
import { Sparkles, RefreshCw, ArrowUp } from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface BrandFooterProps {
  language?: 'ar' | 'en';
}

const INSPIRING_QUOTES = [
  {
    textAr: '«أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ» — قليلٌ متصل خيرٌ من كثيرٍ منقطع، فاصبر وأبشر.',
    textEn: '“The most beloved deeds to Allah are the most consistent, even if small.” Keep going.',
    authorAr: 'هديٌ نبويٌّ شريف',
  },
  {
    textAr: '«عَلَى قَدْرِ أَهْلِ العَزْمِ تَأْتِي العَزَائِمُ» — خطوتك الصادقة اليوم تصنع مجدك غداً بإذن الله.',
    textEn: '“Greatness comes in proportion to resolve.” Your honest step today builds tomorrow.',
    authorAr: 'أبو الطيب المتنبي',
  },
  {
    textAr: '«مَنْ بَارَكَ اللَّهُ لَهُ فِي وَقْتِهِ، أَنْجَزَ فِي السَّاعَةِ مَا لَا يُنْجِزُهُ غَيْرُهُ فِي أَيَّامٍ» — استعن بالله ولا تعجز.',
    textEn: '“When Allah blesses your time, an hour yields what days cannot.” Seek help in Allah.',
    authorAr: 'حكمة السلف',
  },
  {
    textAr: '«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ» — جدّد نيتك في كل عملٍ دنيوي لينقلب في ميزانك طاعةً وأجراً.',
    textEn: '“Actions are judged by intentions.” Renew your intention to elevate every daily task.',
    authorAr: 'قبس من النبوة',
  },
  {
    textAr: '«وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ» — كل جهدٍ تبذله اليوم محفوظٌ عند ربٍّ كريم.',
    textEn: '“Be patient, for Allah never wastes the reward of those who do good.”',
    authorAr: 'سورة هود • ١١٥',
  },
  {
    textAr: '«لَا تَسْتَوْحِشُوا طَرِيقَ الْحَقِّ لِقِلَّةِ السَّالِكِينَ» — ثباتك على وِردك وإنجازك هو الفوز الحقيقي.',
    textEn: '“Stay steadfast on the path of excellence; consistency is the true victory.”',
    authorAr: 'إشراقة إيمانية',
  },
];

export const BrandFooter: React.FC<BrandFooterProps> = ({ language = 'ar' }) => {
  const isAr = language === 'ar';
  const [quoteIdx, setQuoteIdx] = useState<number>(() => {
    const dayOfYear = Math.floor(Date.now() / 86400000);
    return dayOfYear % INSPIRING_QUOTES.length;
  });

  const activeQuote = INSPIRING_QUOTES[quoteIdx] || INSPIRING_QUOTES[0];

  const handleNextQuote = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setQuoteIdx((prev) => (prev + 1) % INSPIRING_QUOTES.length);
  };

  const handleScrollTop = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full pt-2 pb-4 select-none">
      <div className="max-w-3xl mx-auto">
        <div
          onClick={handleNextQuote}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNextQuote();
            }
          }}
          title={isAr ? 'اضغط لإشراقة وحكمة تشجيعية جديدة' : 'Tap for a new inspiring quote'}
          className="rounded-[24px] bg-[#141517] text-white px-4 py-3.5 border border-white/10 shadow-md flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#1eb814] to-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <p
                dir={isAr ? 'rtl' : 'ltr'}
                lang={isAr ? 'ar' : 'en'}
                className="text-sm sm:text-base font-bold text-amber-100 font-quran leading-[2.2] tashkeel-text"
              >
                {isAr ? activeQuote.textAr : activeQuote.textEn}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-[#bce8c2]">
                  ✦ {activeQuote.authorAr}
                </span>
                <span className="text-[10px] text-zinc-500">
                  • {isAr ? 'اضغط لتجديد الحكمة' : 'Tap for next'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextQuote();
              }}
              aria-label={isAr ? 'حكمة أخرى' : 'Next quote'}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleScrollTop();
              }}
              aria-label={isAr ? 'العودة لأعلى الصفحة' : 'Back to top'}
              title={isAr ? 'العودة لأعلى الصفحة' : 'Back to top'}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BrandFooter;
