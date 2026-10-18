import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  CheckCircle,
  Zap,
  Flame,
  ArrowLeft,
  ArrowRight,
  Heart,
  Plus,
  Trash2,
  Timer,
  RotateCcw,
  Smile,
  Star,
  Calculator,
  Copy,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import type { WorkoutExercise, WorkoutSet, UserState } from '../../types';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';
import { resolveStationMetadata, PERSONA_CONFIGS } from '../../utils/lifestyleEngine';
import { CombatSportsModule } from './CombatSportsModule';
import { TeamSportsModule } from './TeamSportsModule';
import { FitnessIntervalEngine } from './FitnessIntervalEngine';
import { WarmupPyramidModal } from './WarmupPyramidModal';
import type { NiyyahPillar } from '../spiritual/NiyyahSanctuaryModal';
import confetti from 'canvas-confetti';
import { db } from '../../db/db';
import { gymFaithAudio } from '../../services/gymFaithAudioService';
import { getBiologicalDate, triggerCelebrationConfetti } from '../../utils/gamification';

export type MovementCategory =
  | 'gym'
  | 'combat'
  | 'football'
  | 'fitness_class'
  | 'home'
  | 'walk'
  | 'mobility';

interface GymAnchorViewProps {
  isSurvivalMode: boolean;
  isCompleted: boolean;
  onCompleteStation: () => void;
  onNextStation: () => void;
  userState?: UserState;
  onRewardToast?: (msg: string) => void;
  onOpenNiyyahModal?: (pillar?: NiyyahPillar) => void;
}

type RoutineType = 'push' | 'pull' | 'legs' | 'upper' | 'arms_delts' | 'cardio' | 'survival';
export type BodyGoalType = 'bulking' | 'cutting' | 'recomp' | 'combat_hybrid';
export type AthleteLevelType = 'beginner' | 'intermediate' | 'advanced';
export type SecondarySportType = 'none' | 'boxing' | 'kickboxing' | 'bjj' | 'calisthenics';
export type CalisthenicsSkillTrack = 'pull_muscleup' | 'handstand_push' | 'frontlever_core' | 'street_shred';

interface CalisthenicsExerciseItem {
  id: string;
  nameAr: string;
  nameEn: string;
  target: string;
  roleAr: string;
  roleEn: string;
  level: AthleteLevelType;
  done: boolean;
}

const CALISTHENICS_SKILL_TRACKS: Record<
  CalisthenicsSkillTrack,
  {
    titleAr: string;
    titleEn: string;
    badgeAr: string;
    coachTipAr: string;
    exercises: Record<AthleteLevelType, Omit<CalisthenicsExerciseItem, 'done'>[]>;
  }
> = {
  pull_muscleup: {
    titleAr: '🔥 العقلة الانفجارية والـ Muscle-Up',
    titleEn: 'Explosive Pull-up & Muscle-Up Track',
    badgeAr: 'سحب انفجاري + انتقال فوق البار',
    coachTipAr: 'سر الـ Muscle-Up ليس العقلة العادية، بل السحب الانفجاري إلى أسفل الصدر (High Pull) مع تقوية الغطس المستقيم (Straight Bar Dips) وقبضة الـ False Grip.',
    exercises: {
      beginner: [
        { id: 'cal-mu-b1', nameAr: 'سحب أسترالي مائل (Australian Pull-ups)', nameEn: 'Australian Rows', target: '4 × 12', roleAr: 'بناء قاعدة السحب للظهر والبايسبس', roleEn: 'Pulling foundation', level: 'beginner' },
        { id: 'cal-mu-b2', nameAr: 'عقلة سلبية بطيئة 5 ثوانٍ (Negative Pull-ups)', nameEn: '5s Eccentric Pull-ups', target: '4 × 5', roleAr: 'تقوية الأوتار والعضلات في مرحلة النزول', roleEn: 'Tendon & eccentric strength', level: 'beginner' },
        { id: 'cal-mu-b3', nameAr: 'تفعيل لوح الكتف بالتعلق (Scapular Pulls)', nameEn: 'Scapular Pulls & Dead Hang', target: '3 × 12 + 30s', roleAr: 'تقوية القبضة وبداية السحب الانفجاري', roleEn: 'Grip & scapular activation', level: 'beginner' },
        { id: 'cal-mu-b4', nameAr: 'متوازي غطس كامل أو بمساعدة (Parallel Bar Dips)', nameEn: 'Parallel Dips', target: '3 × 10', roleAr: 'قوة الدفع العلوية اللازمة فوق البار', roleEn: 'Lockout pushing power', level: 'beginner' },
      ],
      intermediate: [
        { id: 'cal-mu-i1', nameAr: 'عقلة انفجارية للصدر (Chest-to-Bar Explosive Pull-ups)', nameEn: 'Chest-to-Bar Pull-ups', target: '4 × 6-8', roleAr: 'التمرين الأهم لكسر حاجز الانتقال فوق البار', roleEn: 'Explosive pull height', level: 'intermediate' },
        { id: 'cal-mu-i2', nameAr: 'غطس على البار المستقيم (Straight Bar Dips)', nameEn: 'Straight Bar Dips', target: '4 × 10', roleAr: 'محاكاة مرحلة الدفع العلوية للـ Muscle-Up', roleEn: 'Top-bar lockout simulation', level: 'intermediate' },
        { id: 'cal-mu-i3', nameAr: 'تعلق بقبضة الماسل أب (False Grip Hang & Pulls)', nameEn: 'False Grip Chins', target: '3 × 25s', roleAr: 'تسهيل قلب المعصم فوق العقلة بسلاسة', roleEn: 'Wrist transition mastery', level: 'intermediate' },
        { id: 'cal-mu-i4', nameAr: 'رفع الركبة والبطن على العقلة (Toes-to-Bar / L-Raises)', nameEn: 'Hanging Leg Raises', target: '3 × 12', roleAr: 'ربط قوة الجذع مع السحب العلوي', roleEn: 'Core-to-bar compression', level: 'intermediate' },
      ],
      advanced: [
        { id: 'cal-mu-a1', nameAr: 'ماسل أب كامل أو بوزن (Strict / Weighted Muscle-Ups)', nameEn: 'Strict Bar Muscle-Ups', target: '5 × 3-5', roleAr: 'أداء المهارة بتحكم كامل بدون مرجحة مفرطة', roleEn: 'Skill mastery & power', level: 'advanced' },
        { id: 'cal-mu-a2', nameAr: 'عقلة بوزن إضافي أو لبطن المعدة (Waist Pull-ups / Weighted)', nameEn: 'High Waist Pull-ups', target: '4 × 6', roleAr: 'قوة انفجارية فائقة تتجاوز مستوى الصدر', roleEn: 'Supra-maximal pull power', level: 'advanced' },
        { id: 'cal-mu-a3', nameAr: 'عقلة آرشر أحادية الذراع (Archer Pull-ups)', nameEn: 'Archer Pull-ups', target: '3 × 6 لكل ذراع', roleAr: 'تحضير للـ One-Arm Pull-up وتوازن القوة', roleEn: 'Unilateral pulling strength', level: 'advanced' },
        { id: 'cal-mu-a4', nameAr: 'ثبات إل-سيت على العقلة (L-Sit Pull-ups)', nameEn: 'L-Sit Pull-ups', target: '3 × 8', roleAr: 'عزل تام لقوة الظهر والبطن معاً', roleEn: 'Zero-momentum strict pull', level: 'advanced' },
      ],
    },
  },
  handstand_push: {
    titleAr: '🤸‍♂️ الوقوف على اليدين (Handstand) والدفع',
    titleEn: 'Handstand & Overhead Push Track',
    badgeAr: 'توازن الأكتاف + قوة الدفع العمودي',
    coachTipAr: 'الوقوف على اليدين يعتمد 60% على توازن الأصابع وشد الجذع (Hollow Body)، و40% على قوة الأكتاف الأمامية وتمارين الـ Pike Push-ups.',
    exercises: {
      beginner: [
        { id: 'cal-hs-b1', nameAr: 'ضغط بايك للأكتاف (Pike Push-ups)', nameEn: 'Pike Push-ups', target: '4 × 10', roleAr: 'بناء القوة العمودية للأكتاف والترايسبس', roleEn: 'Vertical shoulder strength', level: 'beginner' },
        { id: 'cal-hs-b2', nameAr: 'ثبات الجذع المجوف (Hollow Body Hold)', nameEn: 'Hollow Body Hold', target: '4 × 40s', roleAr: 'منع تقوس أسفل الظهر أثناء الوقوف على اليدين', roleEn: 'Straight-line core alignment', level: 'beginner' },
        { id: 'cal-hs-b3', nameAr: 'مشية الدب وتسلق الحائط الجزئي (Wall Walks)', nameEn: 'Wall Walks', target: '3 × 4', roleAr: 'التعود الآمن على وضع الانقلاب وتحمل وزن الجسم', roleEn: 'Inversion confidence', level: 'beginner' },
        { id: 'cal-hs-b4', nameAr: 'تقوية المعصم والأصابع (Wrist & Finger Push-ups)', nameEn: 'Wrist Conditioning', target: '3 × 15', roleAr: 'حماية المفاصل والتحكم في التوازن بالأصابع', roleEn: 'Wrist & finger braking', level: 'beginner' },
      ],
      intermediate: [
        { id: 'cal-hs-i1', nameAr: 'وقوف على اليدين والبطن للحائط (Chest-to-Wall Handstand)', nameEn: 'Chest-to-Wall Hold', target: '4 × 45s', roleAr: 'ضبط استقامة الجسم 180 درجة وتدريب كبح الأصابع', roleEn: 'Alignment & heel pulls', level: 'intermediate' },
        { id: 'cal-hs-i2', nameAr: 'ضغط بايك مرتفع القدمين (Elevated Pike Push-ups)', nameEn: 'Box Pike Push-ups', target: '4 × 8', roleAr: 'مضاعفة الحمل على الكتف الأمامي والجانبي', roleEn: 'Heavy vertical press', level: 'intermediate' },
        { id: 'cal-hs-i3', nameAr: 'ضغط مايل للأمام (Pseudo Planche Push-ups)', nameEn: 'Pseudo Planche Push-ups', target: '3 × 10', roleAr: 'تقوية وتر البايسبس والكتف الأمامي بعمق', roleEn: 'Anterior delt & tendon load', level: 'intermediate' },
        { id: 'cal-hs-i4', nameAr: 'ثبات الضفدع على الكوعين (Crow / Frog Stand)', nameEn: 'Crow Stand Balance', target: '4 × 30s', roleAr: 'إتقان التوازن الحر بدون حائط', roleEn: 'Freestanding balance feel', level: 'intermediate' },
      ],
      advanced: [
        { id: 'cal-hs-a1', nameAr: 'وقوف حر على اليدين (Freestanding Handstand Hold)', nameEn: 'Freestanding Handstand', target: '6 × 30s', roleAr: 'إتقان التوازن الحر والتحكم العصبي الكامل', roleEn: 'Freestanding mastery', level: 'advanced' },
        { id: 'cal-hs-a2', nameAr: 'ضغط كامل بالوقوف على اليدين (Wall / Free HSPU)', nameEn: 'Handstand Push-ups (HSPU)', target: '4 × 6-8', roleAr: 'أقصى قوة دفع عمودية بوزن الجسم الكامل', roleEn: 'Full bodyweight overhead press', level: 'advanced' },
        { id: 'cal-hs-a3', nameAr: 'انحناء ضغط التسعين درجة (90-Degree Push-up Negatives)', nameEn: '90-Degree Eccentrics', target: '3 × 4', roleAr: 'الربط بين الوقوف على اليدين والبلانش', roleEn: 'HSPU to Planche transition', level: 'advanced' },
        { id: 'cal-hs-a4', nameAr: 'رفع من إل-سيت إلى الوقوف (Bent-Arm Press to Handstand)', nameEn: 'Press to Handstand', target: '4 × 4', roleAr: 'قوة تحكم فائقة في الأكتاف والـ Core', roleEn: 'Slow controlled press', level: 'advanced' },
      ],
    },
  },
  frontlever_core: {
    titleAr: '⚡ الفرونت ليفر والبلانش وشد الجذع',
    titleEn: 'Front Lever, Planche & Core Track',
    badgeAr: 'ثبات أفقي خارق + ذراع مستقيمة',
    coachTipAr: 'المهارات الأفقية (Front Lever & Planche) تعتمد على قوة الذراع المستقيمة (Straight-Arm Strength). لا تثنِ كوعك أبداً أثناء تمارين الثبات!',
    exercises: {
      beginner: [
        { id: 'cal-fl-b1', nameAr: 'ثبات التاك فرونت ليفر (Tuck Front Lever Hold)', nameEn: 'Tuck Front Lever', target: '4 × 15s', roleAr: 'الخطوة الأولى لتعلم السحب الأفقي بالظهر', roleEn: 'Horizontal lat engagement', level: 'beginner' },
        { id: 'cal-fl-b2', nameAr: 'ميلان البلانش بذراع مستقيمة (Planche Lean)', nameEn: 'Planche Leans', target: '4 × 25s', roleAr: 'تهيئة أوتار الكوع والكتف الأمامي للبلانش', roleEn: 'Straight-arm shoulder load', level: 'beginner' },
        { id: 'cal-fl-b3', nameAr: 'إل-سيت على الأرض أو المتوازي (Tuck / Full L-Sit)', nameEn: 'Parallettes L-Sit', target: '4 × 20s', roleAr: 'ضغط عضلات البطن السفلية وتثبيت لوح الكتف', roleEn: 'Core compression & depression', level: 'beginner' },
        { id: 'cal-fl-b4', nameAr: 'سحب أسترالي واسع للظهر (Wide Inverted Rows)', nameEn: 'Wide Body Rows', target: '3 × 12', roleAr: 'تسميك عضلات المجنص وأعلى الظهر', roleEn: 'Mid-back & rear delt mass', level: 'beginner' },
      ],
      intermediate: [
        { id: 'cal-fl-i1', nameAr: 'فرونت ليفر متقدم بزاوية 90 (Advanced Tuck Front Lever)', nameEn: 'Adv. Tuck Front Lever', target: '5 × 12s', roleAr: 'مضاعفة عزم القوة على المجنص والبطن', roleEn: 'Extended lever torque', level: 'intermediate' },
        { id: 'cal-fl-i2', nameAr: 'دراجون فلاج للبطن (Dragon Flags)', nameEn: 'Dragon Flags', target: '4 × 6', roleAr: 'أقوى تمرين جذع يحاكي استقامة الفرونت ليفر', roleEn: 'Anti-extension core power', level: 'intermediate' },
        { id: 'cal-fl-i3', nameAr: 'ثبات تاك بلانش (Tuck Planche Hold)', nameEn: 'Tuck Planche', target: '5 × 10s', roleAr: 'رفع القدمين عن الأرض بالاعتماد على الكتف الأمامي', roleEn: 'Floating straight-arm hold', level: 'intermediate' },
        { id: 'cal-fl-i4', nameAr: 'رفعات آيس كريم ميكر على العقلة (Ice Cream Makers)', nameEn: 'Front Lever Swings', target: '3 × 8', roleAr: 'تقوية ديناميكية لعضلات الظهر في الوضع الأفقي', roleEn: 'Dynamic horizontal pull', level: 'intermediate' },
      ],
      advanced: [
        { id: 'cal-fl-a1', nameAr: 'فرونت ليفر كامل أو مفتوح الساقين (Straddle / Full Front Lever)', nameEn: 'Straddle / Full Front Lever', target: '5 × 8-10s', roleAr: 'ثبات أفقي كامل بقوة الظهر والجذع', roleEn: 'Full horizontal mastery', level: 'advanced' },
        { id: 'cal-fl-a2', nameAr: 'سحب في وضع الفرونت ليفر (Front Lever Rows)', nameEn: 'Tuck / Adv. FL Rows', target: '4 × 6', roleAr: 'قوة سحب أفقية خارقة في الهواء', roleEn: 'Mid-air horizontal rowing', level: 'advanced' },
        { id: 'cal-fl-a3', nameAr: 'بلانش متقدم أو مفتوح (Adv. Tuck / Straddle Planche)', nameEn: 'Adv. Tuck / Straddle Planche', target: '5 × 8s', roleAr: 'قمة القوة الأمامية للأكتاف والأوتار', roleEn: 'Elite straight-arm push', level: 'advanced' },
        { id: 'cal-fl-a4', nameAr: 'إل-سيت إلى في-سيت (V-Sit Compression)', nameEn: 'V-Sit Hold', target: '4 × 10s', roleAr: 'أقصى ضغط للجذع والترايسبس', roleEn: 'Maximum core compression', level: 'advanced' },
      ],
    },
  },
  street_shred: {
    titleAr: '💪 تضخيم وتنشيف بوزن الجسم (Street Hypertrophy)',
    titleEn: 'Street Workout Hypertrophy & Shred',
    badgeAr: 'بناء عضلي صافي + لياقة عالية',
    coachTipAr: 'لبناء العضلات بوزن الجسم، تحكّم في سرعة النزول (3 ثوانٍ نزول + ثانية صعود) واقترب من الفشل العضلي في كل جولة مع راحة 60-90 ثانية.',
    exercises: {
      beginner: [
        { id: 'cal-sh-b1', nameAr: 'ضغط صدر كلاسيكي وواسع (Standard & Wide Push-ups)', nameEn: 'Push-ups Hypertrophy', target: '4 × 15', roleAr: 'بناء الصدر والترايسبس والكتف الأمامي', roleEn: 'Chest & triceps volume', level: 'beginner' },
        { id: 'cal-sh-b2', nameAr: 'سحب أسترالي وعقلة معكوسة للبايسبس (Chin-ups / Rows)', nameEn: 'Chin-ups & Rows', target: '4 × 10', roleAr: 'تضخيم البايسبس وعرض الظهر', roleEn: 'Biceps & lat hypertrophy', level: 'beginner' },
        { id: 'cal-sh-b3', nameAr: 'سكوات بلغاري لكل ساق (Bulgarian Split Squats)', nameEn: 'Bulgarian Split Squats', target: '3 × 12 لكل ساق', roleAr: 'تضخيم الأفخاذ والأرداف بدون الحاجة لأوزان ثقيلة', roleEn: 'Single-leg quad builder', level: 'beginner' },
        { id: 'cal-sh-b4', nameAr: 'بلانك ديناميكي ولمس الأكتاف (Plank Shoulder Taps)', nameEn: 'Plank Shoulder Taps', target: '3 × 45s', roleAr: 'نحت البطن وتثبيت الحوض', roleEn: 'Core stability & shred', level: 'beginner' },
      ],
      intermediate: [
        { id: 'cal-sh-i1', nameAr: 'ضغط دايموند + متوازي صدر (Diamond Push-ups & Chest Dips)', nameEn: 'Dips & Diamond Push-ups', target: '4 × 12', roleAr: 'تفجير الصدر السفلي والترايسبس', roleEn: 'Lower chest & triceps mass', level: 'intermediate' },
        { id: 'cal-sh-i2', nameAr: 'عقلة واسعة وعقلة ضيقة سوبرسيت (Wide + Close Pull-ups)', nameEn: 'Pull-up Mechanical Drop Set', target: '4 × 8+6', roleAr: 'استهداف كل زوايا الظهر والذراعين حتى الإجهاد', roleEn: 'Complete back thickness', level: 'intermediate' },
        { id: 'cal-sh-i3', nameAr: 'سكوات أحادي الساق على صندوق (Box Pistol Squats)', nameEn: 'Box Pistol Squats', target: '4 × 8 لكل ساق', roleAr: 'قوة وتوازن وضخامة للأرجل', roleEn: 'Unilateral leg power', level: 'intermediate' },
        { id: 'cal-sh-i4', nameAr: 'رفع الأرجل المعلق للبطن (Hanging Leg Raises)', nameEn: 'Strict Leg Raises', target: '4 × 12', roleAr: 'إبراز عضلات البطن السفلية (6-Pack)', roleEn: 'Lower abs definition', level: 'intermediate' },
      ],
      advanced: [
        { id: 'cal-sh-a1', nameAr: 'متوازي وعقلة بوزن أو تحكم بطيء (Weighted / Tempo Dips & Pulls)', nameEn: 'Weighted / Tempo Calisthenics', target: '5 × 10', roleAr: 'تضخيم عضلي ينافس الحديد الثقيل', roleEn: 'Elite street hypertrophy', level: 'advanced' },
        { id: 'cal-sh-a2', nameAr: 'ضغط آرشر وضغط بيد واحدة (Archer / One-Arm Push-ups)', nameEn: 'Archer Push-ups', target: '4 × 8 لكل جانب', roleAr: 'تطوير قوة صدر وكتف استثنائية', roleEn: 'Unilateral chest mastery', level: 'advanced' },
        { id: 'cal-sh-a3', nameAr: 'بيستول سكوات كامل + قفز انفجاري (Full Pistol Squats)', nameEn: 'Full Pistol Squats', target: '4 × 8 لكل ساق', roleAr: 'أقصى قوة ومرونة للمفاصل والأرجل', roleEn: 'Full range single-leg squat', level: 'advanced' },
        { id: 'cal-sh-a4', nameAr: 'مساحات الزجاج على العقلة للبطن (Hanging Windshield Wipers)', nameEn: 'Windshield Wipers', target: '4 × 10', roleAr: 'نحت الخواصر (Obliques) وجذع فولاذي', roleEn: 'Oblique & rotational core', level: 'advanced' },
      ],
    },
  },
};

const getRoutineDefaultExercises = (
  routine: RoutineType,
  isAr: boolean,
  bodyGoal: BodyGoalType = 'bulking',
  athleteLevel: AthleteLevelType = 'intermediate'
): WorkoutExercise[] => {
  const wMult = athleteLevel === 'beginner' ? 0.65 : athleteLevel === 'advanced' ? 1.25 : 1.0;
  const rW = (base: number) => Math.max(5, Math.round((base * wMult) / 2.5) * 2.5);
  const mainReps = bodyGoal === 'bulking' ? 8 : bodyGoal === 'cutting' ? 12 : bodyGoal === 'combat_hybrid' ? 6 : 10;
  const isoReps = bodyGoal === 'bulking' ? 10 : bodyGoal === 'cutting' ? 15 : 12;

  switch (routine) {
    case 'pull':
      return [
        {
          id: 'pull-1',
          name: isAr ? 'Barbell Row (سحب بار للظهر - تمرين أساسي)' : 'Barbell Bent-Over Row',
          sets: [
            { weight: rW(55), reps: mainReps, done: false },
            { weight: rW(60), reps: mainReps, done: false },
            { weight: rW(65), reps: Math.max(6, mainReps - 2), done: false },
          ],
        },
        {
          id: 'pull-2',
          name: isAr ? 'Lat Pulldown / Weighted Pull-up (سحب عريض للمجنص)' : 'Wide-Grip Lat Pulldown',
          sets: [
            { weight: rW(50), reps: mainReps + 2, done: false },
            { weight: rW(55), reps: mainReps, done: false },
            { weight: rW(55), reps: mainReps, done: false },
          ],
        },
        {
          id: 'pull-3',
          name: isAr ? 'Seated Cable Row (سحب أرضي ضيق لعمق الظهر)' : 'Seated Cable Row',
          sets: [
            { weight: rW(50), reps: isoReps, done: false },
            { weight: rW(55), reps: isoReps, done: false },
          ],
        },
        {
          id: 'pull-4',
          name: isAr ? 'Face Pulls & Rear Delt (سحب للوجه والكتف الخلفي)' : 'Cable Face Pulls',
          sets: [
            { weight: rW(22.5), reps: 15, done: false },
            { weight: rW(25), reps: 15, done: false },
          ],
        },
        {
          id: 'pull-5',
          name: isAr ? 'Incline DB / EZ-Bar Curl (بايسبس بالبار أو الدمبل)' : 'EZ-Bar / Incline Bicep Curl',
          sets: [
            { weight: rW(30), reps: isoReps, done: false },
            { weight: rW(32.5), reps: isoReps, done: false },
            { weight: rW(32.5), reps: Math.max(8, isoReps - 2), done: false },
          ],
        },
      ];
    case 'legs':
      return [
        {
          id: 'legs-1',
          name: isAr ? 'Barbell Squat / Hack Squat (سكوات أساسي للأفخاذ)' : 'Barbell Back Squat',
          sets: [
            { weight: rW(70), reps: mainReps, done: false },
            { weight: rW(80), reps: mainReps, done: false },
            { weight: rW(85), reps: Math.max(5, mainReps - 2), done: false },
          ],
        },
        {
          id: 'legs-2',
          name: isAr ? 'Romanian Deadlift (رفعة رومانية للخلفيات والأوتار)' : 'Romanian Deadlift (RDL)',
          sets: [
            { weight: rW(65), reps: mainReps + 2, done: false },
            { weight: rW(70), reps: mainReps, done: false },
            { weight: rW(75), reps: mainReps, done: false },
          ],
        },
        {
          id: 'legs-3',
          name: isAr ? 'Leg Press / Bulgarian Split Squat (دفع الأرجل والضخامة)' : 'Leg Press / Split Squat',
          sets: [
            { weight: rW(120), reps: isoReps, done: false },
            { weight: rW(140), reps: isoReps, done: false },
          ],
        },
        {
          id: 'legs-4',
          name: isAr ? 'Lying Leg Curl & Calf Raises (مرجحة خلفيات + سمانة)' : 'Leg Curl & Standing Calves',
          sets: [
            { weight: rW(45), reps: isoReps, done: false },
            { weight: rW(50), reps: isoReps, done: false },
            { weight: rW(50), reps: isoReps, done: false },
          ],
        },
      ];
    case 'upper':
      return [
        {
          id: 'up-1',
          name: isAr ? 'Incline Barbell / DB Press (ضغط صدر علوي)' : 'Incline Chest Press',
          sets: [
            { weight: rW(55), reps: mainReps, done: false },
            { weight: rW(60), reps: mainReps, done: false },
            { weight: rW(62.5), reps: mainReps, done: false },
          ],
        },
        {
          id: 'up-2',
          name: isAr ? 'Weighted Pull-ups / Lat Pulldown (عقلة أو سحب مجنص)' : 'Weighted Pull-ups / Pulldown',
          sets: [
            { weight: rW(55), reps: mainReps, done: false },
            { weight: rW(60), reps: mainReps, done: false },
            { weight: rW(60), reps: mainReps, done: false },
          ],
        },
        {
          id: 'up-3',
          name: isAr ? 'Overhead Shoulder Press (ضغط أكتاف عسكري)' : 'Overhead Shoulder Press',
          sets: [
            { weight: rW(40), reps: mainReps, done: false },
            { weight: rW(42.5), reps: mainReps, done: false },
          ],
        },
        {
          id: 'up-4',
          name: isAr ? 'Chest-Supported Row (سحب ظهر مسنود الصدر)' : 'Chest-Supported Row',
          sets: [
            { weight: rW(50), reps: isoReps, done: false },
            { weight: rW(55), reps: isoReps, done: false },
          ],
        },
        {
          id: 'up-5',
          name: isAr ? 'Arms Superset: Hammer Curl + Rope Pushdown (سوبرسيت ذراع)' : 'Biceps + Triceps Superset',
          sets: [
            { weight: rW(22.5), reps: isoReps, done: false },
            { weight: rW(25), reps: isoReps, done: false },
          ],
        },
      ];
    case 'arms_delts':
      return [
        {
          id: 'ad-1',
          name: isAr ? 'Seated DB Shoulder Press (ضغط أكتاف بالدمبل)' : 'Seated DB Shoulder Press',
          sets: [
            { weight: rW(22.5), reps: mainReps, done: false },
            { weight: rW(25), reps: mainReps, done: false },
            { weight: rW(25), reps: mainReps, done: false },
          ],
        },
        {
          id: 'ad-2',
          name: isAr ? 'Cable / DB Lateral Raises (رفرفة جانبي لتعريض الكتف)' : 'Lateral Raises (3D Delts)',
          sets: [
            { weight: rW(12.5), reps: 15, done: false },
            { weight: rW(12.5), reps: 15, done: false },
            { weight: rW(15), reps: 12, done: false },
          ],
        },
        {
          id: 'ad-3',
          name: isAr ? 'Skullcrushers / Overhead Extension (ترايسبس للرأس الطويل)' : 'EZ-Bar Skullcrushers',
          sets: [
            { weight: rW(30), reps: isoReps, done: false },
            { weight: rW(32.5), reps: isoReps, done: false },
            { weight: rW(35), reps: 10, done: false },
          ],
        },
        {
          id: 'ad-4',
          name: isAr ? 'Preacher Curl & Hammer Curl (بايسبس ارتكاز + هامر للساعد)' : 'Preacher & Hammer Curls',
          sets: [
            { weight: rW(27.5), reps: isoReps, done: false },
            { weight: rW(30), reps: isoReps, done: false },
            { weight: rW(30), reps: 10, done: false },
          ],
        },
      ];
    case 'cardio':
      return [
        {
          id: 'cardio-1',
          name: isAr ? 'Incline Treadmill Walk (مشي مائل لحرق الدهون الصافي Zone 2)' : 'Incline Treadmill Zone 2',
          sets: [
            { weight: 0, reps: 20, done: false },
            { weight: 0, reps: 15, done: false },
          ],
        },
        {
          id: 'cardio-2',
          name: isAr ? 'HIIT Assault Bike / Rower (جولات سرعة لرفع الـ VO2 Max)' : 'HIIT Conditioning Intervals',
          sets: [
            { weight: 0, reps: 10, done: false },
            { weight: 0, reps: 10, done: false },
          ],
        },
        {
          id: 'cardio-3',
          name: isAr ? 'Hanging Leg Raises & Ab Wheel (نحت عضلات البطن والـ Core)' : 'Core & Abs Finisher',
          sets: [
            { weight: 0, reps: 15, done: false },
            { weight: 0, reps: 15, done: false },
            { weight: 0, reps: 15, done: false },
          ],
        },
      ];
    case 'survival':
      return [
        {
          id: 'surv-1',
          name: isAr ? 'Push-ups & Core MVD (حد الكفاية البدني في 5 دقائق)' : 'MVD Push-ups & Core',
          sets: [
            { weight: 0, reps: 15, done: false },
            { weight: 0, reps: 15, done: false },
          ],
        },
      ];
    case 'push':
    default:
      return [
        {
          id: 'ex-1',
          name: isAr ? 'Bench Press (ضغط الصدر بالبار - تمرين القوة الأساسي)' : 'Barbell Bench Press',
          sets: [
            { weight: rW(60), reps: mainReps, done: false },
            { weight: rW(65), reps: mainReps, done: false },
            { weight: rW(70), reps: Math.max(6, mainReps - 2), done: false },
          ],
        },
        {
          id: 'ex-2',
          name: isAr ? 'Incline Dumbbell Press (تجميع بالدمبل مائل للصدر العلوي)' : 'Incline DB Press',
          sets: [
            { weight: rW(22.5), reps: mainReps + 2, done: false },
            { weight: rW(25), reps: mainReps, done: false },
            { weight: rW(25), reps: mainReps, done: false },
          ],
        },
        {
          id: 'ex-3',
          name: isAr ? 'Overhead Shoulder Press / Dips (ضغط أكتاف أو متوازي)' : 'Overhead Press / Weighted Dips',
          sets: [
            { weight: rW(40), reps: mainReps, done: false },
            { weight: rW(42.5), reps: mainReps, done: false },
          ],
        },
        {
          id: 'ex-4',
          name: isAr ? 'Lateral Raises (رفرفة جانبي لتعريض الأكتاف)' : 'Dumbbell Lateral Raises',
          sets: [
            { weight: rW(10), reps: isoReps + 2, done: false },
            { weight: rW(12.5), reps: isoReps, done: false },
            { weight: rW(12.5), reps: isoReps, done: false },
          ],
        },
        {
          id: 'ex-5',
          name: isAr ? 'Tricep Rope Pushdown (سحب حبل للترايسبس)' : 'Tricep Rope Pushdowns',
          sets: [
            { weight: rW(25), reps: isoReps, done: false },
            { weight: rW(27.5), reps: isoReps, done: false },
          ],
        },
      ];
  }
};

export const GymAnchorView: React.FC<GymAnchorViewProps> = ({
  isSurvivalMode,
  isCompleted,
  onCompleteStation,
  onNextStation,
  userState,
  onRewardToast,
  onOpenNiyyahModal,
}) => {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  // Dynamic persona & station metadata
  const personaId = userState?.settings?.lifestylePersona || 'builder_exec';
  const persona = PERSONA_CONFIGS[personaId] || PERSONA_CONFIGS.builder_exec;
  const stationMeta = resolveStationMetadata(
    'GYM_ANCHOR',
    personaId,
    userState?.settings?.stationCustomOverrides,
    isAr
  );

  const [movementCategory, setMovementCategory] = useState<MovementCategory>(() => {
    return (localStorage.getItem('midmar_movement_cat') as MovementCategory) || 'gym';
  });

  const handleSelectMovementCat = (cat: MovementCategory) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setMovementCategory(cat);
    localStorage.setItem('midmar_movement_cat', cat);
  };

  // Personalized Bodybuilding & Hybrid Athlete Profile
  const [bodyGoal, setBodyGoal] = useState<BodyGoalType>(() => {
    return (localStorage.getItem('midmar_body_goal') as BodyGoalType) || 'bulking';
  });
  const [athleteLevel, setAthleteLevel] = useState<AthleteLevelType>(() => {
    return (localStorage.getItem('midmar_athlete_level') as AthleteLevelType) || 'intermediate';
  });
  const [secondarySport, setSecondarySport] = useState<SecondarySportType>(() => {
    return (localStorage.getItem('midmar_secondary_sport') as SecondarySportType) || 'boxing';
  });

  // Calisthenics Skill & Level Progression State
  const [calisthenicsSkill, setCalisthenicsSkill] = useState<CalisthenicsSkillTrack>(() => {
    return (localStorage.getItem('midmar_calisthenics_skill') as CalisthenicsSkillTrack) || 'pull_muscleup';
  });
  const [homeExercises, setHomeExercises] = useState<CalisthenicsExerciseItem[]>(() => {
    const initialTrack = (localStorage.getItem('midmar_calisthenics_skill') as CalisthenicsSkillTrack) || 'pull_muscleup';
    const initialLvl = (localStorage.getItem('midmar_athlete_level') as AthleteLevelType) || 'intermediate';
    const list = CALISTHENICS_SKILL_TRACKS[initialTrack]?.exercises[initialLvl] || CALISTHENICS_SKILL_TRACKS.pull_muscleup.exercises.intermediate;
    return list.map((item) => ({ ...item, done: false }));
  });

  const syncCalisthenicsTrack = (track: CalisthenicsSkillTrack, lvl: AthleteLevelType) => {
    const list = CALISTHENICS_SKILL_TRACKS[track]?.exercises[lvl] || CALISTHENICS_SKILL_TRACKS.pull_muscleup.exercises.intermediate;
    setHomeExercises(list.map((item) => ({ ...item, done: false })));
  };

  // Outdoor walk state
  const [walkMinutes, setWalkMinutes] = useState(30);
  const [neatSparkPaces, setNeatSparkPaces] = useState(() => {
    return Number(localStorage.getItem('midmar_neat_spark') || '0');
  });

  // Mobility stretch state including 3-Phase Posture Reset
  const [mobilityStretches, setMobilityStretches] = useState([
    { id: 'm-posture-1', name: isAr ? '1. فتح الصدر عند الباب (Doorway Pec Stretch)' : '1. Doorway Pec Stretch', duration: '30s', done: false },
    { id: 'm-posture-2', name: isAr ? '2. ارتداد الذقن لتصحيح الرقبة (Chin Tucks)' : '2. Chin Tucks Posture Reset', duration: '10 reps', done: false },
    { id: 'm-posture-3', name: isAr ? '3. جسر الألوية وتفعيل الحوض (Glute Bridges)' : '3. Glute Bridge Activation', duration: '15 reps', done: false },
    { id: 'm1', name: isAr ? 'إطالة عضلات الرقبة والترقوة' : 'Neck & Trap Stretch', duration: '60s', done: false },
    { id: 'm2', name: isAr ? 'تمدد القطة والبقرة للعمود الفقري' : 'Cat-Cow Flow', duration: '10 reps', done: false },
    { id: 'm3', name: isAr ? 'وضعية الطفل وفتح الأكتاف' : "Child's Pose", duration: '90s', done: false },
    { id: 'm4', name: isAr ? 'إطالة أوتار الفخذ وأسفل الظهر' : 'Hamstring & Low Back Relief', duration: '60s', done: false },
  ]);

  const [workoutChecked, setWorkoutChecked] = useState(isCompleted);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineType>(
    isSurvivalMode ? 'survival' : 'push'
  );

  // 3-Step Friction Destroyer Checklist
  const [frictionSteps, setFrictionSteps] = useState({
    shoes: false,
    water: false,
    door: false,
  });

  // Interactive Workout Logger
  const [exercises, setExercises] = useState<WorkoutExercise[]>(() => {
    const saved = localStorage.getItem('midmar_workout_exercises');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'ex-1',
        name: isAr ? 'Bench Press (ضغط الصدر بالبار)' : 'Barbell Bench Press',
        sets: [
          { weight: 60, reps: 10, done: true },
          { weight: 65, reps: 8, done: true },
          { weight: 70, reps: 6, done: false },
        ],
      },
      {
        id: 'ex-2',
        name: isAr ? 'Incline Dumbbell Press (تجميع بالدمبل مائل)' : 'Incline DB Press',
        sets: [
          { weight: 22, reps: 10, done: false },
          { weight: 22, reps: 10, done: false },
        ],
      },
    ];
  });

  const [newExerciseName, setNewExerciseName] = useState('');

  // Rest Timer
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [faithPlaying, setFaithPlaying] = useState(false);
  useEffect(() => {
    const unsubscribe = gymFaithAudio.subscribe((s) => setFaithPlaying(Boolean(s.isPlaying)));
    return () => {
      unsubscribe();
    };
  }, []);

  // Endorphin Rating
  const [endorphinRating, setEndorphinRating] = useState(() => {
    return Number(localStorage.getItem('midmar_endorphin_rating') || '4');
  });

  // Warmup Pyramid Calculator State
  const [isWarmupModalOpen, setIsWarmupModalOpen] = useState(false);
  const [warmupTargetExercise, setWarmupTargetExercise] = useState('Bench Press');
  const [warmupTargetExerciseId, setWarmupTargetExerciseId] = useState<string | null>(null);

  // Niyyah (Intention) Consecration Engine
  const [activeBodyNiyyah, setActiveBodyNiyyah] = useState<string>(() => {
    return localStorage.getItem('midmar_body_niyyah') || 'strong_believer';
  });

  // Save exercises to local storage
  const saveExercises = (updated: WorkoutExercise[]) => {
    setExercises(updated);
    localStorage.setItem('midmar_workout_exercises', JSON.stringify(updated));
  };

  const handleApplyWarmupSets = (warmupSets: Array<{ weight: number; reps: number; done: boolean }>) => {
    if (!warmupTargetExerciseId) return;
    const updated = exercises.map((ex) => {
      if (ex.id === warmupTargetExerciseId) {
        return {
          ...ex,
          sets: [...warmupSets],
        };
      }
      return ex;
    });
    saveExercises(updated);
    if (onRewardToast) {
      onRewardToast(
        isAr ? '📐 تم تطبيق جولات الهرم التدريبي في التمرين!' : '📐 Warm-up pyramid applied to exercise!'
      );
    }
  };

  // Rest Timer Effect
  useEffect(() => {
    let timer: any;
    if (isRestRunning && restSeconds > 0) {
      timer = setTimeout(() => {
        setRestSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isRestRunning && restSeconds === 0) {
      setIsRestRunning(false);
      soundSynth.playGymRestChime();
      haptic.vibrateSprintCelebration();
      gymFaithAudio.duckVolume(2500, 0.25);
    }
    return () => clearTimeout(timer);
  }, [isRestRunning, restSeconds]);

  const handleStartRest = (sec: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setRestSeconds(sec);
    setRestTotal(sec);
    setIsRestRunning(true);
  };

  const handleConfirmDone = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    setWorkoutChecked(true);
    soundSynth.playCompletionChime();
    haptic.vibrateWorkDone();
    try {
      const x = e?.clientX ? e.clientX / window.innerWidth : 0.5;
      const y = e?.clientY ? e.clientY / window.innerHeight : 0.6;
      confetti({ disableForReducedMotion: true,
        particleCount: 55,
        spread: 65,
        origin: { x, y },
        colors: ['#1eb814', '#bce8c2', '#ff5500', '#fde6d8'],
      });
    } catch {
      triggerCelebrationConfetti();
    }

    try {
      let loggedExercises: WorkoutExercise[] = exercises;
      let loggedVolume = totalVolume;
      let loggedSets = completedSetsCount;
      let durationMins = 45;

      if (movementCategory === 'walk') {
        durationMins = walkMinutes;
        loggedVolume = 0;
        loggedSets = 1;
        loggedExercises = [
          {
            id: `walk-${Date.now()}`,
            name: isAr ? `مشي خارجي معتدل (${walkMinutes} دقيقة)` : `Outdoor Walk (${walkMinutes} mins)`,
            sets: [{ reps: walkMinutes, weight: 0, done: true }],
          },
        ];
      } else if (movementCategory === 'mobility') {
        durationMins = 20;
        loggedVolume = 0;
        loggedSets = mobilityStretches.filter((m) => m.done).length || 4;
        loggedExercises = mobilityStretches.map((m) => ({
          id: m.id,
          name: m.name,
          sets: [{ reps: 1, weight: 0, done: m.done }],
        }));
      } else if (movementCategory === 'home') {
        durationMins = 30;
        loggedVolume = 0;
        loggedSets = homeExercises.filter((h) => h.done).length || 4;
        loggedExercises = homeExercises.map((h) => ({
          id: h.id,
          name: isAr ? h.nameAr : h.nameEn,
          sets: [{ reps: 12, weight: 0, done: h.done }],
        }));
      }

      await db.workout_logs.add({
        id: `gym-${Date.now()}`,
        date: getBiologicalDate(),
        category: movementCategory,
        routineType: selectedRoutine,
        splitType: selectedRoutine,
        exercises: loggedExercises,
        durationMinutes: durationMins,
        totalVolume: loggedVolume,
        totalTonnageKg: loggedVolume,
        completedSets: loggedSets,
        endorphinRating: endorphinRating,
        timestamp: Date.now(),
      });

      if (onRewardToast) {
        onRewardToast(
          isAr
            ? `🏋️ تم حفظ نشاطك في السجل الدائم بنجاح (${movementCategory === 'gym' ? `${loggedSets} جولات - حجم ${loggedVolume} كجم` : `${durationMins} دقيقة حركة`})!`
            : `🏋️ Activity logged to permanent record (${durationMins} mins movement)!`
        );
      }
    } catch (e) {
      console.error('Failed to log gym workout to Dexie:', e);
    }

    onCompleteStation();
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}`,
      name: newExerciseName.trim(),
      sets: [{ weight: 20, reps: 10, done: false }],
    };

    saveExercises([...exercises, newEx]);
    setNewExerciseName('');
  };

  const handleDeleteExercise = (id: string) => {
    soundSynth.playTactileClick();
    saveExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleAddSet = (exerciseId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1] || { weight: 20, reps: 10, done: false };
        return {
          ...ex,
          sets: [...ex.sets, { weight: lastSet.weight, reps: lastSet.reps, done: false }],
        };
      }
      return ex;
    });
    saveExercises(updated);
  };

  const handleCloneLastSet = (exerciseId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        if (ex.sets.length === 0) {
          return {
            ...ex,
            sets: [{ weight: 20, reps: 10, rpe: 8, done: false }],
          };
        }
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { weight: lastSet.weight, reps: lastSet.reps, rpe: lastSet.rpe || 8, done: false },
          ],
        };
      }
      return ex;
    });
    saveExercises(updated);
    if (onRewardToast) {
      onRewardToast(
        isAr ? '⚡ تم تكرار الجولة السابقة بنجاح بنقرة واحدة!' : '⚡ Last set cloned successfully!'
      );
    }
  };

  const handleApplyDeloadSet = (exerciseId: string, deloadWeight: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateMedium();
    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1] || { reps: 8, weight: 20 };
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { weight: deloadWeight, reps: lastSet.reps, rpe: 8, done: false },
          ],
        };
      }
      return ex;
    });
    saveExercises(updated);
    if (onRewardToast) {
      onRewardToast(
        isAr
          ? `🛡️ تم تطبيق التخفيف الذكي للجولة التالية (-7.5% إلى ${deloadWeight} كجم) لحماية الجهاز العصبي!`
          : `🛡️ Applied auto-regulated deload set (${deloadWeight} kg) for CNS recovery!`
      );
    }
  };

  const handleUpdateSet = (
    exerciseId: string,
    setIndex: number,
    field: keyof WorkoutSet,
    val: any
  ) => {
    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const newSets = ex.sets.map((s, idx) => {
          if (idx === setIndex) {
            const next = { ...s, [field]: val };
            if (field === 'done' && val === true) {
              soundSynth.playTactileClick();
              haptic.vibrateLight();
              // Adaptive Rest Timer: 180s (3m) for heavy compound lifts, 60s for isolation
              const isCompound = /bench|squat|deadlift|press|row|صدر|سكوات|ديدلفت|بار|ظهر|أرجل/i.test(ex.name);
              handleStartRest(isCompound ? 180 : 60);
            }
            return next;
          }
          return s;
        });
        return { ...ex, sets: newSets };
      }
      return ex;
    });
    saveExercises(updated);
  };

  // Calculate total workout volume
  const totalVolume = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, s) => {
        return s.done ? sAcc + s.weight * s.reps : sAcc;
      }, 0)
    );
  }, 0);

  const completedSetsCount = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.done).length;
  }, 0);

  // Spinal Axial Loading Guard (حارس التحميل المحوري للعمود الفقري)
  const spinalCheck = React.useMemo(() => {
    const squatMatch = exercises.some((ex) => /squat|سكوات|قرفصاء/i.test(ex.name));
    const deadliftMatch = exercises.some((ex) => /deadlift|ديدلفت|رفعة ميتة/i.test(ex.name));
    const isSevere = squatMatch && deadliftMatch;
    return {
      isSevere,
      squatMatch,
      deadliftMatch,
    };
  }, [exercises]);

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-4 transition-colors duration-200">
      {/* Habitline Obsidian Station Hero Banner */}
      <div className="celestial-obsidian-stage rounded-[28px] text-white p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-habit-flame-ink text-white flex items-center justify-center shadow-lg shadow-[#ff5500]/25 shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold border border-white/10">
                {isAr ? 'المحطة 5 من 8' : 'Station 5 of 8'}
              </span>
              <span className="text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
                {persona.badge} • <bdi dir="ltr" className="tabular-nums text-[#fde6d8]">{stationMeta.shortTime}</bdi>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {isAr ? stationMeta.titleAr : stationMeta.titleEn}
            </h2>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          {(isCompleted || workoutChecked) && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#bce8c2] text-zinc-950 font-bold shadow-xs">
              {isAr ? 'مكتملة اليوم ✓' : 'Completed ✓'}
            </span>
          )}
          {faithPlaying && (
            <span
              className="flex items-end gap-0.5 h-6 px-2"
              role="img"
              aria-label={isAr ? 'أثير السيرة يعمل' : 'Faith audio playing'}
            >
              {[10, 18, 14, 22, 12].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-amber-300 animate-pulse"
                  style={{ height: h, animationDelay: `${i * 140}ms` }}
                />
              ))}
            </span>
          )}
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#fde6d8] text-zinc-950 font-mono font-bold tabular-nums shadow-sm">
            +15 XP
          </span>
        </div>
      </div>

      {/* 7 Movement Categories Segmented Tab Strip — Habitline Pill Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none p-1.5 rounded-[24px] surface-card-3d border border-zinc-200/80 dark:border-white/10">
        <button
          type="button"
          onClick={() => handleSelectMovementCat('gym')}
          className={`py-2 px-3.5 rounded-[18px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'gym'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🏋️</span>
          <span>{isAr ? 'كمال أجسام وحديد' : 'Bodybuilding & Gym'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('combat')}
          className={`py-2 px-3.5 rounded-[18px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'combat'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🥊</span>
          <span>{isAr ? 'فنون قتالية (بوكس / كيك / جوجيتسو)' : 'Combat Sports'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('home')}
          className={`py-2 px-3.5 rounded-[18px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'home'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🤸‍♂️</span>
          <span>{isAr ? 'كاليستنكس ووزن الجسم' : 'Calisthenics'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('football')}
          className={`py-2 px-3.5 rounded-[18px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'football'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>⚽</span>
          <span>{isAr ? 'كورة وبادل' : 'Football & Padel'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('fitness_class')}
          className={`py-2 px-3.5 rounded-[18px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'fitness_class'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>⏱️</span>
          <span>{isAr ? 'كلاس فيتنس و HIIT' : 'Fitness Class'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('walk')}
          className={`py-2 px-3.5 rounded-[18px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'walk'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🚶</span>
          <span>{isAr ? 'مشي وهرولة' : 'Walk'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMovementCat('mobility')}
          className={`py-2 px-3.5 rounded-[18px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            movementCategory === 'mobility'
              ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>🧘</span>
          <span>{isAr ? 'إطالات واستشفاء' : 'Mobility'}</span>
        </button>
      </div>

      {/* Physical Niyyah Consecration Bar — Habitline Soft Lavender Surface */}
      <div className="bento-3d-lavender p-4 rounded-[28px] border border-indigo-400/25 dark:border-indigo-500/25 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#5448e8] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-indigo-900 dark:text-indigo-300 block leading-tight">
              {isAr ? 'استحضار نية البدن والرياضة' : 'Body & Vitality Intention'}
            </span>
            <span
              dir={isAr ? 'rtl' : undefined}
              lang={isAr ? 'ar' : undefined}
              className="text-xs font-bold text-zinc-950 dark:text-zinc-100 leading-[2.2] tashkeel-text"
            >
              {isAr ? '«الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ»' : '"The strong believer is beloved to Allah"'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'strong_believer', labelAr: 'المؤمن القوي أحب إلى الله', labelEn: 'Strong Believer' },
            { id: 'body_trust', labelAr: 'صيانة أمانة الجسد والصحة', labelEn: 'Body Safeguarding' },
            { id: 'worship_vitality', labelAr: 'التقوي على طاعة الله ومكابدة الحياة', labelEn: 'Strength for Worship' },
            { id: 'refresh_stamina', labelAr: 'ترويح مباح وشحذ العزيمة', labelEn: 'Permissible Stamina' },
          ].map((chip) => {
            const isSelected = activeBodyNiyyah === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setActiveBodyNiyyah(chip.id);
                  localStorage.setItem('midmar_body_niyyah', chip.id);
                  if (onRewardToast) {
                    onRewardToast(
                      isAr
                        ? `عُقدت نية البدن: ${chip.labelAr} 🌿`
                        : `Physical intention set: ${chip.labelEn}`
                    );
                  }
                }}
                className={`py-1.5 px-3 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                    : 'bg-white/90 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-indigo-400/25 hover:border-[#5448e8]'
                }`}
              >
                {isSelected && '✓ '}
                {isAr ? chip.labelAr : chip.labelEn}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              soundSynth.playTactileClick();
              if (onOpenNiyyahModal) onOpenNiyyahModal('body');
            }}
            className="py-1.5 px-3 rounded-full bg-[#5448e8] hover:bg-[#4538d8] text-white text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
            title={isAr ? 'فتح محراب النوايا الأربع الكامل' : 'Open Full Niyyah Sanctuary'}
          >
            {isAr ? 'المحراب الكامل ←' : 'Full Sanctuary →'}
          </button>
        </div>
      </div>

      {/* Movement View: Combat Sports (Boxing, Kickboxing, Muay Thai, BJJ, MMA) */}
      {movementCategory === 'combat' && (
        <CombatSportsModule onRewardToast={onRewardToast} />
      )}

      {/* Movement View: Team Sports (Football, Padel, Basketball) */}
      {movementCategory === 'football' && (
        <TeamSportsModule onRewardToast={onRewardToast} />
      )}

      {/* Movement View: Fitness Class (HIIT / Tabata / Circuit) */}
      {movementCategory === 'fitness_class' && (
        <FitnessIntervalEngine onRewardToast={onRewardToast} />
      )}

      {/* Movement View: Calisthenics Skill & Level Progression Coach */}
      {movementCategory === 'home' && (
        <div className="p-5 sm:p-6 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#141517] dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xl shadow-sm shrink-0">
                🤸‍♂️
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-100">
                  {isAr
                    ? 'مدرب مهارات الكاليستنكس المتدرج (Calisthenics Skill Coach)'
                    : 'Calisthenics Skill & Level Progression Coach'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isAr
                    ? 'حدد المهارة المستهدفة ومستواك الحالي ليقترح لك النظام التمارين المساعدة الدقيقة التي توصلك لإتقانها'
                    : 'Select your target skill & level for exact prerequisite and assistance progressions'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartRest(60)}
                className="py-2 px-3.5 rounded-full bg-[#fde6d8] dark:bg-amber-950/45 text-zinc-950 dark:text-amber-200 font-mono text-xs font-bold border border-amber-400/35 cursor-pointer tabular-nums"
              >
                ⏱️ 60s {isAr ? 'استراحة' : 'Rest'}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playCompletionChime();
                  haptic.vibrateMedium();
                  const mapped: WorkoutExercise[] = homeExercises.map((ex, i) => ({
                    id: `cal-log-${Date.now()}-${i}`,
                    name: isAr ? `${ex.nameAr} (${ex.target})` : `${ex.nameEn} (${ex.target})`,
                    sets: [
                      { weight: 0, reps: 10, done: false },
                      { weight: 0, reps: 10, done: false },
                      { weight: 0, reps: 10, done: false },
                    ],
                  }));
                  saveExercises(mapped);
                  handleSelectMovementCat('gym');
                  if (onRewardToast) {
                    onRewardToast(
                      isAr
                        ? '🤸‍♂️ تم نقل تمارين الكاليستنكس إلى سجل الجولات الرئيسي لتتبع التكرارات!'
                        : '🤸‍♂️ Loaded Calisthenics track into main workout logger!'
                    );
                  }
                }}
                className="py-2 px-3.5 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 text-xs font-bold cursor-pointer shadow-xs"
              >
                {isAr ? 'نقل لسجل الجولات 📋' : 'Load to Logger 📋'}
              </button>
            </div>
          </div>

          {/* 1. Target Skill Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
              {isAr ? '١. اختر المهارة أو الهدف في الكاليستنكس:' : '1. Choose Target Calisthenics Skill:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {(
                [
                  { id: 'pull_muscleup', label: isAr ? '🔥 العقلة والـ Muscle-Up' : '🔥 Pull-up & Muscle-Up' },
                  { id: 'handstand_push', label: isAr ? '🤸‍♂️ الوقوف على اليدين والدفع' : '🤸‍♂️ Handstand & HSPU' },
                  { id: 'frontlever_core', label: isAr ? '⚡ الفرونت ليفر والبلانش' : '⚡ Front Lever & Planche' },
                  { id: 'street_shred', label: isAr ? '💪 تضخيم وتنشيف بوزن الجسم' : '💪 Street Hypertrophy' },
                ] as const
              ).map((sk) => (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setCalisthenicsSkill(sk.id);
                    localStorage.setItem('midmar_calisthenics_skill', sk.id);
                    syncCalisthenicsTrack(sk.id, athleteLevel);
                  }}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-start border ${
                    calisthenicsSkill === sk.id
                      ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 border-transparent shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-[#ff5500]'
                  }`}
                >
                  {sk.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Athlete Level Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {isAr ? '٢. مستواك الحالي في المهارة:' : '2. Your Current Skill Level:'}
            </span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'beginner', labelAr: '🌱 مبتدئ (تأسيس القوة)', labelEn: '🌱 Beginner' },
                  { id: 'intermediate', labelAr: '⚡ متوسط (بناء المهارة)', labelEn: '⚡ Intermediate' },
                  { id: 'advanced', labelAr: '🏆 متقدم (إتقان وتحكم)', labelEn: '🏆 Advanced' },
                ] as const
              ).map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setAthleteLevel(lvl.id);
                    localStorage.setItem('midmar_athlete_level', lvl.id);
                    syncCalisthenicsTrack(calisthenicsSkill, lvl.id);
                  }}
                  className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    athleteLevel === lvl.id
                      ? 'bg-[#ff5500] text-white shadow-xs'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {isAr ? lvl.labelAr : lvl.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Coach Biomechanical Advice */}
          <div className="bento-3d-amber p-4 rounded-2xl border border-amber-400/35 flex items-start gap-3">
            <span className="text-lg shrink-0">💡</span>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-950 dark:text-amber-200 block">
                {isAr
                  ? `روشتة المدرب لمسار (${CALISTHENICS_SKILL_TRACKS[calisthenicsSkill].titleAr}):`
                  : `Coach Prescription (${CALISTHENICS_SKILL_TRACKS[calisthenicsSkill].titleEn}):`}
              </span>
              <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed">
                {CALISTHENICS_SKILL_TRACKS[calisthenicsSkill].coachTipAr}
              </p>
            </div>
          </div>

          {/* 3. Progressive Assistance Exercises Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {homeExercises.map((ex, idx) => (
              <div
                key={ex.id}
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setHomeExercises((prev) =>
                    prev.map((item) => (item.id === ex.id ? { ...item, done: !item.done } : item))
                  );
                }}
                className={`p-4 rounded-[22px] border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  ex.done
                    ? 'bg-[#d4f5dc]/80 dark:bg-emerald-950/40 border-[#1eb814]/40 text-zinc-950 dark:text-emerald-200'
                    : 'bg-zinc-50 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-[#ff5500]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-5 h-5 mt-0.5 rounded-lg flex items-center justify-center border shrink-0 ${
                        ex.done
                          ? 'bg-habit-green-ink border-[#1eb814] text-white'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {ex.done ? (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-zinc-400">{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold block">
                        {isAr ? ex.nameAr : ex.nameEn}
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block mt-0.5">
                        🎯 {isAr ? `الفائدة للمهارة: ${ex.roleAr}` : `Role: ${ex.roleEn}`}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-[#ff5500] dark:text-orange-300 text-xs font-mono font-bold tabular-nums shrink-0">
                    {ex.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movement View: Outdoor Walk */}
      {movementCategory === 'walk' && (
        <div className="p-5 sm:p-6 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🚶</span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-100">
                {isAr ? 'جلسة المشي والهرولة في الهواء الطلق' : 'Outdoor Mindful Walk'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isAr ? 'تجديد الأكسجين، تحفيز الإبداع، وتصفية الذهن' : 'Oxygenation, creative flow, and screen detox'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  soundSynth.playTactileClick();
                  setWalkMinutes(mins);
                }}
                className={`py-2.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer tabular-nums ${
                  walkMinutes === mins
                    ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {mins} {isAr ? 'دقيقة' : 'm'}
              </button>
            ))}
          </div>

          <div className="bento-3d-amber grid grid-cols-3 gap-3 p-4 rounded-[22px] border border-amber-400/30 text-center">
            <div>
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block font-sans">الخطوات المقدرة</span>
              <span className="text-lg font-mono font-bold text-[#ff5500] dark:text-orange-400 tabular-nums">
                ~{(walkMinutes * 100).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block font-sans">المسافة المتوقعة</span>
              <span className="text-lg font-mono font-bold text-zinc-950 dark:text-zinc-100 tabular-nums">
                ~{(walkMinutes * 0.08).toFixed(1)} كم
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block font-sans">حرق السعرات</span>
              <span className="text-lg font-mono font-bold text-[#1eb814] dark:text-emerald-400 tabular-nums">
                ~{(walkMinutes * 4.5).toFixed(0)} kcal
              </span>
            </div>
          </div>

          {/* NEAT 100-Pace Spark Trigger */}
          <div className="bento-3d-mint p-4 rounded-[22px] border border-[#1eb814]/25 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-950 dark:text-emerald-200">
                <Zap className="w-4 h-4 text-[#ff5500] fill-[#ff5500]" />
                <span>{isAr ? 'شرارة النشاط العفوي (NEAT 100-Pace Spark)' : 'NEAT 100-Pace Spark'}</span>
              </div>
              <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                {isAr
                  ? 'المشي لـ 100 خطوة بعد الجلوس يخفض سكر الدم بنسبة 24% وينشط الدورة الدموية.'
                  : 'Walking 100 paces right now lowers post-meal glucose and sparks circulation.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundSynth.playStreakMilestoneChime();
                haptic.vibrateSprintCelebration();
                const nextCount = neatSparkPaces + 100;
                setNeatSparkPaces(nextCount);
                localStorage.setItem('midmar_neat_spark', String(nextCount));
                if (onRewardToast) {
                  onRewardToast(
                    isAr
                      ? `⚡ أحسنت! أنجزت 100 خطوة الآن (المجموع: ${nextCount.toLocaleString()} خطوة NEAT)!`
                      : `⚡ Awesome! 100 NEAT paces sparked (Total: ${nextCount.toLocaleString()})!`
                  );
                }
              }}
              className="py-2.5 px-4 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs shrink-0 shadow-sm cursor-pointer active:scale-95 transition-all tabular-nums"
            >
              <span>+100 {isAr ? 'خطوة الآن ⚡' : 'Paces ⚡'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Movement View: Mobility & Posture */}
      {movementCategory === 'mobility' && (
        <div className="p-5 sm:p-6 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧘</span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-100">
                {isAr ? 'إطالات واستشفاء الظهر والرقبة (Mobility)' : 'Spine & Posture Relief Routine'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isAr ? 'فك التصلب العضلي الناتج عن الجلوس الطويل والمكاتب' : 'Relieve stiffness from sitting and screens'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mobilityStretches.map((st) => (
              <div
                key={st.id}
                onClick={() => {
                  soundSynth.playTactileClick();
                  haptic.vibrateLight();
                  setMobilityStretches((prev) =>
                    prev.map((item) => (item.id === st.id ? { ...item, done: !item.done } : item))
                  );
                }}
                className={`p-4 rounded-[20px] border transition-all cursor-pointer flex items-center justify-between ${
                  st.done
                    ? 'bg-[#d4f5dc]/80 dark:bg-emerald-950/40 border-[#1eb814]/40 text-zinc-950 dark:text-emerald-200'
                    : 'bg-zinc-50 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-[#5448e8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      st.done
                        ? 'bg-habit-green-ink border-[#1eb814] text-white'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {st.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-xs font-bold">{st.name}</span>
                </div>
                <span className="text-xs font-mono text-[#5448e8] dark:text-indigo-400 font-bold tabular-nums">
                  {st.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movement View: Gym (Smart Bodybuilding & Hybrid Sport Planner + Routine Selector) */}
      {movementCategory === 'gym' && (
        <>
          {/* Smart Bodybuilding Goal, Level & Hybrid Sport Planner */}
          <div className="p-5 sm:p-6 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#141517] dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold text-lg shrink-0">
                  🏋️‍♂️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-100">
                    {isAr
                      ? 'المخطط الذكي لكمال الأجسام والرياضات المدمجة'
                      : 'Smart Bodybuilding & Hybrid Athlete Planner'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isAr
                      ? 'اضبط هدفك (تضخيم / تنشيف) ومستواك ونشاطك الإضافي (بوكس / جوجيتسو / كاليستنكس) ليضبط النظام جدولك تلقائياً'
                      : 'Customize your goal, level, and secondary sport for tailored daily workouts'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                {athleteLevel === 'beginner'
                  ? isAr ? '🌱 مستوى مبتدئ' : '🌱 Beginner'
                  : athleteLevel === 'intermediate'
                  ? isAr ? '⚡ مستوى متوسط' : '⚡ Intermediate'
                  : isAr ? '🏆 مستوى متقدم' : '🏆 Advanced'}
              </span>
            </div>

            {/* Row 1: Primary Body Goal (تضخيم / تنشيف / إعادة تشكيل / قوة قتالية) */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                {isAr ? '١. هدفك الجسدي الحالي:' : '1. Primary Physique Goal:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    {
                      id: 'bulking',
                      titleAr: '💪 تضخيم وبناء عضلي',
                      subAr: 'فائض سعرات + أوزان ثقيلة (6-10 عدات)',
                      titleEn: '💪 Clean Bulking',
                    },
                    {
                      id: 'cutting',
                      titleAr: '🔥 تنشيف وحرق دهون',
                      subAr: 'عجز سعرات + كثافة عالية (12-15 عدة)',
                      titleEn: '🔥 Shred & Cutting',
                    },
                    {
                      id: 'recomp',
                      titleAr: '⚡ تضخيم صافي (Recomp)',
                      subAr: 'بناء عضل وحرق دهون معاً (8-12 عدة)',
                      titleEn: '⚡ Body Recomp',
                    },
                    {
                      id: 'combat_hybrid',
                      titleAr: '🥊 قوة وانفجار قتالي',
                      subAr: 'قوة عصبية بدون ثقل يبطئ الحركة (5-8 عدات)',
                      titleEn: '🥊 Hybrid Fighter Power',
                    },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setBodyGoal(g.id);
                      localStorage.setItem('midmar_body_goal', g.id);
                      saveExercises(getRoutineDefaultExercises(selectedRoutine, isAr, g.id, athleteLevel));
                    }}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                      bodyGoal === g.id
                        ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 border-transparent shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-[#ff5500]'
                    }`}
                  >
                    <span className="text-xs font-bold block">{isAr ? g.titleAr : g.titleEn}</span>
                    <span
                      className={`text-[10px] block mt-0.5 ${
                        bodyGoal === g.id ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {g.subAr}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Athlete Level & Secondary Sport */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Level */}
              <div className="lg:col-span-5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  {isAr ? '٢. مستواك في الحديد (يضبط الأوزان تلقائياً):' : '2. Experience Level:'}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'beginner', labelAr: '🌱 مبتدئ', labelEn: 'Beginner' },
                      { id: 'intermediate', labelAr: '⚡ متوسط', labelEn: 'Intermediate' },
                      { id: 'advanced', labelAr: '🏆 متقدم', labelEn: 'Advanced' },
                    ] as const
                  ).map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setAthleteLevel(lvl.id);
                        localStorage.setItem('midmar_athlete_level', lvl.id);
                        saveExercises(getRoutineDefaultExercises(selectedRoutine, isAr, bodyGoal, lvl.id));
                        syncCalisthenicsTrack(calisthenicsSkill, lvl.id);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        athleteLevel === lvl.id
                          ? 'bg-[#ff5500] text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {isAr ? lvl.labelAr : lvl.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Sport (نشاط إضافي بجانب الحديد) */}
              <div className="lg:col-span-7 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  {isAr ? '٣. نشاط إضافي تلعبُه بجانب كمال الأجسام:' : '3. Secondary Sport Alongside Gym:'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      { id: 'none', labelAr: '🏋️ حديد فقط', labelEn: 'Gym Only' },
                      { id: 'boxing', labelAr: '🥊 + ملاكمة (Boxing)', labelEn: '+ Boxing' },
                      { id: 'kickboxing', labelAr: '🦵 + كيك بوكسينج / مواي تاي', labelEn: '+ Kickboxing' },
                      { id: 'bjj', labelAr: '🥋 + جوجيتسو ومصارعة (BJJ)', labelEn: '+ BJJ / Grappling' },
                      { id: 'calisthenics', labelAr: '🤸‍♂️ + مهارات كاليستنكس', labelEn: '+ Calisthenics' },
                    ] as const
                  ).map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => {
                        soundSynth.playTactileClick();
                        setSecondarySport(sp.id);
                        localStorage.setItem('midmar_secondary_sport', sp.id);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        secondarySport === sp.id
                          ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                          : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {isAr ? sp.labelAr : sp.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Smart Prescription Banner for Goal + Secondary Sport */}
            <div className="bento-3d-mint p-4 rounded-2xl border border-[#1eb814]/35 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <span>🧭</span>
                  <span>
                    {isAr
                      ? 'خطة المدرب الذكية لدمج هدفك ونشاطك بدون إجهاد عصبي:'
                      : 'Smart Coach Prescription & Hybrid Schedule:'}
                  </span>
                </span>
                {secondarySport !== 'none' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectMovementCat(secondarySport === 'calisthenics' ? 'home' : 'combat')
                    }
                    className="px-3 py-1 rounded-full bg-habit-green-ink text-white text-[11px] font-bold cursor-pointer shadow-2xs"
                  >
                    {secondarySport === 'calisthenics'
                      ? isAr
                        ? 'افتح مدرب الكاليستنكس 🤸‍♂️ ←'
                        : 'Open Calisthenics 🤸‍♂️ →'
                      : isAr
                      ? 'افتح حلبة القتال والتقوية 🥊 ←'
                      : 'Open Combat Arena 🥊 →'}
                  </button>
                )}
              </div>

              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {bodyGoal === 'bulking' &&
                  (isAr
                    ? '• التغذية والتضخيم: استهدف فائضاً حرارياً (+300 إلى +450 سعرة فوق ثباتك) مع 1.8 إلى 2.2 جرام بروتين لكل كجم من وزنك. ركّز على زيادة الأوزان تدريجياً في نطاق 6-10 عدات وراحة 2-3 دقائق.'
                    : '• Bulking: +300-450 kcal surplus, 2g/kg protein, progressive overload in 6-10 rep range.')}
                {bodyGoal === 'cutting' &&
                  (isAr
                    ? '• التغذية والتنشيف: استهدف عجزاً حرارياً معتدلاً (-400 إلى -500 سعرة) مع رفع البروتين إلى 2.2 جرام/كجم للحفاظ على الكتلة العضلية، وحافظ على أوزانك في التمارين الأساسية مع 15-20 دقيقة مشي مائل بعد الحديد.'
                    : '• Cutting: -400-500 kcal deficit, 2.2g/kg protein to preserve muscle, keep compound weights high.')}
                {bodyGoal === 'recomp' &&
                  (isAr
                    ? '• إعادة تشكيل الجسم (Recomp): تناول سعرات الثبات أو عجزاً طفيفاً جداً (-150 سعرة) مع بروتين عالٍ (2.2 جرام/كجم) ونوم عميق 7.5 ساعات لبناء عضل صافي وحرق الدهون في آن واحد.'
                    : '• Recomp: Eat at maintenance calories with 2.2g/kg protein and progressive strength training.')}
                {bodyGoal === 'combat_hybrid' &&
                  (isAr
                    ? '• القوة القتالية المدمجة: ركّز على القوة الانفجارية (5-8 عدات سريعة الصعود) وتجنب الفشل العضلي التام في الأكتاف والأرجل قبل أيام النزال حتى لا تثقل حركتك.'
                    : '• Combat Hybrid: Focus on explosive concentric reps (5-8 reps, RPE 8) to avoid soreness before sparring.')}
              </p>

              {secondarySport !== 'none' && (
                <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 pt-1 border-t border-emerald-500/20">
                  {secondarySport === 'boxing' &&
                    (isAr
                      ? '🥊 تنسيق الملاكمة مع الحديد: لا تلعب تمرين دفع/أكتاف ثقيل (Push) في نفس يوم البوكس قبل الحصة مباشرة؛ اجعل الحديد ٤ أيام (علوي/سفلي أو دفع/سحب/أرجل) والبوكس ٢-٣ أيام، وأضف تمارين الرقبة والـ Core الدوار.'
                      : '🥊 Boxing + Gym: Avoid heavy shoulder pressing right before boxing rounds. Use a 3-4 day gym split.')}
                  {secondarySport === 'kickboxing' &&
                    (isAr
                      ? '🦵 تنسيق الكيك بوكسينج مع الحديد: افصل يوم الأرجل الثقيل (Legs) بـ 24-48 ساعة عن حصص الركل والـ Sparring، وركّز على مرونة الحوض وتقوية السمانة وأوتار الركبة.'
                      : '🦵 Kickboxing + Gym: Separate heavy Squat/Leg day by 24-48h from heavy kicking sessions.')}
                  {secondarySport === 'bjj' &&
                    (isAr
                      ? '🥋 تنسيق الجوجيتسو والمصارعة مع الحديد: الجوجيتسو يستهلك قبضة اليد والظهر؛ استخدم (Straps) في تمارين الظهر الثقيلة لحماية أصابعك، وركّز على تقوية الرقبة، جسر الحوض (Hip Thrust)، والسحب المتوازن.'
                      : '🥋 BJJ + Gym: Protect grip fatigue and focus on hip bridge power, isometric rows, and neck strength.')}
                  {secondarySport === 'calisthenics' &&
                    (isAr
                      ? '🤸‍♂️ تنسيق الكاليستنكس مع الحديد: ابدأ حصتك بـ 15 دقيقة لتدريب المهارة (مثل الـ Handstand أو الـ Muscle-Up أو الـ Front Lever) وأنت بكامل طاقتك العصبية، ثم انتقل لتمارين الحديد والتضخيم!'
                      : '🤸‍♂️ Calisthenics + Gym: Practice skill work (Handstand/Muscle-Up/Levers) for 15 mins first while CNS is fresh, then lift weights!')}
                </p>
              )}
            </div>
          </div>

          {/* Anti-Couch Inertia & 3-Step Friction Destroyer Protocol — Habitline Soft Amber Surface */}
          <div className="bento-3d-amber p-5 sm:p-6 rounded-[28px] border border-amber-400/30 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-habit-flame-ink text-white flex items-center justify-center shrink-0 shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-100">
                  {t('couch_inertia_title')}
                </h3>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                  {t('couch_inertia_desc')}
                </p>
              </div>
            </div>

            {/* 3 Steps to Destroy Friction */}
            <div className="p-4 rounded-[22px] bg-white/90 dark:bg-zinc-900/90 border border-amber-400/25 space-y-2.5">
              <div className="font-bold text-zinc-950 dark:text-amber-300 text-xs flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#ff5500]" />
                <span>{t('preworkout_checklist_title')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={frictionSteps.shoes}
                    onChange={(e) => {
                      soundSynth.playTactileClick();
                      setFrictionSteps({ ...frictionSteps, shoes: e.target.checked });
                    }}
                    className="w-4 h-4 text-[#1eb814] rounded-sm focus:ring-0"
                  />
                  <span className="font-bold text-[11px]">{t('pre_step_1')}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={frictionSteps.water}
                    onChange={(e) => {
                      soundSynth.playTactileClick();
                      setFrictionSteps({ ...frictionSteps, water: e.target.checked });
                    }}
                    className="w-4 h-4 text-[#1eb814] rounded-sm focus:ring-0"
                  />
                  <span className="font-bold text-[11px]">{t('pre_step_2')}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={frictionSteps.door}
                    onChange={(e) => {
                      soundSynth.playTactileClick();
                      setFrictionSteps({ ...frictionSteps, door: e.target.checked });
                    }}
                    className="w-4 h-4 text-[#1eb814] rounded-sm focus:ring-0"
                  />
                  <span className="font-bold text-[11px]">{t('pre_step_3')}</span>
                </label>
              </div>
            </div>

            {/* Survival Mode Notice */}
            {isSurvivalMode && (
              <div className="p-3 rounded-[18px] bg-[#fce2e6] dark:bg-rose-950/45 border border-rose-400/30 text-rose-950 dark:text-rose-200 text-xs flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>
                  <strong>وضع البقاء مُفعّل (MVD):</strong> يكفيك اليوم 5 دقائق إطالات خفيفة لحماية شعلتك بنسبة 100%!
                </span>
              </div>
            )}
          </div>

          {/* Routine Selector Tabs — 7 Comprehensive Bodybuilding Splits */}
          <div className="p-4 sm:p-5 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">
                {isAr ? 'اختر تقسيمة تمرين اليوم (تتكيف تلقائياً مع هدفك ومستواك):' : t('routine_select_title')}
              </h3>
              <span className="text-[11px] font-bold text-[#ff5500]">
                {bodyGoal === 'bulking'
                  ? isAr ? 'نظام تضخيم (6-10 عدات)' : 'Bulking Split'
                  : bodyGoal === 'cutting'
                  ? isAr ? 'نظام تنشيف (12-15 عدة)' : 'Cutting Split'
                  : bodyGoal === 'combat_hybrid'
                  ? isAr ? 'نظام قتالي (5-8 عدات انفجارية)' : 'Fighter Split'
                  : isAr ? 'نظام صافي (8-12 عدة)' : 'Recomp Split'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {(
                [
                  { id: 'push', label: isAr ? '💪 دفع (صدر/كتف/تراي)' : 'Push Day' },
                  { id: 'pull', label: isAr ? '🦅 سحب (ظهر/باي/خلفي)' : 'Pull Day' },
                  { id: 'legs', label: isAr ? '🦵 أرجل وقطنية (Legs)' : 'Legs Day' },
                  { id: 'upper', label: isAr ? '🔥 علوي شامل (Upper)' : 'Upper Body' },
                  { id: 'arms_delts', label: isAr ? '💥 ذراع وأكتاف (Arms)' : 'Arms & Delts' },
                  { id: 'cardio', label: isAr ? '🏃 حرق وبطن (Shred)' : 'Cardio & Core' },
                  { id: 'survival', label: t('routine_survival') },
                ] as const
              ).map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setSelectedRoutine(rt.id);
                    saveExercises(getRoutineDefaultExercises(rt.id, isAr, bodyGoal, athleteLevel));
                  }}
                  className={`min-h-[44px] py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center truncate ${
                    selectedRoutine === rt.id
                      ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-[#ff5500]'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rest Timer Bar & Workout Volume Stats — Habitline Obsidian Stage */}
          <div className="celestial-obsidian-stage p-4 sm:p-5 rounded-[28px] text-white border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div
                className="bento-3d-rose relative w-[72px] h-[72px] rounded-full flex items-center justify-center shrink-0"
                role="img"
                aria-label={isAr ? `متبقي ${restSeconds} ثانية من الاستراحة` : `${restSeconds}s of rest left`}
              >
                <svg className="absolute inset-0 w-full h-full -rotate-90 p-1.5 overflow-visible" viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="5" className="text-black/10 dark:text-white/20" />
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="none"
                    stroke="#ff5500"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 27}
                    strokeDashoffset={
                      2 * Math.PI * 27 * (1 - (restTotal > 0 ? Math.min(1, restSeconds / restTotal) : 0))
                    }
                    className="ring-glow-flame transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="relative text-lg font-mono font-bold text-zinc-900 dark:text-white tabular-nums leading-none">
                  {restSeconds}
                  <span className="text-[9px] font-bold">s</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#fde6d8] font-bold uppercase tracking-wider block">
                  {t('rest_timer_title')}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Timer className="w-4 h-4 text-[#ff5500]" />
                  {isRestRunning && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-habit-flame-ink text-white font-bold animate-pulse">
                      {isAr ? 'جاري الاستراحة...' : 'Resting...'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Rest Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleStartRest(60)}
                className={`py-1.5 px-3 rounded-full text-xs font-mono font-bold cursor-pointer transition-all tabular-nums ${
                  restSeconds === 60 ? 'bg-habit-flame-ink text-white shadow-xs' : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                }`}
                title={isAr ? 'عزل (Isolation)' : 'Isolation (60s)'}
              >
                60s {isAr ? 'عزل' : 'Iso'}
              </button>
              <button
                onClick={() => handleStartRest(90)}
                className={`py-1.5 px-3 rounded-full text-xs font-mono font-bold cursor-pointer transition-all tabular-nums ${
                  restSeconds === 90 ? 'bg-habit-flame-ink text-white shadow-xs' : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                }`}
                title={isAr ? 'بناء عضلي (Hypertrophy)' : 'Hypertrophy (90s)'}
              >
                90s {isAr ? 'بناء' : 'Hyp'}
              </button>
              <button
                onClick={() => handleStartRest(180)}
                className={`py-1.5 px-3 rounded-full text-xs font-mono font-bold cursor-pointer transition-all tabular-nums ${
                  restSeconds === 180 ? 'bg-habit-flame-ink text-white shadow-xs' : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                }`}
                title={isAr ? 'تمارين مركبة - فوسفات الطاقة (3 دقائق)' : 'Compound ATP (3m)'}
              >
                3m {isAr ? 'مركب' : 'Comp'}
              </button>
              <button
                onClick={() => handleStartRest(300)}
                className={`py-1.5 px-3 rounded-full text-xs font-mono font-bold cursor-pointer transition-all tabular-nums ${
                  restSeconds === 300 ? 'bg-habit-flame-ink text-white shadow-xs' : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                }`}
                title={isAr ? 'قوة قصوى (5 دقائق)' : 'Max Strength (5m)'}
              >
                5m {isAr ? 'قوة' : 'Str'}
              </button>
              {isRestRunning && (
                <button
                  onClick={() => {
                    setIsRestRunning(false);
                    setRestSeconds(0);
                  }}
                  className="p-2 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Total Volume Metric */}
            <div className="text-end border-t sm:border-t-0 sm:border-s border-white/10 pt-2 sm:pt-0 sm:ps-4 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-[11px] text-zinc-400">
                {isAr ? 'الحجم التدريبي الكلي:' : 'Total Volume:'}
              </span>
              <span className="text-base font-mono font-bold text-[#bce8c2] tabular-nums">
                {totalVolume.toLocaleString()} kg ({completedSetsCount} {t('sets_label')})
              </span>
            </div>
          </div>

          {/* Spinal Axial Loading Guard (حارس التحميل المحوري للعمود الفقري) — Habitline Soft Rose */}
          {spinalCheck.isSevere && (
            <div className="bento-3d-rose p-4 sm:p-5 rounded-[28px] border border-rose-400/40 text-zinc-950 dark:text-rose-100 text-xs flex items-start gap-3.5 animate-in fade-in">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-rose-950 dark:text-rose-200 text-xs sm:text-sm">
                    {isAr ? 'حارس التحميل المحوري للعمود الفقري (Spinal Axial Guard) ⚠️' : 'Spinal Axial Loading Guard ⚠️'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-zinc-900 text-rose-800 dark:text-rose-300 font-mono text-[10px] font-bold">
                    L4-L5 Protection
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {isAr
                    ? 'رصد النظام الجمع بين (السكوات) و(الديدلفت) في نفس الحصة التدريبية. هذا الجمع يضاعف الضغط الانضغاطي المحوري على الفقرات القطنية وجذور الأعصاب مع استنزاف حاد للجهاز العصبي المركزي (CNS). يُوصى علمياً بفصل التمرينين بـ 48 ساعة، أو استبدال أحدهما ببديل غير محوري (مثل Leg Press أو Bulgarian Split Squat أو Romanian Dumbbell Deadlift).'
                    : 'Concurrent Squats & Deadlifts compound heavy axial compressive load on lumbar discs (L4-L5) and CNS fatigue. Sports medicine recommends separating by 48h or swapping one with a non-axial compound (Leg Press, Bulgarian Split Squat, or DB RDL).'}
                </p>
              </div>
            </div>
          )}

          {/* Interactive Exercise Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((ex) => {
              const doneSets = ex.sets.filter((s) => s.done);
              const lastDone = doneSets.length > 0 ? doneSets[doneSets.length - 1] : null;
              const isAtLimit = lastDone && (lastDone.rpe || 8) >= 10;
              const deloadWeight = isAtLimit ? Math.max(5, Number((lastDone.weight * 0.925).toFixed(1))) : 0;
              const reductionKg = isAtLimit ? Number((lastDone.weight - deloadWeight).toFixed(1)) : 0;

              return (
                <div
                  key={ex.id}
                  className="p-5 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 space-y-3.5"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-[#ff5500]" />
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-100">{ex.name}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundSynth.playTactileClick();
                          setWarmupTargetExercise(ex.name);
                          setWarmupTargetExerciseId(ex.id);
                          setIsWarmupModalOpen(true);
                        }}
                        className="py-1 px-3 rounded-full bg-[#fde6d8] hover:bg-[#fbd5be] dark:bg-amber-950/45 text-zinc-950 dark:text-amber-300 border border-amber-400/35 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title={isAr ? 'حساب أوزان الإحماء والهرم' : 'Calculate Warmup Pyramid'}
                      >
                        <Calculator className="w-3 h-3 text-[#ff5500]" />
                        <span>{isAr ? 'حاسبة الإحماء' : 'Warmup'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(ex.id)}
                        className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* RPE 10 Autoregulation & Live Deload Advisor */}
                  {isAtLimit && deloadWeight > 0 && (
                    <div className="p-3 rounded-[18px] bg-[#fce2e6]/80 dark:bg-rose-950/45 border border-rose-400/35 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">⚡</span>
                        <div className="min-w-0">
                          <span className="font-bold text-rose-950 dark:text-rose-200 block truncate text-[11px]">
                            {isAr ? 'مستشعر الإنهاك العصبي (RPE 10 Autoregulation)' : 'CNS Fatigue Alert (RPE 10)'}
                          </span>
                          <span className="text-[10px] text-zinc-700 dark:text-zinc-300 block truncate tabular-nums">
                            {isAr
                              ? `وصلت للفشل التام (${lastDone.weight}كغ). يُنصح بخفض 7.5% (-${reductionKg}كغ) للحفاظ على سرعة البار.`
                              : `Reached failure at ${lastDone.weight}kg. Deload 7.5% (-${reductionKg}kg) to maintain bar speed.`}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyDeloadSet(ex.id, deloadWeight)}
                        className="py-1.5 px-3 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-mono font-bold text-[11px] shrink-0 shadow-2xs cursor-pointer transition-all active:scale-95 tabular-nums"
                        title={isAr ? 'إضافة جولة بتخفيف ذكي 7.5%' : 'Add auto-regulated deload set'}
                      >
                        {isAr ? `تخفيف ذكي (${deloadWeight} كغ) ⚡` : `Deload (${deloadWeight}kg) ⚡`}
                      </button>
                    </div>
                  )}

                  {/* Sets Header */}
                  <div className="grid grid-cols-12 gap-1.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 px-1 items-center">
                    <span className="col-span-1">#</span>
                    <span className="col-span-4">{t('weight_label')}</span>
                    <span className="col-span-3">{t('reps_label')}</span>
                    <span className="col-span-2 text-center" title="Rate of Perceived Exertion (6-10)">RPE</span>
                    <span className="col-span-2 text-center">{isAr ? 'تم' : 'Done'}</span>
                  </div>

                  {/* Sets Rows */}
                  <div className="space-y-1.5">
                    {ex.sets.map((set, idx) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-12 gap-1.5 items-center p-2.5 rounded-2xl border transition-colors ${
                          set.done
                            ? 'bento-3d-mint border-white/50 dark:border-emerald-500/25'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <span className="col-span-1 font-mono font-bold text-xs text-zinc-600 dark:text-zinc-400 ps-0.5 tabular-nums">
                          {idx + 1}
                        </span>
                        {/* Weight Input + Micro-loading pills */}
                        <div className="col-span-4 flex items-center gap-1">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) =>
                              handleUpdateSet(ex.id, idx, 'weight', Number(e.target.value))
                            }
                            className="w-full py-1 px-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-950 dark:text-zinc-100 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums"
                          />
                          <div className="hidden xs:flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSet(ex.id, idx, 'weight', Number((set.weight + 1.25).toFixed(2)))
                              }
                              className="px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-habit-flame-ink hover:text-white text-[9px] font-mono font-bold transition-colors cursor-pointer tabular-nums"
                              title="+1.25kg"
                            >
                              +1.2
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSet(ex.id, idx, 'weight', Number((set.weight + 2.5).toFixed(2)))
                              }
                              className="px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-habit-flame-ink hover:text-white text-[9px] font-mono font-bold transition-colors cursor-pointer tabular-nums"
                              title="+2.5kg"
                            >
                              +2.5
                            </button>
                          </div>
                        </div>
                        {/* Reps Input */}
                        <div className="col-span-3 flex items-center gap-1">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleUpdateSet(ex.id, idx, 'reps', Number(e.target.value))
                            }
                            className="w-full py-1 px-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-950 dark:text-zinc-100 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums"
                          />
                        </div>
                        {/* RPE Column */}
                        <div className="col-span-2 flex justify-center">
                          <select
                            value={set.rpe || 8}
                            onChange={(e) =>
                              handleUpdateSet(ex.id, idx, 'rpe', Number(e.target.value))
                            }
                            className="w-full py-1 px-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 text-center tabular-nums"
                            title={isAr ? 'معدل الجهد RPE (6: سهل، 8: باقي عدتين، 10: الفشل التام)' : 'RPE (6: Easy, 8: 2 RIR, 10: Absolute Failure)'}
                          >
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                          </select>
                        </div>
                        {/* Done Toggle */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() => {
                              soundSynth.playTactileClick();
                              haptic.vibrateLight();
                              handleUpdateSet(ex.id, idx, 'done', !set.done);
                            }}
                            className={`tap-spring w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                              set.done
                                ? 'bg-habit-green-ink border-[#1eb814] text-white shadow-2xs'
                                : 'border-zinc-300 dark:border-zinc-700 hover:border-[#1eb814] bg-white dark:bg-zinc-900'
                            }`}
                          >
                            {set.done && <CheckCircle className="w-4 h-4 stroke-[3]" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Set Actions: Clone Last Set (1-Tap) + Add New Set */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCloneLastSet(ex.id)}
                      className="py-2.5 px-3 rounded-full bg-[#fde6d8]/80 hover:bg-[#fde6d8] dark:bg-amber-950/40 text-zinc-950 dark:text-amber-300 border border-amber-400/35 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                      title={isAr ? 'تكرار نفس وزن وعدات الجولة السابقة بنقرة واحدة دون كتابة' : 'Clone last set weight & reps with 1 tap'}
                    >
                      <Copy className="w-3.5 h-3.5 text-[#ff5500]" />
                      <span className="truncate">{isAr ? 'تكرار الجولة السابقة ⚡' : 'Clone Last Set ⚡'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddSet(ex.id)}
                      className="py-2.5 px-3 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#ff5500] text-zinc-600 dark:text-zinc-400 hover:text-[#ff5500] text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="truncate">{t('add_set_btn')}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Exercise Form */}
            <form
              onSubmit={handleAddExercise}
              className="col-span-1 md:col-span-2 p-4 sm:p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 flex gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            >
              <input
                type="text"
                placeholder={t('exercise_name_placeholder')}
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-[#ff5500]"
              />
              <button
                type="submit"
                className="py-2.5 px-5 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{t('add_exercise_btn')}</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* Endorphin & Post-Workout Mood Booster Rating — Habitline Soft Amber */}
      <div className="bento-3d-amber p-4 sm:p-5 rounded-[28px] border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-habit-flame-ink text-white flex items-center justify-center shadow-2xs">
            <Smile className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">
            {t('endorphin_title')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => {
                soundSynth.playTactileClick();
                setEndorphinRating(star);
                localStorage.setItem('midmar_endorphin_rating', String(star));
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer active:scale-90 ${
                star <= endorphinRating
                  ? 'text-[#ff5500] bg-white dark:bg-zinc-900 shadow-xs'
                  : 'text-zinc-400 dark:text-zinc-600'
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Completion & Next Station — Habitline Pill CTA */}
      <div className="p-5 rounded-[28px] surface-card-3d border border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">{t('station_3_heading')}</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isCompleted || workoutChecked
              ? isAr
                ? 'تم تسجيل التمرين بنجاح (+15 نقطة)!'
                : 'Workout logged (+15 points)!'
              : isAr
              ? 'أكد تمرينك للانتقال لجلسة المساء الإنجازية.'
              : 'Confirm workout to advance to evening session.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {!(isCompleted || workoutChecked) ? (
            <button
              onClick={handleConfirmDone}
              className="tap-spring py-3 px-6 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#1eb814]/25 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t('mark_done')} (+15 XP)</span>
            </button>
          ) : (
            <button
              onClick={onNextStation}
              className="tap-spring py-3 px-6 rounded-full bg-[#141517] dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <span>{t('next_station')}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Warmup Pyramid Modal */}
      <WarmupPyramidModal
        isOpen={isWarmupModalOpen}
        onClose={() => setIsWarmupModalOpen(false)}
        exerciseName={warmupTargetExercise}
        onApplyWarmupSets={handleApplyWarmupSets}
      />
    </div>
  );
};

export default GymAnchorView;
