import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  BookOpen,
  Volume2,
  Copy,
  Check,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Feather,
  X,
} from 'lucide-react';
import { CLASSICAL_ARABIC_POETRY, type ClassicalPoemItem } from '../../data/arabicPoetryData';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface ArabicPoetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
}

export const ArabicPoetryModal: React.FC<ArabicPoetryModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [expandedPoemId, setExpandedPoemId] = useState<string | null>(CLASSICAL_ARABIC_POETRY[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('midmar_poetry_bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  const themes = useMemo(() => [
    { id: 'all', label: isAr ? 'جميع الأبيات' : 'All Verses', icon: '📜' },
    { id: 'عزة النفس والهمة', label: isAr ? 'عزة النفس والهمة' : 'Pride & Resolve', icon: '🦅' },
    { id: 'الحكمة والصبر', label: isAr ? 'الحكمة والصبر' : 'Wisdom & Patience', icon: '🌊' },
    { id: 'الشجاعة والمروءة', label: isAr ? 'الشجاعة والمروءة' : 'Courage & Chivalry', icon: '🛡️' },
    { id: 'الاجتهاد وطلب العلم', label: isAr ? 'الاجتهاد وطلب العلم' : 'Striving & Mastery', icon: '🌟' },
    { id: 'القناعة والزهد', label: isAr ? 'القناعة والزهد' : 'Contentment', icon: '🕊️' },
    { id: 'الوفاء والصداقة', label: isAr ? 'الوفاء والصداقة' : 'Loyalty & Grace', icon: '🌿' },
  ], [isAr]);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredPoems = useMemo(() => {
    return CLASSICAL_ARABIC_POETRY.filter((item) => {
      const matchTheme = selectedTheme === 'all' || item.theme === selectedTheme;
      const query = deferredSearchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        item.verse.toLowerCase().includes(query) ||
        item.poet.toLowerCase().includes(query) ||
        item.explanation.toLowerCase().includes(query) ||
        item.vocabularyBreakdown.some((v) => v.word.includes(query) || v.meaning.includes(query));
      return matchTheme && matchSearch;
    });
  }, [selectedTheme, deferredSearchQuery]);

  const toggleBookmark = (id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('midmar_poetry_bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleCopy = (poem: ClassicalPoemItem) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const textToCopy = `«${poem.verse}»\n— ${poem.poet} (${poem.era})\n\n💡 الحكمة: ${poem.wisdomTakeaway}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(poem.id);
    onRewardToast?.(isAr ? '📋 تم نسخ البيت مع الحكمة بنجاح!' : 'Poem & wisdom copied!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSpeak = (poem: ClassicalPoemItem) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    speechService.speak(poem.verse, 'ar-SA', 0.9);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#12131A] border border-amber-300/40 dark:border-amber-500/20 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-amber-200/50 dark:border-white/[0.08] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shadow-xs">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100 font-serif">
                  {isAr ? 'ديوان الحكمة والشعر العربي المشروح' : 'Classical Arabic Poetry & Wisdom Diwan'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                  {filteredPoems.length} {isAr ? 'بيتاً محققاً' : 'Verses'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'عيون الشعر التليد، تفكيك المفردات اللغوية الصعبة، والدروس العملية لحياتك اليومية'
                  : 'Masterpiece classical verses with word roots, context, and life takeaways'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              speechService.stop();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Themes Filter */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-white/[0.06] space-y-3 bg-slate-50/50 dark:bg-zinc-900/30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن بيت، شاعر (المتنبي، الشافعي)، أو كلمة معينة...' : 'Search verse, poet, or keyword...'}
              className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Theme Badges Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {themes.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setSelectedTheme(th.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                  selectedTheme === th.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-amber-400'
                }`}
              >
                <span>{th.icon}</span>
                <span>{th.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Poems List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredPoems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">{isAr ? 'لم نجد أبياتاً مطابقة لبحثك' : 'No verses found'}</p>
            </div>
          ) : (
            filteredPoems.map((item) => {
              const isExpanded = expandedPoemId === item.id;
              const isBookmarked = bookmarkedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-amber-200/70 dark:border-white/[0.08] bg-white dark:bg-zinc-900/60 p-4 sm:p-5 shadow-xs transition-all hover:border-amber-300/80"
                >
                  {/* Top Meta Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/50">
                        {item.themeIcon} {item.theme}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold">
                        {item.poet} • {item.era}
                      </span>
                      {item.meter && (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 hidden sm:inline">
                          [{item.meter}]
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSpeak(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                        title={isAr ? 'استمع للإلقاء الصوتي' : 'Listen'}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        title={isAr ? 'نسخ البيت' : 'Copy'}
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isBookmarked
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-slate-400 hover:text-amber-600'
                        }`}
                        title={isAr ? 'حفظ في المفضلة' : 'Bookmark'}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Poetic Verse with Tashkeel & Dignified Typography */}
                  <div className="text-center py-4 px-3 bg-gradient-to-b from-amber-50/40 to-transparent dark:from-white/[0.02] rounded-2xl border border-amber-100/60 dark:border-white/[0.04] mb-3">
                    <p className="text-base sm:text-xl font-bold font-serif text-slate-900 dark:text-amber-100 poetic-calligraphy whitespace-pre-line select-text">
                      {item.verse}
                    </p>
                    {item.meterMnemonic && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300">
                        <span className="opacity-75">{isAr ? 'عروض البحر:' : 'Meter Rhythm:'}</span>
                        <span>{item.meterMnemonic}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Life Takeaway Banner */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-start gap-2 text-xs text-emerald-950 dark:text-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="font-medium leading-relaxed">
                      <span className="font-bold">{isAr ? 'الحكمة لواقعك:' : 'Life Takeaway:'}</span> {item.wisdomTakeaway}
                    </p>
                  </div>

                  {/* Toggle Detailed Breakdown Button */}
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setExpandedPoemId(isExpanded ? null : item.id);
                    }}
                    className="mt-3 w-full py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? (isAr ? 'إخفاء الشرح والمفردات اللغوية' : 'Hide details') : (isAr ? 'عرض تفكيك المفردات وشرح السياق' : 'Show vocabulary & context')}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Expanded Linguistic Breakdown & Context */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-3 animate-fade-in text-xs">
                      {/* Context Explanation */}
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-zinc-200 mb-1 flex items-center gap-1">
                          <span>📖</span>
                          <span>{isAr ? 'شرح المعنى والسياق:' : 'Context & Meaning:'}</span>
                        </h4>
                        <p className="text-slate-600 dark:text-zinc-300 leading-relaxed ps-5">
                          {item.explanation}
                        </p>
                      </div>

                      {/* Vocabulary Breakdown Grid */}
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-zinc-200 mb-1.5 flex items-center gap-1">
                          <span>🔍</span>
                          <span>{isAr ? 'معاني المفردات اللغوية في المعجم:' : 'Vocabulary Root Breakdown:'}</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ps-2">
                          {item.vocabularyBreakdown.map((vocab, vIdx) => (
                            <div
                              key={vIdx}
                              className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60"
                            >
                              <span className="font-bold text-amber-700 dark:text-amber-400 font-serif text-sm">
                                {vocab.word}
                              </span>
                              <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-0.5">
                                {vocab.meaning}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
