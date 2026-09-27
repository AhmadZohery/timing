import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Volume2,
  Mic,
  MicOff,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare,
  Flame,
  HelpCircle,
  Globe,
  Award,
  Compass,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

export interface ExecutiveEnglishStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
}

export type StudioTab = 'simulator' | 'templates' | 'drills' | 'placement';

export type UserJobRole =
  | 'software_engineering'
  | 'product_management'
  | 'ui_ux_design'
  | 'data_ai'
  | 'freelance_startups'
  | 'marketing_sales';

export type UserWorkRegion = 'gulf_mena' | 'us_silicon_valley' | 'eu_global';

export type UserEnglishLevel = 'b1' | 'b2' | 'c1';

interface MeetingScenario {
  id: string;
  category: 'scope' | 'deadlines' | 'dependencies' | 'team_safety' | 'tech_debt' | 'leadership';
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  contextAr: string;
  contextEn: string;
  stakeholderSpeaker: string;
  stakeholderPromptEn: string;
  stakeholderPromptAr: string;
  simplifiedAnswerEn: string;
  simplifiedAnswerAr: string;
  options: {
    id: 'weak' | 'aggressive' | 'executive';
    type: 'weak' | 'aggressive' | 'executive';
    labelAr: string;
    labelEn: string;
    textEn: string;
    textAr: string;
    whyResultAr: string;
    whyResultEn: string;
    executiveTacticAr: string;
    executiveTacticEn: string;
  }[];
}

interface ExecutiveTemplate {
  id: string;
  category: 'sprint' | 'boundary' | 'escalation' | 'focus';
  categoryLabelAr: string;
  categoryLabelEn: string;
  titleAr: string;
  titleEn: string;
  subjectLine?: string;
  templateEn: string;
  templateAr: string;
  tipsAr: string;
  tipsEn: string;
}

interface FluencyDrill {
  id: string;
  hookEn: string;
  hookAr: string;
  usageContextAr: string;
  usageContextEn: string;
  exampleEn: string;
  exampleAr: string;
  drillCategory: 'tradeoff' | 'perspective' | 'root_cause' | 'boundary';
}

interface PlacementQuestion {
  id: number;
  titleAr: string;
  titleEn: string;
  situationAr: string;
  situationEn: string;
  options: {
    level: UserEnglishLevel;
    levelLabelAr: string;
    textEn: string;
    textAr: string;
    explanationAr: string;
  }[];
}

const REGIONAL_CONTEXT_PROTIPS: Record<
  UserWorkRegion,
  { nameAr: string; nameEn: string; icon: string; adviceAr: string }
> = {
  gulf_mena: {
    nameAr: 'شركات الخليج والشرق الأوسط (MENA & GCC)',
    nameEn: 'Gulf & MENA Tech Hubs',
    icon: '🌍',
    adviceAr:
      'في بيئات العمل بالخليج (دبي، الرياض، الدوحة، القاهرة...) تكون الفرق متعددة الجنسيات (عربية، هندية، أوروبية). احرص على الجمع بين الاحترام البالغ والوضوح المباشر، وتجنب استخدام الأمثال الإنجليزية الغربية النادرة التي قد تسبب لبساً، وركز دائماً على مصلحة المشروع والعميل.',
  },
  us_silicon_valley: {
    nameAr: 'عن بعد مع شركات أمريكية (US Remote / Valley)',
    nameEn: 'US Remote & Silicon Valley',
    icon: '🇺🇸',
    adviceAr:
      'ثقافة العمل الأمريكية تقدّر المباشرة المطلقة (Radical Candor & Directness) وتكره الاعتذارات المطولة أو التردد. ادخل في صلب الموضوع فوراً (Bottom Line Up Front)، واشرح المقايضات بالأرقام والبدائل (Trade-offs)، وركز على التواصل الـ Async الفعال في سلاك.',
  },
  eu_global: {
    nameAr: 'شركات أوروبية وعالمية (EU & Global Multi-Hub)',
    nameEn: 'European & Global Multi-Hub',
    icon: '🇪🇺',
    adviceAr:
      'الشركات الأوروبية والعالمية تقدّس التوثيق الكتابي المنظم (Written RFCs / PRDs) واحترام ساعات العمل والحدود الشخصية. لا تتوقع رداً فورياً خارج ساعات الدوام، واحرص على جدولة الاجتماعات بأجندة مكتوبة مسبقاً قبل أي مكالمة.',
  },
};

const JOB_ROLE_LABELS: Record<UserJobRole, { nameAr: string; nameEn: string; icon: string }> = {
  software_engineering: { nameAr: 'هندسة برمجيات وقيادة تقنية', nameEn: 'Software & Tech Lead', icon: '💻' },
  product_management: { nameAr: 'إدارة المنتجات والمشاريع', nameEn: 'Product & Agile PM', icon: '🚀' },
  ui_ux_design: { nameAr: 'تصميم UI/UX وتجربة المستخدم', nameEn: 'UI/UX & Product Design', icon: '🎨' },
  data_ai: { nameAr: 'بيانات وذكاء اصطناعي', nameEn: 'Data Science & AI', icon: '🧠' },
  freelance_startups: { nameAr: 'عمل حر وشركات ناشئة', nameEn: 'Freelance & Startups', icon: '💼' },
  marketing_sales: { nameAr: 'مبيعات وتطوير أعمال', nameEn: 'Sales & Growth', icon: '📈' },
};

const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 1,
    titleAr: 'الموقف 1: طلب ميزة إضافية مفاجئة قبل موعد الإطلاق بيومين',
    titleEn: 'Situation 1: Sudden Feature Request 2 Days Before Launch',
    situationAr: 'مديرك يطلب في محادثة سريعة إضافة داشبورد جديدة للعملاء في الشوط الحالي المكتمل بالفعل.',
    situationEn: 'Your VP asks to squeeze in a new analytics widget right before launch, but capacity is full.',
    options: [
      {
        level: 'b1',
        levelLabelAr: 'تأسيسي مباشر (B1)',
        textEn:
          'Our team is already busy with the payment feature. If we add this now, we might delay the release. Can we do it next week?',
        textAr:
          'فريقنا مشغول بالفعل بميزة الدفع. إذا أضفنا هذا الآن، قد نتأخر في الإطلاق. هل يمكننا عمله الأسبوع القادم؟',
        explanationAr: 'لغة بسيطة ومباشرة جداً ومفهومة للجميع، مناسبة للمستوى التأسيسي.',
      },
      {
        level: 'b2',
        levelLabelAr: 'ممارس تقني (B2)',
        textEn:
          "Our sprint capacity is 100% committed to the Payment Gateway. To protect our launch date, let's prioritize this in the upcoming sprint planning.",
        textAr:
          'طاقتنا الاستيعابية مكرسة بالكامل لبوابة الدفع. لحماية موعد الإطلاق، دعنا نعطي هذا الأولوية في تخطيط الشوط القادم.',
        explanationAr: 'لغة أجايل عملية ممتازة توضح السعة وتضع المهمة في مسارها المنطقي.',
      },
      {
        level: 'c1',
        levelLabelAr: 'تنفيذي استراتيجي (C1)',
        textEn:
          'I understand the strategic urgency for the investor demo. Since our bandwidth is locked on Payments, are you open to swapping Payments out, or should we prepare an interactive click-through for Friday?',
        textAr:
          'أتفهم تماماً الأهمية الاستراتيجية للعرض. بما أن طاقتنا محجوزة للمدفوعات، هل يناسبك إجراء هذه المقايضة، أم نعد نموذجاً تفاعلياً ليوم الجمعة؟',
        explanationAr: 'دبلوماسية تنفيذية عالية المستوى تعترف بالقيمة الاستراتيجية وتطرح بدائل فوز-فوز.',
      },
    ],
  },
  {
    id: 2,
    titleAr: 'الموقف 2: عائق يعطل فريقك بسبب تأخر فريق آخر في تسليم الـ API',
    titleEn: 'Situation 2: Cross-Team Blocker Escalation on Slack',
    situationAr: 'أنت بانتظار واجهة برمجة من فريق آخر منذ أسبوع، وتود تنبيههم والتصعيد بلباقة في سلاك.',
    situationEn: 'You are waiting on an API from another team, and development is blocked.',
    options: [
      {
        level: 'b1',
        levelLabelAr: 'تأسيسي مباشر (B1)',
        textEn: 'Hi, we are blocked on the search API. Please let us know when it will be ready so we can continue.',
        textAr: 'مرحباً، نحن معطلون بسبب واجهة البحث. يرجى إعلامنا متى ستكون جاهزة لنتمكن من المتابعة.',
        explanationAr: 'واضحة وخالية من التعقيد، تطلب الإفادة بلباقة.',
      },
      {
        level: 'b2',
        levelLabelAr: 'ممارس تقني (B2)',
        textEn:
          'Hi team, quick update: our sprint progress is paused waiting on the search endpoint. Could you provide a target ETA today so we can plan accordingly?',
        textAr: 'مرحباً، تحديث سريع: تقدمنا متوقف بانتظار واجهة البحث. هل يمكنكم تزويدنا بموعد متوقع اليوم لترتيب خطتنا؟',
        explanationAr: 'تواصل مهني محدد يركز على الـ ETA دون انفعال.',
      },
      {
        level: 'c1',
        levelLabelAr: 'تنفيذي استراتيجي (C1)',
        textEn:
          "Quick blocker flag: Search UI is blocked on the Data API contract. To decouple delivery, we're mocking responses today—can we sync for 10 minutes to lock in a firm integration ETA?",
        textAr:
          'إشارة عائق سريع: واجهة البحث معطلة بانتظار العقد البرمجي. لفك الارتباط، نقوم بمحاكاة الردود اليوم—هل يمكننا المزامنة لـ 10 دقائق لتثبيت موعد الربط النهائي؟',
        explanationAr: 'حل تقني وإداري متزامن (Decouple & Unblock) يظهر قيادة استباقية رفيعة.',
      },
    ],
  },
  {
    id: 3,
    titleAr: 'الموقف 3: اكتشاف ثغرة فنية قبل يوم واحد من الإطلاق الرسمي',
    titleEn: 'Situation 3: Announcing a 48-Hour Launch Delay to Stakeholders',
    situationAr: 'فريق الـ QA اكتشف خللاً تحت الضغط العالي يتطلب تأخير الإطلاق يومين لحمايته.',
    situationEn: 'A high-severity bug was found 24h before public release, requiring a 48h delay.',
    options: [
      {
        level: 'b1',
        levelLabelAr: 'تأسيسي مباشر (B1)',
        textEn:
          'We found a critical bug during testing today. To make sure the system works safely, we need to delay the launch by 2 days.',
        textAr: 'اكتشفنا خطأً حرجاً أثناء الاختبار اليوم. للتأكد من عمل النظام بأمان، نحتاج لتأخير الإطلاق يومين.',
        explanationAr: 'شرح بسيط ومقنع يركز على أمان النظام دون تهويل.',
      },
      {
        level: 'b2',
        levelLabelAr: 'ممارس تقني (B2)',
        textEn:
          'During final QA testing, we identified a critical performance issue under peak load. To protect data integrity, we are shifting our launch date to Thursday morning.',
        textAr:
          'أثناء الاختبار النهائي، حددنا مشكلة أداء حرجة تحت الضغط. لحماية سلامة البيانات، نقوم بترحيل موعد الإطلاق إلى صباح الخميس.',
        explanationAr: 'صياغة مهنية تبرر التأخير بحماية البيانات وتحدد موعداً جديداً بوضوح.',
      },
      {
        level: 'c1',
        levelLabelAr: 'تنفيذي استراتيجي (C1)',
        textEn:
          'Our automated load suites caught a high-severity concurrency edge case under peak traffic. To safeguard transactional integrity, we are activating a 48-hour stabilization protocol with updates every 6 hours.',
        textAr:
          'التقطت حزم الاختبار الآلية حالة تسابق حرجة تحت الضغط العالي. حفاظاً على سلامة العمليات وثقة العملاء، قمنا بتفعيل نافذة تثبيت لمدة 48 ساعة مع تقرير موجز كل 6 ساعات.',
        explanationAr: 'صياغة أزمات عالمية من طراز شركات وادي السيليكون تصوغ التأخير كإجراء أمان احترافي يبعث على الفخر.',
      },
    ],
  },
];

const MEETING_SCENARIOS: MeetingScenario[] = [
  {
    id: 'scope_creep_ambush',
    category: 'scope',
    badgeAr: 'حماية النطاق',
    badgeEn: 'Scope Defense',
    titleAr: 'كمين زحف النطاق المفاجئ قبل العرض التجريبي',
    titleEn: 'Mid-Sprint Scope Creep from C-Level',
    contextAr:
      'المدير التنفيذي يطلب في محادثة سريعة إضافة داشبورد ذكاء اصطناعي قبل يوم الجمعة لتقديمها للمستثمرين، والنسخة الحالية ملتزمة بإطلاق بوابة الدفع.',
    contextEn:
      'The VP asks to slip in an AI Analytics Dashboard before Friday demo, while the sprint is fully committed to Payment Gateway.',
    stakeholderSpeaker: 'VP of Product / Stakeholder',
    stakeholderPromptEn:
      'Hey! The investors are super keen on seeing our AI dashboard on Friday. It is just a simple summary widget—can we quickly squeeze it into this sprint?',
    stakeholderPromptAr:
      'مرحباً! المستثمرون مهتمون للغاية برؤية لوحة تحكم الذكاء الاصطناعي يوم الجمعة. هي مجرد بطاقة ملخصة بسيطة، هل يمكننا حشرها سريعاً في هذا الشوط؟',
    simplifiedAnswerEn:
      'I understand the demo is important. But our sprint is full on the payment feature. If we add the AI dashboard, payments will be delayed. Can we prepare a Figma click-through for Friday instead?',
    simplifiedAnswerAr:
      'أتفهم أهمية العرض التجريبي. لكن شوطنا ممتلئ بميزة الدفع. إذا أضفنا بطاقة الذكاء الاصطناعي سيتأخر الدفع. هل يمكننا إعداد نموذج Figma تفاعلي ليوم الجمعة بدلاً من ذلك؟',
    options: [
      {
        id: 'weak',
        type: 'weak',
        labelAr: 'رد ضعيف ومرتبك (Weak / Reactive)',
        labelEn: 'Weak / Reactive Compromise',
        textEn:
          'Um, sure, I guess we can ask the engineers to work over the weekend and try our best to squeeze it in.',
        textAr:
          'امم، حسناً، أظن أنه يمكننا أن نطلب من المهندسين العمل في عطلة نهاية الأسبوع ونحاول حشرها.',
        whyResultAr:
          '❌ يدمّر التزام الشوط، يرهق الفريق، ويؤسس لعادة سيئة بأن مواعيد الإطلاق قابلة للخرق بلا ثمن.',
        whyResultEn:
          '❌ Destroys sprint integrity, invites burnout, and sets a dangerous precedent of free scope additions.',
        executiveTacticAr: 'لا تقدم وعوداً غير مدروسة على حساب صحة الفريق.',
        executiveTacticEn: 'Never sacrifice sprint stability without explicit trade-off alignment.',
      },
      {
        id: 'aggressive',
        type: 'aggressive',
        labelAr: 'رد دفاعي حاد (Aggressive / Confrontational)',
        labelEn: 'Aggressive Rejection',
        textEn: 'No, the sprint is completely locked. You should have requested this during sprint planning last week.',
        textAr: 'لا، الشوط مغلق تماماً. كان ينبغي عليك طلب هذا أثناء التخطيط الأسبوع الماضي.',
        whyResultAr:
          '⚠️ يحرق الجسور الدبلوماسية مع الإدارة ويجعلك تبدو كعقبة بيروقراطية جامدة بدلاً من شريك عمل ذكي.',
        whyResultEn:
          '⚠️ Burns bridges with executive leadership and makes PM appear like a bureaucratic roadblock rather than a strategic partner.',
        executiveTacticAr: 'افصل بين رفض الطلب واحترام الدافع التجاري خلفه.',
        executiveTacticEn: 'Validate commercial intent while firmly holding operational boundaries.',
      },
      {
        id: 'executive',
        type: 'executive',
        labelAr: 'المعيار الذهبي الدبلوماسي (Executive Gold Standard)',
        labelEn: 'Executive Trade-off & Deflection',
        textEn:
          'I completely understand the strategic leverage for the investor demo. However, our sprint capacity is at 100% focused on the Payment Gateway. Committing to the AI widget right now directly pushes Payments to next cycle. Are you comfortable swapping Payments out, or should we prepare an interactive Figma click-through for Friday so we keep both tracks winning?',
        textAr:
          'أتفهم تماماً الأهمية الاستراتيجية للعرض أمام المستثمرين. ومع ذلك، طاقتنا الاستيعابية للشوط الحالي عند 100% ومكرسة لبوابة الدفع. الالتزام ببطاقة الذكاء الاصطناعي الآن سيرحل بوابة الدفع للدورة القادمة. هل يناسبك إجراء هذه المقايضة، أم نعد نموذج Figma تفاعلياً ليوم الجمعة لنحمي مسار الإنتاج ونلبي حاجة العرض معاً؟',
        whyResultAr:
          '✅ يظهر ذكاءً إدارياً فائقاً: يعترف بالقيمة التجارية، يوضح مقايضة السعة بالأدلة، ويطرح بديلاً ذكياً فوز-فوز.',
        whyResultEn:
          '✅ Masterful executive composure: Validates commercial value, quantifies capacity constraints, enforces realistic trade-offs, and offers a high-impact alternative.',
        executiveTacticAr: 'حوّل الرفض إلى خيار مقايضة واعٍ بيد أصحاب المصلحة (Trade-off Framing).',
        executiveTacticEn: 'Frame boundaries as transparent business trade-offs rather than stubborn resistance.',
      },
    ],
  },
  {
    id: 'critical_release_delay',
    category: 'deadlines',
    badgeAr: 'إدارة الأزمات',
    badgeEn: 'Crisis Management',
    titleAr: 'إعلان تأخير إطلاق حرج قبل 24 ساعة بسبب ثغرة فنية',
    titleEn: 'Delivering Bad News: 48-Hour Launch Postponement',
    contextAr:
      'قبل يوم واحد من الإطلاق الرسمي الموعود للعملاء، اكتشف فريق الـ QA خللاً في تزامن البيانات تحت الضغط العالي يتطلب 48 ساعة تثبيت.',
    contextEn: 'QA discovered a concurrency edge-case under load 24 hours before public release.',
    stakeholderSpeaker: 'Engineering Director / VP Tech',
    stakeholderPromptEn:
      'We just reproduced a race condition in the checkout microservice. If we launch tomorrow, 2% of transactions could duplicate. We cannot ship this.',
    stakeholderPromptAr:
      'لقد قمنا للتو بإعادة إنتاج حالة تسابق في خدمة الدفع. إذا أطلقنا غداً، قد تتكرر 2% من المعاملات. لا يمكننا الشحن.',
    simplifiedAnswerEn:
      'We found a critical issue in checkout testing today. To make sure customer payments are safe, we are pausing launch for 48 hours. Our new target is Tuesday morning, and I will share updates every 6 hours.',
    simplifiedAnswerAr:
      'وجدنا مشكلة حرجة في اختبار الدفع اليوم. للتأكد من أمان مدفوعات العملاء، نوقف الإطلاق مؤقتاً لـ 48 ساعة. موعدنا الجديد صباح الثلاثاء، وسأشارك تحديثات كل 6 ساعات.',
    options: [
      {
        id: 'weak',
        type: 'weak',
        labelAr: 'رد ضعيف واعتذاري مفرط (Apologetic & Blaming)',
        labelEn: 'Apologetic & Finger-Pointing',
        textEn:
          'I am so sorry, the backend developers missed this and now everything is ruined. We will have to cancel the launch indefinitely.',
        textAr:
          'أنا آسف جداً، مطورو الواجهة الخلفية غفلوا عن هذا والآن كل شيء تدمر. سنضطر لإلغاء الإطلاق لأجل غير مسمى.',
        whyResultAr: '❌ يلقي اللوم على الزملاء، يثير الذعر في المؤسسة، ويهدم الثقة في كفاءة إدارة المشروع.',
        whyResultEn:
          '❌ Points fingers at colleagues, creates organizational panic, and shatters credibility in project governance.',
        executiveTacticAr: 'القيادة التنفيذية تتحمل مسؤولية المنظومة برباطة جأش.',
        executiveTacticEn: 'True leaders own systemic outcomes without deflection or panic.',
      },
      {
        id: 'aggressive',
        type: 'aggressive',
        labelAr: 'رد متسرع بالمجازفة (Risky Gambler)',
        labelEn: 'Reckless Rollout',
        textEn: "2% is acceptable. Let's just ship on schedule and patch it silently in production over the weekend.",
        textAr: '2% نسبة مقبولة. دعونا نشحن في الموعد ونرقعها سراً في بيئة الإنتاج خلال العطلة.',
        whyResultAr: '⚠️ مقامرة انتحارية بسمعة المنتج وحسابات العملاء، تؤدي لفقدان الوظيفة والمسؤولية القانونية.',
        whyResultEn: '⚠️ Suicide mission gambling with user trust and financial integrity. Unforgivable negligence.',
        executiveTacticAr: 'أمان البيانات ومصداقية العلامة التجارية خط أحمر.',
        executiveTacticEn: 'Never trade data integrity and customer trust for cosmetic calendar deadlines.',
      },
      {
        id: 'executive',
        type: 'executive',
        labelAr: 'المعيار الذهبي الدبلوماسي (Executive Gold Standard)',
        labelEn: 'Resilient Stabilization Protocol',
        textEn:
          'During our final load stress-testing, our automated suites caught a high-severity concurrency edge case that would corrupt checkout state under peak traffic. To safeguard financial integrity and user trust, we are activating a 48-hour stabilization window. Our revised deployment target is Tuesday at 9:00 AM. I have established a war-room cadence and will publish an operational progress memo every 6 hours until greenlight.',
        textAr:
          'أثناء اختبارات التحمل النهائية، التقطت حزم الاختبار الآلية حالة تسابق حرجة قد تتسبب في تضارب المعاملات تحت الضغط العالي. حفاظاً على سلامة العمليات وثقة العملاء، قمنا بتفعيل نافذة تثبيت لمدة 48 ساعة. الموعد المحدث للإطلاق هو الثلاثاء التاسعة صباحاً. قمت بتشكيل غرفة عمليات وسأصدر تقريراً موجزاً كل 6 ساعات حتى اكتمال الضوء الأخضر.',
        whyResultAr:
          '✅ يصوغ التأخير كإجراء أمان احترافي استباقي يبعث على الفخر، يحدد موعداً جديداً بدقة، ويؤسس لنظام تحديث دوري يزيل القلق.',
        whyResultEn:
          '✅ Frames postponement as rigorous quality stewardship, commits to an exact revision timetable, and establishes transparent updates.',
        executiveTacticAr: 'صغ التأخير دائماً كإجراء حماية لقيمة المنشأة (Risk Mitigation Framing).',
        executiveTacticEn: 'Frame technical delays as proactive risk mitigation and brand defense.',
      },
    ],
  },
  {
    id: 'blocker_cross_team',
    category: 'dependencies',
    badgeAr: 'فك الارتباطات',
    badgeEn: 'Dependency Alignment',
    titleAr: 'تصعيد مهذب لحل ارتباط معطل مع فريق خارجي',
    titleEn: 'Cross-Functional Blocker Escalation',
    contextAr:
      'فريق الـ Data Platform تأخر أسبوعين عن تسليم الـ API المشترطة لإنهاء ميزة البحث، وفريقك أصبح عاطلاً عن التقدم.',
    contextEn: 'Core Data team is 2 weeks late on the search API endpoint, idling your frontend developers.',
    stakeholderSpeaker: 'Lead Engineer / Team Rep',
    stakeholderPromptEn:
      'We cannot proceed with the search filters. We have been waiting on the Data Platform API for 14 days and our sprint is grinding to a halt.',
    stakeholderPromptAr:
      'لا يمكننا الاستمرار في فلاتر البحث. نحن ننتظر واجهة برمجة تطبيقات فريق البيانات منذ 14 يوماً والشوط يتوقف تماماً.',
    simplifiedAnswerEn:
      "We are blocked on the Data API. Today, we will mock the responses so our frontend can keep coding without waiting. Meanwhile, I will meet their lead today to get a firm delivery date.",
    simplifiedAnswerAr:
      'نحن معطلون بسبب واجهة البيانات. اليوم، سنقوم بمحاكاة الردود لكي يواصل المطورون العمل دون انتظار. وفي الوقت ذاته، سأجتمع مع قائدهم اليوم لتحديد موعد تسليم نهائي.',
    options: [
      {
        id: 'weak',
        type: 'weak',
        labelAr: 'رد سلبي متفرج (Passive Bystander)',
        labelEn: 'Passive Wait-and-See',
        textEn:
          "Well, there's nothing we can do until they reply to our Slack messages. Just find something else to work on.",
        textAr: 'حسناً، لا يمكننا فعل شيء حتى يردوا على رسائلنا في سلاك. ابحثوا عن أي شيء آخر للعمل عليه.',
        whyResultAr: '❌ تخلي صريح عن دور مدير المشروع في فتح الممرات وتفكيك العوائق (Clearing the Runway).',
        whyResultEn: '❌ Total failure of PM ownership. Leaves team adrift and wastes costly sprint engineering hours.',
        executiveTacticAr: 'دور الـ PM الحقيقي هو فتح الطريق أمام الفريق.',
        executiveTacticEn: 'A PM is fundamentally an unblocker and runway clearer.',
      },
      {
        id: 'aggressive',
        type: 'aggressive',
        labelAr: 'تصعيد عدائي في القنوات العامة (Public Shaming)',
        labelEn: 'Public Channel Shaming',
        textEn: '@channel Data Platform team is completely blocking our release and ignoring commitments. This is unacceptable.',
        textAr: '@channel فريق منصة البيانات يعطل إطلاقنا تماماً ويتجاهل التزاماته. هذا غير مقبول.',
        whyResultAr: '⚠️ يخلق عداوات بين الفرق ويعطل التعاون المستقبلي ويظهر عدم نضج في قنوات التواصل.',
        whyResultEn:
          '⚠️ Creates cross-department toxicity, provokes defensive hostility, and signals amateurish communication.',
        executiveTacticAr: 'احرص على التصعيد الهيكلي الهادئ بدلاً من التشهير العلني.',
        executiveTacticEn: 'Use structured escalation ladders instead of public public-channel outbursts.',
      },
      {
        id: 'executive',
        type: 'executive',
        labelAr: 'المعيار الذهبي الدبلوماسي (Executive Gold Standard)',
        labelEn: 'Decoupled Mocking & Rapid Alignment',
        textEn:
          "We’ve hit a hard dependency on the Search API from the Data Platform team, which puts our sprint velocity at risk. I’m doing two things immediately: First, I’m aligning with their tech lead on a frozen contract schema so our frontend can mock responses and unblock UI delivery today. Second, I am setting up a 10-minute sync with their PM to lock in a firm integration ETA or escalate resource allocation if they are constrained.",
        textAr:
          'لقد اصطدمنا بارتباط حرج مع واجهة البحث الخاصة بفريق البيانات، مما يهدد سرعة إنجاز الشوط. سأتخذ خطوتين فوريتين: أولاً، الاتفاق مع قائدهم التقني على تجميد مخطط البيانات (Frozen Contract Schema) لكي يحاكي مطورو الواجهة الردود ويبدأوا العمل اليوم دون انتظار. ثانياً، عقد وقفة سريعة لـ 10 دقائق مع مدير مشروعهم لحسم موعد الربط النهائي أو تصعيد الدعم إن كانت لديهم ضغوط سعة.',
        whyResultAr:
          '✅ حل عملي يفك الارتباط فوراً عبر الـ Mocking، ويتحرك بمسار موازٍ لحل المشكلة الهيكلية بدبلوماسية وحسم.',
        whyResultEn:
          '✅ Masterful two-pronged tactic: Unblocks engineers via contract mocking while resolving systemic dependency with diplomatic urgency.',
        executiveTacticAr: 'فكك الاعتماديات تقنياً أثناء تفاوضك الإداري (Decouple & Unblock).',
        executiveTacticEn: 'Technically decouple delivery paths while pursuing managerial resolution.',
      },
    ],
  },
  {
    id: 'pushback_unrealistic_deadline',
    category: 'deadlines',
    badgeAr: 'التفاوض الزمني',
    badgeEn: 'Timeline Negotiation',
    titleAr: 'الرفض الدبلوماسي لتقدير زمني غير واقعي من الإدارة العليا',
    titleEn: 'Pushing Back on Arbitrary Deadlines',
    contextAr: 'الرئيس التنفيذي يريد شحن ميزة نظام الاشتراكات المعقد بالكامل خلال 10 أيام بدلاً من 4 أسابيع.',
    contextEn: 'Leadership imposes a 10-day deadline on an enterprise billing migration requiring 4 weeks.',
    stakeholderSpeaker: 'Chief Executive Officer (CEO)',
    stakeholderPromptEn:
      'We promised the board we will go live with the new subscriptions system in 10 days flat. Make it happen.',
    stakeholderPromptAr:
      'لقد وعدنا مجلس الإدارة بأننا سنطلق نظام الاشتراكات الجديد خلال 10 أيام تماماً. اجعلوا ذلك يحدث.',
    simplifiedAnswerEn:
      "To meet the 10-day goal safely, we can launch a solid MVP covering the main 80% of subscriptions first. Then we ship the rest in the next cycle. This gives the board their announcement without risking billing bugs.",
    simplifiedAnswerAr:
      'لتحقيق هدف الـ 10 أيام بأمان، يمكننا إطلاق نسخة MVP متقنة تغطي 80% من الاشتراكات الرئيسية أولاً. ثم نشحن الباقي في الدورة التالية. هذا يمنح مجلس الإدارة إعلانه دون المخاطرة بأخطاء الفواتير.',
    options: [
      {
        id: 'weak',
        type: 'weak',
        labelAr: 'موافقة مذعنة كارثية (Yes-Man Compliance)',
        labelEn: 'Yes-Man Compliance',
        textEn: 'Understood, we will tell the team to cancel leaves and push through.',
        textAr: 'مفهوم، سنطلب من الفريق إلغاء الإجازات ومواصلة الضغط.',
        whyResultAr: '❌ ضمانة أكيدة لإطلاق نظام مالي مليء بالثغرات واستقالة خيرة المهندسين.',
        whyResultEn: '❌ Guarantees defective billing glitches, user churn, and engineering resignation.',
        executiveTacticAr: 'قول "نعم" للمستحيل ليس شجاعة، بل إهمال مهني.',
        executiveTacticEn: 'Blind compliance to arbitrary timelines is engineering malpractice.',
      },
      {
        id: 'aggressive',
        type: 'aggressive',
        labelAr: 'رفض حاد مجرد (Outright Dismissal)',
        labelEn: 'Blunt Rejection',
        textEn: 'That is completely impossible and detached from technical reality.',
        textAr: 'هذا مستحيل تماماً ومنفصل عن الواقع التقني.',
        whyResultAr: '⚠️ إحراج للقيادة أمام نفسها دون تقديم بديل يخدم التزامهم أمام مجلس الإدارة.',
        whyResultEn: '⚠️ Antagonizes top leadership without giving them ammo to defend commitments to the board.',
        executiveTacticAr: 'لا تقل "لا" وحدها؛ قل "نعم، إذا..." أو "إليك الخيارات الممكنة".',
        executiveTacticEn: 'Replace blunt "No" with conditional scoping options.',
      },
      {
        id: 'executive',
        type: 'executive',
        labelAr: 'المعيار الذهبي الدبلوماسي (Executive Gold Standard)',
        labelEn: 'Phased MVP Phasing with Risk Transparency',
        textEn:
          "To honor the board commitment without risking transactional failures in billing, we can execute a phased rollout. In 10 days, we can deliver a hardened MVP covering the top 80% subscription tier with manual fallback for edge-cases. This gives the board their live announcement while protecting revenue integrity. We will then ship the remaining 20% automation over the subsequent sprint. Let's look at the scope cut together to approve the Phase 1 cutline.",
        textAr:
          'للوفاء بالتزام مجلس الإدارة دون المخاطرة بفشل العمليات المالية في الفواتير، يمكننا تنفيذ إطلاق مرحلي ذكي. خلال 10 أيام، نستطيع تسليم نسخة MVP محكمة تغطي 80% من باقات الاشتراكات الأكثر طلباً مع توفير مسار يدوي استثنائي للحالات الخاصة. هذا يمنح المجلس إعلانه المباشر مع صيانة إيرادات الشركة، ثم نشحن أتمتة الـ 20% المتبقية في الشوط التالي مباشرة. دعنا نراجع خط القطع (Cutline) معاً لاعتماده.',
        whyResultAr:
          '✅ حل استراتيجي عبقري: يحقق هدف الإعلان الرسمي أمام مجلس الإدارة، يقلل النطاق إلى 80% الأكثر أماناً، ويحمي الفريق من الفوضى.',
        whyResultEn:
          '✅ Brilliant strategic framing: Delivers the executive win to the board, trims scope to high-confidence 80%, and insulates financial rails.',
        executiveTacticAr: 'استخدم تكتيك خط القطع المرحلي (Phase 1 Cutline).',
        executiveTacticEn: 'Use the Phase 1 Cutline tactic to protect core value while preserving deadlines.',
      },
    ],
  },
];

const EXECUTIVE_TEMPLATES: ExecutiveTemplate[] = [
  {
    id: 'sprint_kickoff_memo',
    category: 'sprint',
    categoryLabelAr: 'إدارة الأشواط',
    categoryLabelEn: 'Sprint Leadership',
    titleAr: 'بيان انطلاق الشوط وتحديد هدف النجم القطبي (North Star)',
    titleEn: 'Sprint Kickoff & North Star Alignment Memo',
    subjectLine: '🚀 Sprint [Number] Kickoff: [Goal / Theme]',
    templateEn: `Team,

Welcome to Sprint [Number]! Our single North Star commitment for the next [10/14] days is:
🎯 **[Primary Sprint Objective - e.g., Shipping Stripe Billing Migration]**

**Why this matters:**
This sprint directly moves the needle on [Key Business Metric - e.g., Q3 MRR & Churn Reduction].

**Committed Workload:**
- Total Story Points / Estimate: [Number] pts (~[Number] hrs)
- High-Leverage Milestones: [1. Feature A, 2. Endpoint B, 3. E2E Tests]
- Explicitly Out of Scope: [De-scoped items deferred to next cycle]

**Runway & Escalation:**
If you hit any blocker exceeding 60 minutes, do not idle—flag it immediately in our #standup channel.

Let's maintain high velocity and clean craft!`,
    templateAr: `فريق العمل الرائع،

أهلاً بكم في الشوط رقم [رقم الشوط]! هدفنا المحوري الأوحد (North Star) للأيام القادمة هو:
🎯 **[الهدف الرئيسي - مثلاً: شحن وتفعيل نظام الاشتراكات الجديد]**

**لماذا يعتبر هذا مهماً الآن؟**
هذا الشوط يحرك المؤشر مباشرة في [المقياس الاستراتيجي - مثلاً: خفض معدل الإلغاء وزيادة العائد الشهري].

**خطة العمل المعتمدة:**
- إجمالي نقاط الشوط: [النقاط] نقطة (~ [الساعات] ساعة).
- المعالم المحورية: [1. الميزة الأولى، 2. واجهة البيانات، 3. الاختبارات الشاملة].
- خارج نطاق هذا الشوط صراحة: [المهام المؤجلة للدورة القادمة].

**فك العوائق:**
إذا واجهت أي عائق يستغرق أكثر من 60 دقيقة، لا تنتظر—ارفعه فوراً في قناة الوقفة اليومية.

دعونا نحافظ على وتيرة شحن قوية وإتقان عالٍ!`,
    tipsAr: 'ركز على هدف محوري واحد فقط واضح للفريق لمنع تشتت الجهود بين 10 أولويات متنافسة.',
    tipsEn: 'Anchor the sprint around a single North Star goal so the team knows what to defend.',
  },
  {
    id: 'diplomatic_scope_pushback',
    category: 'boundary',
    categoryLabelAr: 'حماية النطاق',
    categoryLabelEn: 'Boundary Defense',
    titleAr: 'رسالة صد زحف النطاق بلباقة واقتراح مقايضة واعية',
    titleEn: 'Diplomatic Scope Pushback & Capacity Trade-off',
    subjectLine: 'Re: Request regarding [Feature / Item Name]',
    templateEn: `Hi [Stakeholder Name],

Thanks for bringing up [Feature/Request Name]—I completely see the commercial upside and strategic intent behind it.

Looking at our current sprint commitment, our engineering bandwidth is operating at full capacity to ship [Current P0 Deliverable] by [Target Date].

Because we protect our delivery commitments, we cannot absorb this without a direct trade-off. We have two viable paths forward:
1. **Option A (Swap):** Deprioritize [Existing Feature X] to create immediate runway for [New Request].
2. **Option B (Batch):** Groom this for our upcoming Sprint [Number] planning so it receives thorough architectural refinement.

Which of these alignments best fits your overarching roadmap priority?`,
    templateAr: `مرحباً [اسم صاحب المصلحة]،

شكراً لطرحك لمقترح [اسم الميزة المطلوبة]—أتفهم تماماً الأثر الإيجابي والدافع الاستراتيجي خلفه.

بالنظر إلى التزامات شوطنا الحالي، فإن سعتنا الهندسية تعمل بكامل طاقتها لشحن [المهمة الحالية ذات الأولوية القصوى P0] في موعدها المحدد [تاريخ الاستحقاق].

وحفاظاً على مصداقية مواعيدنا وجودة الشحن، لا يمكننا استيعاب هذا الطلب دون مقايضة صريحة. أمامنا مساران عمليان:
1. **الخيار (أ) - الاستبدال:** تأجيل [الميزة الحالية X] لتوفير سعة هندسية فورية لـ [الطلب الجديد].
2. **الخيار (ب) - الجدولة:** إدراج الطلب في جلسة تنقيح الشوط القادم [رقم الشوط] ليأخذ حقه من التصميم المعماري الدقيق.

أي هذين الخيارين يخدم أولوياتك الاستراتيجية بشكل أفضل؟`,
    tipsAr: 'لا ترفض بشكل قاطع؛ ضع كرة القرار في ملعبه عبر مقايضة صريحة (Trade-off).',
    tipsEn: 'Transform resistance into stakeholder agency by presenting transparent trade-offs.',
  },
  {
    id: 'maker_focus_shield',
    category: 'focus',
    categoryLabelAr: 'حماية وقت الصنع',
    categoryLabelEn: 'Maker Time Defense',
    titleAr: 'إشعار حماية ساعات التركيز العميق في سلاك / التقويم',
    titleEn: 'Deep Work Focus Shield & Asynchronous Gate',
    templateEn: `🛡️ **[Focus Mode / Deep Work Window]**
I am heads-down in Maker Mode until [Time - e.g. 1:00 PM] working on [Deliverable / Spec / Architecture].

- **For non-urgent topics:** Please drop a note here; I will triage and respond during my Manager Sync window at [Time].
- **For P0 production incidents:** Please tag me with [URGENT] or call directly.

Thanks for protecting engineering focus! 🚀`,
    templateAr: `🛡️ **[وضع التركيز العميق / وقت الصنع]**
أنا في حالة تركيز وانغماس كامل حتى الساعة [الوقت - مثلاً 1:00 ظهراً] لإنجاز [المهمة المعمارية / مواصفات المنتج].

- **للموضوعات غير العاجلة:** يرجى ترك رسالتك هنا؛ سأقوم بفرزها والرد عليها خلال نافذة المزامنة والتنسيق في تمام [الوقت].
- **لحوادث الإنتاج والأنظمة الحرجة (P0):** يرجى الإشارة لي بـ [URGENT] أو الاتصال المباشر.

شكراً لدعمكم وحمايتكم لتركيز الفريق الهندسي! 🚀`,
    tipsAr: 'ضع هذه الرسالة كحالة في Slack أو في دعوة التقويم لتقليل مقاطعات الزملاء بنسبة 80%.',
    tipsEn: 'Set this as your Slack status to establish clear expectations for async communication.',
  },
  {
    id: 'blocker_escalation_memo',
    category: 'escalation',
    categoryLabelAr: 'تصعيد العوائق',
    categoryLabelEn: 'Blocker Escalation',
    titleAr: 'مذكرة تصعيد فوري لعائق خارجي يعطل الشوط',
    titleEn: 'Urgent Blocker Escalation & Impact Statement',
    subjectLine: '🚨 ESCALATION: Sprint Blocker on [Dependency/Project Name]',
    templateEn: `Hi [Manager / Partner Lead Name],

Quick escalation: Our team has been fully blocked for [Number] days on [Dependency Name - e.g., Payments Sandbox Access] from [External Team / Vendor].

**Business Impact:**
- Sprint release target [Date] is at imminent risk.
- Currently, [Number] engineers are idling on this track.

**Action Required:**
Could you please help expedite this approval with [Name/Department] today, or greenlight our fallback plan to mock the endpoint?

Thanks for your prompt support,
[Your Name]`,
    templateAr: `مرحباً [اسم المدير / مسؤول الفريق الشريك]،

تصعيد عاجل: فريقنا معطل بالكامل منذ [عدد الأيام] أيام بسبب [اسم العائق - مثلاً: صلاحيات بيئة اختبار المدفوعات] من [اسم الفريق / المورد الخارجي].

**الأثر التشغيلي والتجاري:**
- موعد إطلاق الشوط المستهدف [التاريخ] معرض لخطر وشيك.
- حالياً، [عدد] مهندسين عاطلون عن التقدم في هذا المسار.

**الإجراء المطلوب:**
هل يمكنك المساعدة في تسريع الاعتماد مع [الاسم / القسم] اليوم، أو إعطاء الضوء الأخضر لتفعيل خطتنا البديلة بمحاكاة الواجهة (Mocking)؟

شاكر لدعمك وتدخلك السريع،
[اسمك]`,
    tipsAr: 'اربط التصعيد دائماً بأثر مالي أو زمني محدد (Business Impact) ليتحرك المدير فوراً.',
    tipsEn: 'Quantify the blocker with team idle time and delivery risk to prompt immediate action.',
  },
];

const FLUENCY_DRILLS: FluencyDrill[] = [
  {
    id: 'tradeoff_hook',
    hookEn: "If we commit to X, what are we willing to de-prioritize?",
    hookAr: "إذا التزمنا بالخيار (أ)، فما الذي نحن مستعدون لتأجيل أولويته في المقابل؟",
    usageContextAr: "تُستخدم فور طرح أي فكرة جديدة عشوائية في الاجتماع لتحويل النقاش من الحماس غير المنضبط إلى عقلية المقايضات الواقعية.",
    usageContextEn: "Deploy immediately when an unplanned feature is suggested to enforce trade-off discipline.",
    exampleEn: "I love the idea of adding dark mode, but if we commit to that this week, what are we willing to de-prioritize from the checkout flow?",
    exampleAr: "أعجبتني فكرة الوضع الداكن، لكن إذا التزمنا بها هذا الأسبوع، فما الذي نحن مستعدون لتأجيل أولويته من مسار الدفع؟",
    drillCategory: 'tradeoff',
  },
  {
    id: 'help_me_understand',
    hookEn: "Help me understand the rationale behind...",
    hookAr: "ساعدني على فهم المنطق والدافع الكامن وراء...",
    usageContextAr: "البديل الدبلوماسي الذهبي لسؤال: (لماذا فعلت هذا؟). يزيل الدفاعية تماماً ويجعل الطرف الآخر يشرح أسبابه بهدوء واحترام.",
    usageContextEn: "Elite replacement for 'Why did you do that?'. Defuses defensiveness instantly.",
    exampleEn: "Help me understand the rationale behind choosing a custom websocket architecture over standard polling here?",
    exampleAr: "ساعدني على فهم المنطق وراء اختيار بنية Websockets مخصصة بدلاً من الـ Polling القياسي هنا؟",
    drillCategory: 'perspective',
  },
  {
    id: 'steelmanning_hook',
    hookEn: "Just to ensure full alignment, what I'm hearing is...",
    hookAr: "فقط للتأكد من التوافق التام، ما أسمعه منك هو أن...",
    usageContextAr: "تُستخدم لتلخيص وجهة نظر الطرف الآخر بأفضل طريقة ممكنة قبل أن تعرض وجهة نظرك المخالفة. تظهر إنصاتاً فائقاً.",
    usageContextEn: "Active listening anchor. Demonstrates deep understanding before presenting counter-arguments.",
    exampleEn: "Just to ensure full alignment, what I'm hearing is that the marketing team needs lead attribution more than raw performance this quarter. Is that accurate?",
    exampleAr: "فقط للتأكد من التوافق، ما أسمعه منك هو أن فريق التسويق بحاجة لتتبع العملاء أكثر من الأداء الخام هذا الربع، هل هذا دقيق؟",
    drillCategory: 'perspective',
  },
  {
    id: 'root_cause_hook',
    hookEn: "What core problem are we actually trying to solve here?",
    hookAr: "ما هي المشكلة الجذرية الحقيقية التي نحاول حلها هنا بالضبط؟",
    usageContextAr: "تُستخدم لإعادة الاجتماع إلى مساره الصحيح حين يغرق الفريق في مناقشة تفاصيل تافهة في الحل بدلاً من المشكلة الأصلية.",
    usageContextEn: "Re-anchors rambling discussions back to first principles and core problem statements.",
    exampleEn: "Before we spend another hour comparing these two libraries, what core problem are we actually trying to solve for the end user?",
    exampleAr: "قبل أن نقضي ساعة أخرى في مقارنة هاتين المكتبتين، ما هي المشكلة الجذرية الحقيقية التي نحاول حلها للمستخدم النهائي؟",
    drillCategory: 'root_cause',
  },
  {
    id: 'timebox_hook',
    hookEn: "Let's timebox this discussion to 10 minutes, and if we don't have consensus, I'll make the final call.",
    hookAr: "دعونا نحدد سقفاً زمنياً لهذا النقاش بـ 10 دقائق، وإن لم نصل إلى إجماع فسأتخذ القرار النهائي.",
    usageContextAr: "تُستخدم لمنع الاجتماعات من التحول إلى جدل فلسفي بيزنطي لا ينتهي. تظهر حزماً قيادياً نبيلاً.",
    usageContextEn: "Asserts decisive leadership and stops circular debates in engineering syncs.",
    exampleEn: "We’ve debated this microservice split for 20 minutes. Let's timebox it to 5 more minutes, and if we don't reach consensus, we default to the monolith for Phase 1.",
    exampleAr: "تناقشنا حول تقسيم الخدمة لـ 20 دقيقة. دعونا نحدد 5 دقائق إضافية، وإن لم نصل لإجماع سنعتمد النظام الموحد للمرحلة الأولى.",
    drillCategory: 'boundary',
  },
  {
    id: 'disagree_and_commit',
    hookEn: "I have reservations about X, but I will fully back and commit to the team's decision.",
    hookAr: "لدي تحفظات على النقطة (X)، لكني سأدعم قرار الفريق بالكامل وألتزم بنجاحه.",
    usageContextAr: "مبدأ أمازون ووادي السيليكون الشهير (Disagree and Commit). يتيح لك إبداء تحفظك بأمانة دون أن تعطل الفريق.",
    usageContextEn: "The classic Silicon Valley principle. Voice principled dissent while fully backing execution.",
    exampleEn: "I still have reservations about using GraphQL for this public API, but I will disagree and commit to ensure our Friday milestone succeeds.",
    exampleAr: "ما زالت لدي تحفظات حول استخدام GraphQL لهذه الواجهة، لكني سأختلف وألتزم تماماً لإنجاح هدف يوم الجمعة.",
    drillCategory: 'tradeoff',
  },
];

export const ExecutiveEnglishStudioModal: React.FC<ExecutiveEnglishStudioModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<StudioTab>('simulator');

  // Personalization State
  const [userRole, setUserRole] = useState<UserJobRole>(() => {
    return (localStorage.getItem('midmar_english_role') as UserJobRole) || 'software_engineering';
  });

  const [userRegion, setUserRegion] = useState<UserWorkRegion>(() => {
    return (localStorage.getItem('midmar_english_region') as UserWorkRegion) || 'gulf_mena';
  });

  const [userLevel, setUserLevel] = useState<UserEnglishLevel>(() => {
    return (localStorage.getItem('midmar_english_level') as UserEnglishLevel) || 'b2';
  });

  const [isStudioIgnored, setIsStudioIgnored] = useState<boolean>(() => {
    return localStorage.getItem('midmar_english_studio_ignored') === 'true';
  });

  // Simulator State
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isPlayingSpeaker, setIsPlayingSpeaker] = useState(false);
  const [isPlayingModelAnswer, setIsPlayingModelAnswer] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [showSimplifiedAnswer, setShowSimplifiedAnswer] = useState(false);

  // Speech Practice State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [recordingScore, setRecordingScore] = useState<number | null>(null);

  // Drills State
  const [selectedDrillIndex, setSelectedDrillIndex] = useState(0);
  const [isPlayingDrill, setIsPlayingDrill] = useState(false);

  // Template Search / Filter
  const [templateFilter, setTemplateFilter] = useState<'all' | 'sprint' | 'boundary' | 'escalation' | 'focus'>('all');

  // Placement Test State
  const [placementAnswers, setPlacementAnswers] = useState<Record<number, UserEnglishLevel>>({});
  const [placementFinished, setPlacementFinished] = useState(false);

  const currentScenario = MEETING_SCENARIOS[selectedScenarioIndex];
  const currentDrill = FLUENCY_DRILLS[selectedDrillIndex];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean state when scenario changes
  useEffect(() => {
    setSelectedOptionId(null);
    setRecordedTranscript('');
    setRecordingScore(null);
    setIsRecording(false);
    setShowSimplifiedAnswer(userLevel === 'b1');
    speechService.stopListening();
  }, [selectedScenarioIndex, userLevel]);

  const handleSaveRole = (role: UserJobRole) => {
    soundSynth.playTactileClick();
    setUserRole(role);
    localStorage.setItem('midmar_english_role', role);
  };

  const handleSaveRegion = (region: UserWorkRegion) => {
    soundSynth.playTactileClick();
    setUserRegion(region);
    localStorage.setItem('midmar_english_region', region);
  };

  const handleSaveLevel = (level: UserEnglishLevel) => {
    soundSynth.playTactileClick();
    setUserLevel(level);
    localStorage.setItem('midmar_english_level', level);
    setShowSimplifiedAnswer(level === 'b1');
  };

  const handleToggleIgnoreStudio = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const next = !isStudioIgnored;
    setIsStudioIgnored(next);
    localStorage.setItem('midmar_english_studio_ignored', next ? 'true' : 'false');
    onRewardToast?.(
      next
        ? isAr
          ? 'تم تعيين القسم كـ (متجاهل / اختياري) لتفادي أي ضغط ✔'
          : 'Section marked as optional / ignored'
        : isAr
          ? 'تمت إعادة تفعيل القسم في خطتك اليومية بنجاح 🌟'
          : 'Section re-activated in your routine'
    );
  };

  // Play Speaker Prompt Audio
  const handlePlaySpeaker = () => {
    if (!currentScenario) return;
    soundSynth.playTactileClick();
    setIsPlayingSpeaker(true);
    speechService.speak(
      currentScenario.stakeholderPromptEn,
      'en-US',
      0.92,
      () => setIsPlayingSpeaker(false),
      () => setIsPlayingSpeaker(false)
    );
  };

  // Play Model Executive Answer Audio
  const handlePlayModelAnswer = (text: string) => {
    soundSynth.playTactileClick();
    setIsPlayingModelAnswer(true);
    speechService.speak(
      text,
      'en-US',
      0.9,
      () => setIsPlayingModelAnswer(false),
      () => setIsPlayingModelAnswer(false)
    );
  };

  // Play Fluency Drill Audio
  const handlePlayDrill = (text: string) => {
    soundSynth.playTactileClick();
    setIsPlayingDrill(true);
    speechService.speak(
      text,
      'en-US',
      0.9,
      () => setIsPlayingDrill(false),
      () => setIsPlayingDrill(false)
    );
  };

  // Select Option & Grade
  const handleSelectOption = (optId: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedOptionId(optId);

    const opt = currentScenario.options.find((o) => o.id === optId);
    if (opt?.type === 'executive') {
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
      if (onRewardToast) {
        onRewardToast(
          isAr
            ? '🌟 إجابة تنفيذية استثنائية من الطراز الأول! (+15 XP)'
            : '🌟 Elite Executive Response! Mastery unlocked! (+15 XP)'
        );
      }
    }
  };

  // Start Mic Voice Practice
  const handleToggleVoicePractice = (targetText: string) => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
      // Evaluate similarity score
      const cleanTarget = targetText.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const cleanRecorded = recordedTranscript.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const targetWords = cleanTarget.split(' ').filter(Boolean);
      const recordedWords = cleanRecorded.split(' ').filter(Boolean);

      let matches = 0;
      targetWords.forEach((tw) => {
        if (recordedWords.includes(tw)) matches++;
      });
      const score = Math.min(100, Math.round((matches / Math.max(1, targetWords.length)) * 100));
      setRecordingScore(score);

      if (score >= 60) {
        soundSynth.playCompletionChime();
        haptic.vibrateSprintCelebration();
      } else {
        haptic.vibrateLight();
      }
    } else {
      soundSynth.playTactileClick();
      setRecordedTranscript('');
      setRecordingScore(null);
      setIsRecording(true);
      speechService.setLang('en-US');
      speechService.startListening(
        (transcript, isFinal) => {
          setRecordedTranscript(transcript);
          if (isFinal) {
            setIsRecording(false);
          }
        },
        (err) => {
          console.warn('Voice test notice:', err);
          setIsRecording(false);
        }
      );
    }
  };

  // 1-Tap Copy
  const handleCopyText = (id: string, text: string) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    navigator.clipboard.writeText(text);
    setCopiedTemplateId(id);
    setTimeout(() => setCopiedTemplateId(null), 2500);

    if (onRewardToast) {
      onRewardToast(
        isAr ? '📋 تم النسخ للحافظة بنجاح!' : '📋 Copied to clipboard ready for Slack/Teams!'
      );
    }
  };

  // Placement Test Logic
  const handleSelectPlacementOption = (questionId: number, level: UserEnglishLevel) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    const updated = { ...placementAnswers, [questionId]: level };
    setPlacementAnswers(updated);

    if (Object.keys(updated).length === PLACEMENT_QUESTIONS.length) {
      // Calculate dominant level
      const counts: Record<UserEnglishLevel, number> = { b1: 0, b2: 0, c1: 0 };
      Object.values(updated).forEach((l) => counts[l]++);
      let recommended: UserEnglishLevel = 'b2';
      if (counts.c1 >= 2) recommended = 'c1';
      else if (counts.b1 >= 2) recommended = 'b1';

      handleSaveLevel(recommended);
      setPlacementFinished(true);
      soundSynth.playCompletionChime();
      haptic.vibrateSprintCelebration();
    }
  };

  const handleResetPlacement = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setPlacementAnswers({});
    setPlacementFinished(false);
  };

  const filteredTemplates = useMemo(() => {
    if (templateFilter === 'all') return EXECUTIVE_TEMPLATES;
    return EXECUTIVE_TEMPLATES.filter((t) => t.category === templateFilter);
  }, [templateFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />

      <div
        className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden font-sans"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800/80 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/40 dark:via-zinc-950 dark:to-purple-950/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-zinc-100 truncate">
                  {isAr ? 'أستوديو القيادة الإنجليزية ومحاكي الاجتماعات' : 'Executive English PM Studio'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 uppercase shrink-0">
                  Silicon Valley Ready
                </span>
                {isStudioIgnored && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                    {isAr ? 'مضبوط كاختياري / متجاهل' : 'Ignored in Routine'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                {isAr
                  ? 'تمكين لغوي إداري عالي المستوى لإدارة أصحاب المصلحة والمفاوضات التقنية بثقة'
                  : 'High-stakes meeting simulations, diplomatic scripts, and executive fluency'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher Navigation - Fixed with whitespace-nowrap and shrink-0 */}
        <div className="px-4 sm:px-6 pt-3 pb-2.5 border-b border-slate-200 dark:border-zinc-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 bg-slate-50/80 dark:bg-zinc-900/60">
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('simulator');
            }}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{isAr ? 'محاكي الاجتماعات' : 'Meeting Simulator'}</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'simulator'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {MEETING_SCENARIOS.length}
            </span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('templates');
            }}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{isAr ? 'رسائل سلاك والبريد' : 'Slack & Email'}</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'templates'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {EXECUTIVE_TEMPLATES.length}
            </span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('drills');
            }}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'drills'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{isAr ? 'مناورات الطلاقة' : 'Fluency Drills'}</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'drills'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {FLUENCY_DRILLS.length}
            </span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('placement');
            }}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'placement'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="whitespace-nowrap">{isAr ? 'تحديد المستوى والتشخيص' : 'Placement & Level'}</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'placement'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}
            >
              {userLevel.toUpperCase()}
            </span>
          </button>
        </div>

        {/* Personalization Quick Ribbon (Role, Region, Level & Ignore Section) */}
        <div className="px-4 sm:px-6 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Job Role Pill */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">{isAr ? 'المجال:' : 'Role:'}</span>
              <select
                value={userRole}
                onChange={(e) => handleSaveRole(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 dark:text-zinc-200 text-xs cursor-pointer focus:outline-none"
              >
                <option value="software_engineering">{isAr ? 'هندسة برمجيات وقيادة تقنية 💻' : 'Software & Tech Lead'}</option>
                <option value="product_management">{isAr ? 'إدارة المنتجات والمشاريع 🚀' : 'Product & Agile PM'}</option>
                <option value="ui_ux_design">{isAr ? 'تصميم UI/UX والمنتج 🎨' : 'UI/UX & Product Design'}</option>
                <option value="data_ai">{isAr ? 'بيانات وذكاء اصطناعي 🧠' : 'Data Science & AI'}</option>
                <option value="freelance_startups">{isAr ? 'عمل حر وشركات ناشئة 💼' : 'Freelance & Startups'}</option>
                <option value="marketing_sales">{isAr ? 'مبيعات وتطوير أعمال 📈' : 'Sales & Growth'}</option>
              </select>
            </div>

            {/* Work Region & Cultural Context */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">{isAr ? 'البيئة:' : 'Region:'}</span>
              <select
                value={userRegion}
                onChange={(e) => handleSaveRegion(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 dark:text-zinc-200 text-xs cursor-pointer focus:outline-none"
              >
                <option value="gulf_mena">{isAr ? 'شركات الخليج والشرق الأوسط 🌍' : 'MENA & GCC Hubs'}</option>
                <option value="us_silicon_valley">{isAr ? 'عن بعد مع شركات أمريكية 🇺🇸' : 'US Remote / Valley'}</option>
                <option value="eu_global">{isAr ? 'شركات أوروبية وعالمية 🇪🇺' : 'EU & Global Teams'}</option>
              </select>
            </div>

            {/* Level Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">{isAr ? 'المستوى:' : 'Level:'}</span>
              <select
                value={userLevel}
                onChange={(e) => handleSaveLevel(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 dark:text-zinc-200 text-xs cursor-pointer focus:outline-none"
              >
                <option value="b1">{isAr ? 'B1 • تأسيسي مباشر' : 'B1 • Foundational'}</option>
                <option value="b2">{isAr ? 'B2 • ممارس تقني' : 'B2 • Agile Practitioner'}</option>
                <option value="c1">{isAr ? 'C1 • تنفيذي قيادي' : 'C1 • Executive Leader'}</option>
              </select>
            </div>
          </div>

          {/* Quick Actions: Level Placement Quiz & Ignore / Mute Section */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                haptic.vibrateLight();
                setActiveTab('placement');
              }}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition-all active:scale-95"
            >
              <Compass className="w-3 h-3" />
              <span>{isAr ? 'اختبار تحديد المستوى 🎯' : 'Level Test 🎯'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleIgnoreStudio}
              title={isStudioIgnored ? 'إلغاء التجاهل وتفعيل القسم' : 'تجاهل هذا القسم من الخطة اليومية'}
              className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                isStudioIgnored
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-700'
              }`}
            >
              {isStudioIgnored ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{isStudioIgnored ? (isAr ? 'قسم متجاهل' : 'Ignored') : (isAr ? 'تجاهل القسم' : 'Ignore')}</span>
            </button>
          </div>
        </div>

        {/* Ignored Section Banner Notice */}
        {isStudioIgnored && (
          <div className="px-4 sm:px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {isAr
                  ? 'هذا القسم مضبوط حالياً كـ (متجاهل / اختياري) لتفادي أي ضغط، ولن يلزمك به في روتينك.'
                  : 'This section is marked as ignored/optional in your daily routine.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleIgnoreStudio}
              className="text-[11px] font-bold underline hover:text-amber-900 dark:hover:text-amber-200 cursor-pointer shrink-0"
            >
              {isAr ? 'إعادة التفعيل' : 'Re-enable'}
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: MEETING SIMULATOR */}
          {activeTab === 'simulator' && currentScenario && (
            <div className="space-y-6">
              {/* Regional Cultural Pro-Tip Callout Box */}
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2.5">
                <span className="text-lg shrink-0">{REGIONAL_CONTEXT_PROTIPS[userRegion].icon}</span>
                <div className="space-y-1">
                  <strong className="text-teal-800 dark:text-teal-300 font-bold block">
                    {isAr ? 'ملاحظة سياقية وثقافية لبيئتك:' : 'Regional & Cultural Context:'}{' '}
                    {REGIONAL_CONTEXT_PROTIPS[userRegion].nameAr} ({JOB_ROLE_LABELS[userRole].nameAr})
                  </strong>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {REGIONAL_CONTEXT_PROTIPS[userRegion].adviceAr}
                  </p>
                </div>
              </div>

              {/* Scenario Selector Carousel Bar */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-100/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <button
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setSelectedScenarioIndex((prev) =>
                      prev > 0 ? prev - 1 : MEETING_SCENARIOS.length - 1
                    );
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title="Previous Scenario"
                >
                  {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                </button>

                <div className="flex-1 text-center px-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    {isAr ? 'الموقف القيادي' : 'Scenario'} {selectedScenarioIndex + 1} / {MEETING_SCENARIOS.length} •{' '}
                    {isAr ? currentScenario.badgeAr : currentScenario.badgeEn}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 truncate">
                    {isAr ? currentScenario.titleAr : currentScenario.titleEn}
                  </h4>
                </div>

                <button
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setSelectedScenarioIndex((prev) =>
                      prev < MEETING_SCENARIOS.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title="Next Scenario"
                >
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Context Callout */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>{isAr ? 'سياق الأزمة والموقف:' : 'Scenario Context:'} </strong>
                  <span>{isAr ? currentScenario.contextAr : currentScenario.contextEn}</span>
                </div>
              </div>

              {/* Stakeholder Voice Bubble */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50/80 via-white to-orange-50/40 dark:from-rose-950/30 dark:via-zinc-900 dark:to-orange-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                      {currentScenario.stakeholderSpeaker}
                    </span>
                  </div>
                  <button
                    onClick={handlePlaySpeaker}
                    disabled={isPlayingSpeaker}
                    className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlayingSpeaker ? 'animate-bounce' : ''}`} />
                    <span>
                      {isPlayingSpeaker
                        ? isAr
                          ? 'جارٍ الاستماع...'
                          : 'Speaking...'
                        : isAr
                          ? 'استمع للموقف 🔊'
                          : 'Listen 🔊'}
                    </span>
                  </button>
                </div>

                <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-zinc-200 font-sans leading-relaxed" dir="ltr">
                  "{currentScenario.stakeholderPromptEn}"
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                  {currentScenario.stakeholderPromptAr}
                </p>
              </div>

              {/* 3 Executive Response Choices */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                    {isAr ? 'كيف سترد كقائد محترف؟ (اختر استراتيجيتك)' : 'Choose Your Executive Response Strategy:'}
                  </h5>

                  {/* Level Format Switcher (C1 Executive vs B1/B2 Simplified) */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setShowSimplifiedAnswer(false)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        !showSimplifiedAnswer
                          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      💎 {isAr ? 'صيغة C1 القيادية' : 'C1 Executive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSimplifiedAnswer(true)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        showSimplifiedAnswer
                          ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      🌱 {isAr ? 'صيغة B1/B2 المبسطة' : 'B1/B2 Plain'}
                    </button>
                  </div>
                </div>

                {/* Simplified Alternative Preview Banner when toggled */}
                {showSimplifiedAnswer && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAr ? 'الصيغة المبسطة والواضحة (الموصى بها لمستوى B1/B2):' : 'B1/B2 Plain English Script:'}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-sans font-medium text-slate-900 dark:text-zinc-100" dir="ltr">
                      "{currentScenario.simplifiedAnswerEn}"
                    </p>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 italic">
                      {currentScenario.simplifiedAnswerAr}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePlayModelAnswer(currentScenario.simplifiedAnswerEn)}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{isAr ? 'استماع للنطق' : 'Listen'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyText('simplified', currentScenario.simplifiedAnswerEn)}
                        className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{isAr ? 'نسخ' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {currentScenario.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isExecutive = opt.type === 'executive';

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? isExecutive
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                              : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-400 shadow-md ring-2 ring-rose-500/20'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              opt.type === 'executive'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : opt.type === 'aggressive'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isAr ? opt.labelAr : opt.labelEn}
                          </span>

                          {isSelected && (
                            <span className="flex items-center gap-1 text-xs font-bold">
                              {isExecutive ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                              )}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm font-sans font-medium text-slate-900 dark:text-zinc-100 leading-relaxed" dir="ltr">
                          "{opt.textEn}"
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 italic">
                          {opt.textAr}
                        </p>

                        {/* Analysis Box if Selected */}
                        {isSelected && (
                          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-zinc-800 space-y-2 animate-fade-in">
                            <div className="text-xs">
                              <span className="font-bold text-slate-800 dark:text-zinc-200">
                                {isAr ? 'التحليل السيكولوجي والإداري:' : 'Executive Rationale:'}{' '}
                              </span>
                              <span className="text-slate-600 dark:text-zinc-400">
                                {isAr ? opt.whyResultAr : opt.whyResultEn}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-300">
                              <strong>💡 {isAr ? 'التكتيك الذهبي:' : 'Core Tactic:'} </strong>
                              <span>{isAr ? opt.executiveTacticAr : opt.executiveTacticEn}</span>
                            </div>

                            {/* Listen to Native Audio or Practice */}
                            <div className="flex items-center gap-2 pt-2 flex-wrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayModelAnswer(opt.textEn);
                                }}
                                disabled={isPlayingModelAnswer}
                                className="py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-black transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Volume2 className={`w-3.5 h-3.5 ${isPlayingModelAnswer ? 'animate-bounce text-amber-400' : ''}`} />
                                <span>
                                  {isPlayingModelAnswer
                                    ? isAr
                                      ? 'جارٍ الاستماع...'
                                      : 'Speaking...'
                                    : isAr
                                      ? 'استمع للنطق النموذجي 🎙️'
                                      : 'Hear Native Model 🎙️'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyText(opt.id, opt.textEn);
                                }}
                                className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer"
                              >
                                {copiedTemplateId === opt.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>
                                  {copiedTemplateId === opt.id
                                    ? isAr
                                      ? 'تم النسخ!'
                                      : 'Copied!'
                                    : isAr
                                      ? 'نسخ لسلاك'
                                      : 'Copy for Slack'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleVoicePractice(opt.textEn);
                                }}
                                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isRecording
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                }`}
                              >
                                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                <span>
                                  {isRecording
                                    ? isAr
                                      ? 'أوقف التحدث وقيم'
                                      : 'Stop & Grade'
                                    : isAr
                                      ? 'تمرن وتحدث بالمايك 🎤'
                                      : 'Practice Speaking 🎤'}
                                </span>
                              </button>
                            </div>

                            {/* Voice Feedback Wave if active */}
                            {isRecording && (
                              <div className="p-3 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between gap-2 animate-pulse mt-2">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  <span>
                                    {isAr
                                      ? 'تحدث بالإنجليزية الآن مستخدماً نفس العبارة...'
                                      : 'Speak the phrase aloud in English now...'}
                                  </span>
                                </span>
                                <span className="font-mono text-zinc-400">Recording...</span>
                              </div>
                            )}

                            {recordingScore !== null && (
                              <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs space-y-1 mt-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                                    {isAr ? 'درجة دقة النطق والمطابقة:' : 'Fluency Match Score:'}
                                  </span>
                                  <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                                    {recordingScore}%
                                  </span>
                                </div>
                                {recordedTranscript && (
                                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono italic" dir="ltr">
                                    Heard: "{recordedTranscript}"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SLACK & EMAIL ARSENAL */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {(['all', 'sprint', 'boundary', 'escalation', 'focus'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      soundSynth.playTactileClick();
                      setTemplateFilter(cat);
                    }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      templateFilter === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all'
                      ? isAr
                        ? 'جميع القوالب'
                        : 'All Templates'
                      : cat === 'sprint'
                      ? isAr
                        ? 'إدارة الأشواط'
                        : 'Sprint'
                      : cat === 'boundary'
                      ? isAr
                        ? 'حماية النطاق'
                        : 'Boundaries'
                      : cat === 'escalation'
                      ? isAr
                        ? 'تصعيد العوائق'
                        : 'Escalations'
                      : isAr
                      ? 'حماية وقت الصنع'
                      : 'Focus Time'}
                  </button>
                ))}
              </div>

              {/* Template Cards List */}
              <div className="grid grid-cols-1 gap-4">
                {filteredTemplates.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs hover:border-indigo-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                            {isAr ? item.categoryLabelAr : item.categoryLabelEn}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                            {isAr ? item.titleAr : item.titleEn}
                          </h4>
                        </div>
                        {item.subjectLine && (
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-1" dir="ltr">
                            Subject: {item.subjectLine}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopyText(item.id, item.templateEn)}
                        className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                      >
                        {copiedTemplateId === item.id ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedTemplateId === item.id
                            ? isAr
                              ? 'تم النسخ!'
                              : 'Copied!'
                            : isAr
                              ? 'نسخ القالب'
                              : 'Copy Template'}
                        </span>
                      </button>
                    </div>

                    {/* Preformatted Template Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-xs font-mono text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed select-all" dir="ltr">
                      {item.templateEn}
                    </div>

                    {/* Arabic Translation & Tips */}
                    <div className="p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                      <p className="font-sans leading-relaxed">
                        <strong>{isAr ? 'المعنى العربي للقالب:' : 'Arabic Translation:'} </strong>
                        <span className="text-slate-600 dark:text-zinc-400 whitespace-pre-wrap block mt-1">{item.templateAr}</span>
                      </p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold pt-1 border-t border-amber-500/20">
                        💡 {isAr ? 'نصيحة إدارية:' : 'Management Tip:'} {isAr ? item.tipsAr : item.tipsEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FLUENCY DRILLS */}
          {activeTab === 'drills' && currentDrill && (
            <div className="space-y-6">
              {/* Drill Selector */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-100/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <button
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setSelectedDrillIndex((prev) =>
                      prev > 0 ? prev - 1 : FLUENCY_DRILLS.length - 1
                    );
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                </button>

                <div className="text-center px-2">
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    {isAr ? 'مناورة الانتقال السريع' : 'Transition Hook'} {selectedDrillIndex + 1} / {FLUENCY_DRILLS.length}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                    {currentDrill.hookEn}
                  </h4>
                </div>

                <button
                  onClick={() => {
                    soundSynth.playTactileClick();
                    setSelectedDrillIndex((prev) =>
                      prev < FLUENCY_DRILLS.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Master Phrase Showcase Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white text-center space-y-4 shadow-xl relative overflow-hidden">
                <div className="inline-flex p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black font-sans text-indigo-100 tracking-wide" dir="ltr">
                    "{currentDrill.hookEn}"
                  </h3>
                  <p className="text-sm text-indigo-300/80 font-medium">
                    {currentDrill.hookAr}
                  </p>
                </div>

                {/* Practical Example Box */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 max-w-xl mx-auto">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                    {isAr ? 'مثال عملي في الاجتماع:' : 'Meeting In-Action Example:'}
                  </span>
                  <p className="text-sm text-slate-200 font-sans" dir="ltr">
                    "{currentDrill.exampleEn}"
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    {currentDrill.exampleAr}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handlePlayDrill(currentDrill.exampleEn)}
                    disabled={isPlayingDrill}
                    className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>
                      {isPlayingDrill
                        ? isAr
                          ? 'جارٍ التشغيل...'
                          : 'Playing...'
                        : isAr
                          ? 'استمع للنطق والموسيقى الإدارية 🔊'
                          : 'Listen with Audio 🔊'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleCopyText(currentDrill.id, currentDrill.exampleEn)}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedTemplateId === currentDrill.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedTemplateId === currentDrill.id ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ المثال' : 'Copy Example')}</span>
                  </button>
                </div>
              </div>

              {/* Context Explanation */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 space-y-1">
                <span className="font-bold text-slate-900 dark:text-zinc-100">
                  🎯 {isAr ? 'متى تستخدم هذا التعبير بالتحديد؟' : 'When to deploy this phrase:'}
                </span>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {isAr ? currentDrill.usageContextAr : currentDrill.usageContextEn}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: PLACEMENT TEST & LEVEL DIAGNOSTIC */}
          {activeTab === 'placement' && (
            <div className="space-y-6">
              {/* Intro Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-amber-500/10 border border-indigo-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {isAr ? 'اختبار تحديد المستوى والتشخيص السريع (دقيقة واحدة)' : 'Executive English Diagnostic'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                    3 مواقف واقعية
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {isAr
                    ? 'ليس الجميع في نفس المستوى اللغوي، ولا نريد إثقالك بمصطلحات صعبة إن كنت تفضل البساطة والوضوح، كما لا نريد إهدار وقتك بنصوص بدائية إن كنت في مستوى تنفيذي متقدم. أجب عن 3 مواقف سريعة لنضبط لك الأستوديو وفق مستواك تماماً.'
                    : 'Personalize your English experience. Take this 1-minute scenario diagnostic to match simulations to your current speaking comfort level.'}
                </p>
              </div>

              {/* Placement Result Banner if finished */}
              {placementFinished && (
                <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-black">
                        {isAr ? 'تم تحديد مستواك بنجاح:' : 'Placement Confirmed:'}{' '}
                        {userLevel === 'b1'
                          ? isAr
                            ? 'المستوى التأسيسي المباشر (B1 Plain)'
                            : 'Foundational Plain (B1)'
                          : userLevel === 'b2'
                          ? isAr
                            ? 'المستوى الممارس التقني المتقدم (B2 Agile)'
                            : 'Agile Practitioner (B2)'
                          : isAr
                          ? 'المستوى التنفيذي الدبلوماسي (C1 Silicon Valley)'
                          : 'Executive Leader (C1)'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetPlacement}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isAr ? 'إعادة الاختبار' : 'Retake'}</span>
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                    {userLevel === 'b1'
                      ? isAr
                        ? 'ممتاز! تم تفعيل الصيغ البسيطة والمباشرة لك في المحاكي. ستتعلم التعبير عن رأيك بوضوح دون خوف أو تعقيد.'
                        : 'Great! Plain, punchy scripts are now enabled for you across the simulator.'
                      : userLevel === 'b2'
                      ? isAr
                        ? 'رائع! مستواك الحالي يمكنك من إدارة مواقف الأجايل والتفاوض التقني باقتدار. تم تفعيل نصوص الـ Practitioner لك.'
                        : 'Awesome! Agile negotiation and practical trade-off scripts are tailored for your level.'
                      : isAr
                      ? 'مستوى نخبوي! تم تفعيل نصوص الدبلوماسية الاستراتيجية الكاملة لشركات وادي السيليكون والمستثمرين.'
                      : 'Elite level! High-stakes Silicon Valley diplomacy and stakeholder defense are unlocked.'}
                  </p>

                  <button
                    type="button"
                    onClick={() => setActiveTab('simulator')}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>{isAr ? 'تطبيق والانتقال لمحاكي الاجتماعات 🚀' : 'Go to Simulator 🚀'}</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 3 Placement Questions */}
              <div className="space-y-5">
                {PLACEMENT_QUESTIONS.map((q, idx) => {
                  const selectedAnswer = placementAnswers[q.id];

                  return (
                    <div
                      key={q.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {isAr ? `الموقف ${idx + 1} من 3` : `Question ${idx + 1} of 3`}
                        </span>
                        {selectedAnswer && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            {selectedAnswer.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                          {isAr ? q.titleAr : q.titleEn}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                          {isAr ? q.situationAr : q.situationEn}
                        </p>
                      </div>

                      <div className="space-y-2 pt-1">
                        {q.options.map((opt) => {
                          const isOptionSelected = selectedAnswer === opt.level;

                          return (
                            <div
                              key={opt.level}
                              onClick={() => handleSelectPlacementOption(q.id, opt.level)}
                              className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                                isOptionSelected
                                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-2xs ring-1 ring-indigo-500/30'
                                  : 'bg-slate-50/60 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-indigo-700 dark:text-indigo-400 text-[11px]">
                                  {opt.levelLabelAr}
                                </span>
                                {isOptionSelected && (
                                  <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                )}
                              </div>
                              <p className="font-sans text-slate-900 dark:text-zinc-100 font-medium" dir="ltr">
                                "{opt.textEn}"
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                {opt.textAr}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3.5 px-5 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>
              {isAr
                ? `المستوى الحالي: ${userLevel.toUpperCase()} • ${JOB_ROLE_LABELS[userRole].nameAr} • ${REGIONAL_CONTEXT_PROTIPS[userRegion].nameAr}`
                : `Level: ${userLevel.toUpperCase()} • ${JOB_ROLE_LABELS[userRole].nameEn}`}
            </span>
          </span>
          <button
            onClick={onClose}
            className="py-1 px-3 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
