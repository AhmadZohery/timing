import React, { useState, useEffect, useRef } from 'react';
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
  Flame,
  Shield,
  Swords,
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
type BoardTheme = 'walnut' | 'tournament' | 'obsidian';
type PieceCode =
  | 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP'
  | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP'
  | null;

type BoardGrid = PieceCode[][]; // 8x8 [row 0..7 (rank 8..1)][col 0..7 (file a..h)]

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/**
 * Staunton Tournament SVG Piece Renderer
 * Renders crisp, 3D-shaded Staunton chess pieces (never flat system emojis)
 */
const StauntonPieceSvg: React.FC<{ piece: Exclude<PieceCode, null>; className?: string }> = ({
  piece,
  className = 'w-[82%] h-[82%]',
}) => {
  const isWhite = piece.startsWith('w');
  const type = piece[1] as 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

  const fillId = isWhite ? 'url(#stauntonWhiteGrad)' : 'url(#stauntonBlackGrad)';
  const strokeColor = isWhite ? '#1e2028' : '#090a0f';
  const innerAccent = isWhite ? '#d4a853' : '#f59e0b';
  const innerLine = isWhite ? '#475569' : '#94a3b8';

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} select-none pointer-events-none drop-shadow-[0_3px_3px_rgba(0,0,0,0.55)]`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="stauntonWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f8f5eb" />
          <stop offset="100%" stopColor="#d9d2c0" />
        </linearGradient>
        <linearGradient id="stauntonBlackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b4254" />
          <stop offset="45%" stopColor="#1f2430" />
          <stop offset="100%" stopColor="#0f1219" />
        </linearGradient>
      </defs>

      {type === 'P' && (
        <g fill={fillId} stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22.5,9 C 19.5,9 17,11.5 17,14.5 C 17,16.8 18.4,18.7 20.4,19.5 C 17.5,21.2 15.5,24.5 15.5,29 L 29.5,29 C 29.5,24.5 27.5,21.2 24.6,19.5 C 26.6,18.7 28,16.8 28,14.5 C 28,11.5 25.5,9 22.5,9 z" />
          <path d="M 12.5,33 L 32.5,33 C 33.5,31 31,29 29.5,29 L 15.5,29 C 14,29 11.5,31 12.5,33 z" />
          <rect x="10.5" y="34" width="24" height="4.5" rx="1.5" />
          <line x1="16" y1="29" x2="29" y2="29" stroke={innerLine} strokeWidth="1" />
        </g>
      )}

      {type === 'R' && (
        <g fill={fillId} stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 11,35 L 34,35 L 33,31 L 12,31 L 11,35 z" />
          <rect x="9.5" y="35" width="26" height="4" rx="1.2" />
          <path d="M 14,31 L 15.5,17 L 29.5,17 L 31,31 L 14,31 z" />
          <path d="M 12,17 L 33,17 L 33,10.5 L 29.5,10.5 L 29.5,13.5 L 25.5,13.5 L 25.5,10.5 L 19.5,10.5 L 19.5,13.5 L 15.5,13.5 L 15.5,10.5 L 12,10.5 L 12,17 z" />
          <line x1="15.5" y1="20" x2="29.5" y2="20" stroke={innerLine} strokeWidth="1" />
        </g>
      )}

      {type === 'N' && (
        <g fill={fillId} stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
          <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
          <circle cx="15.5" cy="14.5" r="1.3" fill={innerAccent} stroke="none" />
          <rect x="9.5" y="35" width="26" height="4" rx="1.2" />
        </g>
      )}

      {type === 'B' && (
        <g fill={fillId} stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22.5" cy="8" r="2.3" fill={innerAccent} />
          <path d="M 15,31 C 15,24 14,18 22.5,10.5 C 31,18 30,24 30,31 L 15,31 z" />
          <path d="M 20,16 L 25,16 M 22.5,13.5 L 22.5,18.5" stroke={innerAccent} strokeWidth="1.6" />
          <path d="M 11.5,35 L 33.5,35 L 31.5,31 L 13.5,31 L 11.5,35 z" />
          <rect x="9.5" y="35" width="26" height="4" rx="1.2" />
        </g>
      )}

      {type === 'Q' && (
        <g fill={fillId} stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 9,13 L 14.5,29 L 30.5,29 L 36,13 L 29,21 L 22.5,11 L 16,21 L 9,13 z" />
          <circle cx="8.5" cy="11.5" r="1.8" fill={innerAccent} />
          <circle cx="15.5" cy="9.5" r="1.8" fill={innerAccent} />
          <circle cx="22.5" cy="8" r="2" fill={innerAccent} />
          <circle cx="29.5" cy="9.5" r="1.8" fill={innerAccent} />
          <circle cx="36.5" cy="11.5" r="1.8" fill={innerAccent} />
          <path d="M 12,34 L 33,34 L 31,29 L 14,29 L 12,34 z" />
          <rect x="9.5" y="34.5" width="26" height="4.2" rx="1.2" />
        </g>
      )}

      {type === 'K' && (
        <g fill={fillId} stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22.5,5 L 22.5,11 M 19.5,8 L 25.5,8" stroke={innerAccent} strokeWidth="2.2" />
          <path d="M 22.5,11 C 18,11 16.5,15.5 17.5,21 L 27.5,21 C 28.5,15.5 27,11 22.5,11 z" />
          <path d="M 11.5,30 C 11.5,22 16,18 22.5,18 C 29,18 33.5,22 33.5,30 L 11.5,30 z" />
          <path d="M 11.5,34.5 L 33.5,34.5 L 32,30 L 13,30 L 11.5,34.5 z" />
          <rect x="9.5" y="34.5" width="26" height="4.2" rx="1.2" />
        </g>
      )}
    </svg>
  );
};

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
    if (piece === 'wP' && r2 === 0) {
      next[r2][c2] = 'wQ';
    } else if (piece === 'bP' && r2 === 7) {
      next[r2][c2] = 'bQ';
    } else {
      next[r2][c2] = piece;
    }
  }
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

/**
 * Multi-Move Tactical Combination Step
 * Allows 2-move and 3-move combinations where the opponent automatically plays the best defensive reply!
 */
interface TacticalCombinationStep {
  playerFrom: string;
  playerTo: string;
  playerNotation: string;
  opponentReplyFrom?: string;
  opponentReplyTo?: string;
  opponentReplyNotation?: string;
}

interface TacticalPuzzle {
  id: string;
  eloRating: number;
  level: ChessLevel;
  titleAr: string;
  titleEn: string;
  motifAr: string;
  evalLabel: string; // e.g., "#2", "#3", "+6.4"
  sideToMove: 'w' | 'b';
  opponentLastMove?: { from: string; to: string; descAr: string };
  placements: Record<string, Exclude<PieceCode, null>>;
  steps: TacticalCombinationStep[];
  hint1Ar: string;
  hint2Ar: string;
  explanationAr: string;
}

// 10 Realistic, Full-Board, Multi-Move Master & Tournament Tactical Combinations (1700 - 2450 ELO)
const TACTICAL_PUZZLES: TacticalPuzzle[] = [
  {
    id: 'puz-morphy-opera-sacrifice',
    eloRating: 1850,
    level: 'intermediate',
    titleAr: 'تضحية مورفي الخالدة بالوزير (Opera House Mate in 2)',
    titleEn: 'Morphy Opera House Queen Sacrifice (#2)',
    motifAr: 'تضحية وزير إجبارية + مات بالرخ (2 نقلات)',
    evalLabel: '#2',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'b4',
      to: 'd7',
      descAr: 'الأسود تراجع بحصانه إلى d7 ظناً منه أنه يحمي مربع b8!',
    },
    placements: {
      e8: 'bK', h8: 'bR', d7: 'bN', f6: 'bQ', e7: 'bP', f7: 'bP', g7: 'bP', h7: 'bP', a7: 'bP',
      b3: 'wQ', g5: 'wB', d1: 'wR', e1: 'wK', f2: 'wP', g2: 'wP', h2: 'wP', c2: 'wP', a2: 'wP',
    },
    steps: [
      {
        playerFrom: 'b3',
        playerTo: 'b8',
        playerNotation: '1. Qb8+!!',
        opponentReplyFrom: 'd7',
        opponentReplyTo: 'b8',
        opponentReplyNotation: '1... Nxb8',
      },
      {
        playerFrom: 'd1',
        playerTo: 'd8',
        playerNotation: '2. Rd8#',
      },
    ],
    hint1Ar: '💡 تلميح ١ (النقلة الأولى): الحصان الأسود في d7 هو المدافع الوحيد عن مربع d8، لكنه مربوط أيضاً! كيف تجبره على ترك حراسة d8 بتضحية صاعقة؟',
    hint2Ar: '🎯 تلميح ٢: ضحِّ بالوزير الأبيض من b3 إلى b8 (1. Qb8+!!)! بعد أن يأكله الحصان (1...Nxb8)، انزل بالرخ من d1 إلى d8 كش مات (2. Rd8#)!',
    explanationAr: 'رائعة بول مورفي الخالدة في أوبرا باريس (1858)! تضحية الوزير 1.Qb8+!! تشتت الحصان المدافع عن d8، فيصبح الفيل في g5 والرخ في d8 يطبقان كش مات ساحق (2.Rd8#).',
  },
  {
    id: 'puz-philidor-smothered-mate',
    eloRating: 2050,
    level: 'advanced',
    titleAr: 'المات المخنوق بتضحية الوزير (Philidor Smothered Mate)',
    titleEn: 'Philidor Legacy Smothered Mate (#2)',
    motifAr: 'تضحية وزير لحبس الملك + كش مات مخنوق بالحصان',
    evalLabel: '#2',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'g8',
      to: 'h8',
      descAr: 'الملك الأسود هرب للزاوية h8 بعد الكش المزدوج!',
    },
    placements: {
      h8: 'bK', f8: 'bR', a8: 'bR', d6: 'bB', c5: 'bQ', g7: 'bP', h7: 'bP', b7: 'bP', a7: 'bP',
      b3: 'wQ', h6: 'wN', c4: 'wB', f1: 'wR', g1: 'wK', f2: 'wP', g2: 'wP', h2: 'wP', a2: 'wP',
    },
    steps: [
      {
        playerFrom: 'b3',
        playerTo: 'g8',
        playerNotation: '1. Qg8+!!',
        opponentReplyFrom: 'f8',
        opponentReplyTo: 'g8',
        opponentReplyNotation: '1... Rxg8',
      },
      {
        playerFrom: 'h6',
        playerTo: 'f7',
        playerNotation: '2. Nf7#',
      },
    ],
    hint1Ar: '💡 تلميح ١: الملك الأسود محشور في الزاوية h8، لكن المربع g8 ما زال فارغاً! كيف تجبر الرخ الأسود نفسه على سد المربع g8 على ملكه؟',
    hint2Ar: '🎯 تلميح ٢: ضحِّ بالوزير في قلب الزاوية: من b3 إلى g8 (1. Qg8+!!)! الملك لا يستطيع الأكل بسبب حماية الحصان في h6، فيضطر الرخ للأكل (1...Rxg8)، ثم 2. Nf7# مات مخنوق!',
    explanationAr: 'إعجاز تكتيكي! تضحية الوزير 1.Qg8+!! تجبر الرخ الأسود (1...Rxg8) على إغلاق آخر منفذ تنفس لملكه، ليقفز الحصان إلى f7 (2.Nf7#) في أشهر «مات مخنوق» في تاريخ الشطرنج.',
  },
  {
    id: 'puz-anastasia-hook-mate',
    eloRating: 1920,
    level: 'intermediate',
    titleAr: 'مات أناستاسيا عبر تضحية الوزير (Anastasia\'s Mate)',
    titleEn: 'Anastasia\'s Tactical Combination (#2)',
    motifAr: 'تضحية بفتح عمود h + تنسيق الحصان والرخ',
    evalLabel: '#2',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'g8',
      to: 'h8',
      descAr: 'الأسود ظن أن بيدق h7 يحمي ملكه من الرخ!',
    },
    placements: {
      h8: 'bK', f8: 'bR', c8: 'bB', d8: 'bQ', f7: 'bP', h7: 'bP', c6: 'bP', b7: 'bP', a7: 'bP',
      h5: 'wQ', e7: 'wN', e3: 'wR', g1: 'wK', d3: 'wB', f2: 'wP', g2: 'wP', c3: 'wP', a2: 'wP',
    },
    steps: [
      {
        playerFrom: 'h5',
        playerTo: 'h7',
        playerNotation: '1. Qxh7+!!',
        opponentReplyFrom: 'h8',
        opponentReplyTo: 'h7',
        opponentReplyNotation: '1... Kxh7',
      },
      {
        playerFrom: 'e3',
        playerTo: 'h3',
        playerNotation: '2. Rh3#',
      },
    ],
    hint1Ar: '💡 تلميح ١: الحصان الأبيض في e7 يسيطر تماماً على مربعي الهروب g8 و g6! ما العائق الوحيد أمام رخك في e3 لتوجيه القاضية على عمود h؟',
    hint2Ar: '🎯 تلميح ٢: حطّم بيدق h7 بالوزير (1. Qxh7+!!)، وبعد أن يأكل الملك إجبارياً (1...Kxh7)، انقل الرخ من e3 إلى h3 (2. Rh3#) كش مات!',
    explanationAr: 'مات أناستاسيا النموذجي! الحصان في e7 يصنع جداراً نارياً يمنع الملك الأسود من الهروب إلى عمود g، وتضحية الوزير 1.Qxh7+!! تفتح عمود h للرخ ليحسم الدور بـ 2.Rh3#.',
  },
  {
    id: 'puz-boden-criss-cross',
    eloRating: 1980,
    level: 'intermediate',
    titleAr: 'مقص الفيلين القاتل (Boden\'s Criss-Cross Mate)',
    titleEn: 'Boden\'s Mate with Queen Sacrifice (#2)',
    motifAr: 'تضحية وزير لتدمير حصن التبييت الطويل + مقص الفيلين',
    evalLabel: '#2',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'e8',
      to: 'c8',
      descAr: 'الأسود بيّت طويلاً (O-O-O) ظناً أن جناح الوزير آمن!',
    },
    placements: {
      c8: 'bK', d8: 'bR', f8: 'bB', d7: 'bP', c6: 'bP', b7: 'bP', a7: 'bP', e6: 'bP', f5: 'bQ',
      c3: 'wQ', f4: 'wB', e2: 'wB', d1: 'wR', g1: 'wK', f2: 'wP', g2: 'wP', h2: 'wP', a3: 'wP',
    },
    steps: [
      {
        playerFrom: 'c3',
        playerTo: 'c6',
        playerNotation: '1. Qxc6+!!',
        opponentReplyFrom: 'b7',
        opponentReplyTo: 'c6',
        opponentReplyNotation: '1... bxc6',
      },
      {
        playerFrom: 'e2',
        playerTo: 'a6',
        playerNotation: '2. Ba6#',
      },
    ],
    hint1Ar: '💡 تلميح ١: الفيل الأبيض في f4 يقطع القطر h2-b8 على الملك الأسود في c8! كيف تفتح القطر المتقاطع a6-c8 لفيلك الثاني في e2؟',
    hint2Ar: '🎯 تلميح ٢: اضرب البيدق c6 بالوزير (1. Qxc6+!!)! عندما يأكل بيدق b7 الوزير (1...bxc6)، ينفتح القطر وتلعب الفيل من e2 إلى a6 (2. Ba6#) كش مات!',
    explanationAr: '«مات بودين» (Boden\'s Mate)! التضحية 1.Qxc6+!! تجبر بيدق b7 على التحرك إلى c6 فيغلق على ملكه وينكشف قطر a6-c8 ليتقاطع الفيلان (f4 و a6) كالمقص على الملك.',
  },
  {
    id: 'puz-deflection-backrank-combo',
    eloRating: 2120,
    level: 'advanced',
    titleAr: 'تشتيت الوزير المدافع عن الصف الثامن (Deflection Combo)',
    titleEn: 'Queen Deflection & Back-Rank Combination',
    motifAr: 'تشتيت المدافع الوحيد (Deflection) + استغلال ضعف الصف الخلفي',
    evalLabel: '+9.2',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'd8',
      to: 'c7',
      descAr: 'الوزير الأسود تحرك إلى c7 ليحمي الرخ في e7 ويضغط على c2!',
    },
    placements: {
      g8: 'bK', e7: 'bR', c7: 'bQ', f7: 'bP', g7: 'bP', h7: 'bP', b6: 'bP', a7: 'bP',
      d6: 'wQ', e1: 'wR', c1: 'wR', g1: 'wK', f2: 'wP', g2: 'wP', h2: 'wP', c2: 'wP', a3: 'wP',
    },
    steps: [
      {
        playerFrom: 'd6',
        playerTo: 'c7',
        playerNotation: '1. Qxc7!',
        opponentReplyFrom: 'e7',
        opponentReplyTo: 'c7',
        opponentReplyNotation: '1... Rxc7',
      },
      {
        playerFrom: 'e1',
        playerTo: 'e8',
        playerNotation: '2. Re8#',
      },
    ],
    hint1Ar: '💡 تلميح ١: الرخ الأسود في e7 يقوم بمهمتين مستحيلتين في وقت واحد (Overloaded): حماية الوزير في c7 وحماية الصف الثامن في e8!',
    hint2Ar: '🎯 تلميح ٢: التهم الوزير الأسود فوراً من d6 إلى c7 (1. Qxc7!)، وإذا استرد الأسود بالرخ (1...Rxc7)، انزل برخك من e1 إلى e8 (2. Re8#) كش مات!',
    explanationAr: 'تكتيك «القطعة المثقلة بالمهام» (Overloaded Piece)! الرخ الأسود في e7 لا يستطيع حماية الوزير في c7 وحراسة مربع المات e8 في آنٍ واحد.',
  },
  {
    id: 'puz-arabian-knight-rook-mate',
    eloRating: 1780,
    level: 'beginner',
    titleAr: 'المات العربي الأصيل بالرخ والحصان (Arabian Mate in 2)',
    titleEn: 'Classic Arabian Mate Combination (#2)',
    motifAr: 'التعاون الهندسي الفريد بين الحصان والرخ في الزاوية',
    evalLabel: '#2',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'g8',
      to: 'h8',
      descAr: 'الملك الأسود تراجع للركن h8 هرباً من الحصان!',
    },
    placements: {
      h8: 'bK', a8: 'bR', d5: 'bB', f6: 'bP', d6: 'bP', b7: 'bP', a7: 'bP',
      f5: 'wN', g7: 'wR', c1: 'wR', g1: 'wK', f2: 'wP', g2: 'wP', h3: 'wP', b2: 'wP',
    },
    steps: [
      {
        playerFrom: 'f5',
        playerTo: 'h6',
        playerNotation: '1. Nh6!',
        opponentReplyFrom: 'a8',
        opponentReplyTo: 'f8',
        opponentReplyNotation: '1... Rf8',
      },
      {
        playerFrom: 'g7',
        playerTo: 'h7',
        playerNotation: '2. Rh7#',
      },
    ],
    hint1Ar: '💡 تلميح ١: الملك الأسود محبوس في h8! أي نقلة بالحصان الأبيض من f5 تراقب مربع الهروب g8 وتحمي في نفس الوقت مربع المات h7؟',
    hint2Ar: '🎯 تلميح ٢: العب الحصان من f5 إلى h6 (1. Nh6!)، ومهما لعب الأسود (1...Rf8)، اختم الدور بالرخ من g7 إلى h7 (2. Rh7#) كش مات!',
    explanationAr: '«المات العربي» (Arabian Mate) هو أقدم تكتيك مسجل في تاريخ الشطرنج منذ عصر المنصوري والصولي: الحصان في h6 يحرس الرخ في h7 ويمنع الملك من الهروب إلى g8!',
  },
  {
    id: 'puz-greek-gift-continuation',
    eloRating: 2180,
    level: 'advanced',
    titleAr: 'هدية الإغريق الكاملة واقتحام القلعة (Greek Gift Assault)',
    titleEn: 'Full Greek Gift Sacrifice & Knight Invasion',
    motifAr: 'تضحية الفيل في h7 + قفزة الحصان المزدوجة',
    evalLabel: '+7.8',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'f8',
      to: 'e8',
      descAr: 'الأسود حرّك رخه إلى e8 وترك الملك في g8 بلا حصان مدافع في f6!',
    },
    placements: {
      g8: 'bK', e8: 'bR', c8: 'bB', d8: 'bQ', b8: 'bN', f7: 'bP', g7: 'bP', h7: 'bP', d5: 'bP', c6: 'bP', a7: 'bP',
      d3: 'wB', f3: 'wN', d1: 'wQ', e4: 'wP', h4: 'wP', f1: 'wR', g1: 'wK', c2: 'wP', b2: 'wP', a2: 'wP',
    },
    steps: [
      {
        playerFrom: 'd3',
        playerTo: 'h7',
        playerNotation: '1. Bxh7+!!',
        opponentReplyFrom: 'g8',
        opponentReplyTo: 'h7',
        opponentReplyNotation: '1... Kxh7',
      },
      {
        playerFrom: 'f3',
        playerTo: 'g5',
        playerNotation: '2. Ng5+!',
      },
    ],
    hint1Ar: '💡 تلميح ١: شروط «هدية الإغريق» مكتملة: فيلك في d3 يصوب على h7، حصانك في f3 جاهز للقفز إلى g5، ولا يوجد حصان أسود في f6!',
    hint2Ar: '🎯 تلميح ٢: فجّر حصن الملك بـ 1. Bxh7+!! (من d3 إلى h7)، وبعد 1...Kxh7 اقفز بحصانك من f3 إلى g5 (2. Ng5+!) لفتح طريق الوزير إلى h5!',
    explanationAr: 'منظومة هدية الإغريق الكاملة (1.Bxh7+!! Kxh7 2.Ng5+!) تخرج الملك الأسود إلى العراء تحت نيران الوزير الأبيض (Qh5) والرخ في h4.',
  },
  {
    id: 'puz-windmill-clearance-sacrifice',
    eloRating: 2290,
    level: 'advanced',
    titleAr: 'تضحية إخلاء المربع وكش الرخين الأعمى (Blind Swine Clearance)',
    titleEn: 'Clearance Sacrifice & 7th Rank Mate (#2)',
    motifAr: 'تضحية لإخلاء الصف السابع + مات الرخين في الزاوية',
    evalLabel: '#2',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'f8',
      to: 'd8',
      descAr: 'الأسود سحب رخه إلى d8 وترك الملك وحيداً في h8!',
    },
    placements: {
      h8: 'bK', d8: 'bR', b6: 'bQ', e6: 'bP', h7: 'bP', a7: 'bP', b7: 'bP',
      f7: 'wR', g6: 'wB', g1: 'wR', h1: 'wK', f2: 'wP', h2: 'wP', a3: 'wP',
    },
    steps: [
      {
        playerFrom: 'f7',
        playerTo: 'h7',
        playerNotation: '1. Rxh7+!!',
        opponentReplyFrom: 'h8',
        opponentReplyTo: 'h7',
        opponentReplyNotation: '1... Kxh7',
      },
      {
        playerFrom: 'g1',
        playerTo: 'g7',
        playerNotation: '2. Rg7# / Qh5#',
      },
    ],
    hint1Ar: '💡 تلميح ١: بيدق h7 يحمي الملك الأسود، لكن الفيل في g6 يحرس مربع h7! كيف تحطم الغطاء وتستدرج الملك لمربع المات؟',
    hint2Ar: '🎯 تلميح ٢: اضرب بيدق h7 بالرخ (1. Rxh7+!)، وبعد 1...Kxh7 انزل بالرخ الثاني من g1 إلى g7 (2. Rg7+) محمياً بالفيل!',
    explanationAr: 'تدمير الغطاء الدفاعي على الصف السابع وعمود g المفتوح يضع الملك الأسود في شبكة مات قاتلة بالتعاون بين الرخين والفيل.',
  },
  {
    id: 'puz-zwischenzug-royal-fork',
    eloRating: 1890,
    level: 'intermediate',
    titleAr: 'النقلة البينية الخادعة قبل الشوكة الملكية (Zwischenzug Fork)',
    titleEn: 'Decoy Sacrifice into Royal Knight Fork (#2)',
    motifAr: 'استدراج الملك (Decoy) إلى مربع الشوكة الملكية',
    evalLabel: '+8.5',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'd8',
      to: 'c7',
      descAr: 'الوزير الأسود وقف في c7 على مرمى شوكة الحصان لو كان الملك في e8 أو g7!',
    },
    placements: {
      g8: 'bK', c7: 'bQ', f8: 'bR', f7: 'bP', g7: 'bP', h7: 'bP', c6: 'bP', b7: 'bP',
      g6: 'wR', f5: 'wN', d3: 'wB', g1: 'wK', f2: 'wP', g2: 'wP', h2: 'wP',
    },
    steps: [
      {
        playerFrom: 'g6',
        playerTo: 'g7',
        playerNotation: '1. Rxg7+!!',
        opponentReplyFrom: 'g8',
        opponentReplyTo: 'g7',
        opponentReplyNotation: '1... Kxg7',
      },
      {
        playerFrom: 'f5',
        playerTo: 'e7',
        playerNotation: '2. Ne7+! (أو Nh6+)',
      },
    ],
    hint1Ar: '💡 تلميح ١: لو كان الملك الأسود في g7، لقفز الحصان من f5 ليوجه شوكة قاتلة! كيف تجبر الملك الأسود على الوقوف في g7؟',
    hint2Ar: '🎯 تلميح ٢: ضحِّ بالرخ من g6 إلى g7 (1. Rxg7+!!)! بعد أن يأكل الملك إجبارياً (1...Kxg7)، اقفز بالحصان من f5 إلى e7 (2. Ne7+) لكسب الوزير في c7!',
    explanationAr: 'تكتيك «الاستدراج» (Decoy Sacrifice)! تضحية الرخ 1.Rxg7+!! تسحب الملك الأسود لمربع سيئ ليقع مع وزيره في c7 تحت شوكة الحصان 2.Ne7+!',
  },
  {
    id: 'puz-opera-pin-mate-3',
    eloRating: 2380,
    level: 'advanced',
    titleAr: 'تكتيك الأستاذ الكبير: شل الوزير المربوط والاختراق (GM Pin Crush)',
    titleEn: 'Grandmaster Pin Exploitation & Mating Net (#2)',
    motifAr: 'استغلال الربط المطلق للوزير على الملك (Absolute Pin)',
    evalLabel: '#2',
    sideToMove: 'w',
    opponentLastMove: {
      from: 'd8',
      to: 'e7',
      descAr: 'الأسود غطى الكش بالوزير في e7 ظناً أنه يدافع عن f6!',
    },
    placements: {
      e8: 'bK', e7: 'bQ', h8: 'bR', a8: 'bR', d6: 'bP', f7: 'bP', g7: 'bP', h7: 'bP', b7: 'bP',
      f6: 'wQ', g5: 'wN', e1: 'wR', g1: 'wK', c4: 'wB', f2: 'wP', g2: 'wP', h2: 'wP',
    },
    steps: [
      {
        playerFrom: 'f6',
        playerTo: 'e7',
        playerNotation: '1. Qxe7# (أو 1. Bxf7+)',
      },
    ],
    hint1Ar: '💡 تلميح ١: انظر إلى الملك الأسود في e8 ووزيره في e7 ورخك في e1 وفيلك في c4 وحصانك في g5!',
    hint2Ar: '🎯 تلميح ٢: الوزير الأبيض في f6 محمي بحصانك في g5! التهم الوزير في e7 مباشرة (1. Qxe7#): كش مات لأن الفيل في c4 يراقب f7 والوزير يغلق d8 و f8!',
    explanationAr: 'تنسيق هندسي كامل بين القطع الأربع (الوزير، الرخ في e1، الفيل في c4، والحصان في g5) يخنق الملك الأسود في وسط الرقعة بضربة قاضية 1.Qxe7#!',
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

const DAILY_GAUNTLET_TARGET = 5;
const MAX_DAILY_ATTEMPTS = 5;

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const ChessTacticalLabModal: React.FC<ChessTacticalLabModalProps> = ({
  isOpen,
  onClose,
  isAr,
  onRewardToast,
}) => {
  const [activeTab, setActiveTab] = useState<'puzzles' | 'openings' | 'sandbox'>('puzzles');
  const [levelFilter, setLevelFilter] = useState<'all' | ChessLevel>('all');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('walnut');
  const [flipped, setFlipped] = useState(false);

  // Puzzle & Multi-Step State
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [moveHistoryLog, setMoveHistoryLog] = useState<string[]>([]);
  const [selectedSq, setSelectedSq] = useState<string | null>(null);
  const [hintStage, setHintStage] = useState<0 | 1 | 2>(0);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [wrongAttemptSq, setWrongAttemptSq] = useState<string | null>(null);
  const opponentTimerRef = useRef<number | null>(null);

  // 5 Daily Attempts + 5 Daily Gauntlet Rounds Tracker
  const [attemptsLeft, setAttemptsLeft] = useState<number>(() => {
    const savedDate = localStorage.getItem('midmar_chess_attempts_date');
    const today = getTodayKey();
    if (savedDate !== today) {
      localStorage.setItem('midmar_chess_attempts_date', today);
      localStorage.setItem('midmar_chess_attempts_left', String(MAX_DAILY_ATTEMPTS));
      return MAX_DAILY_ATTEMPTS;
    }
    const raw = Number(localStorage.getItem('midmar_chess_attempts_left'));
    return Number.isFinite(raw) && raw > 0 ? raw : MAX_DAILY_ATTEMPTS;
  });

  const [todaySolvedCount, setTodaySolvedCount] = useState<number>(() => {
    const savedDate = localStorage.getItem('midmar_chess_gauntlet_date');
    const today = getTodayKey();
    if (savedDate !== today) {
      localStorage.setItem('midmar_chess_gauntlet_date', today);
      localStorage.setItem('midmar_chess_today_solved', '0');
      return 0;
    }
    return Number(localStorage.getItem('midmar_chess_today_solved') || '0');
  });

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
  const currentPuzzle =
    filteredPuzzles[puzzleIdx % Math.max(1, filteredPuzzles.length)] || TACTICAL_PUZZLES[0];
  const activeStep =
    currentPuzzle.steps[Math.min(currentStepIdx, currentPuzzle.steps.length - 1)] ||
    currentPuzzle.steps[0];

  const [puzzleBoard, setPuzzleBoard] = useState<BoardGrid>(() =>
    buildBoardFromPlacement(currentPuzzle.placements)
  );
  const [puzzleLastMove, setPuzzleLastMove] = useState<{ from: string; to: string } | null>(
    currentPuzzle.opponentLastMove
      ? { from: currentPuzzle.opponentLastMove.from, to: currentPuzzle.opponentLastMove.to }
      : null
  );

  // Reset board when puzzle changes
  useEffect(() => {
    if (opponentTimerRef.current) {
      window.clearTimeout(opponentTimerRef.current);
    }
    setPuzzleBoard(buildBoardFromPlacement(currentPuzzle.placements));
    setCurrentStepIdx(0);
    setIsOpponentThinking(false);
    setMoveHistoryLog([]);
    setSelectedSq(null);
    setHintStage(0);
    setPuzzleSolved(false);
    setWrongAttemptSq(null);
    setPuzzleLastMove(
      currentPuzzle.opponentLastMove
        ? { from: currentPuzzle.opponentLastMove.from, to: currentPuzzle.opponentLastMove.to }
        : null
    );
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

  const updateAttempts = (nextVal: number) => {
    const clamped = Math.max(0, Math.min(MAX_DAILY_ATTEMPTS, nextVal));
    setAttemptsLeft(clamped);
    localStorage.setItem('midmar_chess_attempts_date', getTodayKey());
    localStorage.setItem('midmar_chess_attempts_left', String(clamped));
  };

  const handleRefillAttempts = () => {
    soundSynth.playCompletionChime();
    haptic.vibrateLight();
    updateAttempts(MAX_DAILY_ATTEMPTS);
    setWrongAttemptSq(null);
    onRewardToast?.(
      isAr
        ? '♟️ تم تجديد الـ 5 محاولات التكتيكية كاملة! ركّز واحسب النقلات بعمق.'
        : '♟️ All 5 tactical attempts restored!'
    );
  };

  const handleSquareClickPuzzle = (sq: string) => {
    if (puzzleSolved || isOpponentThinking) return;
    if (attemptsLeft <= 0) {
      soundSynth.playTactileClick();
      haptic.vibrateDouble();
      return;
    }

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

    // If a piece is already selected, test the move against current step
    if (selectedSq) {
      if (selectedSq === activeStep.playerFrom && sq === activeStep.playerTo) {
        soundSynth.playTactileClick();
        haptic.vibrateLight();
        const afterPlayerBoard = applyMoveOnBoard(puzzleBoard, selectedSq, sq);
        setPuzzleBoard(afterPlayerBoard);
        setPuzzleLastMove({ from: selectedSq, to: sq });
        setSelectedSq(null);
        setWrongAttemptSq(null);
        setHintStage(0);

        const nextLog = [...moveHistoryLog, activeStep.playerNotation];
        setMoveHistoryLog(nextLog);

        const isFinalStep = currentStepIdx >= currentPuzzle.steps.length - 1;

        if (!isFinalStep && activeStep.opponentReplyFrom && activeStep.opponentReplyTo) {
          // Opponent fights back automatically after 480ms!
          setIsOpponentThinking(true);
          const replyFrom = activeStep.opponentReplyFrom;
          const replyTo = activeStep.opponentReplyTo;
          const replyNot = activeStep.opponentReplyNotation || '';

          opponentTimerRef.current = window.setTimeout(() => {
            soundSynth.playTactileClick();
            haptic.vibrateLight();
            const afterOpponentBoard = applyMoveOnBoard(afterPlayerBoard, replyFrom, replyTo);
            setPuzzleBoard(afterOpponentBoard);
            setPuzzleLastMove({ from: replyFrom, to: replyTo });
            setMoveHistoryLog((prev) => [...prev, replyNot]);
            setCurrentStepIdx((prev) => prev + 1);
            setIsOpponentThinking(false);
          }, 480);
        } else {
          // Combination completely solved!
          soundSynth.playCompletionChime();
          haptic.vibrateSprintCelebration();
          setPuzzleSolved(true);

          if (!solvedIds.includes(currentPuzzle.id)) {
            const updated = [...solvedIds, currentPuzzle.id];
            setSolvedIds(updated);
            localStorage.setItem('midmar_chess_solved_puzzles', JSON.stringify(updated));
          }

          const nextDailyCount = todaySolvedCount + 1;
          setTodaySolvedCount(nextDailyCount);
          localStorage.setItem('midmar_chess_gauntlet_date', getTodayKey());
          localStorage.setItem('midmar_chess_today_solved', String(nextDailyCount));

          onRewardToast?.(
            isAr
              ? `♟️ تكتيك أستاذ كبير (${activeStep.playerNotation})! أكملت ${Math.min(nextDailyCount, DAILY_GAUNTLET_TARGET)}/${DAILY_GAUNTLET_TARGET} من تحدي اليوم (+25 XP)`
              : `♟️ Grandmaster combination solved! (${Math.min(nextDailyCount, DAILY_GAUNTLET_TARGET)}/${DAILY_GAUNTLET_TARGET} today, +25 XP)`
          );
        }
      } else {
        // Wrong tactical attempt — deduct 1 attempt out of 5
        soundSynth.playTactileClick();
        haptic.vibrateDouble();
        setWrongAttemptSq(sq);
        updateAttempts(attemptsLeft - 1);
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

  // Theme colors for realistic tournament board
  const themeSquareClasses = {
    walnut: {
      frame: 'bg-gradient-to-br from-[#3d2616] via-[#2b1a0e] to-[#1a0f07] border-[#b4834b]/50',
      light: 'bg-[#f0d9b5] hover:bg-[#e8ce9f]',
      dark: 'bg-[#b58863] hover:bg-[#a67853]',
      coordLight: 'text-[#b58863]',
      coordDark: 'text-[#f0d9b5]',
    },
    tournament: {
      frame: 'bg-gradient-to-br from-[#1f2e22] via-[#162219] to-[#0f1711] border-emerald-500/40',
      light: 'bg-[#ebecd0] hover:bg-[#dfe2b8]',
      dark: 'bg-[#739552] hover:bg-[#668746]',
      coordLight: 'text-[#739552]',
      coordDark: 'text-[#ebecd0]',
    },
    obsidian: {
      frame: 'bg-gradient-to-br from-[#232733] via-[#161922] to-[#0d0f15] border-amber-400/40',
      light: 'bg-[#d8dee9] hover:bg-[#c8d0df]',
      dark: 'bg-[#4c566a] hover:bg-[#414b5e]',
      coordLight: 'text-[#4c566a]',
      coordDark: 'text-[#d8dee9]',
    },
  }[boardTheme];

  const evalWhiteHeightPercent = puzzleSolved ? 96 : currentStepIdx > 0 ? 82 : 68;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl rounded-[32px] bg-[#101218] text-white border border-white/15 shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header with 5-Round Daily Gauntlet & 5 Daily Attempts */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-[#171a24] via-[#1e1b4b] to-[#132620] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              ♟️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                  {isAr ? 'مختبر الشطرنج الاحترافي وتحدي الـ 5 جولات' : 'Pro Chess Tactical Lab & 5-Round Gauntlet'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-mono font-bold">
                  ELO {currentPuzzle.eloRating}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 truncate">
                {isAr
                  ? 'قطع ستونتون واقعية • تكتيكات متتابعة يرد فيها الخصم • ٥ محاولات و٥ ألغاز يومية'
                  : 'Realistic Staunton SVG • Multi-move combinations • 5 daily attempts & 5 daily rounds'}
              </p>
            </div>
          </div>

          {/* Right Header Badges: 5 Daily Attempts + 5 Daily Rounds + Close */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 5 Daily Attempts Bar */}
            <div
              className="px-3 py-1.5 rounded-2xl bg-black/35 border border-white/10 flex items-center gap-1.5"
              title={isAr ? 'محاولاتك التكتيكية اليومية (٥ محاولات)' : 'Daily Tactical Attempts (5)'}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-zinc-300">
                {isAr ? 'المحاولات:' : 'Attempts:'}
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: MAX_DAILY_ATTEMPTS }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx < attemptsLeft
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : 'bg-rose-500/35 border border-rose-400/40'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-mono font-bold text-white ms-0.5">
                {attemptsLeft}/{MAX_DAILY_ATTEMPTS}
              </span>
            </div>

            {/* 5 Daily Gauntlet Progress */}
            <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-200">
                {isAr
                  ? `تحدي اليوم: ${Math.min(todaySolvedCount, DAILY_GAUNTLET_TARGET)}/${DAILY_GAUNTLET_TARGET}`
                  : `Daily 5: ${Math.min(todaySolvedCount, DAILY_GAUNTLET_TARGET)}/${DAILY_GAUNTLET_TARGET}`}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher & Level Filter Bar */}
        <div className="px-4 py-2.5 bg-[#151821] border-b border-white/10 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'puzzles' as const, labelAr: '⚔️ تكتيكات الأساتذة (٥ جولات)', labelEn: '⚔️ Master Puzzles (5 Rounds)' },
              { id: 'openings' as const, labelAr: '📖 ملف خطط الافتتاحيات', labelEn: '📖 Opening Plans' },
              { id: 'sandbox' as const, labelAr: '🧪 رقعة التحليل الحرة', labelEn: '🧪 Analysis Board' },
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

          {/* Difficulty & Board Wood Theme Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all' as const, labelAr: 'الكل (10)', labelEn: 'All' },
              { id: 'beginner' as const, labelAr: '⚡ تكتيكي (1750+)', labelEn: '1750+' },
              { id: 'intermediate' as const, labelAr: '🔥 متقدم (1950+)', labelEn: '1950+' },
              { id: 'advanced' as const, labelAr: '👑 أستاذ كبير (2150+)', labelEn: '2150+ GM' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setLevelFilter(lvl.id);
                  setPuzzleIdx(0);
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
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
        <div className="p-3.5 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT / START COLUMN: Realistic Evaluation Bar + 8x8 Staunton Board */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-3">
            <div className="w-full max-w-[405px] flex items-stretch gap-2" dir="ltr">
              {/* Live Engine Evaluation Bar (Lichess / Chess.com style) */}
              <div className="w-6 rounded-xl overflow-hidden bg-[#1e222d] border border-white/15 flex flex-col justify-end relative shadow-inner shrink-0">
                <div
                  className="w-full bg-gradient-to-t from-[#f8f5eb] to-[#ffffff] transition-all duration-500"
                  style={{ height: `${evalWhiteHeightPercent}%` }}
                />
                <span className="absolute top-1.5 inset-x-0 text-center text-[8px] font-mono font-bold text-zinc-300">
                  b
                </span>
                <span className="absolute bottom-1.5 inset-x-0 text-center text-[8px] font-mono font-bold text-zinc-900">
                  {activeTab === 'puzzles' ? currentPuzzle.evalLabel : '+0.4'}
                </span>
              </div>

              {/* 8x8 Realistic Tournament Board */}
              <div
                className={`flex-1 aspect-square rounded-2xl p-2 sm:p-2.5 border-2 shadow-[0_18px_40px_rgba(0,0,0,0.75)] ${themeSquareClasses.frame}`}
              >
                <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border border-black/40">
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
                        activeStep.playerFrom === sq;
                      const isHintTo =
                        activeTab === 'puzzles' &&
                        hintStage >= 2 &&
                        !puzzleSolved &&
                        activeStep.playerTo === sq;
                      const isWrong = activeTab === 'puzzles' && wrongAttemptSq === sq;

                      // Show subtle target indicator when the correct piece is selected
                      const isTargetCandidate =
                        activeTab === 'puzzles' &&
                        selectedSq &&
                        !puzzleSolved &&
                        !piece?.startsWith(currentPuzzle.sideToMove);

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
                              ? 'bg-rose-600/85'
                              : isSelected
                              ? 'bg-amber-400/90 ring-2 ring-inset ring-white'
                              : isHintTo
                              ? 'bg-emerald-400/80 animate-pulse ring-2 ring-inset ring-emerald-200'
                              : isHintFrom
                              ? 'bg-amber-300/85 ring-2 ring-inset ring-amber-600'
                              : isLastMoveSq
                              ? isLight
                                ? 'bg-[#f5f682]'
                                : 'bg-[#b9ca43]'
                              : isLight
                              ? themeSquareClasses.light
                              : themeSquareClasses.dark
                          }`}
                        >
                          {/* Algebraic Rank & File Coordinates */}
                          {c === (flipped ? 7 : 0) && (
                            <span
                              className={`absolute top-0.5 left-1 text-[8px] font-mono font-bold leading-none ${
                                isLight ? themeSquareClasses.coordLight : themeSquareClasses.coordDark
                              }`}
                            >
                              {RANKS[r]}
                            </span>
                          )}
                          {r === (flipped ? 0 : 7) && (
                            <span
                              className={`absolute bottom-0.5 right-1 text-[8px] font-mono font-bold leading-none ${
                                isLight ? themeSquareClasses.coordLight : themeSquareClasses.coordDark
                              }`}
                            >
                              {FILES[c]}
                            </span>
                          )}

                          {/* Target move dot when a piece is selected */}
                          {isTargetCandidate && !piece && (
                            <span className="w-2.5 h-2.5 rounded-full bg-black/20 pointer-events-none" />
                          )}
                          {isTargetCandidate && piece && (
                            <span className="absolute inset-1 rounded-full border-2 border-black/25 pointer-events-none" />
                          )}

                          {/* Staunton Vector Piece */}
                          {piece && (
                            <div
                              className={`w-full h-full flex items-center justify-center transition-transform duration-150 ${
                                isSelected ? 'scale-110 -translate-y-0.5' : ''
                              }`}
                            >
                              <StauntonPieceSvg piece={piece} />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Board Controls & Theme Switcher */}
            <div className="flex items-center justify-between w-full max-w-[405px] gap-1.5 flex-wrap">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'walnut', label: isAr ? '🪵 خشب الجوز' : '🪵 Walnut' },
                    { id: 'tournament', label: isAr ? '🌿 بطولة' : '🌿 Green' },
                    { id: 'obsidian', label: isAr ? '🖤 أوبسيديان' : '🖤 Dark' },
                  ] as const
                ).map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setBoardTheme(th.id);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border ${
                      boardTheme === th.id
                        ? 'bg-amber-400 text-zinc-950 border-amber-300'
                        : 'bg-white/5 text-zinc-300 border-white/10'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setFlipped((f) => !f);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-bold text-zinc-200 flex items-center gap-1 cursor-pointer"
                >
                  <FlipVertical className="w-3 h-3 text-amber-300" />
                  <span>{isAr ? 'قلب الرقعة' : 'Flip'}</span>
                </button>

                {activeTab === 'puzzles' && (
                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setPuzzleBoard(buildBoardFromPlacement(currentPuzzle.placements));
                      setCurrentStepIdx(0);
                      setIsOpponentThinking(false);
                      setMoveHistoryLog([]);
                      setPuzzleSolved(false);
                      setSelectedSq(null);
                      setWrongAttemptSq(null);
                      setPuzzleLastMove(
                        currentPuzzle.opponentLastMove
                          ? { from: currentPuzzle.opponentLastMove.from, to: currentPuzzle.opponentLastMove.to }
                          : null
                      );
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-bold text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-300" />
                    <span>{isAr ? 'إعادة التكتيك' : 'Reset'}</span>
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
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-bold text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-300" />
                    <span>{isAr ? 'ترتيب البداية' : 'Reset'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT / END COLUMN: Multi-Move Tactical Engine, 5 Daily Gauntlet Slots, & Repertoire */}
          <div className="lg:col-span-6 space-y-3.5">
            {activeTab === 'puzzles' && (
              <div className="space-y-3.5">
                {/* 5-Puzzle Daily Gauntlet Selector Strip */}
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5" />
                      <span>
                        {isAr
                          ? 'سلسلة التحديات التكتيكية اليومية (اختر أي جولة من ١ إلى ١٠):'
                          : 'Daily Tactical Gauntlet (Select Round 1-10):'}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300 font-bold">
                      {isAr
                        ? `محلول الكل: ${solvedIds.length}/${TACTICAL_PUZZLES.length}`
                        : `Solved: ${solvedIds.length}/${TACTICAL_PUZZLES.length}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {filteredPuzzles.map((p, idx) => {
                      const isCurrent = currentPuzzle.id === p.id;
                      const isDone = solvedIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            soundSynth.playTactileClick();
                            setPuzzleIdx(idx);
                          }}
                          className={`py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                            isCurrent
                              ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-sm scale-105'
                              : isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {isDone ? `${idx + 1}✓` : idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Current Puzzle Header & Opponent Last Move Context */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[11px] font-bold">
                      {currentPuzzle.motifAr}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {isAr
                        ? `النقلة ${currentStepIdx + 1} من ${currentPuzzle.steps.length} • تقييم ${currentPuzzle.eloRating}`
                        : `Move ${currentStepIdx + 1} of ${currentPuzzle.steps.length} • ELO ${currentPuzzle.eloRating}`}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {isAr ? currentPuzzle.titleAr : currentPuzzle.titleEn}
                  </h3>

                  {currentPuzzle.opponentLastMove && (
                    <div className="p-2.5 rounded-xl bg-black/35 border border-white/10 text-[11px] text-zinc-300">
                      ♟️ <strong>{isAr ? 'آخر نقلة للخصم:' : 'Opponent played:'}</strong>{' '}
                      {currentPuzzle.opponentLastMove.descAr}
                    </div>
                  )}

                  {/* Live Move Sequence Status */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <span className="text-xs font-bold text-emerald-300">
                      {isOpponentThinking
                        ? isAr
                          ? '⏳ نقلة أولى صحيحة! الأسود يرد بالنقلة الدفاعية الإجبارية...'
                          : '⏳ Correct! Black is playing the forced reply...'
                        : currentStepIdx > 0 && !puzzleSolved
                        ? isAr
                          ? '🔥 ممتاز! الآن نفّذ النقلة الثانية القاضية لحسم التكتيك!'
                          : '🔥 Great first move! Now find the finishing blow!'
                        : isAr
                        ? '⚪ النقلة للأبيض: احسب السلسلة التكتيكية واضغط على القطعة ثم المربع الهدف'
                        : '⚪ White to move: Calculate the combination and play the best move'}
                    </span>

                    {moveHistoryLog.length > 0 && (
                      <div className="flex items-center gap-1" dir="ltr">
                        {moveHistoryLog.map((mv, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white/10 text-amber-300 font-mono text-[11px] font-bold"
                          >
                            {mv}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Out of 5 Daily Attempts Banner */}
                {attemptsLeft <= 0 && !puzzleSolved && (
                  <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-400/50 space-y-2.5">
                    <div className="text-xs font-bold text-rose-200">
                      {isAr
                        ? '⚠️ استنفدت الـ 5 محاولات التكتيكية في هذه الجولة! في الشطرنج الحقيقي التسرع يكلف الدور.'
                        : '⚠️ All 5 tactical attempts used!'}
                    </div>
                    <button
                      type="button"
                      onClick={handleRefillAttempts}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer shadow-md"
                    >
                      {isAr ? '🔄 تجديد 5 محاولات جديدة فوراً ومتابعة التحدي' : '🔄 Restore 5 Attempts Now'}
                    </button>
                  </div>
                )}

                {/* Wrong Attempt Feedback */}
                {wrongAttemptSq && !puzzleSolved && attemptsLeft > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold flex items-center justify-between gap-2">
                    <span>
                      {isAr
                        ? `❌ نقلة غير دقيقة! الخصم يستطيع الدفاع ضدها. بقي لديك ${attemptsLeft} من 5 محاولات.`
                        : `❌ Inaccurate move! ${attemptsLeft}/5 attempts remaining.`}
                    </span>
                    <button
                      type="button"
                      onClick={handleRefillAttempts}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-white shrink-0 cursor-pointer"
                    >
                      {isAr ? 'إعادة شحن الـ 5 محاولات' : 'Refill 5'}
                    </button>
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
                              ? '💡 هنت ١: كشف الفكرة التكتيكية'
                              : '💡 Hint 1: Tactical Motif'
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
                            activeStep.playerFrom,
                            activeStep.playerTo
                          );
                          setPuzzleBoard(nextB);
                          setPuzzleLastMove({
                            from: activeStep.playerFrom,
                            to: activeStep.playerTo,
                          });
                          setMoveHistoryLog((prev) => [...prev, activeStep.playerNotation]);
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
                            ? `سلسلة تكتيكية متقنة! (${moveHistoryLog.join(' ')})`
                            : `Combination Solved! (${moveHistoryLog.join(' ')})`}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-zinc-950 text-[11px] font-bold">
                        +25 XP
                      </span>
                    </div>
                    <p className="text-xs text-emerald-50 leading-relaxed">
                      {currentPuzzle.explanationAr}
                    </p>
                  </div>
                )}

                {/* Next / Prev Puzzle Navigation */}
                <div className="flex items-center justify-between gap-2 pt-1">
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
                    <span>{isAr ? 'التكتيك السابق' : 'Previous'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setPuzzleIdx((prev) => (prev + 1) % filteredPuzzles.length);
                    }}
                    className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <span>{isAr ? 'التحدي التكتيكي التالي ⚔️' : 'Next Tactical Challenge ⚔️'}</span>
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

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-amber-300 font-bold">
                        ECO {currentOpening.ecoCode} •{' '}
                        {currentOpening.side === 'white'
                          ? isAr
                            ? 'خطة الأبيض'
                            : 'White'
                          : isAr
                          ? 'خطة الأسود'
                          : 'Black'}
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

                  <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-xs text-indigo-100 leading-relaxed">
                    {openingStepIdx === 0
                      ? isAr
                        ? 'اضغط على «النقلة التالية ▶» لمشاهدة تسلسل خطة الافتتاح خطوة بخطوة على الرقعة.'
                        : 'Tap Next ▶ to step through the opening moves on the board.'
                      : currentOpening.steps[openingStepIdx - 1]?.commentAr}
                  </div>

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
                      ⚠️ <strong>{isAr ? 'تنبيه تكتيكي:' : 'Trap Alert:'}</strong>{' '}
                      {currentOpening.trapWarningAr}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>
                      {isAr
                        ? 'دفتر خططي وملاحظاتي الخاصة في الشطرنج:'
                        : 'My Personal Chess Repertoire Notes:'}
                    </span>
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
                    ? 'اضغط على أي قطعة ستونتون ثم اضغط على أي مربع على الرقعة لتحريكها بحرية وتجربة الخطط والتفريعات التي تدور في ذهنك.'
                    : 'Tap any Staunton piece and tap any target square to freely test variations and plans.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
