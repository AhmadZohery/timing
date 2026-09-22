export type CombatDiscipline = 'boxing' | 'muay_thai' | 'bjj';

export interface CombatDrill {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'striking' | 'defense' | 'grappling' | 'conditioning';
  descriptionAr: string;
}

export interface RoundTimerPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  roundSeconds: number;
  restSeconds: number;
  totalRounds: number;
  warningSeconds: number;
}

export interface TeamMatchLog {
  id: string;
  date: string;
  sportType: 'football' | 'padel' | 'basketball';
  durationMinutes: number;
  goals: number;
  assists: number;
  result: 'win' | 'draw' | 'loss';
  intensityRating: number; // 1 to 5
  notes?: string;
}

export const COMBAT_DRILLS: Record<CombatDiscipline, CombatDrill[]> = {
  boxing: [
    {
      id: 'box-1',
      nameAr: 'تتابعات الضربات الأساسية (Jab - Cross - Hook - Uppercut)',
      nameEn: '1-2-3-4 Punch Combo',
      category: 'striking',
      descriptionAr: 'تركيز على سرعة اليدين، تدوير الورك، واستعادة وضعية الحماية فوراً.',
    },
    {
      id: 'box-2',
      nameAr: 'مراوغات الرأس والجذع (Slip - Roll - Weave)',
      nameEn: 'Head Movement & Slips',
      category: 'defense',
      descriptionAr: 'الانزلاق يميناً ويساراً مع تفادي اللكمات الوهمية والرد الفوري بلكمة مضادة.',
    },
    {
      id: 'box-3',
      nameAr: 'جولات الكيس الثقيل بكثافة عالية (Heavy Bag Conditioning)',
      nameEn: 'Heavy Bag Power Bursts',
      category: 'conditioning',
      descriptionAr: 'تبديل بين ضربات سريعة خفيفة (Patter) ثم انفجار 10 ثوانٍ بأقصى قوة.',
    },
    {
      id: 'box-4',
      nameAr: 'تحركات القدمين والملاكمة بالظل (Shadow Boxing & Footwork)',
      nameEn: 'Shadow Boxing & Pivot',
      category: 'striking',
      descriptionAr: 'حركة دائرية مستمرة، قطع الزوايا، ومحاكاة نزال حقيقي لثلاث دقائق كاملة.',
    },
  ],
  muay_thai: [
    {
      id: 'mt-1',
      nameAr: 'ركلات التييب الدفاعية (Teep Push Kicks)',
      nameEn: 'Front Push Kicks (Teep)',
      category: 'striking',
      descriptionAr: 'استخدام الركلة الأمامية للسيطرة على المسافة وإيقاف اندفاع الخصم بقوة.',
    },
    {
      id: 'mt-2',
      nameAr: 'الركلات الدائرية القاطعة (Roundhouse Heavy Kicks)',
      nameEn: 'Power Roundhouse Kicks',
      category: 'striking',
      descriptionAr: 'تدوير قصبة الساق والكتف بالكامل مع إسقاط اليد لزيادة عزم الدوران.',
    },
    {
      id: 'mt-3',
      nameAr: 'التحام الكلينش وضربات الركبة (Clinch & Knees)',
      nameEn: 'Clinch Control & Knees',
      category: 'grappling',
      descriptionAr: 'التحكم برأس الخصم عبر كلينش محكم وسحب الرأس لتوجيه ركلات ركبة متتالية.',
    },
    {
      id: 'mt-4',
      nameAr: 'ضربات الكوع القريبة (Elbow Slashes)',
      nameEn: 'Close-Range Elbows',
      category: 'striking',
      descriptionAr: 'كوع قاطع مائل وأفقي مع حماية الوجه باليد الأخرى.',
    },
  ],
  bjj: [
    {
      id: 'bjj-1',
      nameAr: 'سحب الحرس والمرور (Guard Pull & Pass)',
      nameEn: 'Guard Pull & Passing Drill',
      category: 'grappling',
      descriptionAr: 'التدرب على اختراق حرس الخصم والوصول للسيطرة الجانبية (Side Control).',
    },
    {
      id: 'bjj-2',
      nameAr: 'الانقلابات من الحرس المغلق (Closed Guard Sweeps)',
      nameEn: 'Scissor & Flower Sweeps',
      category: 'grappling',
      descriptionAr: 'اختلال توازن الخصم والالتفاف لأعلى للحصول على وضعية الامتطاء (Mount).',
    },
    {
      id: 'bjj-3',
      nameAr: 'سلسلة الإخضاع السريع (Armbar - Triangle - Omoplata)',
      nameEn: 'Triple Threat Submission Chain',
      category: 'grappling',
      descriptionAr: 'الانتقال السلس بين كسر الذراع وخنق المثلث وفق رد فعل الخصم الدفاعي.',
    },
    {
      id: 'bjj-4',
      nameAr: 'جولات السجال الحر على البساط (Live Sparring Rolls)',
      nameEn: 'Live Rolling Rounds',
      category: 'conditioning',
      descriptionAr: 'سجال قتالي هادئ وذكي مدته 5 دقائق مع التركيز على التقنية والتنفس الهادئ.',
    },
  ],
};

export const ROUND_PRESETS: RoundTimerPreset[] = [
  {
    id: 'box_standard',
    nameAr: 'ملاكمة احترافية (3 د × 5 جولات)',
    nameEn: 'Pro Boxing (3m / 1m Rest)',
    roundSeconds: 180,
    restSeconds: 60,
    totalRounds: 5,
    warningSeconds: 10,
  },
  {
    id: 'box_championship',
    nameAr: 'نزال بطولة كامل (3 د × 10 جولات)',
    nameEn: 'Championship (10 Rounds)',
    roundSeconds: 180,
    restSeconds: 60,
    totalRounds: 10,
    warningSeconds: 10,
  },
  {
    id: 'bjj_sparring',
    nameAr: 'جيوجيتسو سجال البساط (5 د × 5 جولات)',
    nameEn: 'BJJ Rolls (5m / 1m Rest)',
    roundSeconds: 300,
    restSeconds: 60,
    totalRounds: 5,
    warningSeconds: 15,
  },
  {
    id: 'bjj_blue_belt',
    nameAr: 'جيوجيتسو الحزام الأزرق (6 د × 4 جولات)',
    nameEn: 'BJJ Blue Belt (6m / 1m Rest)',
    roundSeconds: 360,
    restSeconds: 60,
    totalRounds: 4,
    warningSeconds: 15,
  },
  {
    id: 'bjj_purple_brown',
    nameAr: 'جيوجيتسو الحزام البنفسجي/البني (8 د × 3 جولات)',
    nameEn: 'BJJ Purple/Brown (8m / 90s Rest)',
    roundSeconds: 480,
    restSeconds: 90,
    totalRounds: 3,
    warningSeconds: 20,
  },
  {
    id: 'bjj_black_belt',
    nameAr: 'جيوجيتسو بطولة العالم - الحزام الأسود (10 د × 3 جولات)',
    nameEn: 'BJJ Black Belt IBJJF (10m / 2m Rest)',
    roundSeconds: 600,
    restSeconds: 120,
    totalRounds: 3,
    warningSeconds: 30,
  },
  {
    id: 'speed_intervals',
    nameAr: 'فواصل سريعة مكثفة (2 د × 6 جولات)',
    nameEn: 'Speed Intervals (2m / 30s Rest)',
    roundSeconds: 120,
    restSeconds: 30,
    totalRounds: 6,
    warningSeconds: 10,
  },
  {
    id: 'hiit_tabata',
    nameAr: 'فيتنس تاباتا (20ث تمرين / 10ث راحة)',
    nameEn: 'Tabata (20s / 10s Rest × 8)',
    roundSeconds: 20,
    restSeconds: 10,
    totalRounds: 8,
    warningSeconds: 3,
  },
];

export interface StrikingCombo {
  id: string;
  discipline: CombatDiscipline;
  cueText: string;
  cueAr: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export const STRIKING_COMBOS: StrikingCombo[] = [
  { id: 'c1', discipline: 'boxing', cueText: '1 - 2! (Jab - Cross)', cueAr: '١ - ٢! (جَاب - كْرُوس)', difficulty: 'basic' },
  { id: 'c2', discipline: 'boxing', cueText: '1 - 2 - 3! (Jab - Cross - Lead Hook)', cueAr: '١ - ٢ - ٣! (جَاب - كْرُوس - هُوك)', difficulty: 'basic' },
  { id: 'c3', discipline: 'boxing', cueText: '2 - 3 - 2! (Cross - Hook - Cross)', cueAr: '٢ - ٣ - ٢! (كْرُوس - هُوك - كْرُوس)', difficulty: 'intermediate' },
  { id: 'c4', discipline: 'boxing', cueText: 'Slip Right - 2 - 3 - 2!', cueAr: 'مراوغة يمين - كْرُوس - هُوك!', difficulty: 'intermediate' },
  { id: 'c5', discipline: 'boxing', cueText: '1 - 2 - Roll Left - Lead Hook - Cross!', cueAr: '١ - ٢ - رول يسار - هوك - كروس!', difficulty: 'advanced' },
  { id: 'c6', discipline: 'muay_thai', cueText: 'Teep Push Kick - Cross!', cueAr: 'ركلة تِيب - كْرُوس!', difficulty: 'basic' },
  { id: 'c7', discipline: 'muay_thai', cueText: 'Jab - Rear Roundhouse Kick!', cueAr: 'جَاب - ركلة دائرية خلفية قوية!', difficulty: 'basic' },
  { id: 'c8', discipline: 'muay_thai', cueText: '1 - 2 - Clinch & Double Knee!', cueAr: '١ - ٢ - كْلِينش وركبتين متتاليتين!', difficulty: 'intermediate' },
  { id: 'c9', discipline: 'muay_thai', cueText: 'Lead Hook - Rear Horizontal Elbow!', cueAr: 'هُوك أمامي - كُوع قاطع خلفي!', difficulty: 'advanced' },
  { id: 'c10', discipline: 'bjj', cueText: 'Fake Guard Pull -> Ankle Pick!', cueAr: 'تمويه سحب حرس -> سحب الكاحل فوراً!', difficulty: 'intermediate' },
  { id: 'c11', discipline: 'bjj', cueText: 'Armbar Trap -> Flower Sweep!', cueAr: 'فخ كسر الذراع -> انقلاب الفلاور سويب!', difficulty: 'intermediate' },
  { id: 'c12', discipline: 'bjj', cueText: 'Kimura Grip -> Hip Bump Sweep!', cueAr: 'قبضة كيمورا -> انقلاب الدفع بالورك!', difficulty: 'basic' },
];

export interface FootballPitchFormat {
  id: '5v5' | '7v7' | '11v11';
  nameAr: string;
  nameEn: string;
  kmPerHourRate: number;
  benchmarkDistanceKm: string;
  descriptionAr: string;
}

export const FOOTBALL_PITCH_FORMATS: FootballPitchFormat[] = [
  {
    id: '5v5',
    nameAr: 'خماسي (5v5 - صالات وترتان)',
    nameEn: '5v5 (Futsal / Turf Cage)',
    kmPerHourRate: 4.5,
    benchmarkDistanceKm: '3.5 - 5.0 km',
    descriptionAr: 'انفجارات سرعة متتالية، مساحات ضيقة، تحولات هجومية ودفاعية سريعة جداً.',
  },
  {
    id: '7v7',
    nameAr: 'سباعي (7v7 - ملعب متوسط)',
    nameEn: '7v7 (Mid-Pitch)',
    kmPerHourRate: 6.5,
    benchmarkDistanceKm: '5.5 - 7.5 km',
    descriptionAr: 'توازن بين التمركز التكتيكي والركض المتواصل وتغطية الخطوط العريضة.',
  },
  {
    id: '11v11',
    nameAr: 'أحد عشر (11v11 - ملعب نظامي كامل)',
    nameEn: '11v11 (Full Regulation Pitch)',
    kmPerHourRate: 9.5,
    benchmarkDistanceKm: '8.5 - 12.0 km',
    descriptionAr: 'مباراة كاملة بمسافات ركض عالية، سرعات قصوى، وضغط بدني تكتيكي متقدم.',
  },
];

