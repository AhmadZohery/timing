import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Check,
  Sparkles,
  Bookmark,
  Quote,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Award,
  Search,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

export type BookCategory = 'tazkiyah' | 'productivity' | 'history' | 'mindset';
export type BookStatus = 'reading' | 'wishlist' | 'completed';

export interface BookItem {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  icon: string;
  summaryAr: string;
  keyTakeawayAr: string;
  isCustom?: boolean;
  lastReadAt?: number;
}

export interface BookQuoteItem {
  id: string;
  bookId: string;
  bookTitle: string;
  author: string;
  pageNumber: number;
  quoteText: string;
  reflectionText?: string;
  createdAt: number;
}

interface DailyReadingStats {
  dateKey: string;
  pagesReadToday: number;
  dailyGoalPages: number;
  totalPagesAllTime: number;
}

const STORAGE_BOOKS_KEY = 'midmar_books_library_v1';
const STORAGE_QUOTES_KEY = 'midmar_book_quotes_v1';
const STORAGE_STATS_KEY = 'midmar_reading_daily_stats_v1';

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const INITIAL_CURATED_BOOKS: BookItem[] = [
  {
    id: 'book_raqaiq_quran',
    title: 'رقائق القرآن',
    author: 'الشيخ إبراهيم السكران',
    category: 'tazkiyah',
    totalPages: 210,
    currentPage: 45,
    status: 'reading',
    icon: '🕋',
    summaryAr: 'تأملات إيمانية عميقة توقظ القلب من الغفلة وتربط الإنسان بمعاني الوحي والآخرة بلغة آسرة.',
    keyTakeawayAr: 'أعظم ما يرقق القلب ويحيي الهمة هو التعرض لنفحات القرآن بتدبر وافتقار.',
  },
  {
    id: 'book_atomic_habits',
    title: 'العادات الذرية (Atomic Habits)',
    author: 'جيمس كلير (James Clear)',
    category: 'productivity',
    totalPages: 320,
    currentPage: 80,
    status: 'reading',
    icon: '⚡',
    summaryAr: 'منهج علمي عملي لبناء العادات الإيجابية الصغيرة المتراكمة وكسر العادات السيئة عبر تغيير الهوية والبيئة.',
    keyTakeawayAr: 'التحسن بنسبة 1% كل يوم يصنع فرقاً هائلاً على المدى الطويل؛ ركّز على النظام لا على الهدف فقط.',
  },
  {
    id: 'book_da_wa_dawa',
    title: 'الداء والدواء (الجواب الكافي)',
    author: 'الإمام ابن قيم الجوزية',
    category: 'tazkiyah',
    totalPages: 350,
    currentPage: 0,
    status: 'wishlist',
    icon: '🌿',
    summaryAr: 'دستور في طب القلوب وفقه النفس وعلاج الشهوات والشبهات وأثر الدعاء والتوحيد في الشفاء.',
    keyTakeawayAr: 'من لم يداوِ قلبه بالقرآن والافتقار إلى الله، تفرقت به السبل وأضنته العلل.',
  },
  {
    id: 'book_deep_work',
    title: 'العمل العميق (Deep Work)',
    author: 'كال نيوبورت (Cal Newport)',
    category: 'productivity',
    totalPages: 296,
    currentPage: 0,
    status: 'wishlist',
    icon: '🧠',
    summaryAr: 'قواعد التركيز الفائق في عالم مليء بالمشتتات الرقمية وكيف تنتج أعمالاً ذات قيمة عالية في وقت أقل.',
    keyTakeawayAr: 'القدرة على التركيز العميق بدون تشتت هي المهارة الأندر والأعلى قيمة في العصر الحديث.',
  },
  {
    id: 'book_majriyat',
    title: 'الماجريات',
    author: 'الشيخ إبراهيم السكران',
    category: 'productivity',
    totalPages: 280,
    currentPage: 0,
    status: 'wishlist',
    icon: '🛡️',
    summaryAr: 'تشخيص دقيق لآفة الانغماس في الأحداث اليومية والشبكات الاجتماعية وكيف تسرق العمر والتركيز العلمي.',
    keyTakeawayAr: 'حراسة الوقت والذهن من فضول الأخبار والجدل العقيم شرط أساسي للإنجاز والرسوخ.',
  },
  {
    id: 'book_raheeq_makhtum',
    title: 'الرحيق المختوم في السيرة النبوية',
    author: 'صفي الرحمن المباركفوري',
    category: 'history',
    totalPages: 512,
    currentPage: 120,
    status: 'reading',
    icon: '🕌',
    summaryAr: 'السيرة النبوية الشاملة بأسلوب متسلسل يربط الأحداث والغزوات بالدروس التربوية والقيادية.',
    keyTakeawayAr: 'سيرة النبي ﷺ هي التطبيق العملي الحي للقرآن في الصبر، التخطيط، والرحمة.',
  },
  {
    id: 'book_rijal_hawla_rasul',
    title: 'رجال حول الرسول ﷺ',
    author: 'خالد محمد خالد',
    category: 'history',
    totalPages: 410,
    currentPage: 0,
    status: 'wishlist',
    icon: '⚔️',
    summaryAr: 'صور مشرقة لبطولات وتضحيات وزهد الصحابة الكرام بأسلوب أدبي رفيع يبعث العزة والهمة.',
    keyTakeawayAr: 'القدوات الحقيقية ترفع سقف طموحك وتريك كيف يصنع الإيمان المعجزات.',
  },
  {
    id: 'book_islam_east_west',
    title: 'الإسلام بين الشرق والغرب',
    author: 'علي عزت بيجوفيتش',
    category: 'history',
    totalPages: 380,
    currentPage: 0,
    status: 'wishlist',
    icon: '🏛️',
    summaryAr: 'قراءة فلسفية وحضارية عميقة تشرح وسطية الإسلام وتوازنه الفريد بين الروح والمادة.',
    keyTakeawayAr: 'الإسلام ليس مجرد روحانية منعزلة ولا مادية جافة، بل هو وحدة متكاملة تجمع الفطرة والوحي.',
  },
  {
    id: 'book_psychology_money',
    title: 'سيكولوجية المال (Psychology of Money)',
    author: 'مورغان هاوسل (Morgan Housel)',
    category: 'mindset',
    totalPages: 256,
    currentPage: 256,
    status: 'completed',
    icon: '💎',
    summaryAr: 'دروس خالدة في الثروة، القناعة، وإدارة المخاطر المالية بعيداً عن الطمع والقرارات المتهورة.',
    keyTakeawayAr: 'النجاح المالي يعتمد على انضباطك النفسي ومعرفتك لمعنى "الكفاية" أكثر من ذكائك الحسابي.',
  },
  {
    id: 'book_maslakiyat',
    title: 'مسلكيات',
    author: 'الشيخ إبراهيم السكران',
    category: 'mindset',
    totalPages: 240,
    currentPage: 0,
    status: 'wishlist',
    icon: '📚',
    summaryAr: 'بصائر في منهجية طلب العلم، علو الهمة، وأدب الحوار وتزكية العقل والعمل.',
    keyTakeawayAr: 'العلم الحقيقي ما أورث العمل والخشية والتواضع، لا مجرد التكاثر بالمعلومات.',
  },
  {
    id: 'book_lianaka_allah',
    title: 'لأنك الله: رحلة إلى السماء السابعة',
    author: 'علي بن جابر الفيفي',
    category: 'tazkiyah',
    totalPages: 192,
    currentPage: 192,
    status: 'completed',
    icon: '✨',
    summaryAr: 'تأملات وجدانية ميسرة في أسماء الله الحسنى (الصمد، الحفيظ، اللطيف، الشافي، الوكيل) وأثرها في طمأنينة القلب.',
    keyTakeawayAr: 'كلما عرف العبد ربه بأسمائه وصفاته، زاد حبه وتوكله وسكن قلبه عند الشدائد.',
  },
  {
    id: 'book_art_of_strategy',
    title: 'التفكير الاستراتيجي وصناعة القرار',
    author: 'مختارات الفكر القيادي',
    category: 'mindset',
    totalPages: 220,
    currentPage: 0,
    status: 'wishlist',
    icon: '♟️',
    summaryAr: 'قواعد التخطيط بعيد المدى، ترتيب الأولويات، وقراءة العواقب قبل اتخاذ القرارات المصيرية.',
    keyTakeawayAr: 'القائد الحكيم يحسم المعركة بالتخطيط والإعداد قبل أن تبدأ.',
  },
];

const INITIAL_QUOTES: BookQuoteItem[] = [
  {
    id: 'q_init_1',
    bookId: 'book_raqaiq_quran',
    bookTitle: 'رقائق القرآن',
    author: 'الشيخ إبراهيم السكران',
    pageNumber: 34,
    quoteText: 'إن القلب إذا طال ابتعاده عن تدبر الوحي قسا وانشغل بالصغائر، فإذا صافح آيات الله بخشوع عادت إليه حياته وبصيرته.',
    reflectionText: 'جعل ورد التدبر أول عمل بعد الفجر قبل فتح الهاتف.',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'q_init_2',
    bookId: 'book_atomic_habits',
    bookTitle: 'العادات الذرية (Atomic Habits)',
    author: 'جيمس كلير',
    pageNumber: 57,
    quoteText: 'أنت لا ترتقي إلى مستوى أهدافك، بل تهبط إلى مستوى أنظمتك وعاداتك اليومية.',
    reflectionText: 'بناء نظام ثابت للقراءة (15 صفحة يومياً) والرياضة بدلاً من الحماس المؤقت.',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'q_init_3',
    bookId: 'book_majriyat',
    bookTitle: 'الماجريات',
    author: 'الشيخ إبراهيم السكران',
    pageNumber: 112,
    quoteText: 'من لم يحرس أوقاته الفاضلة من سيل الأخبار المتلاحقة، تشتت ذهنه وضعف إنتاجه العلمي والعملي.',
    reflectionText: 'تخصيص ساعات العمل العميق والقراءة بعيداً عن الإشعارات.',
    createdAt: Date.now() - 86400000,
  },
];

const CATEGORY_META: Record<
  BookCategory,
  { labelAr: string; labelEn: string; badgeClass: string }
> = {
  tazkiyah: {
    labelAr: '🌿 تزكية ورقائق',
    labelEn: 'Tazkiyah & Soul',
    badgeClass: 'bg-[#d4f5dc] text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200',
  },
  productivity: {
    labelAr: '⚡ إنتاجية وتركيز عميق',
    labelEn: 'Deep Work & Habits',
    badgeClass: 'bg-[#e2defc] text-indigo-950 dark:bg-indigo-950/70 dark:text-indigo-200',
  },
  history: {
    labelAr: '🕌 سيرة وتاريخ وفكر',
    labelEn: 'Seerah & History',
    badgeClass: 'bg-[#fde6d8] text-amber-950 dark:bg-amber-950/70 dark:text-amber-200',
  },
  mindset: {
    labelAr: '🧠 عقلية وقيادة',
    labelEn: 'Mindset & Strategy',
    badgeClass: 'bg-sky-100 text-sky-950 dark:bg-sky-950/70 dark:text-sky-200',
  },
};

interface BookReadingSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  onRewardToast?: (msg: string) => void;
}

export const BookReadingSanctuaryModal: React.FC<BookReadingSanctuaryModalProps> = ({
  isOpen,
  onClose,
  isAr,
  onRewardToast,
}) => {
  const [activeTab, setActiveTab] = useState<'reading' | 'library' | 'quotes' | 'add'>('reading');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BookCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | BookStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [books, setBooks] = useState<BookItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BOOKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CURATED_BOOKS;
  });

  const [quotes, setQuotes] = useState<BookQuoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_QUOTES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_QUOTES;
  });

  const [stats, setStats] = useState<DailyReadingStats>(() => {
    const today = getTodayKey();
    try {
      const saved = localStorage.getItem(STORAGE_STATS_KEY);
      if (saved) {
        const parsed: DailyReadingStats = JSON.parse(saved);
        if (parsed.dateKey === today) {
          return parsed;
        }
        return {
          dateKey: today,
          pagesReadToday: 0,
          dailyGoalPages: parsed.dailyGoalPages || 20,
          totalPagesAllTime: parsed.totalPagesAllTime || 165,
        };
      }
    } catch {}
    return {
      dateKey: today,
      pagesReadToday: 0,
      dailyGoalPages: 20,
      totalPagesAllTime: 165,
    };
  });

  // Reading Focus Timer State
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Quote Quick Add Modal inside Reading Card
  const [quoteDraftBookId, setQuoteDraftBookId] = useState<string>(books[0]?.id || 'book_raqaiq_quran');
  const [quoteDraftPage, setQuoteDraftPage] = useState<string>('');
  const [quoteDraftText, setQuoteDraftText] = useState<string>('');
  const [quoteDraftReflection, setQuoteDraftReflection] = useState<string>('');

  // Custom Book Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPages, setNewPages] = useState('250');
  const [newCategory, setNewCategory] = useState<BookCategory>('productivity');
  const [newStatus, setNewStatus] = useState<BookStatus>('reading');
  const [newSummary, setNewSummary] = useState('');
  const [newIcon, setNewIcon] = useState('📘');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOOKS_KEY, JSON.stringify(books));
    } catch {}
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_QUOTES_KEY, JSON.stringify(quotes));
    } catch {}
  }, [quotes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
    } catch {}
  }, [stats]);

  // Reading timer effect
  useEffect(() => {
    if (!isTimerRunning || timerSecondsLeft === null) return;
    if (timerSecondsLeft <= 0) {
      setIsTimerRunning(false);
      setTimerSecondsLeft(null);
      soundSynth.playStreakMilestoneChime();
      haptic.vibrateSprintCelebration();
      onRewardToast?.(
        isAr
          ? '🎉 أتممت جلسة القراءة الهادئة بنجاح! (+25 XP للتركيز المعرفي)'
          : '🎉 Reading Focus Session Completed! (+25 XP)'
      );
      return;
    }
    const id = setInterval(() => {
      setTimerSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [isTimerRunning, timerSecondsLeft, isAr, onRewardToast]);

  const readingBooks = useMemo(() => books.filter((b) => b.status === 'reading'), [books]);
  const completedCount = useMemo(() => books.filter((b) => b.status === 'completed').length, [books]);

  const filteredLibraryBooks = useMemo(() => {
    return books.filter((b) => {
      const matchCat = categoryFilter === 'all' || b.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.summaryAr.toLowerCase().includes(q);
      return matchCat && matchStatus && matchSearch;
    });
  }, [books, categoryFilter, statusFilter, searchQuery]);

  if (!isOpen) return null;

  const handleLogPages = (bookId: string, deltaPages: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    let completedJustNow = false;
    let targetBookTitle = '';

    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        targetBookTitle = b.title;
        const nextPage = Math.min(b.totalPages, Math.max(0, b.currentPage + deltaPages));
        const isNowDone = nextPage >= b.totalPages;
        if (isNowDone && b.status !== 'completed') {
          completedJustNow = true;
        }
        return {
          ...b,
          currentPage: nextPage,
          status: isNowDone ? 'completed' : 'reading',
          lastReadAt: Date.now(),
        };
      })
    );

    if (deltaPages > 0) {
      setStats((prev) => ({
        ...prev,
        dateKey: getTodayKey(),
        pagesReadToday: prev.pagesReadToday + deltaPages,
        totalPagesAllTime: prev.totalPagesAllTime + deltaPages,
      }));
    }

    if (completedJustNow) {
      soundSynth.playStreakMilestoneChime();
      haptic.vibrateSprintCelebration();
      onRewardToast?.(
        isAr
          ? `🏆 مبارك ختم كتاب «${targetBookTitle}» بالكامل! (+50 XP)`
          : `🏆 Completed "${targetBookTitle}"! (+50 XP)`
      );
    } else if (deltaPages > 0) {
      onRewardToast?.(
        isAr
          ? `📖 تم تسجيل +${deltaPages} صفحات في «${targetBookTitle}» (+15 XP)`
          : `📖 Logged +${deltaPages} pages in "${targetBookTitle}" (+15 XP)`
      );
    }
  };

  const handleChangeBookStatus = (bookId: string, newSt: BookStatus) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        return {
          ...b,
          status: newSt,
          currentPage: newSt === 'completed' ? b.totalPages : newSt === 'reading' && b.currentPage >= b.totalPages ? 0 : b.currentPage,
        };
      })
    );
    if (newSt === 'reading') {
      setActiveTab('reading');
      onRewardToast?.(isAr ? '📖 أُضيف الكتاب إلى رف القراءة الحالية' : 'Added to Currently Reading');
    }
  };

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteDraftText.trim()) return;

    const bookObj = books.find((b) => b.id === quoteDraftBookId) || books[0];
    const created: BookQuoteItem = {
      id: `quote_${Date.now()}`,
      bookId: bookObj.id,
      bookTitle: bookObj.title,
      author: bookObj.author,
      pageNumber: Math.max(1, Number(quoteDraftPage) || bookObj.currentPage || 1),
      quoteText: quoteDraftText.trim(),
      reflectionText: quoteDraftReflection.trim() || undefined,
      createdAt: Date.now(),
    };

    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();
    setQuotes((prev) => [created, ...prev]);
    setQuoteDraftText('');
    setQuoteDraftReflection('');
    setQuoteDraftPage('');
    onRewardToast?.(isAr ? '💡 تم حفظ الفائدة والاقتباس في دفترك المعرفي (+15 XP)' : 'Quote saved (+15 XP)');
  };

  const handleAddCustomBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;

    const total = Math.max(10, Number(newPages) || 200);
    const created: BookItem = {
      id: `custom_book_${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim(),
      category: newCategory,
      totalPages: total,
      currentPage: newStatus === 'completed' ? total : 0,
      status: newStatus,
      icon: newIcon,
      summaryAr: newSummary.trim() || 'كتاب مضاف إلى مكتبتك الخاصة.',
      keyTakeawayAr: 'القراءة المستمرة تبني البصيرة وترفع الهمة.',
      isCustom: true,
      lastReadAt: Date.now(),
    };

    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();
    setBooks((prev) => [created, ...prev]);
    setNewTitle('');
    setNewAuthor('');
    setNewSummary('');
    setActiveTab(newStatus === 'reading' ? 'reading' : 'library');
    onRewardToast?.(
      isAr ? `📚 تمت إضافة كتاب «${created.title}» إلى مكتبتك!` : `Added "${created.title}" to library!`
    );
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const dailyGoalPct = Math.min(100, Math.round((stats.pagesReadToday / Math.max(1, stats.dailyGoalPages)) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'مكتبة القراءة ورف الكتب التفاعلي' : 'Interactive Book Reading Sanctuary'}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[30px] bg-white dark:bg-[#121316] border border-zinc-200/80 dark:border-white/12 shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden">
        {/* 1. Header Stage */}
        <div className="celestial-obsidian-stage p-4 sm:p-5 border-b border-white/10 text-white flex items-center justify-between gap-3 shrink-0 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -end-12 w-44 h-44 rounded-full bg-amber-400/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -start-12 w-40 h-40 rounded-full bg-[#bce8c2]/15 blur-2xl" />

          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#fde6d8] text-zinc-950 flex items-center justify-center text-2xl shrink-0 shadow-md font-bold">
              📚
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                  {isAr ? 'محراب القراءة ورف الكتب التفاعلي' : 'Book Reading Sanctuary & Tracker'}
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#bce8c2] text-zinc-950">
                  {isAr ? `${readingBooks.length} قيد القراءة • ${completedCount} مكتملة` : `${readingBooks.length} Reading`}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-300 mt-0.5 truncate">
                {isAr
                  ? 'تتبع وردك القرائي بالصفحات، مؤقت قراءة هادئ، ودفتر لتدوين الفوائد والاقتباسات'
                  : 'Track daily pages, quiet reading focus timer, and book quotes vault'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Daily Reading Goal Bar & Built-in Quiet Reading Timer */}
        <div className="p-3.5 sm:px-5 bg-zinc-50 dark:bg-[#17191e] border-b border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Left: Daily Pages Progress */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-[#bce8c2]" />
                  <span>{isAr ? 'ورد القراءة اليومي:' : 'Daily Reading Goal:'}</span>
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-[#bce8c2]">
                  {stats.pagesReadToday} / {stats.dailyGoalPages} {isAr ? 'صفحة' : 'pages'} ({dailyGoalPct}%)
                </span>
              </div>

              {/* Goal Selector Pills */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isAr ? 'الهدف:' : 'Goal:'}
                </span>
                {[10, 20, 30, 50].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setStats((prev) => ({ ...prev, dailyGoalPages: g }));
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      stats.dailyGoalPages === g
                        ? 'bg-[#141517] text-white dark:bg-[#bce8c2] dark:text-zinc-950'
                        : 'bg-zinc-200/70 dark:bg-white/10 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#1eb814] transition-all duration-300"
                style={{ width: `${dailyGoalPct}%` }}
              />
            </div>
          </div>

          {/* Right: Quiet Reading Session Timer */}
          <div className="flex items-center gap-1.5 sm:border-s sm:border-zinc-200 dark:sm:border-white/10 sm:ps-3 shrink-0">
            <Timer className="w-4 h-4 text-amber-600 dark:text-[#fde6d8] shrink-0" />
            {timerSecondsLeft !== null ? (
              <div className="flex items-center gap-1.5 bg-[#141517] text-white px-3 py-1.5 rounded-full text-xs font-mono font-bold">
                <span className="text-[#fde6d8]">{formatTimer(timerSecondsLeft)}</span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning((r) => !r)}
                  className="p-1 rounded-full bg-white/15 hover:bg-white/25 cursor-pointer"
                  title={isTimerRunning ? 'إيقاف مؤقت' : 'استئناف'}
                >
                  {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSecondsLeft(null);
                  }}
                  className="p-1 rounded-full bg-white/10 hover:bg-rose-500/40 cursor-pointer"
                  title="إلغاء المؤقت"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 me-1">
                  {isAr ? 'مؤقت قراءة:' : 'Focus Timer:'}
                </span>
                {[15, 25, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      haptic.vibrateLight();
                      setTimerSecondsLeft(mins * 60);
                      setIsTimerRunning(true);
                      onRewardToast?.(
                        isAr
                          ? `⏱️ بدأت جلسة قراءة هادئة لمدة ${mins} دقيقة`
                          : `⏱️ Started ${mins}m reading focus timer`
                      );
                    }}
                    className="px-2.5 py-1 rounded-full bg-[#fde6d8] hover:brightness-95 text-zinc-950 text-[11px] font-bold cursor-pointer active:scale-95 transition-all"
                  >
                    {mins}{isAr ? 'د' : 'm'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="px-3.5 sm:px-5 py-2.5 bg-white dark:bg-[#141517] border-b border-zinc-200/80 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            {
              id: 'reading',
              label: isAr ? `📖 قيد القراءة الآن (${readingBooks.length})` : `📖 Reading (${readingBooks.length})`,
            },
            {
              id: 'library',
              label: isAr ? `🏛️ المكتبة الشاملة (${books.length})` : `🏛️ Library (${books.length})`,
            },
            {
              id: 'quotes',
              label: isAr ? `💡 دفتر الفوائد والاقتباسات (${quotes.length})` : `💡 Quotes (${quotes.length})`,
            },
            {
              id: 'add',
              label: isAr ? '➕ إضافة كتاب خاص' : '➕ Add Book',
            },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#141517] text-white dark:bg-[#bce8c2] dark:text-zinc-950 shadow-xs'
                    : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 4. Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: CURRENTLY READING */}
          {activeTab === 'reading' && (
            <div className="space-y-4">
              {readingBooks.length === 0 ? (
                <div className="p-8 rounded-[26px] surface-card-3d border border-zinc-200 dark:border-white/10 text-center space-y-3">
                  <div className="text-3xl">📚</div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {isAr ? 'لا يوجد كتاب قيد القراءة حالياً' : 'No active books in progress'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isAr
                      ? 'اختر كتاباً من المكتبة الشاملة أو أضف كتابك الخاص لتبدأ تتبع صفحاتك اليومية.'
                      : 'Pick a book from the Library tab or add a custom book to start tracking.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="px-4 py-2 rounded-full bg-habit-green-ink text-white text-xs font-bold cursor-pointer"
                  >
                    {isAr ? 'تصفح المكتبة الشاملة ←' : 'Browse Library →'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {readingBooks.map((book) => {
                    const pct = Math.min(100, Math.round((book.currentPage / Math.max(1, book.totalPages)) * 100));
                    const remainingPages = Math.max(0, book.totalPages - book.currentPage);
                    const estDays = Math.max(1, Math.ceil(remainingPages / Math.max(1, stats.dailyGoalPages)));
                    const catMeta = CATEGORY_META[book.category];

                    return (
                      <div
                        key={book.id}
                        className="rounded-[26px] surface-card-3d border border-zinc-200/90 dark:border-white/12 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs"
                      >
                        <div className="space-y-3">
                          {/* Top Row */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-[#fde6d8] dark:bg-white/10 text-zinc-950 dark:text-white flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                                {book.icon}
                              </div>
                              <div className="min-w-0">
                                <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${catMeta.badgeClass}`}>
                                  {isAr ? catMeta.labelAr : catMeta.labelEn}
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mt-1 line-clamp-1">
                                  {book.title}
                                </h3>
                                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 truncate">
                                  {book.author}
                                </p>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-[#bce8c2] font-mono text-xs font-bold shrink-0">
                              {pct}%
                            </span>
                          </div>

                          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                            {book.summaryAr}
                          </p>

                          {/* Progress Bar & Page Counter */}
                          <div className="p-3 rounded-2xl bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/10 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {isAr
                                  ? `صفحة ${book.currentPage} من ${book.totalPages}`
                                  : `Page ${book.currentPage} of ${book.totalPages}`}
                              </span>
                              <span className="text-[11px] font-bold text-amber-800 dark:text-[#fde6d8]">
                                {remainingPages === 0
                                  ? isAr
                                    ? 'مكتمل!'
                                    : 'Completed!'
                                  : isAr
                                  ? `باقي ${remainingPages} ص (~${estDays} أيام)`
                                  : `${remainingPages}p left (~${estDays}d)`}
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#1eb814] to-emerald-400 transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 1-Tap Page Logging Controls */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                            <span>{isAr ? 'تسجيل الصفحات المقروءة فوراً (+15 XP):' : 'Quick Log Pages (+15 XP):'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuoteDraftBookId(book.id);
                                setQuoteDraftPage(String(book.currentPage || 1));
                                setActiveTab('quotes');
                              }}
                              className="text-indigo-600 dark:text-[#e2defc] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Quote className="w-3 h-3" />
                              <span>{isAr ? 'تدوين اقتباس' : 'Save Quote'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { delta: 1, label: isAr ? '+1 ص' : '+1p' },
                              { delta: 5, label: isAr ? '+5 ص' : '+5p' },
                              { delta: 10, label: isAr ? '+10 ص' : '+10p' },
                              { delta: 20, label: isAr ? '+20 ص' : '+20p' },
                            ].map((btn) => (
                              <button
                                key={btn.delta}
                                type="button"
                                onClick={() => handleLogPages(book.id, btn.delta)}
                                className="py-2 px-2 rounded-xl bg-[#d4f5dc] hover:bg-[#bce8c2] dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-zinc-950 dark:text-[#bce8c2] font-mono text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL LIBRARY & WISHLIST */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'ابحث باسم الكتاب، المؤلف، أو الموضوع...' : 'Search book title, author, or topic...'}
                    className="w-full h-10 ps-10 pe-4 rounded-2xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'all', label: isAr ? '✨ كل التصنيفات' : 'All' },
                      { id: 'tazkiyah', label: isAr ? '🌿 تزكية ورقائق' : 'Tazkiyah' },
                      { id: 'productivity', label: isAr ? '⚡ إنتاجية وتركيز' : 'Productivity' },
                      { id: 'history', label: isAr ? '🕌 سيرة وتاريخ' : 'Seerah & History' },
                      { id: 'mindset', label: isAr ? '🧠 عقلية وقيادة' : 'Mindset' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryFilter(cat.id as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          categoryFilter === cat.id
                            ? 'bg-[#141517] text-white dark:bg-[#fde6d8] dark:text-zinc-950'
                            : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'all', label: isAr ? 'الكل' : 'All' },
                      { id: 'reading', label: isAr ? '📖 قيد القراءة' : 'Reading' },
                      { id: 'wishlist', label: isAr ? '🔖 قائمة القراءة' : 'Wishlist' },
                      { id: 'completed', label: isAr ? '✅ مكتملة' : 'Completed' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatusFilter(st.id as any)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                          statusFilter === st.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Books Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredLibraryBooks.map((book) => {
                  const catMeta = CATEGORY_META[book.category];
                  const pct = Math.min(100, Math.round((book.currentPage / Math.max(1, book.totalPages)) * 100));

                  return (
                    <div
                      key={book.id}
                      className="p-4 rounded-[24px] surface-card-3d border border-zinc-200/80 dark:border-white/10 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-xl shrink-0">
                              {book.icon}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                                {book.title}
                              </h4>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {book.author} • {book.totalPages} {isAr ? 'صفحة' : 'p'}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${catMeta.badgeClass}`}>
                            {isAr ? catMeta.labelAr : catMeta.labelEn}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          {book.summaryAr}
                        </p>

                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-950 dark:text-amber-200 font-medium">
                          💡 <span className="font-bold">{isAr ? 'خلاصة الكتاب:' : 'Key Takeaway:'}</span> {book.keyTakeawayAr}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-white/10">
                        <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                          {book.status === 'completed'
                            ? isAr
                              ? '✅ مكتمل (100%)'
                              : '✅ Completed'
                            : book.status === 'reading'
                            ? isAr
                              ? `📖 قيد القراءة (${pct}%)`
                              : `📖 Reading (${pct}%)`
                            : isAr
                            ? '🔖 في قائمة القراءة'
                            : '🔖 Wishlist'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {book.status !== 'reading' && (
                            <button
                              type="button"
                              onClick={() => handleChangeBookStatus(book.id, 'reading')}
                              className="px-3 py-1.5 rounded-full bg-[#141517] dark:bg-[#bce8c2] text-white dark:text-zinc-950 text-[11px] font-bold cursor-pointer active:scale-95 transition-transform"
                            >
                              {isAr ? 'ابدأ قراءته 📖' : 'Start Reading 📖'}
                            </button>
                          )}
                          {book.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleChangeBookStatus(book.id, 'completed')}
                              className="px-2.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
                            >
                              {isAr ? 'تم الختم ✓' : 'Mark Done ✓'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: QUOTES & TAKEAWAYS VAULT */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {/* Add Quote Form */}
              <form
                onSubmit={handleAddQuote}
                className="p-4 rounded-[24px] bento-3d-lavender border border-indigo-300/60 dark:border-indigo-500/25 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
                    <span>{isAr ? 'تدوين اقتباس أو فائدة جديدة من قراءتك' : 'Save a New Book Quote or Takeaway'}</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#5448e8] text-white">
                    +15 XP
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <select
                    value={quoteDraftBookId}
                    onChange={(e) => setQuoteDraftBookId(e.target.value)}
                    className="sm:col-span-2 h-10 px-3 rounded-xl bg-white/90 dark:bg-zinc-900 border border-indigo-200 dark:border-white/15 text-xs font-bold text-zinc-900 dark:text-white"
                  >
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.icon} {b.title} — {b.author}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    placeholder={isAr ? 'رقم الصفحة (مثال: 45)' : 'Page #'}
                    value={quoteDraftPage}
                    onChange={(e) => setQuoteDraftPage(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-white/90 dark:bg-zinc-900 border border-indigo-200 dark:border-white/15 text-xs font-mono text-zinc-900 dark:text-white"
                  />
                </div>

                <textarea
                  rows={2}
                  required
                  placeholder={isAr ? 'اكتب نص الاقتباس أو الفائدة التي استوقفتك في الكتاب...' : 'Enter the quote or key idea...'}
                  value={quoteDraftText}
                  onChange={(e) => setQuoteDraftText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/90 dark:bg-zinc-900 border border-indigo-200 dark:border-white/15 text-xs text-zinc-900 dark:text-white"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder={isAr ? 'تأملك الشخصي أو كيف ستطبقه عملياً (اختياري)...' : 'Your personal reflection / action item...'}
                    value={quoteDraftReflection}
                    onChange={(e) => setQuoteDraftReflection(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl bg-white/90 dark:bg-zinc-900 border border-indigo-200 dark:border-white/15 text-xs text-zinc-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-[#141517] dark:bg-white text-white dark:text-zinc-950 text-xs font-bold cursor-pointer active:scale-95 transition-transform shrink-0"
                  >
                    {isAr ? 'حفظ الفائدة 💡' : 'Save Quote 💡'}
                  </button>
                </div>
              </form>

              {/* Saved Quotes List */}
              <div className="space-y-2.5">
                {quotes.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-[22px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bookmark className="w-4 h-4 text-amber-600 dark:text-[#fde6d8] shrink-0" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {q.bookTitle}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          ({q.author})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-[#fde6d8] font-mono text-[10px] font-bold">
                          {isAr ? `ص ${q.pageNumber}` : `p. ${q.pageNumber}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuotes((prev) => prev.filter((item) => item.id !== q.id))}
                          className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-100 leading-relaxed bg-zinc-100/80 dark:bg-white/[0.04] p-3 rounded-xl border-s-4 border-amber-500">
                      «{q.quoteText}»
                    </p>

                    {q.reflectionText && (
                      <p className="text-[11px] text-emerald-800 dark:text-[#bce8c2] font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'التطبيق العملي:' : 'Action:'} {q.reflectionText}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADD CUSTOM BOOK */}
          {activeTab === 'add' && (
            <form
              onSubmit={handleAddCustomBook}
              className="max-w-xl mx-auto p-5 rounded-[26px] surface-card-3d border border-zinc-200 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#bce8c2] text-zinc-950 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {isAr ? 'إضافة كتاب جديد إلى مكتبتك' : 'Add a New Book to Your Shelf'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isAr ? 'أضف أي كتاب تقرؤه حالياً أو تخطط لقراءته لتتبع تقدمك فيه' : 'Track any custom book you are reading'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? 'عنوان الكتاب *' : 'Book Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: علو الهمة' : 'e.g. Deep Work'}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/15 text-xs text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? 'المؤلف *' : 'Author *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder={isAr ? 'مثال: د. محمد إسماعيل المقدم' : 'Author name'}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/15 text-xs text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? 'عدد الصفحات' : 'Total Pages'}
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={newPages}
                    onChange={(e) => setNewPages(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/15 text-xs font-mono text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as BookCategory)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/15 text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="tazkiyah">{isAr ? '🌿 تزكية ورقائق' : 'Tazkiyah'}</option>
                    <option value="productivity">{isAr ? '⚡ إنتاجية وتركيز' : 'Productivity'}</option>
                    <option value="history">{isAr ? '🕌 سيرة وتاريخ' : 'Seerah & History'}</option>
                    <option value="mindset">{isAr ? '🧠 عقلية وقيادة' : 'Mindset'}</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as BookStatus)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/15 text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="reading">{isAr ? '📖 قيد القراءة الآن' : 'Reading Now'}</option>
                    <option value="wishlist">{isAr ? '🔖 قائمة القراءة' : 'Wishlist'}</option>
                    <option value="completed">{isAr ? '✅ مكتمل' : 'Completed'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  {isAr ? 'رمز الكتاب:' : 'Book Icon:'}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['📘', '📗', '📙', '🕋', '🧠', '⚡', '🕌', '⚔️', '💎', '🌿'].map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setNewIcon(emo)}
                      className={`w-9 h-9 rounded-xl text-base flex items-center justify-center cursor-pointer transition-all ${
                        newIcon === emo
                          ? 'bg-[#141517] text-white dark:bg-[#bce8c2] ring-2 ring-emerald-500'
                          : 'bg-zinc-100 dark:bg-white/5'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  {isAr ? 'نبذة أو هدفك من قراءة الكتاب (اختياري)' : 'Summary or Goal (optional)'}
                </label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder={isAr ? 'لماذا تقرأ هذا الكتاب وما الذي تود الاستفادة منه؟' : 'Why are you reading this book?'}
                  className="w-full p-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/15 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs shadow-md cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>{isAr ? 'حفظ الكتاب وبدء التتبع 📚' : 'Save Book & Track 📚'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
