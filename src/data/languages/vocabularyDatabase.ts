import { ENGLISH_WORDS } from './english';
import { SPANISH_WORDS } from './spanish';
import { FRENCH_WORDS } from './french';
import { ITALIAN_WORDS } from './italian';
import { GERMAN_WORDS } from './german';

export type TargetLanguageCode = 'en' | 'fr' | 'it' | 'es' | 'de';

export type WordCategory =
  | 'business_tech'
  | 'daily_fluency'
  | 'fitness_sports'
  | 'mindset_focus'
  | 'travel_lifestyle';

export interface TargetLanguage {
  code: TargetLanguageCode;
  nameAr: string;
  nameEn: string;
  flag: string;
  speechCode: string;
}

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface CefrLevelInfo {
  level: CefrLevel;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeColor: string;
  minWordsToUnlockExam: number;
}

export const CEFR_LEVELS_INFO: CefrLevelInfo[] = [
  {
    level: 'A1',
    nameAr: 'المبتدئ التأسيسي',
    nameEn: 'Breakthrough',
    titleAr: 'A1 - التأسيس الأولي',
    titleEn: 'A1 - Beginner',
    descriptionAr: 'المفردات الأساسية والتراكيب اليومية المباشرة للتعريف بالنفس والبيئة المحيطة.',
    descriptionEn: 'Basic vocabulary and simple phrases for everyday communication.',
    badgeColor: 'emerald',
    minWordsToUnlockExam: 4,
  },
  {
    level: 'A2',
    nameAr: 'الابتدائي الواثق',
    nameEn: 'Waystage',
    titleAr: 'A2 - التواصل المباشر',
    titleEn: 'A2 - Elementary',
    descriptionAr: 'التواصل في المهام الروتينية، التسوق، العائلة، والأعمال اليومية الشائعة.',
    descriptionEn: 'Routine communicative tasks, shopping, family, and direct exchanges.',
    badgeColor: 'teal',
    minWordsToUnlockExam: 6,
  },
  {
    level: 'B1',
    nameAr: 'المتوسط المستقل',
    nameEn: 'Threshold',
    titleAr: 'B1 - الطلاقة المستقلة',
    titleEn: 'B1 - Intermediate',
    descriptionAr: 'استيعاب النقاط الرئيسية في العمل والدراسة، والتعامل مع مواقف السفر ووصف الآمال والخطط.',
    descriptionEn: 'Independent communication at work, travel, and expressing goals and opinions.',
    badgeColor: 'sky',
    minWordsToUnlockExam: 6,
  },
  {
    level: 'B2',
    nameAr: 'فوق المتوسط الطليق',
    nameEn: 'Vantage',
    titleAr: 'B2 - التعبير المتقدم',
    titleEn: 'B2 - Upper Intermediate',
    descriptionAr: 'فهم الأفكار المعقدة في النصوص التقنية، والتحدث بعفوية وطلاقة دون إجهاد مع المتحدث الأصلي.',
    descriptionEn: 'Complex texts, technical discourse, and spontaneous interaction with native speakers.',
    badgeColor: 'indigo',
    minWordsToUnlockExam: 6,
  },
  {
    level: 'C1',
    nameAr: 'المتقدم الاحترافي',
    nameEn: 'Effective Operational',
    titleAr: 'C1 - الكفاءة الفعالة',
    titleEn: 'C1 - Advanced',
    descriptionAr: 'استيعاب طائفة واسعة من النصوص الطويلة الصعبة، والتعبير بمرونة تامة في الأغراض الاجتماعية والأكاديمية.',
    descriptionEn: 'Wide range of demanding texts, flexible language for academic and professional success.',
    badgeColor: 'purple',
    minWordsToUnlockExam: 6,
  },
  {
    level: 'C2',
    nameAr: 'الإتقان الأصيل والبياني',
    nameEn: 'Mastery',
    titleAr: 'C2 - البلاغة والطلاقة الأصيلة',
    titleEn: 'C2 - Mastery',
    descriptionAr: 'فهم كل ما يُسمع أو يُقرأ بيسر تام، وإعادة صياغة الحجج والتعبير بدقة متناهية مع التقاط الظلال الدلالية الدقيقة.',
    descriptionEn: 'Effortless understanding, spontaneous reconstruction of arguments, native-like precision and nuance.',
    badgeColor: 'amber',
    minWordsToUnlockExam: 6,
  },
];

export interface VocabularyWord {
  id: string;
  lang: TargetLanguageCode;
  word: string;
  phonetic: string;
  translationAr: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'idiom';
  contextSentence: string;
  contextSentenceAr: string;
  collocations: string[];
  category: WordCategory;
  level: CefrLevel;
  isIdiom?: boolean;
  literalTranslationAr?: string;
  etymologyRoot?: string;
  mnemonicHook?: string;
}

export const TARGET_LANGUAGES: TargetLanguage[] = [
  { code: 'en', nameAr: 'الإنجليزية (English)', nameEn: 'English', flag: '🇬🇧', speechCode: 'en-US' },
  { code: 'es', nameAr: 'الإسبانية (Español)', nameEn: 'Spanish', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'fr', nameAr: 'الفرنسية (Français)', nameEn: 'French', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'it', nameAr: 'الإيطالية (Italiano)', nameEn: 'Italian', flag: '🇮🇹', speechCode: 'it-IT' },
  { code: 'de', nameAr: 'الألمانية (Deutsch)', nameEn: 'German', flag: '🇩🇪', speechCode: 'de-DE' },
];

export const VOCABULARY_DATABASE: VocabularyWord[] = [
  ...ENGLISH_WORDS,
  ...SPANISH_WORDS,
  ...FRENCH_WORDS,
  ...ITALIAN_WORDS,
  ...GERMAN_WORDS,
];
