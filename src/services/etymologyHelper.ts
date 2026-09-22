import type { VocabularyWord, TargetLanguageCode } from '../data/languages/vocabularyDatabase';

export interface MorphologicalPart {
  part: string;
  type: 'prefix' | 'root' | 'suffix';
  origin?: string;
  meaningEn: string;
  meaningAr: string;
}

export interface RootDeconstruction {
  word: string;
  language: TargetLanguageCode;
  translationAr: string;
  parts: MorphologicalPart[];
  etymologySummary: string;
  etymologySummaryAr: string;
  sensoryMnemonic: string; // Vivid mental imagery in Arabic
  sensoryMnemonicEn: string; // Vivid mental imagery in English
  palaceVisual: string; // Memory palace placement anchor
  isDeconstructed: boolean;
}

// Curated high-frequency linguistic roots across languages
const ETYMOLOGY_DICTIONARY: Record<string, Partial<RootDeconstruction>> = {
  // English
  resilience: {
    parts: [
      { part: 're-', type: 'prefix', origin: 'Latin', meaningEn: 'back / again', meaningAr: 'للخلف / مجدداً' },
      { part: 'sili / salire', type: 'root', origin: 'Latin', meaningEn: 'to leap / spring', meaningAr: 'يقفز / يرتد' },
      { part: '-ence', type: 'suffix', origin: 'Latin', meaningEn: 'state of', meaningAr: 'حالة أو صفة' },
    ],
    etymologySummary: 'From Latin "resilire" (to leap back, rebound like a spring).',
    etymologySummaryAr: 'من اللاتينية resilire: القفز والارتداد للأعلى بعد أي ضغطة أو صدمة.',
    sensoryMnemonic: 'تخيل نوابض حديدية صلبة تنضغط تحت قدميك ثم تقفز بك عالياً فوق كل العوائق.',
    sensoryMnemonicEn: 'Picture a powerful steel coil bouncing back up instantly after being stepped on.',
    palaceVisual: 'مدخل قصر الذاكرة: بوابة حديدية مرنة ترتد وتمنع أي اقتحام.',
  },
  perseverance: {
    parts: [
      { part: 'per-', type: 'prefix', origin: 'Latin', meaningEn: 'thoroughly / through', meaningAr: 'تماماً / حتى النهاية' },
      { part: 'severus', type: 'root', origin: 'Latin', meaningEn: 'strict / severe / steadfast', meaningAr: 'صارم / حازم / ثابث' },
      { part: '-ance', type: 'suffix', origin: 'Latin', meaningEn: 'action or quality', meaningAr: 'صفة الفعل' },
    ],
    etymologySummary: 'From Latin "perseverare" (to abide strictly through to the end).',
    etymologySummaryAr: 'من اللاتينية: الثبات الصارم المتواصل حتى بلوغ خط النهاية دون انقطاع.',
    sensoryMnemonic: 'تخيل جبلاً جليدياً عاتياً تمشي فيه بخطى ثابتة لا تلتفت للعواصف حتى تصعد القمة.',
    sensoryMnemonicEn: 'Envision walking firmly through a mountain blizzard without turning your head until reaching the summit.',
    palaceVisual: 'في القاعة الرئيسية: درع روماني صلب منقوش عليه رمز الثبات المطلق.',
  },
  discipline: {
    parts: [
      { part: 'discere', type: 'root', origin: 'Latin', meaningEn: 'to learn / comprehend', meaningAr: 'يتعلم / يستوعب' },
      { part: 'discipulus', type: 'root', origin: 'Latin', meaningEn: 'pupil / disciple', meaningAr: 'تلميذ شغوف' },
      { part: '-ina', type: 'suffix', origin: 'Latin', meaningEn: 'system / practice', meaningAr: 'منظومة تدريب' },
    ],
    etymologySummary: 'From Latin "disciplina" (instruction, training given to a disciple).',
    etymologySummaryAr: 'أصلها من ترويض النفس وتدريبها كتلميذ نجيب يتبع مساراً محكماً.',
    sensoryMnemonic: 'تخيل سيفاً يتم طرقه وصقله في النار حتى يصبح حاداً كالشفرة.',
    sensoryMnemonicEn: 'Envision a steel blade being forged in relentless fire until razor sharp.',
    palaceVisual: 'قاعة السلاح: سيف مصقول بدقة متناهية يرمز لقوة التحكم بالذات.',
  },
  consistency: {
    parts: [
      { part: 'con-', type: 'prefix', origin: 'Latin', meaningEn: 'together / firmly', meaningAr: 'معاً / بإحكام' },
      { part: 'sistere / stare', type: 'root', origin: 'Latin', meaningEn: 'to stand firm', meaningAr: 'يقف ثابتاً' },
      { part: '-ency', type: 'suffix', origin: 'Latin', meaningEn: 'state of being', meaningAr: 'حالة الاستمرار' },
    ],
    etymologySummary: 'From Latin "consistere" (to stand firm together, hold steady).',
    etymologySummaryAr: 'من اللاتينية: أن تقف كل أفعالك اليومية متراصة كالبنيان المرصوص.',
    sensoryMnemonic: 'تخيل قطرات ماء متتالية تسقط في نفس النقطة كل ثانية حتى تحفر الصخر الصلب.',
    sensoryMnemonicEn: 'Picture water drops hitting the exact same stone every second until it carves through solid rock.',
    palaceVisual: 'ساعة مائية في حديقة القصر لا تتوقف قطراتها ليلاً أو نهاراً.',
  },
  procrastination: {
    parts: [
      { part: 'pro-', type: 'prefix', origin: 'Latin', meaningEn: 'forward / in favor of', meaningAr: 'للأمام / نحو' },
      { part: 'cras', type: 'root', origin: 'Latin', meaningEn: 'tomorrow', meaningAr: 'الغد' },
      { part: '-tion', type: 'suffix', origin: 'Latin', meaningEn: 'action / process', meaningAr: 'فعل / عملية' },
    ],
    etymologySummary: 'From Latin "procrastinare" (putting things off until tomorrow - cras).',
    etymologySummaryAr: 'من اللاتينية: إلقاء الأمر نحو الغد (cras = الغد).',
    sensoryMnemonic: 'تخيل جسراً خشبياً تحرقه تحت قدميك بدلاً من العبور اليوم، فيضيع منك الوقت.',
    sensoryMnemonicEn: 'Picture a calendar flipping infinitely to tomorrow while today slips through your fingers.',
    palaceVisual: 'ساعة حائط عقاربها تدور للخلف ومكتوب عليها "ليس اليوم".',
  },
  endurance: {
    parts: [
      { part: 'en-', type: 'prefix', origin: 'Latin', meaningEn: 'in / within', meaningAr: 'في الداخل' },
      { part: 'durus', type: 'root', origin: 'Latin', meaningEn: 'hard / lasting', meaningAr: 'صلب / متين' },
      { part: '-ance', type: 'suffix', origin: 'Latin', meaningEn: 'capacity of', meaningAr: 'القدرة على' },
    ],
    etymologySummary: 'From Latin "indurare" (to make hard like stone, endure suffering).',
    etymologySummaryAr: 'من اللاتينية: صلابة الجوهر الداخلي كالحجر الصوان أمام وطأة الزمن.',
    sensoryMnemonic: 'تخيل جذور شجرة زيتون معمرة تخترق الصخور الجبلية لقرون دون أن تقتلعها الرياح.',
    sensoryMnemonicEn: 'Envision the deep roots of an ancient olive tree gripping bedrock through centuries of storms.',
    palaceVisual: 'صخرة صوان ضخمة تتكسر عليها أمواج المحيط العاتية.',
  },
};

// Algorithmic Morphological Fallback Deconstructor
export function deconstructVocabularyWord(wordItem: VocabularyWord): RootDeconstruction {
  const normalizedKey = wordItem.word.toLowerCase().trim();

  // 1. Check exact dictionary match
  if (ETYMOLOGY_DICTIONARY[normalizedKey]) {
    const dict = ETYMOLOGY_DICTIONARY[normalizedKey];
    return {
      word: wordItem.word,
      language: wordItem.lang,
      translationAr: wordItem.translationAr,
      parts: dict.parts || [],
      etymologySummary: dict.etymologySummary || `Root breakdown for ${wordItem.word}`,
      etymologySummaryAr: dict.etymologySummaryAr || `التفكيك الصرفي والاشتقاقي لكلمة ${wordItem.word}`,
      sensoryMnemonic: dict.sensoryMnemonic || `اربط صوت "${wordItem.word}" بصورة حسية لمعنى: ${wordItem.translationAr}`,
      sensoryMnemonicEn: dict.sensoryMnemonicEn || `Anchor the phonetic sound of "${wordItem.word}" to its core meaning.`,
      palaceVisual: dict.palaceVisual || 'قاعة المعرفة الرئيسية في قصر الذاكرة.',
      isDeconstructed: true,
    };
  }

  // 2. Algorithmic morphological parser based on language
  const parts: MorphologicalPart[] = [];
  let remaining = normalizedKey;

  // Language specific prefix detection
  const prefixes: { prefix: string; origin: string; en: string; ar: string }[] = [
    { prefix: 'inter', origin: 'Latin', en: 'between / among', ar: 'بين / مشترك' },
    { prefix: 'trans', origin: 'Latin', en: 'across / beyond', ar: 'عبر / ما وراء' },
    { prefix: 'anti', origin: 'Greek', en: 'against / opposite', ar: 'مضاد / مقابل' },
    { prefix: 'auto', origin: 'Greek', en: 'self / same', ar: 'ذاتي / تلقائي' },
    { prefix: 'sub', origin: 'Latin', en: 'under / below', ar: 'تحت / فرعي' },
    { prefix: 'pre', origin: 'Latin', en: 'before', ar: 'قبل / تمهيدي' },
    { prefix: 'pro', origin: 'Latin', en: 'forward / forth', ar: 'للأمام / دافع' },
    { prefix: 'dis', origin: 'Latin', en: 'apart / opposite', ar: 'نفي / انفصال' },
    { prefix: 'un', origin: 'Germanic', en: 'not / reversal', ar: 'عكس / نفي' },
    { prefix: 'in', origin: 'Latin', en: 'in / not', ar: 'داخل / غير' },
    { prefix: 're', origin: 'Latin', en: 'again / back', ar: 'إعادة / تكرار' },
    { prefix: 'des', origin: 'Romance', en: 'undo / reverse', ar: 'عكس / تفكيك' },
    { prefix: 'ver', origin: 'Germanic', en: 'change / completion', ar: 'تحويل / تمام' },
    { prefix: 'ent', origin: 'Germanic', en: 'origin / release', ar: 'ابتداء / انعتاق' },
  ];

  for (const p of prefixes) {
    if (remaining.startsWith(p.prefix) && remaining.length > p.prefix.length + 2) {
      parts.push({
        part: `${p.prefix}-`,
        type: 'prefix',
        origin: p.origin,
        meaningEn: p.en,
        meaningAr: p.ar,
      });
      remaining = remaining.slice(p.prefix.length);
      break;
    }
  }

  // Suffix detection
  const suffixes: { suffix: string; origin: string; en: string; ar: string }[] = [
    { suffix: 'tion', origin: 'Latin', en: 'state / act of', ar: 'اسم المصدر / الفعل' },
    { suffix: 'sion', origin: 'Latin', en: 'state / act of', ar: 'اسم المصدر / الفعل' },
    { suffix: 'able', origin: 'Latin', en: 'capable of', ar: 'قابل لـ / يمكن' },
    { suffix: 'ible', origin: 'Latin', en: 'capable of', ar: 'قابل لـ / يمكن' },
    { suffix: 'ment', origin: 'Latin/French', en: 'action or result', ar: 'نتيجة الفعل أو هيئته' },
    { suffix: 'ity', origin: 'Latin', en: 'quality or condition', ar: 'صفة أو ماهية' },
    { suffix: 'ness', origin: 'Germanic', en: 'state or quality', ar: 'حالة أو كينونة' },
    { suffix: 'less', origin: 'Germanic', en: 'without', ar: 'خالٍ من / بدون' },
    { suffix: 'ful', origin: 'Germanic', en: 'full of', ar: 'ممتلئ بـ' },
    { suffix: 'ción', origin: 'Spanish', en: 'action / process', ar: 'عملية أو حدث' },
    { suffix: 'mente', origin: 'Romance', en: 'manner / adverbal', ar: 'حال / ظرف' },
    { suffix: 'heit', origin: 'Germanic', en: 'quality of', ar: 'ماهية أو صفة' },
    { suffix: 'keit', origin: 'Germanic', en: 'quality of', ar: 'ماهية أو صفة' },
    { suffix: 'ung', origin: 'Germanic', en: 'process / result', ar: 'نتيجة أو عملية' },
  ];

  let detectedSuffix: MorphologicalPart | null = null;
  for (const s of suffixes) {
    if (remaining.endsWith(s.suffix) && remaining.length > s.suffix.length + 2) {
      detectedSuffix = {
        part: `-${s.suffix}`,
        type: 'suffix',
        origin: s.origin,
        meaningEn: s.en,
        meaningAr: s.ar,
      };
      remaining = remaining.slice(0, remaining.length - s.suffix.length);
      break;
    }
  }

  // Root core
  parts.push({
    part: remaining,
    type: 'root',
    origin: wordItem.lang === 'de' ? 'Germanic' : 'Latin/Indo-European',
    meaningEn: `Core semantic stem of "${wordItem.word}"`,
    meaningAr: `الجذر الدلالي المحوري لكلمة "${wordItem.translationAr}"`,
  });

  if (detectedSuffix) {
    parts.push(detectedSuffix);
  }

  return {
    word: wordItem.word,
    language: wordItem.lang,
    translationAr: wordItem.translationAr,
    parts,
    etymologySummary: `Morphological structure: [${parts.map((p) => p.part).join(' + ')}] expressing "${wordItem.translationAr}".`,
    etymologySummaryAr: `البنية الصرفية: [${parts.map((p) => p.part).join(' + ')}] تؤدي إلى المعنى العربي الدقيق: "${wordItem.translationAr}".`,
    sensoryMnemonic: `ربط حسي: نغمة لفظ "${wordItem.word}" مقترنة بصورة ذهنية تجسد (${wordItem.translationAr}) في موقف يومي محدد.`,
    sensoryMnemonicEn: `Mnemonic hook: Picture a vivid real-world moment embodying "${wordItem.translationAr}" whenever you hear "${wordItem.word}".`,
    palaceVisual: `جناح الحصيلة واللغات: غرفة مخصصة لكلمة [${wordItem.word}] مع مجسم يرمز لـ (${wordItem.translationAr}).`,
    isDeconstructed: true,
  };
}
