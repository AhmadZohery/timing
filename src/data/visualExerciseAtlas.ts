import type { AthleteLevelType, BodyGoalType, SecondarySportType } from '../components/stations/GymAnchorView';

export type RoutineSplitId =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'arms_delts'
  | 'cardio'
  | 'calisthenics'
  | 'combat'
  | 'rest'
  | 'survival';

export type MuscleGroupId =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs_quads'
  | 'legs_hamstrings'
  | 'calves'
  | 'core'
  | 'full_body';

export type VisualMovementArchetype =
  | 'bench_press'
  | 'incline_press'
  | 'chest_fly'
  | 'overhead_press'
  | 'lateral_raise'
  | 'dips_pushup'
  | 'tricep_extension'
  | 'pullup_pulldown'
  | 'row_horizontal'
  | 'face_pull'
  | 'bicep_curl'
  | 'squat_press'
  | 'hip_hinge_rdl'
  | 'leg_curl_calf'
  | 'core_hanging'
  | 'calisthenics_skill';

export interface VisualExerciseMetadata {
  id: string;
  nameAr: string;
  nameEn: string;
  muscleGroup: MuscleGroupId;
  muscleLabelAr: string;
  secondaryMusclesAr: string[];
  equipmentAr: string;
  archetype: VisualMovementArchetype;
  defaultBaseWeightKg: number;
  defaultRepsBulking: number;
  defaultRepsCutting: number;
  isCompound: boolean;
  startPostureAr: string;
  peakPostureAr: string;
  formCuesAr: string[];
  commonMistakeAr: string;
  breathingAr: string;
  routineTags: RoutineSplitId[];
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroupId, { labelAr: string; labelEn: string }> = {
  chest: { labelAr: 'الصدر (Chest)', labelEn: 'Chest' },
  back: { labelAr: 'الظهر والمجنص (Back & Lats)', labelEn: 'Back & Lats' },
  shoulders: { labelAr: 'الأكتاف (Shoulders)', labelEn: 'Shoulders' },
  biceps: { labelAr: 'البايسبس والساعد (Biceps)', labelEn: 'Biceps' },
  triceps: { labelAr: 'الترايسبس (Triceps)', labelEn: 'Triceps' },
  legs_quads: { labelAr: 'الأفخاذ الأمامية (Quads)', labelEn: 'Quads' },
  legs_hamstrings: { labelAr: 'الخلفيات والأرداف (Hamstrings & Glutes)', labelEn: 'Hamstrings & Glutes' },
  calves: { labelAr: 'السمانة (Calves)', labelEn: 'Calves' },
  core: { labelAr: 'البطن والجذع (Core & Abs)', labelEn: 'Core & Abs' },
  full_body: { labelAr: 'شامل ومهارات (Full Body)', labelEn: 'Full Body' },
};

export const VISUAL_EXERCISE_ATLAS: VisualExerciseMetadata[] = [
  // ======================== CHEST (الصدر) ========================
  {
    id: 'atlas-bench-barbell',
    nameAr: 'Bench Press (ضغط الصدر بالبار المستوي)',
    nameEn: 'Barbell Flat Bench Press',
    muscleGroup: 'chest',
    muscleLabelAr: 'الصدر الأوسط',
    secondaryMusclesAr: ['الكتف الأمامي', 'الترايسبس'],
    equipmentAr: 'بار ومقعد مستوٍ',
    archetype: 'bench_press',
    defaultBaseWeightKg: 60,
    defaultRepsBulking: 8,
    defaultRepsCutting: 10,
    isCompound: true,
    startPostureAr: 'استلقِ بثبات، اجمع لوحي الكتف للخلف، وامسك البار بعرض أوسع قليلاً من الكتفين.',
    peakPostureAr: 'انزل بالبار ببطء لأسفل الصدر (زاوية الكوع 45-70°)، ثم ادفع بقوة للأعلى.',
    formCuesAr: [
      'ثبّت قدميك بقوة على الأرض واضغط بلوحي الكتف داخل المقعد',
      'لا تفتح كوعيك بزاوية 90 درجة لحماية مفصل الكتف',
      'المس أسفل الصدر بهدوء بدون نطّ البار على القفص الصدري',
    ],
    commonMistakeAr: 'فتح الكوعين للخارج بزاوية 90° أو رفع المقعدة عن البنش أثناء الدفع.',
    breathingAr: 'شهيق عميق أثناء النزول (2 ثانية) • زفير قوي عند الدفع للأعلى',
    routineTags: ['push', 'upper'],
  },
  {
    id: 'atlas-incline-db',
    nameAr: 'Incline Dumbbell Press (تجميع بالدمبل مائل للصدر العلوي)',
    nameEn: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    muscleLabelAr: 'الصدر العلوي (الترقوي)',
    secondaryMusclesAr: ['الكتف الأمامي', 'الترايسبس'],
    equipmentAr: 'دمبل وبنش مائل 30°',
    archetype: 'incline_press',
    defaultBaseWeightKg: 24,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: true,
    startPostureAr: 'اضبط زاوية البنش على 30 درجة (وليس 45° حتى لا يتحول التمرين للكتف).',
    peakPostureAr: 'انزل بالدمبل بمحاذاة أعلى الصدر لمد ألياف الصدر العلوي ثم ادفع للأعلى.',
    formCuesAr: [
      'زاوية 30 درجة هي الزاوية الذهبية لاستهداف الصدر العلوي',
      'اجعل المعصم مستقيماً فوق الكوع طوال الحركة',
      'لا تصدم الدمبلين ببعضهما في الأعلى لتحافظ على الشد العضلي',
    ],
    commonMistakeAr: 'رفع زاوية البنش أكثر من 45 درجة فيذهب الحمل كله للكتف الأمامي.',
    breathingAr: 'شهيق عند النزول وتمدد الصدر • زفير عند التجميع لأعلى',
    routineTags: ['push', 'upper'],
  },
  {
    id: 'atlas-chest-dips',
    nameAr: 'Weighted Chest Dips (متوازي الصدر المائل للأمام)',
    nameEn: 'Chest-Focused Parallel Dips',
    muscleGroup: 'chest',
    muscleLabelAr: 'الصدر السفلي والخارجي',
    secondaryMusclesAr: ['الترايسبس', 'الكتف الأمامي'],
    equipmentAr: 'جهاز المتوازي',
    archetype: 'dips_pushup',
    defaultBaseWeightKg: 10,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: true,
    startPostureAr: 'امسك قبضتي المتوازي ومِل بجذعك للأمام بزاوية 30 درجة مع ثني الركبتين للخلف.',
    peakPostureAr: 'انزل حتى يصبح الكتف بمستوى الكوع أو أقل قليلاً، ثم ادفع بقوة الصدر.',
    formCuesAr: [
      'الميل للأمام يوجّه الحمل للصدر السفلي؛ الاستقامة توجهه للترايسبس',
      'تحكم في النزول ولا تهبط بشكل مفاجئ لحماية الترقوة',
    ],
    commonMistakeAr: 'النزول المفرط بدون إحماء أو بقاء الجسم عمودياً عند الرغبة باستهداف الصدر.',
    breathingAr: 'شهيق أثناء النزول • زفير عند الصعود',
    routineTags: ['push', 'calisthenics'],
  },
  {
    id: 'atlas-cable-fly',
    nameAr: 'Cable Crossover / Pec Deck (تفتيح كابل أو فراشة لعزل الصدر)',
    nameEn: 'Cable Fly / Pec Deck Isolation',
    muscleGroup: 'chest',
    muscleLabelAr: 'تفصيل منتصف الصدر',
    secondaryMusclesAr: ['الكتف الأمامي'],
    equipmentAr: 'جهاز الكابل أو الفراشة',
    archetype: 'chest_fly',
    defaultBaseWeightKg: 15,
    defaultRepsBulking: 12,
    defaultRepsCutting: 15,
    isCompound: false,
    startPostureAr: 'تقدم خطوة للأمام، اثنِ كوعيك قليلاً وثبّت زاوية الكوع طوال التمرين.',
    peakPostureAr: 'اجمع يديك أمام صدرك كأنك تعانق شجرة كبيرة واعصر الصدر لثانية كاملة.',
    formCuesAr: [
      'الحركة تتم من مفصل الكتف فقط وليس بثني وفرد الكوع',
      'اثبت ثانية واحدة في نقطة التجميع القصوى لأقصى ضخ دموي (Pump)',
    ],
    commonMistakeAr: 'تحويل التمرين إلى تمرين دفع بسبب ثني الكوعين بأوزان ثقيلة.',
    breathingAr: 'شهيق عند فتح الذراعين • زفير مع عصر الصدر في المنتصف',
    routineTags: ['push'],
  },
  {
    id: 'atlas-machine-chest-press',
    nameAr: 'Machine Chest Press (جهاز دفع الصدر الآمن للكتف)',
    nameEn: 'Seated Machine Chest Press',
    muscleGroup: 'chest',
    muscleLabelAr: 'الصدر الشامل بعزل عالٍ',
    secondaryMusclesAr: ['الترايسبس'],
    equipmentAr: 'جهاز دفع الصدر',
    archetype: 'bench_press',
    defaultBaseWeightKg: 55,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: true,
    startPostureAr: 'اضبط المقعد بحيث تكون المقابض عند منتصف الصدر وأسفله قليلاً.',
    peakPostureAr: 'ادفع للأمام مع إبقاء الرأس والظهر ملتصقين بالمسند.',
    formCuesAr: [
      'بديل ممتاز وآمن جداً للبار الحر إذا كنت تشعر بإجهاد في الكتف',
      'تحكم في مرحلة الرجوع (3 ثوانٍ) لتحقيق أقصى بناء عضلي',
    ],
    commonMistakeAr: 'رفع الكتفين باتجاه الأذنين أثناء الدفع.',
    breathingAr: 'شهيق عند الرجوع • زفير عند الدفع',
    routineTags: ['push', 'upper'],
  },

  // ======================== BACK (الظهر والمجنص) ========================
  {
    id: 'atlas-barbell-row',
    nameAr: 'Barbell Row (سحب بار منحني لكثافة الظهر)',
    nameEn: 'Barbell Bent-Over Row',
    muscleGroup: 'back',
    muscleLabelAr: 'وسط الظهر والمجنص',
    secondaryMusclesAr: ['الكتف الخلفي', 'البايسبس', 'القطنية'],
    equipmentAr: 'بار حر',
    archetype: 'row_horizontal',
    defaultBaseWeightKg: 55,
    defaultRepsBulking: 8,
    defaultRepsCutting: 10,
    isCompound: true,
    startPostureAr: 'ادفع الحوض للخلف، احنِ جذعك بزاوية 45° مع ظهر مستقيم تماماً.',
    peakPostureAr: 'اسحب البار بكوعيك نحو السرة/أسفل البطن واعصر لوحي الكتف معاً.',
    formCuesAr: [
      'تخيل أن يديك مجرد خطافين وأن السحب يتم بدفع الكوعين للخلف',
      'حافظ على ثبات الرقبة في خط واحد مع العمود الفقري',
    ],
    commonMistakeAr: 'تقويس أسفل الظهر أو الوقوف بشكل شبه مستقيم ومرجحة الجذع.',
    breathingAr: 'زفير عند سحب البار للبطن • شهيق أثناء النزول المتحكم به',
    routineTags: ['pull', 'upper'],
  },
  {
    id: 'atlas-lat-pulldown',
    nameAr: 'Lat Pulldown / Pull-ups (سحب عالي عريض للمجنص / عقلة)',
    nameEn: 'Wide-Grip Lat Pulldown & Pull-ups',
    muscleGroup: 'back',
    muscleLabelAr: 'عرض المجنص (V-Taper)',
    secondaryMusclesAr: ['البايسبس', 'الساعد'],
    equipmentAr: 'جهاز السحب العالي أو عقلة',
    archetype: 'pullup_pulldown',
    defaultBaseWeightKg: 55,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: true,
    startPostureAr: 'امسك البار بقبضة أوسع من الكتفين، اخفض كتفيك للأسفل قبل بدء السحب.',
    peakPostureAr: 'اسحب البار نحو أعلى الصدر مع توجيه الكوعين للأسفل وللداخل.',
    formCuesAr: [
      'ابدأ الحركة بخفض لوحي الكتف (Scapular Depression) قبل ثني الكوع',
      'لا تسحب البار خلف الرقبة أبداً لحماية فقرات الرقبة ومفصل الكتف',
    ],
    commonMistakeAr: 'الميل المفرط للخلف وتحويل التمرين إلى سحب أفقي بالقطنية.',
    breathingAr: 'زفير عند السحب لأعلى الصدر • شهيق عند التمدد للأعلى',
    routineTags: ['pull', 'upper', 'calisthenics'],
  },
  {
    id: 'atlas-seated-cable-row',
    nameAr: 'Seated Cable Row (سحب أرضي ضيق لعمق الظهر)',
    nameEn: 'Seated Cable Row (V-Bar)',
    muscleGroup: 'back',
    muscleLabelAr: 'عمق وسُمك الظهر الداخلي',
    secondaryMusclesAr: ['البايسبس', 'المجنص السفلي'],
    equipmentAr: 'جهاز الكابل الأرضي',
    archetype: 'row_horizontal',
    defaultBaseWeightKg: 50,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: true,
    startPostureAr: 'اجلس بظهر مستقيم، اثنِ ركبتيك قليلاً وافرد صدرك للأمام.',
    peakPostureAr: 'اسحب المقبض نحو أسفل البطن مع ضم لوحي الكتف للخلف.',
    formCuesAr: [
      'اسمح للوحي الكتف بالتمدد قليلاً للأمام في البداية دون تقويس القطنية',
      'اثبت لنصف ثانية عند ملامسة المقبض للبطن',
    ],
    commonMistakeAr: 'الأرجحة الأمامية والخلفية بأسفل الظهر لرفع وزن أثقل.',
    breathingAr: 'زفير عند السحب • شهيق عند فرد الذراعين',
    routineTags: ['pull', 'upper'],
  },
  {
    id: 'atlas-one-arm-db-row',
    nameAr: 'One-Arm Dumbbell Row (منشار بالدمبل لكل جانب)',
    nameEn: 'Single-Arm Dumbbell Row',
    muscleGroup: 'back',
    muscleLabelAr: 'المجنص السفلي وعلاج عدم التماثل',
    secondaryMusclesAr: ['البايسبس', 'الكتف الخلفي'],
    equipmentAr: 'دمبل وبنش',
    archetype: 'row_horizontal',
    defaultBaseWeightKg: 26,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: true,
    startPostureAr: 'ارتكز بيدك على البنش واجعل ظهرك مسطحاً موازياً للأرض.',
    peakPostureAr: 'اسحب الدمبل في مسار قوسي نحو الجيب الخلفي (الحوض) وليس نحو الكتف.',
    formCuesAr: [
      'السحب باتجاه الحوض يفعل ألياف المجنص بنسبة مضاعفة مقارنة بالسحب للصدر',
      'ممتاز جداً لأنه لا يضغط على العمود الفقري نهائياً',
    ],
    commonMistakeAr: 'لف الجذع بعنف أو سحب الدمبل للكتف فيشتغل البايسبس بدلاً من الظهر.',
    breathingAr: 'زفير عند السحب • شهيق عند النزول الكامل',
    routineTags: ['pull'],
  },

  // ======================== SHOULDERS (الأكتاف) ========================
  {
    id: 'atlas-ohp',
    nameAr: 'Overhead Shoulder Press (ضغط أكتاف بالبار أو الدمبل)',
    nameEn: 'Overhead Shoulder Press (OHP)',
    muscleGroup: 'shoulders',
    muscleLabelAr: 'الكتف الأمامي والجانبي',
    secondaryMusclesAr: ['الترايسبس', 'أعلى الصدر'],
    equipmentAr: 'بار أو دمبل',
    archetype: 'overhead_press',
    defaultBaseWeightKg: 40,
    defaultRepsBulking: 8,
    defaultRepsCutting: 10,
    isCompound: true,
    startPostureAr: 'البار أو الدمبل عند مستوى الترقوة، الكوعان متقدمان قليلاً للأمام (زاوية 30°).',
    peakPostureAr: 'ادفع الوزن عمودياً فوق الرأس حتى استقامة الذراعين مع شد البطن والأرداف.',
    formCuesAr: [
      'شد عضلات البطن والأرداف يمنع تقوس أسفل الظهر أثناء الدفع فوق الرأس',
      'لا تفتح كوعيك للجانبين بزاوية 90°؛ اجعلهما للأمام قليلاً في مسار الكتف الطبيعي',
    ],
    commonMistakeAr: 'الميل بالظهر للخلف لتحويل التمرين لضغط صدر علوي وإيذاء القطنية.',
    breathingAr: 'شهيق عند النزول للترقوة • زفير عند الدفع فوق الرأس',
    routineTags: ['push', 'upper', 'arms_delts'],
  },
  {
    id: 'atlas-lateral-raise',
    nameAr: 'Lateral Raises (رفرفة جانبي بالدمبل أو الكابل لتعريض الكتف)',
    nameEn: 'Dumbbell / Cable Lateral Raises',
    muscleGroup: 'shoulders',
    muscleLabelAr: 'الكتف الجانبي (3D Width)',
    secondaryMusclesAr: ['الترابيس العلوي'],
    equipmentAr: 'دمبل أو كابل',
    archetype: 'lateral_raise',
    defaultBaseWeightKg: 10,
    defaultRepsBulking: 12,
    defaultRepsCutting: 15,
    isCompound: false,
    startPostureAr: 'قف بمرونة، مِل بجذعك للأمام 10 درجات، واثنِ الكوعين ثنية خفيفة ثابتة.',
    peakPostureAr: 'ارفع ذراعيك للجانبين (في مستوى لوح الكتف 30° للأمام) حتى موازاة الكتف.',
    formCuesAr: [
      'فكّر في دفع الدمبل بعيداً عن جسمك للجانبين وليس مجرد رفعه للأعلى',
      'اخفض كتفيك بعيداً عن أذنيك لعزل الكتف الجانبي عن الترابيس',
    ],
    commonMistakeAr: 'استخدام وزن ثقيل جداً ومرجحة الظهر والركبتين لرفع الدمبل.',
    breathingAr: 'زفير عند الرفع للجانب • شهيق مع النزول البطيء',
    routineTags: ['push', 'arms_delts', 'upper'],
  },
  {
    id: 'atlas-face-pull',
    nameAr: 'Face Pulls & Rear Delt (سحب الحبل للوجه والكتف الخلفي)',
    nameEn: 'Cable Face Pulls & Rear Delts',
    muscleGroup: 'shoulders',
    muscleLabelAr: 'الكتف الخلفي وصحة الكفة المدورة',
    secondaryMusclesAr: ['أعلى الظهر', 'الروتيتر كف'],
    equipmentAr: 'حبل الكابل العالي',
    archetype: 'face_pull',
    defaultBaseWeightKg: 22.5,
    defaultRepsBulking: 15,
    defaultRepsCutting: 15,
    isCompound: false,
    startPostureAr: 'اضبط البكرة بمستوى الوجه وامسك الحبل بحيث يشير الإبهامان للخلف.',
    peakPostureAr: 'اسحب الحبل نحو الجبهة مع فتح الذراعين للخارج وتدوير الكتف خارجياً.',
    formCuesAr: [
      'أهم تمرين لحماية الكتف من الإصابات وتصحيح انحناء الأكتاف للأمام',
      'اجعل يديك تسبقان كوعيك للخلف في نهاية الحركة (External Rotation)',
    ],
    commonMistakeAr: 'السحب نحو الصدر بوزن ثقيل بدلاً من السحب نحو الجبهة/العينين.',
    breathingAr: 'زفير مع السحب والثبات ثانية • شهيق عند العودة',
    routineTags: ['pull', 'arms_delts', 'upper'],
  },

  // ======================== ARMS (البايسبس والترايسبس) ========================
  {
    id: 'atlas-bicep-curl',
    nameAr: 'EZ-Bar / Incline DB Curl (تبادل بايسبس بالبار الزجزاج أو الدمبل)',
    nameEn: 'EZ-Bar / Incline Bicep Curl',
    muscleGroup: 'biceps',
    muscleLabelAr: 'البايسبس (الرأس الطويل والقصير)',
    secondaryMusclesAr: ['الساعد'],
    equipmentAr: 'بار زجزاج أو دمبل',
    archetype: 'bicep_curl',
    defaultBaseWeightKg: 30,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: false,
    startPostureAr: 'ثبّت كوعيك بجانب الضلوع تماماً وابدأ بذراعين مفرودتين بالكامل.',
    peakPostureAr: 'ارفع الوزن بقوة البايسبس فقط مع عصر العضلة في الأعلى.',
    formCuesAr: [
      'لا تحرك كوعيك للأمام أثناء الصعود حتى لا يستريح البايسبس',
      'النزول البطيء (3 ثوانٍ) يبني حجم البايسبس أكثر من الصعود السريع',
    ],
    commonMistakeAr: 'أرجحة الظهر والحوض لرفع البار.',
    breathingAr: 'زفير عند رفع الوزن • شهيق عند النزول الكامل',
    routineTags: ['pull', 'arms_delts', 'upper'],
  },
  {
    id: 'atlas-hammer-curl',
    nameAr: 'Hammer Curl & Preacher Curl (بايسبس هامر للساعد وتكوير الذراع)',
    nameEn: 'Hammer & Preacher Curls',
    muscleGroup: 'biceps',
    muscleLabelAr: 'عضلة البراكيالس والساعد والبايسبس',
    secondaryMusclesAr: ['الساعد الخارجي'],
    equipmentAr: 'دمبل أو دكة الارتكاز',
    archetype: 'bicep_curl',
    defaultBaseWeightKg: 16,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: false,
    startPostureAr: 'امسك الدمبل بقبضة المطرقة (الإبهام للأعلى) وثبّت الكوع.',
    peakPostureAr: 'اصعد بالدمبل حتى مستوى الكتف وانزل ببطء.',
    formCuesAr: [
      'يستهدف عضلة الـ Brachialis التي تدفع البايسبس للأعلى وتعطي الذراع عرضاً قوياً',
      'مفيد جداً لقوة القبضة في الجوجيتسو والملاكمة والعقلة',
    ],
    commonMistakeAr: 'ثني المعصم أو تدويره أثناء الحركة.',
    breathingAr: 'زفير عند الصعود • شهيق عند النزول',
    routineTags: ['pull', 'arms_delts'],
  },
  {
    id: 'atlas-tricep-pushdown',
    nameAr: 'Tricep Rope Pushdown (سحب حبل للترايسبس)',
    nameEn: 'Tricep Cable Rope Pushdown',
    muscleGroup: 'triceps',
    muscleLabelAr: 'الترايسبس (الرأس الجانبي والوسطي)',
    secondaryMusclesAr: [],
    equipmentAr: 'حبل الكابل العالي',
    archetype: 'tricep_extension',
    defaultBaseWeightKg: 25,
    defaultRepsBulking: 12,
    defaultRepsCutting: 15,
    isCompound: false,
    startPostureAr: 'مِل قليلاً للأمام، ثبّت كوعيك بجانب جسمك كأنهما مسماران ثابتان.',
    peakPostureAr: 'افرد ذراعيك للأسفل بالكامل وافتح طرفي الحبل للخارج في النهاية.',
    formCuesAr: [
      'الترايسبس يشكل ثلثي حجم الذراع؛ افرد الكوع بالكامل في كل عدة',
      'لا تدع الكوع يتحرك للأمام والأعلى عند رجوع الوزن',
    ],
    commonMistakeAr: 'الضغط بالأكتاف والصدر على الحبل بدلاً من عزل مفصل الكوع.',
    breathingAr: 'زفير عند فرد الذراع للأسفل • شهيق عند الرجوع',
    routineTags: ['push', 'arms_delts', 'upper'],
  },
  {
    id: 'atlas-overhead-tricep',
    nameAr: 'Skullcrushers / Overhead Extension (ترايسبس فرنساوي للرأس الطويل)',
    nameEn: 'Overhead Extension / Skullcrushers',
    muscleGroup: 'triceps',
    muscleLabelAr: 'الرأس الطويل للترايسبس (ضخامة الذراع)',
    secondaryMusclesAr: [],
    equipmentAr: 'بار زجزاج أو كابل خلف الرأس',
    archetype: 'tricep_extension',
    defaultBaseWeightKg: 27.5,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: false,
    startPostureAr: 'اجعل الذراعين مائلتين قليلاً خلف الرأس لوضع الرأس الطويل للترايسبس تحت أقصى تمدد.',
    peakPostureAr: 'اثنِ الكوعين خلف الجبهة ثم افرد الذراعين بقوة الترايسبس.',
    formCuesAr: [
      'الرأس الطويل للترايسبس لا يعمل بكامل طاقته إلا عندما يرتفع الكوع نحو الرأس',
      'احرص على توجيه الكوعين للأمام وعدم فتحهما للجانبين',
    ],
    commonMistakeAr: 'النزول بالبار على الأنف مباشرة بدلاً من خلف الرأس قليلاً.',
    breathingAr: 'شهيق عند النزول • زفير عند الفرد',
    routineTags: ['push', 'arms_delts'],
  },

  // ======================== LEGS (الأرجل والسمانة) ========================
  {
    id: 'atlas-squat',
    nameAr: 'Barbell Squat / Hack Squat (السكوات الأساسي لتضخيم الأرجل)',
    nameEn: 'Barbell Back Squat / Hack Squat',
    muscleGroup: 'legs_quads',
    muscleLabelAr: 'الأفخاذ الأمامية والأرداف',
    secondaryMusclesAr: ['القطنية', 'الجذع (Core)'],
    equipmentAr: 'بار حر أو جهاز هاك سكوات',
    archetype: 'squat_press',
    defaultBaseWeightKg: 75,
    defaultRepsBulking: 8,
    defaultRepsCutting: 10,
    isCompound: true,
    startPostureAr: 'ضع البار على عضلة الترابيس (وليس فقرات الرقبة)، خذ نفساً عميقاً للبطن (Bracing).',
    peakPostureAr: 'انزل بالحوض والركبتين معاً حتى يصبح الفخذ موازياً للأرض أو أعمق، ثم ادفع بمنتصف القدم.',
    formCuesAr: [
      'وجّه ركبتيك في نفس اتجاه أصابع القدمين ولا تدعهما تنهاران للداخل',
      'إذا كنت تشعر بإجهاد في أسفل الظهر، استخدم جهاز الـ Hack Squat كبديل ممتاز',
    ],
    commonMistakeAr: 'رفع الكعبين عن الأرض أو تقويس أسفل الظهر في قاع الحركة.',
    breathingAr: 'شهيق وحبس النفس في البطن قبل النزول • زفير عند تخطي منتصف الصعود',
    routineTags: ['legs'],
  },
  {
    id: 'atlas-leg-press',
    nameAr: 'Leg Press / Bulgarian Split Squat (دفع الأرجل أو السكوات البلغاري)',
    nameEn: 'Leg Press / Bulgarian Split Squat',
    muscleGroup: 'legs_quads',
    muscleLabelAr: 'الأفخاذ الأمامية والأرداف (بدون حمل على الظهر)',
    secondaryMusclesAr: ['الخلفيات'],
    equipmentAr: 'جهاز الدفع أو دمبل',
    archetype: 'squat_press',
    defaultBaseWeightKg: 130,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: true,
    startPostureAr: 'ثبّت أسفل ظهرك ومقعدتك بالكامل على كرسي الجهاز، وضع قدميك بعرض الكتفين.',
    peakPostureAr: 'انزل بالمنصة ببطء حتى زاوية 90° أو أعمق دون أن ترتفع مقعدتك عن الكرسي.',
    formCuesAr: [
      'وضع القدمين أسفل المنصة يركز على الأماميات (Quads)؛ رفعهما للأعلى يركز على الخلفيات والأرداف',
      'لا تقفل ركبتيك بالكامل (Lockout) في نهاية الدفع لحماية المفاصل!',
    ],
    commonMistakeAr: 'قفل الركبتين بعنف أو نزول الوزن لدرجة تقويس الفقرات القطنية عن المقعد.',
    breathingAr: 'شهيق عند النزول • زفير عند الدفع',
    routineTags: ['legs'],
  },
  {
    id: 'atlas-rdl',
    nameAr: 'Romanian Deadlift - RDL (رفعة رومانية بالبار أو الدمبل للخلفيات)',
    nameEn: 'Romanian Deadlift (RDL)',
    muscleGroup: 'legs_hamstrings',
    muscleLabelAr: 'الأفخاذ الخلفية والأرداف',
    secondaryMusclesAr: ['القطنية', 'أعلى الظهر'],
    equipmentAr: 'بار أو دمبل',
    archetype: 'hip_hinge_rdl',
    defaultBaseWeightKg: 70,
    defaultRepsBulking: 10,
    defaultRepsCutting: 12,
    isCompound: true,
    startPostureAr: 'قف باستقامة، اثنِ ركبتيك ثنية بسيطة جداً (15°) وثبّت هذه الزاوية.',
    peakPostureAr: 'ادفع حوضك للخلف أقصى ما يمكن مع إبقاء البار ملاصقاً للفخذين حتى منتصف القصبة.',
    formCuesAr: [
      'سر الـ RDL هو دفع المقعدة للخلف كأنك تغلق باباً خلفك، وليس النزول بالظهر للأسفل',
      'توقف عن النزول بمجرد توقف الحوض عن الرجوع للخلف حتى لا ينتقل الحمل للقطنية',
    ],
    commonMistakeAr: 'إبعاد البار عن الجسم أو ثني الظهر للوصول إلى الأرض.',
    breathingAr: 'شهيق أثناء دفع الحوض للخلف • زفير مع عصر الأرداف للصعود',
    routineTags: ['legs'],
  },
  {
    id: 'atlas-leg-curl-calf',
    nameAr: 'Lying Leg Curl & Calf Raises (مرجحة خلفيات الأرجل + السمانة)',
    nameEn: 'Leg Curl & Standing Calf Raises',
    muscleGroup: 'legs_hamstrings',
    muscleLabelAr: 'عزل الخلفيات وعضلة السمانة',
    secondaryMusclesAr: ['السمانة'],
    equipmentAr: 'جهاز الخلفيات وجهاز السمانة',
    archetype: 'leg_curl_calf',
    defaultBaseWeightKg: 45,
    defaultRepsBulking: 12,
    defaultRepsCutting: 15,
    isCompound: false,
    startPostureAr: 'ثبّت الحوض على جهاز المرجحة واضبط الأسطوانة فوق الكعب مباشرة.',
    peakPostureAr: 'اثنِ ركبتيك لأقصى مدى واعصر الخلفيات، ثم أتبعها برفعات سمانة كاملة المدى.',
    formCuesAr: [
      'في السمانة: اثبت ثانيتين في القاع لفك مطاطية وتر العرقوب وتشغيل العضلة فعلياً',
    ],
    commonMistakeAr: 'رفع الحوض أثناء مرجحة الخلفيات أو النطّ السريع في السمانة.',
    breathingAr: 'زفير عند الانقباض • شهيق عند النزول الكامل',
    routineTags: ['legs'],
  },

  // ======================== CORE & CALISTHENICS ========================
  {
    id: 'atlas-hanging-leg-raise',
    nameAr: 'Hanging Leg Raises & Ab Wheel (رفع الأرجل على العقلة وعجلة البطن)',
    nameEn: 'Hanging Leg Raises & Ab Rollout',
    muscleGroup: 'core',
    muscleLabelAr: 'عضلات البطن السفلية والـ Core العميق',
    secondaryMusclesAr: ['قبضة اليد', 'الخواصر'],
    equipmentAr: 'عقلة أو عجلة البطن',
    archetype: 'core_hanging',
    defaultBaseWeightKg: 0,
    defaultRepsBulking: 15,
    defaultRepsCutting: 15,
    isCompound: false,
    startPostureAr: 'تعلق على العقلة بقبضة ثابتة واشدد جذعك لمنع التأرجح.',
    peakPostureAr: 'ارفع ركبتيك أو ساقيك مع لف الحوض للأعلى (Pelvic Tilt) لعصر عضلات البطن.',
    formCuesAr: [
      'رفع الساقين بدون لف الحوض للأعلى يشغّل عضلات الحوض (Hip Flexors) فقط وليس البطن!',
    ],
    commonMistakeAr: 'التأرجح والاعتماد على قوة الدفع بدلاً من انقباض البطن.',
    breathingAr: 'زفير كامل عند رفع الأرجل • شهيق عند النزول ببطء',
    routineTags: ['cardio', 'legs', 'calisthenics'],
  },
  {
    id: 'atlas-calisthenics-muscleup',
    nameAr: 'Explosive Pull-ups & Muscle-Up Progression (عقلة انفجارية للصدر)',
    nameEn: 'Explosive High Pull-ups & Muscle-Up',
    muscleGroup: 'full_body',
    muscleLabelAr: 'المجنص، الصدر، الترايسبس، والانفجار العصبي',
    secondaryMusclesAr: ['البطن', 'الساعد'],
    equipmentAr: 'بار العقلة',
    archetype: 'calisthenics_skill',
    defaultBaseWeightKg: 0,
    defaultRepsBulking: 8,
    defaultRepsCutting: 10,
    isCompound: true,
    startPostureAr: 'تعلق بقبضة قوية (أو False Grip) مع تقدم الجسم قليلاً أمام البار.',
    peakPostureAr: 'اسحب في مسار قوسي (C-Shape) نحو أسفل الصدر/البطن وليس عمودياً للذقن.',
    formCuesAr: [
      'الـ Muscle-Up يتطلب سحباً قوسياً حول البار كأنك تضغط على البار للأسفل بذراعين قويتين',
    ],
    commonMistakeAr: 'السحب عمودياً بقرب البار فيصطدم الصدر بالبار ويستحيل الانتقال فوقه.',
    breathingAr: 'زفير انفجاري عند السحب الأقصى',
    routineTags: ['calisthenics', 'pull'],
  },
];

/**
 * Matches any exercise name (Arabic or English) to the best VisualExerciseMetadata entry!
 */
export function matchExerciseToVisualAtlas(exerciseName: string): VisualExerciseMetadata {
  const q = exerciseName.toLowerCase();
  if (/incline|مائل|علوي/.test(q) && /press|ضغط|تجميع|دمبل/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-incline-db')!;
  }
  if (/fly|crossover|تفتيح|فراشة/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-cable-fly')!;
  }
  if (/dip|push-up|pushup|متوازي|ضغط صدر/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-chest-dips')!;
  }
  if (/bench|chest press|ضغط الصدر/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-bench-barbell')!;
  }
  if (/pulldown|pull-up|pullup|chin-up|عقلة|سحب عريض|مجنص/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-lat-pulldown')!;
  }
  if (/cable row|سحب أرضي|مسنود/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-seated-cable-row')!;
  }
  if (/row|سحب بار|منشار/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-barbell-row')!;
  }
  if (/lateral|رفرفة جانبي/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-lateral-raise')!;
  }
  if (/face pull|rear delt|سحب للوجه|كتف خلفي/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-face-pull')!;
  }
  if (/overhead|shoulder press|pike|hspu|handstand|أكتاف/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-ohp')!;
  }
  if (/hammer|preacher|هامر|ارتكاز/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-hammer-curl')!;
  }
  if (/curl|bicep|بايسبس/.test(q) && !/leg|أرجل|خلفيات/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-bicep-curl')!;
  }
  if (/skull|overhead ext|فرنساوي|رأس طويل/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-overhead-tricep')!;
  }
  if (/tricep|pushdown|ترايسبس|سحب حبل/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-tricep-pushdown')!;
  }
  if (/rdl|romanian|deadlift|رومانية|ديدلفت/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-rdl')!;
  }
  if (/leg press|split squat|بلغاري|دفع الأرجل/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-leg-press')!;
  }
  if (/leg curl|calf|خلفيات|سمانة/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-leg-curl-calf')!;
  }
  if (/squat|pistol|سكوات|قرفصاء/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-squat')!;
  }
  if (/muscle-up|lever|planche|ماسل أب|فرونت ليفر|بلانش/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-calisthenics-muscleup')!;
  }
  if (/leg raise|ab |core|plank|بطن|بلانك/.test(q)) {
    return VISUAL_EXERCISE_ATLAS.find((x) => x.id === 'atlas-hanging-leg-raise')!;
  }
  return VISUAL_EXERCISE_ATLAS[0];
}

/**
 * Returns alternative exercises targeting the same muscle group for 1-tap swapping!
 */
export function getAlternativeExercisesFor(currentExerciseName: string): VisualExerciseMetadata[] {
  const matched = matchExerciseToVisualAtlas(currentExerciseName);
  const sameMuscle = VISUAL_EXERCISE_ATLAS.filter(
    (item) => item.muscleGroup === matched.muscleGroup && item.id !== matched.id
  );
  if (sameMuscle.length >= 2) return sameMuscle;
  // Include related muscles if group is small
  const related = VISUAL_EXERCISE_ATLAS.filter(
    (item) =>
      item.id !== matched.id &&
      (item.muscleGroup === matched.muscleGroup ||
        item.routineTags.some((tag) => matched.routineTags.includes(tag)))
  );
  return related.slice(0, 5);
}

export interface SmartSplitRecommendation {
  yesterdaySplit: RoutineSplitId;
  yesterdayLabelAr: string;
  recommendedSplit: 'push' | 'pull' | 'legs' | 'upper' | 'arms_delts' | 'cardio';
  recommendedTitleAr: string;
  recommendedReasonAr: string;
  alternativeTitleAr: string;
  alternativeSplit: 'push' | 'pull' | 'legs' | 'upper' | 'arms_delts' | 'cardio' | 'combat' | 'calisthenics';
  recoveringMusclesAr: string[];
  freshMusclesAr: string[];
}

export const YESTERDAY_SPLIT_OPTIONS: Array<{
  id: RoutineSplitId;
  labelAr: string;
  shortAr: string;
  icon: string;
}> = [
  { id: 'push', labelAr: '💪 دفع (صدر وكتف وترايسبس)', shortAr: 'دفع (Push)', icon: '💪' },
  { id: 'pull', labelAr: '🦅 سحب (ظهر وبايسبس وخلفي)', shortAr: 'سحب (Pull)', icon: '🦅' },
  { id: 'legs', labelAr: '🦵 أرجل وبطن (Legs & Core)', shortAr: 'أرجل (Legs)', icon: '🦵' },
  { id: 'upper', labelAr: '🔥 علوي شامل (Upper Body)', shortAr: 'علوي (Upper)', icon: '🔥' },
  { id: 'arms_delts', labelAr: '💥 ذراع وأكتاف (Arms & Delts)', shortAr: 'ذراع وأكتاف', icon: '💥' },
  { id: 'combat', labelAr: '🥊 فنون قتالية (بوكس / كيك / جوجيتسو)', shortAr: 'قتال (Combat)', icon: '🥊' },
  { id: 'calisthenics', labelAr: '🤸‍♂️ كاليستنكس ومهارات وزن الجسم', shortAr: 'كاليستنكس', icon: '🤸‍♂️' },
  { id: 'cardio', labelAr: '🏃 كارديو وحرق دهون وبطن', shortAr: 'كارديو وبطن', icon: '🏃' },
  { id: 'rest', labelAr: '🛌 أمس كان يوم راحة واستشفاء', shortAr: 'راحة (Rest)', icon: '🛌' },
];

export function computeTodaySmartRecommendation(
  yesterdaySplit: RoutineSplitId,
  bodyGoal: BodyGoalType,
  secondarySport: SecondarySportType,
  _athleteLevel: AthleteLevelType
): SmartSplitRecommendation {
  const yOpt = YESTERDAY_SPLIT_OPTIONS.find((o) => o.id === yesterdaySplit) || YESTERDAY_SPLIT_OPTIONS[0];

  if (yesterdaySplit === 'push') {
    return {
      yesterdaySplit,
      yesterdayLabelAr: yOpt.labelAr,
      recommendedSplit: 'pull',
      recommendedTitleAr: '🦅 يوم سحب (ظهر عريض + بايسبس + كتف خلفي)',
      recommendedReasonAr:
        'لأنك لعبت أمس (دفع: صدر وأكتاف وترايسبس)، فعضلات الدفع في مرحلة استشفاء وبناء (48 ساعة)، بينما عضلات الظهر والبايسبس في كامل طاقتها العصبية اليوم!',
      alternativeTitleAr:
        secondarySport === 'boxing' || secondarySport === 'kickboxing'
          ? '🦵 أو: يوم أرجل وبطن (لتفادي إجهاد الذراعين قبل القتال)'
          : '🦵 أو: يوم أرجل وبطن (Legs & Core)',
      alternativeSplit: 'legs',
      recoveringMusclesAr: ['الصدر', 'الكتف الأمامي', 'الترايسبس'],
      freshMusclesAr: ['الظهر والمجنص 100%', 'البايسبس 100%', 'الأرجل 100%'],
    };
  }

  if (yesterdaySplit === 'pull') {
    return {
      yesterdaySplit,
      yesterdayLabelAr: yOpt.labelAr,
      recommendedSplit: 'legs',
      recommendedTitleAr: '🦵 يوم أرجل وقطنية وبطن (Legs & Core Power)',
      recommendedReasonAr:
        'بعد يوم السحب القوي أمس، منح الجزء العلوي راحة اليوم والتركيز على الأرجل يرفع هرمون البناء الطبيعي ويحمي مفصل الكوع والكتف.',
      alternativeTitleAr: '💪 أو: يوم دفع (صدر وأكتاف وترايسبس) إذا أردت تأجيل الأرجل',
      alternativeSplit: 'push',
      recoveringMusclesAr: ['الظهر والمجنص', 'البايسبس', 'الساعد'],
      freshMusclesAr: ['الأرجل والأفخاذ 100%', 'الصدر والترايسبس 95%'],
    };
  }

  if (yesterdaySplit === 'legs') {
    return {
      yesterdaySplit,
      yesterdayLabelAr: yOpt.labelAr,
      recommendedSplit: bodyGoal === 'cutting' ? 'upper' : 'push',
      recommendedTitleAr:
        bodyGoal === 'cutting'
          ? '🔥 يوم علوي شامل عالي الكثافة (Upper Body Shred)'
          : '💪 يوم دفع (صدر + أكتاف + ترايسبس)',
      recommendedReasonAr:
        'أرجلك وأسفل ظهرك في طور الاستشفاء من تمرين أمس؛ اليوم مثالي لتفجير الجزء العلوي على البنش والأجهزة بدون أي تحميل على الساقين!',
      alternativeTitleAr:
        secondarySport === 'calisthenics'
          ? '🤸‍♂️ أو: حصة مهارات كاليستنكس للجزء العلوي (Muscle-Up / Handstand)'
          : '💥 أو: يوم ذراع وأكتاف (Arms & 3D Delts)',
      alternativeSplit: secondarySport === 'calisthenics' ? 'calisthenics' : 'arms_delts',
      recoveringMusclesAr: ['الأفخاذ الأمامية والخلفية', 'السمانة', 'أسفل الظهر'],
      freshMusclesAr: ['الصدر 100%', 'الأكتاف 100%', 'الظهر والذراعين 100%'],
    };
  }

  if (yesterdaySplit === 'upper') {
    return {
      yesterdaySplit,
      yesterdayLabelAr: yOpt.labelAr,
      recommendedSplit: 'legs',
      recommendedTitleAr: '🦵 يوم سفلي وأرجل وبطن (Lower Body & Abs)',
      recommendedReasonAr:
        'لعبت أمس (علوي شامل)، لذا كل عضلات الصدر والظهر والأكتاف تحتاج 48 ساعة للاستشفاء، واليوم هو دور النصف السفلي والـ Core.',
      alternativeTitleAr: '🏃 أو: حرق دهون وكارديو Zone 2 وبطن (استشفاء نشط)',
      alternativeSplit: 'cardio',
      recoveringMusclesAr: ['الصدر والظهر', 'الأكتاف والذراعين'],
      freshMusclesAr: ['الأرجل كاملة 100%', 'عضلات البطن 100%'],
    };
  }

  if (yesterdaySplit === 'arms_delts') {
    return {
      yesterdaySplit,
      yesterdayLabelAr: yOpt.labelAr,
      recommendedSplit: 'legs',
      recommendedTitleAr: '🦵 يوم أرجل وبطن (لإراحة الذراعين والأكتاف)',
      recommendedReasonAr:
        'لأنك استهدفت البايسبس والترايسبس والأكتاف أمس، فإن أي تمرين صدر أو ظهر ثقيل اليوم سيتأثر بإجهاد ذراعيك؛ الأرجل هي الخيار الذكي اليوم!',
      alternativeTitleAr: '🏃 أو: كارديو ونحت البطن والـ Core',
      alternativeSplit: 'cardio',
      recoveringMusclesAr: ['البايسبس والترايسبس', 'الأكتاف'],
      freshMusclesAr: ['الأرجل والأرداف 100%', 'البطن والـ Core 100%'],
    };
  }

  if (yesterdaySplit === 'combat') {
    return {
      yesterdaySplit,
      yesterdayLabelAr: yOpt.labelAr,
      recommendedSplit: 'pull',
      recommendedTitleAr: '🦅 يوم سحب وتقوية الظهر والرقبة (Pull & Fighter Back)',
      recommendedReasonAr:
        'حصص القتال (البوكس/الكيك بوكسينج) تستهلك الكتف الأمامي والصدر والسمانة؛ تمرين السحب اليوم يوازن مفصل الكتف ويقوي الظهر والقبضة دون إرهاق اللكم!',
      alternativeTitleAr: '🔥 أو: علوي شامل بأوزان متوسطة وانفجارية',
      alternativeSplit: 'upper',
      recoveringMusclesAr: ['الكتف الأمامي (من اللكم)', 'السمانة والـ Cardio'],
      freshMusclesAr: ['الظهر والمجنص 95%', 'الكتف الخلفي والبايسبس 95%'],
    };
  }

  if (yesterdaySplit === 'calisthenics') {
    return {
      yesterdaySplit,
      yesterdayLabelAr: yOpt.labelAr,
      recommendedSplit: 'legs',
      recommendedTitleAr: '🦵 يوم أرجل أو دفع بالحديد (لتعويض زوايا التضخيم)',
      recommendedReasonAr:
        'الكاليستنكس يركز بقوة على السحب والـ Core والكتف؛ اليوم مثالي لتمرين الأرجل أو تمارين عزل وتضخيم الصدر بالدمبل.',
      alternativeTitleAr: '💪 أو: يوم دفع وتضخيم صدر بالدمبل والأجهزة',
      alternativeSplit: 'push',
      recoveringMusclesAr: ['المجنص والساعد', 'الجذع (Core)'],
      freshMusclesAr: ['الأرجل 100%', 'الصدر بالدمبل والأجهزة 90%'],
    };
  }

  // Default: rest or cardio yesterday -> full energy today!
  return {
    yesterdaySplit,
    yesterdayLabelAr: yOpt.labelAr,
    recommendedSplit: 'push',
    recommendedTitleAr: '💪 يوم دفع أساسي (صدر + أكتاف + ترايسبس) بطاقة كاملة',
    recommendedReasonAr:
      'جهازك العصبي وعضلاتك في قمة الاستشفاء (100%) بعد الراحة/الكارديو أمس؛ ابدأ الدورة التدريبية بحصة دفع قوية وكسر أوزانك!',
    alternativeTitleAr: '🔥 أو: يوم علوي شامل (صدر وظهر وأكتاف)',
    alternativeSplit: 'upper',
    recoveringMusclesAr: ['لا يوجد — جميع العضلات مستشفية وجاهزة!'],
    freshMusclesAr: ['الصدر والأكتاف 100%', 'الظهر والذراعين 100%', 'الأرجل 100%'],
  };
}
