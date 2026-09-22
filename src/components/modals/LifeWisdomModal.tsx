import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  Brain,
  Search,
  Bookmark,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import { LIFE_WISDOM_ITEMS, type LifeWisdomItem } from '../../data/lifeWisdomData';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface LifeWisdomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
}

export const LifeWisdomModal: React.FC<LifeWisdomModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(LIFE_WISDOM_ITEMS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('midmar_wisdom_bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  const categories = useMemo(() => [
    { id: 'all', label: isAr ? 'جميع المعارف' : 'All Knowledge', icon: '🧠' },
    { id: 'mental_models', label: isAr ? 'نماذج التفكير' : 'Mental Models', icon: '⚖️' },
    { id: 'productivity_decisions', label: isAr ? 'الإنتاجية والقرارات' : 'Productivity & Time', icon: '⏳' },
    { id: 'health_body', label: isAr ? 'علوم الجسد والصحة' : 'Body & Health', icon: '🫁' },
    { id: 'psychology_relations', label: isAr ? 'علم النفس والعلاقات' : 'Psychology & Relations', icon: '🧘' },
  ], [isAr]);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredItems = useMemo(() => {
    return LIFE_WISDOM_ITEMS.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const query = deferredSearchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        item.titleAr.toLowerCase().includes(query) ||
        item.titleEn.toLowerCase().includes(query) ||
        item.summaryAr.toLowerCase().includes(query) ||
        item.detailedExplanationAr.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query));
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, deferredSearchQuery]);

  const toggleBookmark = (id: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('midmar_wisdom_bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleCopy = (item: LifeWisdomItem) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const textToCopy = `💡 ${item.titleAr} (${item.titleEn})\n\n«${item.summaryAr}»\n\n📌 الخطوة العملية: ${item.practicalActionAr}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    onRewardToast?.(isAr ? '📋 تم نسخ النموذج المعرفي بنجاح!' : 'Mental model copied!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#12131A] border border-cyan-300/40 dark:border-cyan-500/20 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-cyan-200/50 dark:border-white/[0.08] bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-lg shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                  {isAr ? 'خزانة النماذج الفكرية والمعارف الحياتية' : 'Mental Models & Life Wisdom Vault'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400/40">
                  {filteredItems.length} {isAr ? 'مبدأ ونموذج' : 'Models'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'قوانين التفكير، إدارة الوقت، علوم الجسد، والإسعافات الأولية التي تفيدك في حياتك اليومية'
                  : 'Actionable mental models, time laws, and practical life hacks'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-white/[0.06] space-y-3 bg-slate-50/50 dark:bg-zinc-900/30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن نموذج (باريتو، باركنسون، تنفس، نوم، قرار)...' : 'Search models, rules, or health hacks...'}
              className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-cyan-400'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
              <Brain className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">{isAr ? 'لم نجد معارف مطابقة لبحثك' : 'No items found'}</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              const isBookmarked = bookmarkedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-cyan-200/70 dark:border-white/[0.08] bg-white dark:bg-zinc-900/60 p-4 sm:p-5 shadow-xs transition-all hover:border-cyan-400/80"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300/50">
                        {item.icon} {item.categoryLabelAr}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold">
                        {item.titleEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors"
                        title={isAr ? 'نسخ الفكرة' : 'Copy'}
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isBookmarked
                            ? 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40'
                            : 'text-slate-400 hover:text-cyan-600'
                        }`}
                        title={isAr ? 'حفظ في المفضلة' : 'Bookmark'}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Core Summary */}
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
                      {item.titleAr}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                      {item.summaryAr}
                    </p>
                  </div>

                  {/* Practical Action Banner */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/30 dark:to-teal-950/10 border border-emerald-300/60 dark:border-emerald-700/50 flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200">
                    <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">{isAr ? 'التطبيق العملي اليوم:' : 'Action:'} </span>
                      {item.practicalActionAr}
                    </p>
                  </div>

                  {/* Toggle Detailed Explanation */}
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setExpandedId(isExpanded ? null : item.id);
                    }}
                    className="mt-3 w-full py-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? (isAr ? 'إخفاء الشرح والمثال' : 'Hide details') : (isAr ? 'عرض الشرح المتعمق ومثال واقعي' : 'Show deep explanation & example')}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Expanded Explanation */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5 text-xs animate-fade-in">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-zinc-200 mb-1 flex items-center gap-1">
                          <span>🔍</span>
                          <span>{isAr ? 'الشرح العلمي والمنطقي:' : 'Deep Explanation:'}</span>
                        </h4>
                        <p className="text-slate-600 dark:text-zinc-300 leading-relaxed ps-5">
                          {item.detailedExplanationAr}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200/70 dark:border-zinc-700/60">
                        <span className="font-bold text-slate-900 dark:text-zinc-100 block mb-0.5">
                          {isAr ? '🌱 مثال حي من واقع الحياة:' : 'Real-life Example:'}
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                          {item.realLifeExampleAr}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {item.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
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
