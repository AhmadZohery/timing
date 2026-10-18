import React, { useState, useEffect } from 'react';
import {
  X,
  Lightbulb,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  FlipVertical,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface ChessTacticalLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  onRewardToast?: (msg: string) => void;
}

type ChessLevel = 'beginner' | 'intermediate' | 'advanced';
type PieceCode =
  | 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP'
  | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP'
  | null;

type BoardGrid = PieceCode[][]; // 8x8 [row 0..7 (rank 8..1)][col 0..7 (file a..h)]

const PIECE_GLYPHS: Record<Exclude<PieceCode, null>, string> = {
  wK: '♔',
  wQ: '♕',
  wR: '♖',
  wB: '♗',
  wN: '♘',
  wP: '♙',
  bK: '♚',
  bQ: '♛',
  bR: '♜',
  bB: '♝',
  bN: '♞',
  bP: '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function sqToCoords(sq: string): [number, number] {
  const col = FILES.indexOf(sq[0]);
  const row = 8 - parseInt(sq[1], 10);
  return [row, col];
}

function coordsToSq(row: number, col: number): string {
  return `${FILES[col]}${8 - row}`;
}

function createEmptyBoard(): BoardGrid {
  return Array.from({ length: 8 }, () => Array<PieceCode>(8).fill(null));
}

function createInitialBoard(): BoardGrid {
  const b = createEmptyBoard();
  const backWhite: PieceCode[] = ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'];
  const backBlack: PieceCode[] = ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'];
  b[0] = [...backBlack];
  b[1] = Array<PieceCode>(8).fill('bP');
  b[6] = Array<PieceCode>(8).fill('wP');
  b[7] = [...backWhite];
  return b;
}

function cloneBoard(b: BoardGrid): BoardGrid {
  return b.map((row) => [...row]);
}

function applyMoveOnBoard(b: BoardGrid, fromSq: string, toSq: string): BoardGrid {
  const next = cloneBoard(b);
  const [r1, c1] = sqToCoords(fromSq);
  const [r2, c2] = sqToCoords(toSq);
  const piece = next[r1]?.[c1] || null;
  if (next[r1]) next[r1][c1] = null;
  if (next[r2]) {
    // Handle pawn promotion to Queen automatically on rank 8/1
    if (piece === 'wP' && r2 === 0) {
      next[r2][c2] = 'wQ';
    } else if (piece === 'bP' && r2 === 7) {
      next[r2][c2] = 'bQ';
    } else {
      next[r2][c2] = piece;
    }
  }
  // Simple castling rook follow-up if King moves 2 files
  if (piece === 'wK' && fromSq === 'e1' && toSq === 'g1') {
    next[7][7] = null;
    next[7][5] = 'wR';
  } else if (piece === 'wK' && fromSq === 'e1' && toSq === 'c1') {
    next[7][0] = null;
    next[7][3] = 'wR';
  } else if (piece === 'bK' && fromSq === 'e8' && toSq === 'g8') {
    next[0][7] = null;
    next[0][5] = 'bR';
  }
  return next;
}

function buildBoardFromPlacement(placements: Record<string, Exclude<PieceCode, null>>): BoardGrid {
  const b = createEmptyBoard();
  Object.entries(placements).forEach(([sq, piece]) => {
    const [r, c] = sqToCoords(sq);
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      b[r][c] = piece;
    }
  });
  return b;
}

interface TacticalPuzzle {
  id: string;
  level: ChessLevel;
  titleAr: string;
  titleEn: string;
  motifAr: string;
  sideToMove: 'w' | 'b';
  placements: Record<string, Exclude<PieceCode, null>>;
  solutionFrom: string;
  solutionTo: string;
  notation: string;
  hint1Ar: string;
  hint2Ar: string;
  explanationAr: string;
}

const TACTICAL_PUZZLES: TacticalPuzzle[] = [
  {
    id: 'puz-royal-fork',
    level: 'beginner',
    titleAr: 'شوكة الحصان الملكية (Royal Knight Fork)',
    titleEn: 'Royal Knight Fork',
    motifAr: 'هجوم مزدوج بالحصان (Fork)',
    sideToMove: 'w',
    placements: {
      g8: 'bK',
      c8: 'bQ',
      f7: 'bP',
      g7: 'bP',
      h7: 'bP',
      d5: 'wN',
      e1: 'wK',
      d1: 'wR',
      f2: 'wP',
      g2: 'wP',
      h2: 'wP',
    },
    solutionFrom: 'd5',
    solutionTo: 'e7',
    notation: 'Ne7+',
    hint1Ar: '💡 تلميح ١: انظر إلى حصانك المتمركز في d5.. أي مربع يمنحه كش للملك وتهديداً مباشراً لوزير الخصم في c8؟',
    hint2Ar: '🎯 تلميح ٢: انقل الحصان من d5 إلى e7 (Ne7+)! كش للملك في g8 وهجوم مباشر على الوزير في c8 في نفس اللحظة.',
    explanationAr: 'أحسنت! النقلة Ne7+ تصنع «شوكة ملكية» (Royal Fork): الملك الأسود مجبر على الهروب من الكش، وفي النقلة التالية تكسب الوزير الأسود في c8 مجاناً!',
  },
  {
    id: 'puz-back-rank',
    level: 'beginner',
    titleAr: 'القاضية في الصف الخلفي (Back-Rank Mate)',
    titleEn: 'Back-Rank Checkmate',
    motifAr: 'مات الصف الثامن (Checkmate in 1)',
    sideToMove: 'w',
    placements: {
      g8: 'bK',
      f7: 'bP',
      g7: 'bP',
      h7: 'bP',
      a8: 'bR',
      d1: 'wR',
      g1: 'wK',
      f2: 'wP',
      g2: 'wP',
      h2: 'wP',
    },
    solutionFrom: 'd1',
    solutionTo: 'd8',
    notation: 'Rd8#',
    hint1Ar: '💡 تلميح ١: بيادق الملك الأسود (f7, g7, h7) تحبس ملكه في الصف الثامن بلا أي متنفس (Luft).',
    hint2Ar: '🎯 تلميح ٢: انطلق بالرخ الأبيض من d1 إلى d8 (Rd8#)!',
    explanationAr: 'كش مات نظيف! الرخ في d8 يوجه كش قاتل في الصف الثامن، ولا يستطيع الملك الأسود الهروب لأن بيادقه الخاصة تغلق عليه الصف السابع.',
  },
  {
    id: 'puz-queen-pin-tactic',
    level: 'intermediate',
    titleAr: 'استغلال الربط العمودي (Exploiting the Pin)',
    titleEn: 'Winning the Pinned Knight',
    motifAr: 'الضغط على القطعة المربوطة (Pin Pressure)',
    sideToMove: 'w',
    placements: {
      e8: 'bK',
      e5: 'bN',
      d7: 'bP',
      f7: 'bP',
      g7: 'bP',
      e1: 'wR',
      g1: 'wK',
      f3: 'wP',
      g2: 'wP',
      h2: 'wP',
    },
    solutionFrom: 'f3',
    solutionTo: 'f4',
    notation: 'f4!',
    hint1Ar: '💡 تلميح ١: الحصان الأسود في e5 لا يستطيع التحرك إطلاقاً لأنه مربوط (Pinned) أمام ملكه في e8 بواسطة رخك في e1!',
    hint2Ar: '🎯 تلميح ٢: ادفع البيدق من f3 إلى f4 لمهاجمة الحصان المشلول في e5 وكسبه!',
    explanationAr: 'قاعدة ذهبية في الشطرنج: «اضغط على القطعة المربوطة بأقل قطعة قيمة لديك (البيدق)!» الحصان في e5 مربوط على الملك ولا يستطيع الهروب من البيدق f4.',
  },
  {
    id: 'puz-discovered-attack',
    level: 'intermediate',
    titleAr: 'الكش الكاشف لصيد الوزير (Discovered Check)',
    titleEn: 'Discovered Check Wins Queen',
    motifAr: 'هجوم بالكشف (Discovered Attack)',
    sideToMove: 'w',
    placements: {
      g8: 'bK',
      d7: 'bQ',
      f7: 'bP',
      g7: 'bP',
      h7: 'bP',
      d5: 'wB',
      d1: 'wR',
      g1: 'wK',
      f2: 'wP',
      g2: 'wP',
    },
    solutionFrom: 'd5',
    solutionTo: 'f7',
    notation: 'Bxf7+!',
    hint1Ar: '💡 تلميح ١: لاحظ أن رخك في d1 يقف في نفس العمود مع وزير الخصم في d7، لكن فيلك في d5 يسد الطريق حالياً!',
    hint2Ar: '🎯 تلميح ٢: اضرب بيدق f7 بالفيل مع كش للملك (d5 إلى f7)! ستكسب البيدق بالكش وتكشف خط الرخ على الوزير الأسود!',
    explanationAr: 'تكتيك عبقري! النقلة Bxf7+ تضرب الملك بكش إجباري، وفي نفس اللحظة تفتح عمود d للرخ الأبيض في d1 ليلتهم الوزير الأسود في d7 في النقلة التالية!',
  },
  {
    id: 'puz-greek-gift',
    level: 'advanced',
    titleAr: 'هدية الإغريق وتدمير حصن الملك (Greek Gift Sacrifice)',
    titleEn: 'Classic Greek Gift Sacrifice',
    motifAr: 'تضحية الفيل في h7 (Bxh7+)',
    sideToMove: 'w',
    placements: {
      g8: 'bK',
      f8: 'bR',
      f7: 'bP',
      g7: 'bP',
      h7: 'bP',
      d3: 'wB',
      f3: 'wN',
      d1: 'wQ',
      h4: 'wP',
      g1: 'wK',
    },
    solutionFrom: 'd3',
    solutionTo: 'h7',
    notation: 'Bxh7+!!',
    hint1Ar: '💡 تلميح ١: الملك الأسود في g8 بلا أي مدافع قريب، بينما فيلك في d3 وحصانك في f3 ووزيرك في d1 جاهزون للانقضاض!',
    hint2Ar: '🎯 تلميح ٢: فجّر حصن الملك بالتضحية الكلاسيكية من d3 إلى h7 (Bxh7+!!)، يتبعها Ng5+ ثم Qh5 بمات لا يصد!',
    explanationAr: 'تضحية الفيل الكلاسيكية (Bxh7+!!) تقتلع الغطاء الدفاعي للملك الأسود، وتسمح بدخول الحصان (Ng5+) والوزير (Qh5) لهجوم مات حتمي!',
  },
  {
    id: 'puz-rook-skewer',
    level: 'advanced',
    titleAr: 'سيخ الرخ في النهايات (Endgame Rook Skewer)',
    titleEn: 'Absolute Rook Skewer',
    motifAr: 'تكتيك السيخ (Skewer)',
    sideToMove: 'w',
    placements: {
      e7: 'bK',
      a7: 'bR',
      h1: 'wR',
      g2: 'wK',
      f4: 'wP',
    },
    solutionFrom: 'h1',
    solutionTo: 'h7',
    notation: 'Rh7+!',
    hint1Ar: '💡 تلميح ١: الملك الأسود (e7) والرخ الأسود (a7) يقفان على نفس الصف السابع!',
    hint2Ar: '🎯 تلميح ٢: اصعد برخك من h1 إلى h7 (Rh7+)! كش يجبر الملك على ترك الصف السابع فتأسر الرخ في a7!',
    explanationAr: '«السيخ» (Skewer) هو عكس الربط تماماً: تهاجم القطعة الأغلى (الملك في e7) فتجبرها على التحرك، وتلتقط القطعة التي خلفها (الرخ في a7)!',
  },
];

interface OpeningStep {
  from: string;
  to: string;
  notation: string;
  commentAr: string;
}

interface ChessOpeningPlan {
  id: string;
  side: 'white' | 'black';
  level: ChessLevel;
  nameAr: string;
  nameEn: string;
  ecoCode: string;
  coreIdeaAr: string;
  keyGoalsAr: string[];
  trapWarningAr: string;
  steps: OpeningStep[];
}

const CHESS_OPENINGS: ChessOpeningPlan[] = [
  {
    id: 'italian-giuoco',
    side: 'white',
    level: 'beginner',
    nameAr: 'الافتتاح الإيطالي (Giuoco Piano)',
    nameEn: 'Italian Game (Giuoco Piano)',
    ecoCode: 'C53',
    coreIdeaAr: 'انتشار سريع للقطع نحو المركز، استهداف أضعف مربع في معسكر الأسود (f7)، وبناء مركز بيادق قوي عبر c3 ثم d4.',
    keyGoalsAr: [
      'وضع الفيل في المربع النشط c4 للضغط على القطر a2-g8 ومربع f7.',
      'تمهيد نقلة d4 القوية بدعم البيدق c3 لكسب المساحة في المركز.',
      'التبييت السريع وتوصيل الرخين على عمودي e و d.',
    ],
    trapWarningAr: 'احذر من لعب d4 مبكراً دون إعداد بـ c3 حتى لا يفقد بيدق المركز توازنه بعد تبادل البيادق.',
    steps: [
      { from: 'e2', to: 'e4', notation: '1. e4', commentAr: 'الأبيض يفتح المركز ويحرر خط الفيل والوزير فوراً.' },
      { from: 'e7', to: 'e5', notation: '1... e5', commentAr: 'الأسود يرد بالمثل ويثبت نصيبه من المربعات المركزية.' },
      { from: 'g1', to: 'f3', notation: '2. Nf3', commentAr: 'تطوير الحصان لمربع مثالي مع مهاجمة بيدق e5.' },
      { from: 'b8', to: 'c6', notation: '2... Nc6', commentAr: 'الأسود يدافع عن بيدق e5 بحصانه الطبيعي.' },
      { from: 'f1', to: 'c4', notation: '3. Bc4', commentAr: 'النقلة المميزة للافتتاح الإيطالي: تصويب الفيل مباشرة نحو مربع f7 الضعيف!' },
      { from: 'f8', to: 'c5', notation: '3... Bc5', commentAr: 'الأسود ينشر فيله بنشاط نحو المركز (Giuoco Piano).' },
      { from: 'c2', to: 'c3', notation: '4. c3!', commentAr: 'تمهيد استراتيجي ذكي لدفع d4 وبناء مركز بيادق كاسح!' },
    ],
  },
  {
    id: 'london-system',
    side: 'white',
    level: 'beginner',
    nameAr: 'نظام لندن الصلب (London System)',
    nameEn: 'The Solid London System',
    ecoCode: 'D02',
    coreIdeaAr: 'منظومة استراتيجية متماسكة تلعب بنفس الهيكل الهرمي (d4, Bf4, e3, c3) ضد أي رد من الأسود، مما يوفر وقت التفكير في الافتتاح ويمنحك وسط لعب آمن وهجوماً قوياً على جناح الملك.',
    keyGoalsAr: [
      'إخراج فيل المربعات السوداء إلى f4 قبل إغلاق السلسلة بنقلة e3.',
      'بناء مثلث البيادق الحصين (c3 - d4 - e3) لحماية المركز.',
      'غرس الحصان في المربع المركزي الأمامي e5 وشن هجوم على جناح الملك.',
    ],
    trapWarningAr: 'لا تلعب e3 قبل إخراج الفيل إلى f4 حتى لا تحبس فيلك داخل سلسلة البيادق!',
    steps: [
      { from: 'd2', to: 'd4', notation: '1. d4', commentAr: 'السيطرة على المركز ببيدق الوزير المحمي.' },
      { from: 'd7', to: 'd5', notation: '1... d5', commentAr: 'الأسود يثبت التعادل في المربعات المركزية.' },
      { from: 'c1', to: 'f4', notation: '2. Bf4!', commentAr: 'السر الأول لنظام لندن: تفعيل الفيل خارج سلسلة البيادق نحو المربع النشط f4.' },
      { from: 'g8', to: 'f6', notation: '2... Nf6', commentAr: 'تطوير الحصان الأسود للمركز.' },
      { from: 'e2', to: 'e3', notation: '3. e3', commentAr: 'تثبيت سلسلة البيادق وفتح قطر الفيل الأبيض.' },
      { from: 'c7', to: 'c5', notation: '3... c5', commentAr: 'الأسود يختبر مركز الأبيض من الجناح.' },
      { from: 'c2', to: 'c3', notation: '4. c3', commentAr: 'اكتمال الهرم الصخري للندن (c3-d4-e3) الجاهز لأي مواجهة!' },
    ],
  },
  {
    id: 'queens-gambit',
    side: 'white',
    level: 'intermediate',
    nameAr: 'غامبيت الوزير (Queen\'s Gambit)',
    nameEn: 'Queen\'s Gambit',
    ecoCode: 'D06',
    coreIdeaAr: 'أعظم افتتاح كلاسيكي للأبيض: تقديم بيدق الجناح (c4) لاقتلاع بيدق الأسود المركزي (d5) والسيطرة الكاملة على المربعات المركزية وخطوط الرخ.',
    keyGoalsAr: [
      'إجبار الأسود إما على التنازل عن المركز أو الدفاع السلبي.',
      'تطوير الحصانين إلى c3 و f3 مع الضغط المستمر على مربع d5.',
      'استغلال عمود c شبه المفتوح للرخ في وسط اللعب.',
    ],
    trapWarningAr: 'إذا قبل الأسود الغامبيت (1...dxc4)، لا تتعجل استعادته بل العب e3 أو e4 أولاً للسيطرة على المركز ثم استرده بالفيل.',
    steps: [
      { from: 'd2', to: 'd4', notation: '1. d4', commentAr: 'افتتاح بيدق الوزير للسيطرة الاستراتيجية.' },
      { from: 'd7', to: 'd5', notation: '1... d5', commentAr: 'الأسود يقابل المركز بالمركز.' },
      { from: 'c2', to: 'c4', notation: '2. c4!', commentAr: 'غامبيت الوزير: ضرب بيدق d5 من الجناح لزعزعة سيطرة الأسود على المركز!' },
      { from: 'e7', to: 'e6', notation: '2... e6', commentAr: 'غامبيت الوزير المرفوض (QGD): الأسود يدعم بيدقه في d5.' },
      { from: 'b1', to: 'c3', notation: '3. Nc3', commentAr: 'زيادة الضغط التكتيكي على مربع d5 ومربع e4.' },
      { from: 'g8', to: 'f6', notation: '3... Nf6', commentAr: 'الأسود يعزز دفاعه عن المركز.' },
      { from: 'c1', to: 'g5', notation: '4. Bg5', commentAr: 'ربط الحصان المدافع عن d5 على الوزير الأسود!' },
    ],
  },
  {
    id: 'sicilian-najdorf',
    side: 'black',
    level: 'advanced',
    nameAr: 'الدفاع الصقلي الهجومي (Sicilian Defense)',
    nameEn: 'Sicilian Defense (Open)',
    ecoCode: 'B50',
    coreIdeaAr: 'السلاح الأول لأبطال العالم (كاسباروف وفيشر) للفوز بالأسود: كسر التماثل منذ النقلة الأولى (1...c5) ومبادلة بيدق جناح ببيدق مركزي للأبيض للحصول على تفوق عددي في المركز وهجوم مضاد كاسح على عمود c.',
    keyGoalsAr: [
      'منع الأبيض من تكوين مركز مثالي بـ d4 دون أن يخسر بيدق d4 مقابل بيدق c5.',
      'فتح عمود c للرخ الأسود للضغط على جناح الوزير.',
      'السيطرة على مربع e5 ومربعات اللون الأسود.',
    ],
    trapWarningAr: 'تجنب التأخر في تطوير قطع جناح الملك والتبييت لأن الأبيض يملك مساحة هجومية سريعة.',
    steps: [
      { from: 'e2', to: 'e4', notation: '1. e4', commentAr: 'الأبيض يبدأ بنقلة بيدق الملك الهجومية.' },
      { from: 'c7', to: 'c5', notation: '1... c5!', commentAr: 'الدفاع الصقلي: قتال غير متماثل يرفض التعادل ويراقب مربع d4!' },
      { from: 'g1', to: 'f3', notation: '2. Nf3', commentAr: 'الأبيض يجهز لنقلة d4.' },
      { from: 'd7', to: 'd6', notation: '2... d6', commentAr: 'الأسود يراقب مربع e5 ويفتح طريق فيل المربعات البيضاء.' },
      { from: 'd2', to: 'd4', notation: '3. d4', commentAr: 'الأبيض يفتح المركز.' },
      { from: 'c5', to: 'd4', notation: '3... cxd4!', commentAr: 'الأسود يربح معادلة استراتيجية: بيدق جناح (c) مقابل بيدق مركزي (d)!' },
      { from: 'f3', to: 'd4', notation: '4. Nxd4', commentAr: 'الحصان الأبيض يتمركز، والأسود يستعد لمهاجمته بـ Nf6.' },
    ],
  },
  {
    id: 'caro-kann',
    side: 'black',
    level: 'beginner',
    nameAr: 'دفاع كارو-كان الحصين (Caro-Kann Defense)',
    nameEn: 'Caro-Kann Defense',
    ecoCode: 'B12',
    coreIdeaAr: 'أكثر دفاعات الأسود صلابة وأماناً ضد 1.e4: دعم نقلة d5 بنقلة c6 أولاً، مع الاحتفاظ بقطر مفتوح لإخراج فيل المربعات البيضاء إلى f5 قبل إغلاق السلسلة بنقلة e6.',
    keyGoalsAr: [
      'بناء هيكل بيادق سليم تماماً بلا أي جزر بيادق ضعيفة في النهايات.',
      'إخراج الفيل الأبيض إلى f5 أو g4 قبل لعب e6.',
      'الضغط المضاد على قاعدة سلسلة بيادق الأبيض بنقلة c5.',
    ],
    trapWarningAr: 'بعد إخراج الفيل إلى f5، تذكر توفير مربع هروب له في h7 (بنقلة h6) حتى لا يصطاده الأبيض بالبيادق.',
    steps: [
      { from: 'e2', to: 'e4', notation: '1. e4', commentAr: 'الأبيض يطالب بالمركز.' },
      { from: 'c7', to: 'c6', notation: '1... c6', commentAr: 'كارو-كان: إعداد صخري لنقلة d5.' },
      { from: 'd2', to: 'd4', notation: '2. d4', commentAr: 'الأبيض يأخذ المركز الكامل.' },
      { from: 'd7', to: 'd5', notation: '2... d5!', commentAr: 'الأسود يتحدى بيدق e4 مباشرة مع دعم كامل من بيدق c6.' },
      { from: 'e4', to: 'e5', notation: '3. e5', commentAr: 'تفريع التقدم (Advance Variation): الأبيض يكسب مساحة.' },
      { from: 'c8', to: 'f5', notation: '3... Bf5!', commentAr: 'ميزة كارو-كان الكبرى على الدفاع الفرنسي: الفيل يخرج بحرية إلى f5!' },
    ],
  },
];

export const ChessTacticalLabModal: React.FC<ChessTacticalLabModalProps> = ({
  isOpen,
  onClose,
  isAr,
  onRewardToast,
}) => {
  const [activeTab, setActiveTab] = useState<'puzzles' | 'openings' | 'sandbox'>('puzzles');
  const [levelFilter, setLevelFilter] = useState<'all' | ChessLevel>('all');
  const [flipped, setFlipped] = useState(false);

  // Puzzle State
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [selectedSq, setSelectedSq] = useState<string | null>(null);
  const [hintStage, setHintStage] = useState<0 | 1 | 2>(0);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [wrongAttemptSq, setWrongAttemptSq] = useState<string | null>(null);
  const [solvedIds, setSolvedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('midmar_chess_solved_puzzles') || '[]');
    } catch {
      return [];
    }
  });

  // Opening Repertoire State
  const [selectedOpeningId, setSelectedOpeningId] = useState<string>(CHESS_OPENINGS[0].id);
  const [openingStepIdx, setOpeningStepIdx] = useState<number>(0);
  const [openingSideFilter, setOpeningSideFilter] = useState<'all' | 'white' | 'black'>('all');
  const [personalChessNote, setPersonalChessNote] = useState<string>(() => {
    return localStorage.getItem('midmar_chess_repertoire_notes') || '';
  });

  // Sandbox Board State
  const [sandboxBoard, setSandboxBoard] = useState<BoardGrid>(createInitialBoard);
  const [sandboxSelectedSq, setSandboxSelectedSq] = useState<string | null>(null);
  const [sandboxLastMove, setSandboxLastMove] = useState<{ from: string; to: string } | null>(null);

  const filteredPuzzles = TACTICAL_PUZZLES.filter(
    (p) => levelFilter === 'all' || p.level === levelFilter
  );
  const currentPuzzle = filteredPuzzles[puzzleIdx % Math.max(1, filteredPuzzles.length)] || TACTICAL_PUZZLES[0];

  const [puzzleBoard, setPuzzleBoard] = useState<BoardGrid>(() =>
    buildBoardFromPlacement(currentPuzzle.placements)
  );
  const [puzzleLastMove, setPuzzleLastMove] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    setPuzzleBoard(buildBoardFromPlacement(currentPuzzle.placements));
    setSelectedSq(null);
    setHintStage(0);
    setPuzzleSolved(false);
    setWrongAttemptSq(null);
    setPuzzleLastMove(null);
  }, [currentPuzzle.id]);

  const filteredOpenings = CHESS_OPENINGS.filter(
    (op) =>
      (openingSideFilter === 'all' || op.side === openingSideFilter) &&
      (levelFilter === 'all' || op.level === levelFilter)
  );
  const currentOpening =
    CHESS_OPENINGS.find((o) => o.id === selectedOpeningId) ||
    filteredOpenings[0] ||
    CHESS_OPENINGS[0];

  // Compute board for current opening step
  const openingBoardData = React.useMemo(() => {
    let b = createInitialBoard();
    let lastMv: { from: string; to: string } | null = null;
    const count = Math.min(openingStepIdx, currentOpening.steps.length);
    for (let i = 0; i < count; i++) {
      const st = currentOpening.steps[i];
      b = applyMoveOnBoard(b, st.from, st.to);
      lastMv = { from: st.from, to: st.to };
    }
    return { board: b, lastMove: lastMv };
  }, [currentOpening, openingStepIdx]);

  if (!isOpen) return null;

  const handleSquareClickPuzzle = (sq: string) => {
    if (puzzleSolved) return;
    const [r, c] = sqToCoords(sq);
    const pieceOnSq = puzzleBoard[r]?.[c] || null;

    // If user clicked a friendly piece, select it
    if (
      pieceOnSq &&
      ((currentPuzzle.sideToMove === 'w' && pieceOnSq.startsWith('w')) ||
        (currentPuzzle.sideToMove === 'b' && pieceOnSq.startsWith('b')))
    ) {
      soundSynth.playTactileClick();
      haptic.vibrateLight();
      setSelectedSq(sq);
      setWrongAttemptSq(null);
      return;
    }

    // If a piece is already selected, test the move
    if (selectedSq) {
      if (selectedSq === currentPuzzle.solutionFrom && sq === currentPuzzle.solutionTo) {
        // Correct winning move!
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
        const nextB = applyMoveOnBoard(puzzleBoard, selectedSq, sq);
        setPuzzleBoard(nextB);
        setPuzzleLastMove({ from: selectedSq, to: sq });
        setPuzzleSolved(true);
        setSelectedSq(null);
        setWrongAttemptSq(null);

        if (!solvedIds.includes(currentPuzzle.id)) {
          const updated = [...solvedIds, currentPuzzle.id];
          setSolvedIds(updated);
          localStorage.setItem('midmar_chess_solved_puzzles', JSON.stringify(updated));
        }
        onRewardToast?.(
          isAr
            ? `♟️ نقلة عبقرية (${currentPuzzle.notation})! +20 نقطة تركيز ذهني!`
            : `♟️ Brilliant tactical move (${currentPuzzle.notation})! +20 Focus XP!`
        );
      } else {
        soundSynth.playTactileClick();
        haptic.vibrateDouble();
        setWrongAttemptSq(sq);
      }
    }
  };

  const handleSquareClickSandbox = (sq: string) => {
    const [r, c] = sqToCoords(sq);
    const pieceOnSq = sandboxBoard[r]?.[c] || null;

    if (!sandboxSelectedSq) {
      if (pieceOnSq) {
        soundSynth.playTactileClick();
        setSandboxSelectedSq(sq);
      }
      return;
    }

    if (sandboxSelectedSq === sq) {
      setSandboxSelectedSq(null);
      return;
    }

    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const nextB = applyMoveOnBoard(sandboxBoard, sandboxSelectedSq, sq);
    setSandboxBoard(nextB);
    setSandboxLastMove({ from: sandboxSelectedSq, to: sq });
    setSandboxSelectedSq(null);
  };

  // Determine which board & highlights to render
  const activeBoard =
    activeTab === 'puzzles'
      ? puzzleBoard
      : activeTab === 'openings'
      ? openingBoardData.board
      : sandboxBoard;

  const activeLastMove =
    activeTab === 'puzzles'
      ? puzzleLastMove
      : activeTab === 'openings'
      ? openingBoardData.lastMove
      : sandboxLastMove;

  const rowOrder = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const colOrder = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl rounded-[32px] bg-[#12141a] text-white border border-white/15 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#181b24] via-[#1e1b4b] to-[#142620] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              ♟️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {isAr ? 'مختبر الشطرنج التكتيكي وملف الخطط' : 'Chess Tactical Lab & Opening Repertoire'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 text-[10px] font-bold">
                  {isAr ? `الألغاز المحلولة: ${solvedIds.length}/${TACTICAL_PUZZLES.length}` : `Solved: ${solvedIds.length}/${TACTICAL_PUZZLES.length}`}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 truncate">
                {isAr
                  ? 'تنشيط التركيز الذهني العميق عبر تكتيكات سريعة، هنتات ذكية، وموسوعة خطط الافتتاحيات'
                  : 'Sharpen deep cognitive focus with quick tactical puzzles, smart hints & opening plans'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher & Level Filter Bar */}
        <div className="px-4 py-3 bg-[#161922] border-b border-white/10 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'puzzles' as const, labelAr: '⚡ ألغاز التركيز والهنتات', labelEn: '⚡ Tactical Puzzles' },
              { id: 'openings' as const, labelAr: '📖 ملف خطط الشطرنج', labelEn: '📖 Opening Plans' },
              { id: 'sandbox' as const, labelAr: '🧪 رقعة التجربة الحرة', labelEn: '🧪 Free Board' },
            ].map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setActiveTab(tb.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tb.id
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                }`}
              >
                {isAr ? tb.labelAr : tb.labelEn}
              </button>
            ))}
          </div>

          {/* Level Selector */}
          <div className="flex items-center gap-1">
            {[
              { id: 'all' as const, labelAr: 'الكل', labelEn: 'All' },
              { id: 'beginner' as const, labelAr: '🌱 مبتدئ', labelEn: '🌱 Beginner' },
              { id: 'intermediate' as const, labelAr: '⚡ متوسط', labelEn: '⚡ Interm.' },
              { id: 'advanced' as const, labelAr: '🏆 متقدم', labelEn: '🏆 Advanced' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setLevelFilter(lvl.id);
                  setPuzzleIdx(0);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  levelFilter === lvl.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                }`}
              >
                {isAr ? lvl.labelAr : lvl.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Main Interactive Content Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT / START COLUMN: Interactive 8x8 Chessboard (7 Cols on Desktop) */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-2.5">
            <div className="w-full max-w-[370px] aspect-square rounded-2xl p-2 bg-gradient-to-br from-[#2a241d] to-[#1a1612] border-2 border-amber-500/35 shadow-[0_14px_35px_rgba(0,0,0,0.65)]">
              <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border border-amber-200/20" dir="ltr">
                {rowOrder.map((r) =>
                  colOrder.map((c) => {
                    const sq = coordsToSq(r, c);
                    const isLight = (r + c) % 2 === 0;
                    const piece = activeBoard[r]?.[c] || null;
                    const isSelected =
                      (activeTab === 'puzzles' && selectedSq === sq) ||
                      (activeTab === 'sandbox' && sandboxSelectedSq === sq);
                    const isLastMoveSq =
                      activeLastMove?.from === sq || activeLastMove?.to === sq;
                    const isHintFrom =
                      activeTab === 'puzzles' &&
                      hintStage >= 1 &&
                      !puzzleSolved &&
                      currentPuzzle.solutionFrom === sq;
                    const isHintTo =
                      activeTab === 'puzzles' &&
                      hintStage >= 2 &&
                      !puzzleSolved &&
                      currentPuzzle.solutionTo === sq;
                    const isWrong = activeTab === 'puzzles' && wrongAttemptSq === sq;

                    return (
                      <button
                        key={sq}
                        type="button"
                        onClick={() => {
                          if (activeTab === 'puzzles') handleSquareClickPuzzle(sq);
                          else if (activeTab === 'sandbox') handleSquareClickSandbox(sq);
                        }}
                        className={`relative flex items-center justify-center select-none transition-colors cursor-pointer ${
                          isWrong
                            ? 'bg-rose-500/80'
                            : isSelected
                            ? 'bg-amber-400/85 ring-2 ring-inset ring-white'
                            : isHintTo
                            ? 'bg-emerald-400/75 animate-pulse ring-2 ring-inset ring-emerald-200'
                            : isHintFrom
                            ? 'bg-amber-300/80 ring-2 ring-inset ring-amber-500'
                            : isLastMoveSq
                            ? isLight
                              ? 'bg-[#f6f669]'
                              : 'bg-[#baca44]'
                            : isLight
                            ? 'bg-[#ebecd0] hover:bg-[#dfe2b8]'
                            : 'bg-[#739552] hover:bg-[#668746]'
                        }`}
                      >
                        {/* Algebraic Rank & File Coordinates on Board Edges */}
                        {c === (flipped ? 7 : 0) && (
                          <span
                            className={`absolute top-0.5 left-1 text-[8px] font-mono font-bold leading-none ${
                              isLight ? 'text-[#739552]' : 'text-[#ebecd0]'
                            }`}
                          >
                            {RANKS[r]}
                          </span>
                        )}
                        {r === (flipped ? 0 : 7) && (
                          <span
                            className={`absolute bottom-0.5 right-1 text-[8px] font-mono font-bold leading-none ${
                              isLight ? 'text-[#739552]' : 'text-[#ebecd0]'
                            }`}
                          >
                            {FILES[c]}
                          </span>
                        )}

                        {/* Chess Piece Glyph */}
                        {piece && (
                          <span
                            className={`text-2xl sm:text-3xl leading-none transition-transform ${
                              isSelected ? 'scale-110' : ''
                            } ${
                              piece.startsWith('w')
                                ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)]'
                                : 'text-[#111318] drop-shadow-[0_1px_1px_rgba(255,255,255,0.55)]'
                            }`}
                          >
                            {PIECE_GLYPHS[piece]}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Board Utility Controls */}
            <div className="flex items-center justify-between w-full max-w-[370px] gap-2">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setFlipped((f) => !f);
                }}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <FlipVertical className="w-3.5 h-3.5 text-amber-300" />
                <span>{isAr ? 'قلب الرقعة' : 'Flip Board'}</span>
              </button>

              {activeTab === 'puzzles' && (
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setPuzzleBoard(buildBoardFromPlacement(currentPuzzle.placements));
                    setPuzzleSolved(false);
                    setSelectedSq(null);
                    setWrongAttemptSq(null);
                    setPuzzleLastMove(null);
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isAr ? 'إعادة اللغز' : 'Reset Puzzle'}</span>
                </button>
              )}

              {activeTab === 'sandbox' && (
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setSandboxBoard(createInitialBoard());
                    setSandboxSelectedSq(null);
                    setSandboxLastMove(null);
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isAr ? 'ترتيب البداية' : 'Reset Initial Board'}</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT / END COLUMN: Controls, Hints, or Opening Encyclopedia (6 Cols on Desktop) */}
          <div className="lg:col-span-6 space-y-4">
            {/* ============================================================ */}
            {/* MODE 1: TACTICAL PUZZLES & HINTS                             */}
            {/* ============================================================ */}
            {activeTab === 'puzzles' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[11px] font-bold">
                      {currentPuzzle.motifAr}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      {isAr
                        ? `لغز ${(puzzleIdx % filteredPuzzles.length) + 1} من ${filteredPuzzles.length}`
                        : `Puzzle ${(puzzleIdx % filteredPuzzles.length) + 1} of ${filteredPuzzles.length}`}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {isAr ? currentPuzzle.titleAr : currentPuzzle.titleEn}
                  </h3>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isAr
                      ? '⚪ النقلة للأبيض: اضغط على القطعة الصحيحة على الرقعة ثم اضغط على مربع الهدف لتنفيذ التكتيك القاضي!'
                      : '⚪ White to move: Tap the piece on the board, then tap the target square!'}
                  </p>
                </div>

                {/* Wrong Attempt Feedback */}
                {wrongAttemptSq && !puzzleSolved && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold">
                    {isAr
                      ? '❌ ليست النقلة الأقوى! فكّر في التهديد المباشر أو اضغط على «💡 هنت ذكي» بالأسفل.'
                      : '❌ Not the strongest tactical shot! Try again or tap Hint below.'}
                  </div>
                )}

                {/* Progressive Smart Hints */}
                {!puzzleSolved && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          setHintStage((prev) => (prev === 0 ? 1 : 2));
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-md"
                      >
                        <Lightbulb className="w-4 h-4" />
                        <span>
                          {hintStage === 0
                            ? isAr
                              ? '💡 هنت ١: كشف القطعة والفكرة'
                              : '💡 Hint 1: Piece & Idea'
                            : isAr
                            ? '🎯 هنت ٢: إظهار المربع الهدف على الرقعة'
                            : '🎯 Hint 2: Highlight Target Square'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playCompletionChime();
                          const nextB = applyMoveOnBoard(
                            puzzleBoard,
                            currentPuzzle.solutionFrom,
                            currentPuzzle.solutionTo
                          );
                          setPuzzleBoard(nextB);
                          setPuzzleLastMove({
                            from: currentPuzzle.solutionFrom,
                            to: currentPuzzle.solutionTo,
                          });
                          setPuzzleSolved(true);
                        }}
                        className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-zinc-200 cursor-pointer"
                      >
                        {isAr ? '👁️ تنفيذ الحل على الرقعة' : '👁️ Show Solution'}
                      </button>
                    </div>

                    {hintStage >= 1 && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/35 text-amber-100 text-xs leading-relaxed">
                        {currentPuzzle.hint1Ar}
                      </div>
                    )}
                    {hintStage >= 2 && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-100 text-xs leading-relaxed">
                        {currentPuzzle.hint2Ar}
                      </div>
                    )}
                  </div>
                )}

                {/* Solved Celebration & Tactical Explanation */}
                {puzzleSolved && (
                  <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/45 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>
                          {isAr
                            ? `تكتيك متقن! (${currentPuzzle.notation})`
                            : `Solved! (${currentPuzzle.notation})`}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-zinc-950 text-[11px] font-bold">
                        +20 XP
                      </span>
                    </div>
                    <p className="text-xs text-emerald-50 leading-relaxed">
                      {currentPuzzle.explanationAr}
                    </p>
                  </div>
                )}

                {/* Next / Prev Puzzle Navigation */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setPuzzleIdx(
                        (prev) => (prev - 1 + filteredPuzzles.length) % filteredPuzzles.length
                      );
                    }}
                    className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>{isAr ? 'اللغز السابق' : 'Previous'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setPuzzleIdx((prev) => (prev + 1) % filteredPuzzles.length);
                    }}
                    className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <span>{isAr ? 'اللغز التكتيكي التالي' : 'Next Puzzle'}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* MODE 2: CHESS OPENING PLANS & REPERTOIRE FILE                */}
            {/* ============================================================ */}
            {activeTab === 'openings' && (
              <div className="space-y-3.5">
                {/* White / Black Repertoire Filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all' as const, label: isAr ? 'كل الخطط' : 'All Plans' },
                    { id: 'white' as const, label: isAr ? '⚪ خطط الأبيض' : '⚪ White Repertoire' },
                    { id: 'black' as const, label: isAr ? '⚫ دفاعات الأسود' : '⚫ Black Defenses' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setOpeningSideFilter(s.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                        openingSideFilter === s.id
                          ? 'bg-white text-zinc-950'
                          : 'bg-white/10 text-zinc-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Opening Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {filteredOpenings.map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setSelectedOpeningId(op.id);
                        setOpeningStepIdx(op.steps.length);
                        setFlipped(op.side === 'black');
                      }}
                      className={`px-3 py-2 rounded-2xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                        currentOpening.id === op.id
                          ? 'bg-amber-400/25 border-amber-300 text-amber-200'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      {op.side === 'white' ? '⚪ ' : '⚫ '}
                      {isAr ? op.nameAr : op.nameEn}
                    </button>
                  ))}
                </div>

                {/* Interactive Move Stepper */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-amber-300 font-bold">
                        ECO {currentOpening.ecoCode} • {currentOpening.side === 'white' ? (isAr ? 'خطة الأبيض' : 'White') : (isAr ? 'خطة الأسود' : 'Black')}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {isAr ? currentOpening.nameAr : currentOpening.nameEn}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setOpeningStepIdx(0);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-bold cursor-pointer"
                        title={isAr ? 'بداية الدور' : 'Start'}
                      >
                        ⏮
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setOpeningStepIdx((i) => Math.max(0, i - 1));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
                      >
                        {isAr ? '◀ السابقة' : '◀ Prev'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setOpeningStepIdx((i) => Math.min(currentOpening.steps.length, i + 1));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer"
                      >
                        {isAr ? 'النقلة التالية ▶' : 'Next ▶'}
                      </button>
                    </div>
                  </div>

                  {/* Move Pills Strip */}
                  <div className="flex items-center gap-1.5 flex-wrap" dir="ltr">
                    {currentOpening.steps.map((st, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setOpeningStepIdx(idx + 1);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold cursor-pointer ${
                          openingStepIdx === idx + 1
                            ? 'bg-emerald-400 text-zinc-950'
                            : idx < openingStepIdx
                            ? 'bg-white/15 text-white'
                            : 'bg-white/5 text-zinc-500'
                        }`}
                      >
                        {st.notation}
                      </button>
                    ))}
                  </div>

                  {/* Current Step Commentary */}
                  <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-xs text-indigo-100 leading-relaxed">
                    {openingStepIdx === 0
                      ? isAr
                        ? 'اضغط على «النقلة التالية ▶» لمشاهدة تسلسل خطة الافتتاح خطوة بخطوة على الرقعة.'
                        : 'Tap Next ▶ to step through the opening moves on the board.'
                      : currentOpening.steps[openingStepIdx - 1]?.commentAr}
                  </div>

                  {/* Strategic Plan & Goals */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-amber-300 block">
                      🎯 {isAr ? 'الخطة الاستراتيجية في وسط اللعب:' : 'Middlegame Strategic Plan:'}
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {currentOpening.coreIdeaAr}
                    </p>
                    <ul className="space-y-1 text-[11px] text-zinc-200 list-disc list-inside">
                      {currentOpening.keyGoalsAr.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-[11px] text-rose-200 mt-2">
                      ⚠️ <strong>{isAr ? 'تنبيه تكتيكي:' : 'Trap Alert:'}</strong> {currentOpening.trapWarningAr}
                    </div>
                  </div>
                </div>

                {/* Personal Chess Repertoire Notes */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isAr ? 'دفتر خططي وملاحظاتي الخاصة في الشطرنج:' : 'My Personal Chess Repertoire Notes:'}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={personalChessNote}
                    onChange={(e) => {
                      setPersonalChessNote(e.target.value);
                      localStorage.setItem('midmar_chess_repertoire_notes', e.target.value);
                    }}
                    placeholder={
                      isAr
                        ? 'سجّل هنا تفريعاتك المفضلة، أو الأخطاء التي تريد تجنبها في مبارياتك القادمة...'
                        : 'Write your favorite variations or opening notes here...'
                    }
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* MODE 3: FREE SANDBOX BOARD                                   */}
            {/* ============================================================ */}
            {activeTab === 'sandbox' && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isAr ? 'رقعة التحليل والتجربة الحرة' : 'Free Analysis & Sandbox Board'}</span>
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isAr
                    ? 'اضغط على أي قطعة ثم اضغط على أي مربع على الرقعة لتحريكها بحرية وتجربة الخطط والتفريعات التي تدور في ذهنك.'
                    : 'Tap any piece and tap any target square to freely test variations and plans.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
