import React, { useState } from 'react';
import { X, Check, RefreshCw, Plus, Sparkles, Eye, Dumbbell, ShieldAlert } from 'lucide-react';
import {
  VISUAL_EXERCISE_ATLAS,
  MUSCLE_GROUP_LABELS,
  matchExerciseToVisualAtlas,
  getAlternativeExercisesFor,
  type VisualExerciseMetadata,
  type VisualMovementArchetype,
  type MuscleGroupId,
} from '../../data/visualExerciseAtlas';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

interface ExerciseMovementDiagramProps {
  archetype: VisualMovementArchetype;
  compact?: boolean;
  className?: string;
}

/**
 * Interactive SVG Biomechanical Figure & Muscle Highlight Illustration
 * Renders the athlete's posture, apparatus (bench/bar/cables/rack), glowing target muscles,
 * and motion trajectory vectors.
 */
export const ExerciseMovementDiagram: React.FC<ExerciseMovementDiagramProps> = ({
  archetype,
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#11161d] via-[#151d26] to-[#0e1318] border border-white/10 flex items-center justify-center select-none ${
        compact ? 'w-16 h-16 sm:w-20 sm:h-16 shrink-0' : 'w-full h-48 sm:h-56'
      } ${className}`}
    >
      {/* Subtle biomechanical grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id={`grid-${archetype}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#38bdf8" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#grid-${archetype})`} />
      </svg>

      {/* Main Biomechanical SVG Figure */}
      <svg
        viewBox="0 0 160 110"
        className="relative z-10 w-full h-full p-1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <radialGradient id="muscleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff5500" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#10b981" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. FLAT BENCH PRESS */}
        {archetype === 'bench_press' && (
          <g>
            {/* Flat Bench */}
            <line x1="25" y1="74" x2="115" y2="74" stroke="#64748b" strokeWidth="5" />
            <line x1="38" y1="74" x2="38" y2="96" stroke="#475569" strokeWidth="4" />
            <line x1="102" y1="74" x2="102" y2="96" stroke="#475569" strokeWidth="4" />
            {/* Athlete Supine Body */}
            <circle cx="38" cy="64" r="6.5" fill="#e2e8f0" />
            {/* Torso with glowing Pectorals */}
            <path d="M46 66 L94 66" stroke="#cbd5e1" strokeWidth="9" />
            <ellipse cx="62" cy="63" rx="12" ry="6" fill="url(#muscleGlow)" />
            {/* Legs planted */}
            <path d="M94 67 L116 68 L122 94" stroke="#94a3b8" strokeWidth="6" />
            {/* Arms pressing up (Ghost start + Active peak) */}
            <path d="M58 65 L52 52 L58 32" stroke="#38bdf8" strokeWidth="3.5" strokeDasharray="3 2" opacity="0.55" />
            <path d="M58 65 L58 26" stroke="#22c55e" strokeWidth="5" />
            {/* Barbell + Plates */}
            <line x1="36" y1="24" x2="82" y2="24" stroke="#f8fafc" strokeWidth="3" />
            <rect x="39" y="16" width="5" height="16" rx="1.5" fill="#ff5500" />
            <rect x="74" y="16" width="5" height="16" rx="1.5" fill="#ff5500" />
            {/* Upward Force Arrow */}
            <path d="M92 50 L92 24 M87 30 L92 23 L97 30" stroke="#22c55e" strokeWidth="2.5" />
          </g>
        )}

        {/* 2. INCLINE PRESS */}
        {archetype === 'incline_press' && (
          <g>
            {/* 30-deg Incline Bench */}
            <path d="M35 38 L82 78 L112 78" stroke="#64748b" strokeWidth="5" />
            <line x1="52" y1="54" x2="52" y2="95" stroke="#475569" strokeWidth="3.5" />
            <line x1="95" y1="78" x2="95" y2="95" stroke="#475569" strokeWidth="3.5" />
            {/* Athlete on Incline */}
            <circle cx="46" cy="36" r="6.5" fill="#e2e8f0" />
            <path d="M51 43 L82 72" stroke="#cbd5e1" strokeWidth="9" />
            {/* Glowing Upper Chest + Anterior Delt */}
            <circle cx="61" cy="50" r="10" fill="url(#muscleGlow)" />
            <path d="M82 72 L106 72 L114 94" stroke="#94a3b8" strokeWidth="6" />
            {/* Arms pressing dumbbells vertically */}
            <path d="M58 48 L58 18" stroke="#22c55e" strokeWidth="5" />
            {/* Dumbbell */}
            <rect x="49" y="14" width="18" height="6" rx="2" fill="#ff5500" />
            <path d="M78 46 L78 18 M73 24 L78 17 L83 24" stroke="#22c55e" strokeWidth="2.5" />
          </g>
        )}

        {/* 3. CHEST FLY / PEC DECK */}
        {archetype === 'chest_fly' && (
          <g>
            {/* Torso Front View */}
            <circle cx="80" cy="22" r="7.5" fill="#e2e8f0" />
            <path d="M64 34 L96 34 L90 74 L70 74 Z" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
            {/* Glowing Inner & Full Pecs */}
            <ellipse cx="72" cy="46" rx="9" ry="7" fill="url(#muscleGlow)" />
            <ellipse cx="88" cy="46" rx="9" ry="7" fill="url(#muscleGlow)" />
            {/* Wide Open Arms (Start) */}
            <path d="M64 38 Q36 36 24 48" stroke="#38bdf8" strokeWidth="4" strokeDasharray="3 3" opacity="0.6" />
            <path d="M96 38 Q124 36 136 48" stroke="#38bdf8" strokeWidth="4" strokeDasharray="3 3" opacity="0.6" />
            {/* Converged Arms Hugging Arc (Peak) */}
            <path d="M64 38 Q56 54 76 54" stroke="#22c55e" strokeWidth="5" />
            <path d="M96 38 Q104 54 84 54" stroke="#22c55e" strokeWidth="5" />
            {/* Arc Arrows */}
            <path d="M32 58 Q52 68 70 60" stroke="#ff5500" strokeWidth="2.2" />
            <path d="M128 58 Q108 68 90 60" stroke="#ff5500" strokeWidth="2.2" />
          </g>
        )}

        {/* 4. OVERHEAD SHOULDER PRESS */}
        {archetype === 'overhead_press' && (
          <g>
            {/* Standing Athlete */}
            <circle cx="80" cy="36" r="6.5" fill="#e2e8f0" />
            <line x1="80" y1="44" x2="80" y2="76" stroke="#cbd5e1" strokeWidth="9" />
            <path d="M76 76 L70 98 M84 76 L90 98" stroke="#94a3b8" strokeWidth="5.5" />
            {/* Glowing Deltoids */}
            <circle cx="67" cy="46" r="8" fill="url(#muscleGlow)" />
            <circle cx="93" cy="46" r="8" fill="url(#muscleGlow)" />
            {/* Arms Overhead */}
            <path d="M67 46 L58 34 L62 16" stroke="#22c55e" strokeWidth="4.5" />
            <path d="M93 46 L102 34 L98 16" stroke="#22c55e" strokeWidth="4.5" />
            {/* Overhead Barbell */}
            <line x1="36" y1="15" x2="124" y2="15" stroke="#f8fafc" strokeWidth="3" />
            <rect x="42" y="8" width="5" height="14" rx="1.5" fill="#ff5500" />
            <rect x="113" y="8" width="5" height="14" rx="1.5" fill="#ff5500" />
          </g>
        )}

        {/* 5. LATERAL RAISE */}
        {archetype === 'lateral_raise' && (
          <g>
            <circle cx="80" cy="26" r="7" fill="#e2e8f0" />
            <path d="M68 38 L92 38 L87 74 L73 74 Z" fill="#334155" />
            <path d="M75 74 L72 98 M85 74 L88 98" stroke="#94a3b8" strokeWidth="5" />
            {/* Glowing Side Delts */}
            <circle cx="64" cy="40" r="8.5" fill="url(#muscleGlow)" />
            <circle cx="96" cy="40" r="8.5" fill="url(#muscleGlow)" />
            {/* Arms Down (Ghost) */}
            <path d="M66 42 L58 68 M94 42 L102 68" stroke="#64748b" strokeWidth="3.5" strokeDasharray="3 2" />
            {/* Arms Raised Outward to Shoulder Level */}
            <path d="M66 40 L28 42" stroke="#22c55e" strokeWidth="5" />
            <path d="M94 40 L132 42" stroke="#22c55e" strokeWidth="5" />
            {/* Dumbbells */}
            <rect x="20" y="38" width="8" height="8" rx="2" fill="#ff5500" />
            <rect x="132" y="38" width="8" height="8" rx="2" fill="#ff5500" />
            {/* Arc Paths */}
            <path d="M46 66 Q32 56 32 46" stroke="#38bdf8" strokeWidth="2" />
            <path d="M114 66 Q128 56 128 46" stroke="#38bdf8" strokeWidth="2" />
          </g>
        )}

        {/* 6. DIPS & PUSH-UPS */}
        {archetype === 'dips_pushup' && (
          <g>
            {/* Parallel Dip Bars */}
            <line x1="35" y1="54" x2="125" y2="54" stroke="#64748b" strokeWidth="4" />
            <line x1="48" y1="54" x2="48" y2="98" stroke="#475569" strokeWidth="4" />
            <line x1="112" y1="54" x2="112" y2="98" stroke="#475569" strokeWidth="4" />
            {/* Forward-leaning Athlete on Dips */}
            <circle cx="64" cy="22" r="6.5" fill="#e2e8f0" />
            <path d="M67 30 L84 62" stroke="#cbd5e1" strokeWidth="9" />
            {/* Glowing Lower Chest + Triceps */}
            <circle cx="71" cy="42" r="10" fill="url(#muscleGlow)" />
            {/* Bent Elbows pressing on bars */}
            <path d="M70 36 L86 38 L78 54" stroke="#22c55e" strokeWidth="5" />
            {/* Bent knees */}
            <path d="M84 62 L92 84 L106 78" stroke="#94a3b8" strokeWidth="5.5" />
            <path d="M42 46 L42 24 M38 30 L42 23 L46 30" stroke="#22c55e" strokeWidth="2.5" />
          </g>
        )}

        {/* 7. TRICEP ROPE / OVERHEAD EXTENSION */}
        {archetype === 'tricep_extension' && (
          <g>
            {/* High Cable Pulley */}
            <line x1="42" y1="8" x2="42" y2="98" stroke="#475569" strokeWidth="4" />
            <circle cx="48" cy="14" r="5" fill="#ff5500" />
            <line x1="48" y1="14" x2="72" y2="56" stroke="#38bdf8" strokeWidth="2" />
            {/* Athlete Side Profile */}
            <circle cx="96" cy="24" r="6.5" fill="#e2e8f0" />
            <path d="M94 32 L90 68" stroke="#cbd5e1" strokeWidth="9" />
            <path d="M90 68 L86 98 M92 68 L98 98" stroke="#94a3b8" strokeWidth="5.5" />
            {/* Pinned Upper Arm + Glowing Triceps */}
            <path d="M90 36 L86 56" stroke="#e2e8f0" strokeWidth="6" />
            <circle cx="91" cy="45" r="8" fill="url(#muscleGlow)" />
            {/* Forearm start (ghost) & full lockout (green) */}
            <path d="M86 56 L68 46" stroke="#64748b" strokeWidth="4" strokeDasharray="3 2" />
            <path d="M86 56 L74 74" stroke="#22c55e" strokeWidth="5" />
            {/* Motion arc */}
            <path d="M64 52 Q62 66 70 74" stroke="#ff5500" strokeWidth="2.2" />
          </g>
        )}

        {/* 8. PULL-UP & LAT PULLDOWN */}
        {archetype === 'pullup_pulldown' && (
          <g>
            {/* Pull-up / Lat Bar */}
            <line x1="28" y1="14" x2="132" y2="14" stroke="#94a3b8" strokeWidth="3.5" />
            {/* Athlete Back View */}
            <circle cx="80" cy="30" r="6.5" fill="#e2e8f0" />
            {/* V-Taper Torso with Glowing Lats */}
            <path d="M62 40 L98 40 L88 76 L72 76 Z" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
            <ellipse cx="67" cy="52" rx="8" ry="12" fill="url(#muscleGlow)" />
            <ellipse cx="93" cy="52" rx="8" ry="12" fill="url(#muscleGlow)" />
            {/* Wide Grip Arms Pulling Elbows Down */}
            <path d="M62 42 L44 32 L50 14" stroke="#22c55e" strokeWidth="5" />
            <path d="M98 42 L116 32 L110 14" stroke="#22c55e" strokeWidth="5" />
            {/* Legs */}
            <path d="M75 76 L73 98 M85 76 L87 98" stroke="#94a3b8" strokeWidth="5" />
            {/* Downward Elbow Drive Arrows */}
            <path d="M36 26 L42 44 M37 40 L42 45 L46 39" stroke="#ff5500" strokeWidth="2.2" />
            <path d="M124 26 L118 44 M114 39 L118 45 L123 40" stroke="#ff5500" strokeWidth="2.2" />
          </g>
        )}

        {/* 9. BARBELL / CABLE / DB ROW */}
        {archetype === 'row_horizontal' && (
          <g>
            {/* Hinged Athlete at 45 degrees */}
            <circle cx="108" cy="28" r="6.5" fill="#e2e8f0" />
            <path d="M102 34 L66 56" stroke="#cbd5e1" strokeWidth="10" />
            {/* Glowing Mid-Back & Lats */}
            <ellipse cx="82" cy="43" rx="13" ry="7" fill="url(#muscleGlow)" />
            {/* Hinged Hips & Knees */}
            <path d="M66 56 L76 76 L70 98" stroke="#94a3b8" strokeWidth="6" />
            {/* Arm extended down (Ghost) vs Pulled to hip (Active) */}
            <path d="M94 38 L94 74" stroke="#64748b" strokeWidth="3.5" strokeDasharray="3 2" />
            <path d="M94 38 L74 34 L82 56" stroke="#22c55e" strokeWidth="5" />
            {/* Barbell Plate */}
            <circle cx="82" cy="60" r="9" fill="#ff5500" stroke="#f8fafc" strokeWidth="2" />
            <path d="M108 68 L92 52 M92 58 L91 51 L98 52" stroke="#22c55e" strokeWidth="2.2" />
          </g>
        )}

        {/* 10. FACE PULL & REAR DELT */}
        {archetype === 'face_pull' && (
          <g>
            <line x1="34" y1="10" x2="34" y2="98" stroke="#475569" strokeWidth="4" />
            <circle cx="40" cy="30" r="5" fill="#ff5500" />
            <line x1="40" y1="30" x2="84" y2="30" stroke="#38bdf8" strokeWidth="2.5" />
            {/* Athlete Pulling to Forehead */}
            <circle cx="102" cy="28" r="6.5" fill="#e2e8f0" />
            <path d="M102 36 L104 72 L98 98 M104 72 L112 98" stroke="#cbd5e1" strokeWidth="6" />
            {/* Glowing Rear Delts & Upper Back */}
            <circle cx="106" cy="40" r="9" fill="url(#muscleGlow)" />
            <path d="M102 40 L116 36 L92 26" stroke="#22c55e" strokeWidth="5" />
          </g>
        )}

        {/* 11. BICEP CURL */}
        {archetype === 'bicep_curl' && (
          <g>
            <circle cx="86" cy="22" r="6.5" fill="#e2e8f0" />
            <path d="M86 30 L86 70" stroke="#cbd5e1" strokeWidth="9" />
            <path d="M84 70 L78 98 M88 70 L94 98" stroke="#94a3b8" strokeWidth="5.5" />
            {/* Upper Arm + Glowing Bicep Peak */}
            <path d="M84 34 L82 54" stroke="#e2e8f0" strokeWidth="6" />
            <circle cx="77" cy="45" r="8.5" fill="url(#muscleGlow)" />
            {/* Forearm down (ghost) & curled up (green) */}
            <path d="M82 54 L76 76" stroke="#64748b" strokeWidth="4" strokeDasharray="3 2" />
            <path d="M82 54 L62 38" stroke="#22c55e" strokeWidth="5" />
            {/* Dumbbell */}
            <circle cx="60" cy="36" r="5.5" fill="#ff5500" />
            <path d="M62 70 Q50 54 56 42" stroke="#38bdf8" strokeWidth="2.2" />
          </g>
        )}

        {/* 12. SQUAT & LEG PRESS */}
        {archetype === 'squat_press' && (
          <g>
            {/* Athlete in Deep Parallel Squat */}
            <circle cx="88" cy="22" r="6.5" fill="#e2e8f0" />
            {/* Barbell on Traps */}
            <circle cx="78" cy="30" r="8" fill="#ff5500" stroke="#f8fafc" strokeWidth="2" />
            {/* Torso */}
            <path d="M80 32 L58 60" stroke="#cbd5e1" strokeWidth="9" />
            {/* Thighs Parallel with Glowing Quads & Glutes */}
            <path d="M58 60 L92 62" stroke="#22c55e" strokeWidth="8" />
            <ellipse cx="74" cy="58" rx="14" ry="7" fill="url(#muscleGlow)" />
            {/* Shins & Feet flat */}
            <path d="M92 62 L84 94 L98 94" stroke="#cbd5e1" strokeWidth="6" />
            {/* Upward Drive Arrow */}
            <path d="M40 72 L40 28 M35 35 L40 27 L45 35" stroke="#22c55e" strokeWidth="2.5" />
          </g>
        )}

        {/* 13. ROMANIAN DEADLIFT (RDL) & HIP HINGE */}
        {archetype === 'hip_hinge_rdl' && (
          <g>
            {/* Athlete Hip Hinged Back */}
            <circle cx="106" cy="34" r="6.5" fill="#e2e8f0" />
            <path d="M98 38 L56 52" stroke="#cbd5e1" strokeWidth="9" />
            {/* Glowing Hamstrings & Glutes */}
            <ellipse cx="62" cy="64" rx="11" ry="14" fill="url(#muscleGlow)" />
            {/* Slight knee bend, vertical shins */}
            <path d="M56 52 L66 74 L64 96" stroke="#22c55e" strokeWidth="6.5" />
            {/* Arms hanging straight with barbell brushing shins */}
            <path d="M92 40 L88 74" stroke="#cbd5e1" strokeWidth="4.5" />
            <circle cx="88" cy="76" r="9" fill="#ff5500" stroke="#f8fafc" strokeWidth="2" />
            {/* Hip Drive Back Arrow */}
            <path d="M48 52 L28 52 M34 47 L27 52 L34 57" stroke="#38bdf8" strokeWidth="2.5" />
          </g>
        )}

        {/* 14. LEG CURL & CALVES */}
        {archetype === 'leg_curl_calf' && (
          <g>
            {/* Bench */}
            <path d="M28 66 L96 66 L124 76" stroke="#64748b" strokeWidth="5" />
            <circle cx="36" cy="56" r="6" fill="#e2e8f0" />
            <path d="M44 60 L94 62" stroke="#cbd5e1" strokeWidth="8" />
            {/* Glowing Hamstrings & Calves */}
            <ellipse cx="104" cy="54" rx="10" ry="8" fill="url(#muscleGlow)" />
            {/* Leg Extended (ghost) vs Curled (active) */}
            <path d="M94 62 L132 72" stroke="#64748b" strokeWidth="4" strokeDasharray="3 2" />
            <path d="M94 62 L106 34" stroke="#22c55e" strokeWidth="6" />
            <circle cx="106" cy="34" r="5" fill="#ff5500" />
          </g>
        )}

        {/* 15. CORE & HANGING LEG RAISES */}
        {archetype === 'core_hanging' && (
          <g>
            <line x1="48" y1="10" x2="112" y2="10" stroke="#94a3b8" strokeWidth="3.5" />
            <path d="M76 10 L76 30 M84 10 L84 30" stroke="#cbd5e1" strokeWidth="4" />
            <circle cx="80" cy="28" r="6" fill="#e2e8f0" />
            <path d="M80 35 L80 64" stroke="#cbd5e1" strokeWidth="9" />
            {/* Glowing 6-Pack Core */}
            <circle cx="84" cy="54" r="10" fill="url(#muscleGlow)" />
            {/* Legs hanging (ghost) vs Raised L-Sit (green) */}
            <path d="M80 64 L80 96" stroke="#64748b" strokeWidth="4.5" strokeDasharray="3 2" />
            <path d="M80 64 L122 58" stroke="#22c55e" strokeWidth="6" />
            <path d="M114 86 Q124 74 122 62" stroke="#ff5500" strokeWidth="2.2" />
          </g>
        )}

        {/* 16. CALISTHENICS SKILL (MUSCLE-UP / LEVER / HANDSTAND) */}
        {archetype === 'calisthenics_skill' && (
          <g>
            <line x1="32" y1="48" x2="128" y2="48" stroke="#94a3b8" strokeWidth="3.5" />
            {/* Athlete Performing Front Lever / High Muscle-Up Transition */}
            <circle cx="46" cy="28" r="6.5" fill="#e2e8f0" />
            <path d="M52 32 L114 32" stroke="#22c55e" strokeWidth="8" />
            <ellipse cx="76" cy="32" rx="16" ry="8" fill="url(#muscleGlow)" />
            <path d="M68 32 L78 48" stroke="#f8fafc" strokeWidth="5" />
          </g>
        )}
      </svg>

      {!compact && (
        <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[10px] font-bold pointer-events-none">
          <span className="px-2 py-0.5 rounded-full bg-black/60 text-emerald-300 border border-emerald-500/30">
            ● المسار الأخضر: ذروة الأداء
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/60 text-orange-300 border border-orange-500/30">
            ● التوهج: العضلة المستهدفة
          </span>
        </div>
      )}
    </div>
  );
};

interface VisualExerciseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExerciseName?: string;
  initialTab?: 'guide' | 'swap' | 'library';
  currentExercisesNames?: string[];
  onSwapExercise?: (newExerciseMeta: VisualExerciseMetadata) => void;
  onToggleLibraryExercise?: (exerciseMeta: VisualExerciseMetadata) => void;
  isAr?: boolean;
}

export const VisualExerciseGuideModal: React.FC<VisualExerciseGuideModalProps> = ({
  isOpen,
  onClose,
  initialExerciseName = 'Bench Press',
  initialTab = 'guide',
  currentExercisesNames = [],
  onSwapExercise,
  onToggleLibraryExercise,
  isAr = true,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'swap' | 'library'>(initialTab);
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<MuscleGroupId | 'all'>('all');
  const [inspectedExercise, setInspectedExercise] = useState<VisualExerciseMetadata>(() =>
    matchExerciseToVisualAtlas(initialExerciseName)
  );

  React.useEffect(() => {
    if (isOpen) {
      setInspectedExercise(matchExerciseToVisualAtlas(initialExerciseName));
      setActiveTab(initialTab);
    }
  }, [isOpen, initialExerciseName, initialTab]);

  if (!isOpen) return null;

  const alternatives = getAlternativeExercisesFor(inspectedExercise.nameAr);

  const filteredLibrary =
    selectedMuscleFilter === 'all'
      ? VISUAL_EXERCISE_ATLAS
      : VISUAL_EXERCISE_ATLAS.filter((ex) => ex.muscleGroup === selectedMuscleFilter);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[30px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 shadow-2xl p-4 sm:p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#141517] dark:bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white truncate">
                {isAr
                  ? 'الأطلس المصور للحركات والبدائل الذكية'
                  : 'Visual Exercise Atlas & Smart Swapper'}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {inspectedExercise.nameAr}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Mode Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('guide');
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'guide'
                ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="truncate">{isAr ? 'شكل الحركة والأداء' : 'Form & Muscles'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('swap');
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'swap'
                ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="truncate">{isAr ? 'استبدال التمرين ببديل' : 'Swap Exercise'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('library');
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'library'
                ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="truncate">{isAr ? 'اختر تمارين اليوم' : 'Pick Exercises'}</span>
          </button>
        </div>

        {/* TAB 1: VISUAL BIOMECHANICAL FORM & MUSCLE GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-6">
                <ExerciseMovementDiagram archetype={inspectedExercise.archetype} />
              </div>

              <div className="md:col-span-6 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    🎯 الأساسي: {inspectedExercise.muscleLabelAr}
                  </span>
                  {inspectedExercise.secondaryMusclesAr.map((sec) => (
                    <span
                      key={sec}
                      className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold border border-zinc-200 dark:border-zinc-800"
                    >
                      + {sec}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                    ⚙️ {inspectedExercise.equipmentAr}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2 text-xs">
                  <div>
                    <strong className="text-zinc-900 dark:text-white block">١. وضع البداية والتجهيز:</strong>
                    <p className="text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                      {inspectedExercise.startPostureAr}
                    </p>
                  </div>
                  <div className="border-t border-zinc-200/70 dark:border-zinc-800 pt-2">
                    <strong className="text-emerald-700 dark:text-emerald-400 block">٢. مسار الحركة وذروة الانقباض:</strong>
                    <p className="text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                      {inspectedExercise.peakPostureAr}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-xs text-sky-900 dark:text-sky-200 font-bold">
                  🌬️ إيقاع التنفس: {inspectedExercise.breathingAr}
                </div>
              </div>
            </div>

            {/* Golden Form Cues & Common Mistake */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">
                  ✅ قواعد الأداء الذهبية (لأقصى استفادة):
                </span>
                <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-200">
                  {inspectedExercise.formCuesAr.map((cue, idx) => (
                    <li key={idx} className="leading-relaxed">
                      • {cue}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>خطأ شائع يجب تجنبه:</span>
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-200 mt-1.5 leading-relaxed">
                    {inspectedExercise.commonMistakeAr}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('swap')}
                  className="w-full py-2 px-3 rounded-xl bg-[#141517] dark:bg-white text-white dark:text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>هل الجهاز مشغول أو يزعج مفصلك؟ استبدله ببديل الآن</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 1-TAP SWAP EXERCISE WITH SAME-MUSCLE ALTERNATIVES */}
        {activeTab === 'swap' && (
          <div className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-zinc-800 dark:text-amber-200 flex items-center justify-between gap-2">
              <span>
                🔄 اختر أي تمرين بديل يستهدف نفس العضلة (<strong>{inspectedExercise.muscleLabelAr}</strong>) ليحل محل التمرين الحالي فوراً:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 flex flex-col justify-between gap-3 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <ExerciseMovementDiagram archetype={alt.archetype} compact />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white leading-snug">
                        {alt.nameAr}
                      </h4>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                        🎯 {alt.muscleLabelAr} • {alt.equipmentAr}
                      </span>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {alt.startPostureAr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playCompletionChime();
                        haptic.vibrateMedium();
                        if (onSwapExercise) {
                          onSwapExercise(alt);
                          onClose();
                        }
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-habit-green-ink hover:bg-habit-green-ink-deep text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>استبدل بهذا التمرين ✓</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setInspectedExercise(alt);
                        setActiveTab('guide');
                      }}
                      className="py-2 px-3 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold cursor-pointer"
                    >
                      شرح الشكل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FULL VISUAL EXERCISE PICKER (CHOOSE WHAT TO PLAY TODAY) */}
        {activeTab === 'library' && (
          <div className="space-y-3.5">
            {/* Muscle Group Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedMuscleFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                  selectedMuscleFilter === 'all'
                    ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                الكل ({VISUAL_EXERCISE_ATLAS.length})
              </button>
              {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroupId[]).map((mKey) => (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setSelectedMuscleFilter(mKey)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                    selectedMuscleFilter === mKey
                      ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {MUSCLE_GROUP_LABELS[mKey].labelAr}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[52vh] overflow-y-auto pe-1">
              {filteredLibrary.map((item) => {
                const isAdded = currentExercisesNames.some(
                  (n) =>
                    n.toLowerCase().includes(item.nameEn.split(' ')[0].toLowerCase()) ||
                    n === item.nameAr
                );
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isAdded
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div
                      onClick={() => {
                        setInspectedExercise(item);
                        setActiveTab('guide');
                      }}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <ExerciseMovementDiagram archetype={item.archetype} compact />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                          {item.nameAr}
                        </h5>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                          🎯 {item.muscleLabelAr} • {item.equipmentAr}
                        </span>
                        <span className="text-[10px] text-zinc-500 underline">اضغط لعرض شكل الحركة</span>
                      </div>
                    </div>

                    {onToggleLibraryExercise && (
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          haptic.vibrateLight();
                          onToggleLibraryExercise(item);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer active:scale-95 transition-all ${
                          isAdded
                            ? 'bg-[#1eb814] text-white'
                            : 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>مضاف</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
