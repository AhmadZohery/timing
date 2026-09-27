import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Volume2,
  CheckCircle2,
  Briefcase,
  MapPin,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { type CefrLevel, CEFR_LEVELS_INFO } from '../../data/languages/vocabularyDatabase';
import { spacedRepetition } from '../../services/spacedRepetitionService';
import { speechService } from '../../services/speechService';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';

export interface EnglishPlacementDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  onPlacementApplied?: (resultLevel: CefrLevel) => void;
  onRewardToast?: (msg: string) => void;
}

export type CareerDomainId = 'tech' | 'business' | 'freelance' | 'general';
export type RegionalContextId = 'gulf' | 'global_remote' | 'mena_egypt';

interface DiagnosticQuestion {
  id: string;
  stageLevel: CefrLevel;
  scenarioAr: string;
  scenarioEn: string;
  prompt: string;
  options: {
    id: string;
    text: string;
    levelScore: CefrLevel;
    isBest: boolean;
    explanationAr: string;
  }[];
  audioSnippet?: string;
}

const CAREER_DOMAINS: { id: CareerDomainId; titleAr: string; titleEn: string; icon: string; descAr: string }[] = [
  {
    id: 'tech',
    titleAr: 'التقنية والبرمجيات (Tech & Software)',
    titleEn: 'Software Engineering & IT',
    icon: '💻',
    descAr: 'مصطلحات الـ PRs، محادثات الـ Standup، النقاشات المعمارية، وحل الـ Blockers.',
  },
  {
    id: 'business',
    titleAr: 'إدارة الأعمال والمبيعات (Business & Sales)',
    titleEn: 'Business Dev, Sales & Finance',
    icon: '📊',
    descAr: 'إيميلات العملاء، اجتماعات الـ Pitch، المفاوضات، وعروض الشراكة.',
  },
  {
    id: 'freelance',
    titleAr: 'العمل الحر والعملاء الأجانب (Freelance & Remote)',
    titleEn: 'Freelance & Upwork Clients',
    icon: '🚀',
    descAr: 'مقابلات العمل، تحديد الـ Scope، تفاوض الأسعار، وإدارة توقعات العميل.',
  },
  {
    id: 'general',
    titleAr: 'الإنجليزية المهنية العامة (General Workplace)',
    titleEn: 'General Workplace & Life',
    icon: '🌐',
    descAr: 'التواصل اليومي الراقي، الاجتماعات العامة، وطلاقة التحدث دون تردد.',
  },
];

const REGIONAL_CONTEXTS: { id: RegionalContextId; titleAr: string; titleEn: string; icon: string; descAr: string }[] = [
  {
    id: 'gulf',
    titleAr: 'الخليج والشركات الإقليمية (Dubai / Riyadh / Gulf Hubs)',
    titleEn: 'Gulf Corporate & Regional Hubs',
    icon: '🏙️',
    descAr: 'بيئة العمل متعددة الجنسيات في دبي، الرياض، والدوحة.',
  },
  {
    id: 'global_remote',
    titleAr: 'العمل عن بعد مع شركات غربية (US / EU Remote Teams)',
    titleEn: 'US/EU Global Remote Teams',
    icon: '🌍',
    descAr: 'سلاسة التواصل مع فرق بأمريكا وأوروبا، فهم اللهجات وسرعة الرد.',
  },
  {
    id: 'mena_egypt',
    titleAr: 'مصر والشرق الأوسط (MENA Local & Regional)',
    titleEn: 'MENA & Local Market',
    icon: '🏛️',
    descAr: 'سوق العمل المحلي والشركات الناشئة مع التطلع للارتقاء الإقليمي.',
  },
];

// Adaptive scenario-based question bank
const DIAGNOSTIC_QUESTIONS: Record<CareerDomainId, DiagnosticQuestion[]> = {
  tech: [
    {
      id: 'tech_q1',
      stageLevel: 'A2',
      scenarioAr: 'أنت في اجتماع الـ Daily Standup وتريد أن تقول باختصار أن مهمتك انتهت وأنت جاهز للمهمة التالية:',
      scenarioEn: 'Daily standup: reporting task completion and ready for next:',
      prompt: 'Which phrase is the most natural and professional?',
      options: [
        {
          id: 'opt1',
          text: 'I finished the login task yesterday. I am ready to pick up the next ticket.',
          levelScore: 'B1',
          isBest: true,
          explanationAr: 'ممتازة ومهنية ومباشرة في سياق الـ Agile/Scrum اليومي.',
        },
        {
          id: 'opt2',
          text: 'I make the task done and I want other task please.',
          levelScore: 'A1',
          isBest: false,
          explanationAr: 'ركيكة قواعدياً ولا تليق ببيئة عمل احترافية.',
        },
        {
          id: 'opt3',
          text: 'Yesterday, the authentication module was successfully finalized, permitting my transition to subsequent objectives.',
          levelScore: 'C1',
          isBest: false,
          explanationAr: 'رسمية بزيادة مبالغ فيها لا تناسب الـ Standup السريع، وإن كانت دقيقة لغوياً.',
        },
      ],
      audioSnippet: 'I finished the login task yesterday. I am ready to pick up the next ticket.',
    },
    {
      id: 'tech_q2',
      stageLevel: 'B1',
      scenarioAr: 'وجدت مشكلة غير متوقعة (Blocker) في الـ API ستؤخر تسليم المهمة بيومين. كيف ترسل تنبيهاً ذكياً للمدير في Slack؟',
      scenarioEn: 'Reporting an unexpected technical blocker that delays delivery by 2 days:',
      prompt: 'Select the best communication strategy:',
      options: [
        {
          id: 'opt1',
          text: 'Sorry, I cannot do it on time. It has a bug.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'سلبية جداً وتفتقر للمهنية واقتراح الحلول.',
        },
        {
          id: 'opt2',
          text: 'Quick heads-up: We hit an unexpected rate-limiting blocker on the payment API. I am investigating a workaround, but it might push our deployment back by two days.',
          levelScore: 'B2',
          isBest: true,
          explanationAr: 'صياغة ممتازة تجمع بين التنبيه الاستباقي (Heads-up) واقتراح الحل والتقدير الزمني الواقعي.',
        },
        {
          id: 'opt3',
          text: 'The code is completely broken due to third-party incompetence.',
          levelScore: 'B1',
          isBest: false,
          explanationAr: 'لهجة انفعالية وغير دبلوماسية.',
        },
      ],
      audioSnippet: 'Quick heads-up: We hit an unexpected rate-limiting blocker on the payment API.',
    },
    {
      id: 'tech_q3',
      stageLevel: 'B2',
      scenarioAr: 'العميل يطلب ميزة إضافية كبيرة (Scope Creep) قبل الإطلاق بيومين، وتريد رفض الطلب حالياً بلباقة ودبلوماسية:',
      scenarioEn: 'Diplomatically pushing back against late scope creep before launch:',
      prompt: 'How would an experienced Senior Engineer / Tech Lead respond?',
      options: [
        {
          id: 'opt1',
          text: 'No, this is out of scope. We cannot do it.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'صدامي وجاف ويؤثر سلباً على العلاقة مع العميل.',
        },
        {
          id: 'opt2',
          text: 'That is a valuable feature idea! To protect our launch deadline this Thursday, I recommend we backlog this for Phase 2 right after deployment. What do you think?',
          levelScore: 'B2',
          isBest: true,
          explanationAr: 'قمة الذكاء الدبلوماسي: ثناء على الفكرة + حماية موعد الإطلاق + ترحيل لـ Phase 2.',
        },
        {
          id: 'opt3',
          text: 'We could endeavor to implement this if you formally acknowledge the inevitable compromise of our release schedule.',
          levelScore: 'C1',
          isBest: false,
          explanationAr: 'معقدة لغوياً وجافة وقد تبدو عدائية للعميل.',
        },
      ],
      audioSnippet: 'That is a valuable feature idea! To protect our launch deadline, I recommend we backlog this for Phase 2.',
    },
    {
      id: 'tech_q4',
      stageLevel: 'C1',
      scenarioAr: 'تريد إقناع الإدارة بإعادة كتابة جزء من الكود القديم (Technical Debt Refactoring) في اجتماع استراتيجي:',
      scenarioEn: 'Persuading stakeholders to address technical debt during a strategy meeting:',
      prompt: 'Which phrase demonstrates executive-level architectural framing?',
      options: [
        {
          id: 'opt1',
          text: 'Our old code is terrible and we must rewrite it because I hate it.',
          levelScore: 'B1',
          isBest: false,
          explanationAr: 'مبرر شخصي غير احترافي لا يقنع صناع القرار.',
        },
        {
          id: 'opt2',
          text: 'By allocating 15% of our sprint bandwidth to refactoring this core service, we will significantly mitigate technical debt, cut cloud latency by 40%, and future-proof our scaling roadmap.',
          levelScore: 'C1',
          isBest: true,
          explanationAr: 'صياغة قيادية تنفيذية (Executive framing) تربط الكود بالعائد المادي وسرعة النظام والتوسع المستقبلي.',
        },
        {
          id: 'opt3',
          text: 'We need to fix the bugs in the backend system soon.',
          levelScore: 'B1',
          isBest: false,
          explanationAr: 'بسيطة وعامة جداً لا تحمل وزناً إقناعياً.',
        },
      ],
      audioSnippet: 'By allocating 15% of our sprint bandwidth to refactoring, we will significantly mitigate technical debt.',
    },
  ],
  business: [
    {
      id: 'biz_q1',
      stageLevel: 'A2',
      scenarioAr: 'تريد تأكيد موعد اجتماع مهم مع شريك تجاري عبر البريد الإلكتروني:',
      scenarioEn: 'Confirming a business meeting via email:',
      prompt: 'Which sentence is polite and clear?',
      options: [
        {
          id: 'opt1',
          text: 'I look forward to our meeting tomorrow at 2:00 PM to discuss the partnership.',
          levelScore: 'B1',
          isBest: true,
          explanationAr: 'صياغة رسمية، واضحة ومباشرة وتفي بالغرض.',
        },
        {
          id: 'opt2',
          text: 'See you tomorrow 2 pm.',
          levelScore: 'A1',
          isBest: false,
          explanationAr: 'عامية وغير مناسبة لشركاء جدد.',
        },
        {
          id: 'opt3',
          text: 'I write to make confirmation for the meeting of tomorrow 2 o clock.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'ترجمة حرفية ركيكة.',
        },
      ],
      audioSnippet: 'I look forward to our meeting tomorrow at 2:00 PM to discuss the partnership.',
    },
    {
      id: 'biz_q2',
      stageLevel: 'B1',
      scenarioAr: 'العميل يطلب خصماً 30% وتريد الحفاظ على السعر مع تقديم قيمة بديلة دون خسارة الصفقة:',
      scenarioEn: 'Handling a 30% discount request without compromising profitability:',
      prompt: 'Which negotiation response strikes the best commercial balance?',
      options: [
        {
          id: 'opt1',
          text: 'While our standard pricing reflects the premium quality and dedicated support we provide, we can bundle complimentary onboarding for your team instead of a cash discount.',
          levelScore: 'B2',
          isBest: true,
          explanationAr: 'تفاوض مهني يحافظ على القيمة السعرية ويمنح العميل ميزة تدريب إضافية مرضية.',
        },
        {
          id: 'opt2',
          text: 'No discount. Our price is fixed for everyone.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'جافة جداً وتدفع العميل للمنافسين فوراً.',
        },
        {
          id: 'opt3',
          text: 'Okay, we give you 30% discount just sign the contract please.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'استسلام فوري يهدر أرباح الشركة ويقلل هيبتها.',
        },
      ],
      audioSnippet: 'While our standard pricing reflects premium quality, we can bundle complimentary onboarding for your team.',
    },
    {
      id: 'biz_q3',
      stageLevel: 'B2',
      scenarioAr: 'أنت في اجتماع مجلس إدارة وتريد الإشارة إلى أن نتائج الربع الحالي فاقت التوقعات المالية:',
      scenarioEn: 'Highlighting quarterly earnings exceeding financial targets in a board meeting:',
      prompt: 'Choose the most articulate executive phrasing:',
      options: [
        {
          id: 'opt1',
          text: 'Our Q3 performance not only met targets but outpaced our initial forecasts by a healthy 18%, driven primarily by expansion in regional enterprise accounts.',
          levelScore: 'C1',
          isBest: true,
          explanationAr: 'لغة استثمارية رفيعة (Executive business fluency) مع ربط الأرقام بسبب النمو.',
        },
        {
          id: 'opt2',
          text: 'We made more money than we thought this quarter, which is very good.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'لغة عامية وبسيطة جداً لا تناسب مجالس الإدارة.',
        },
        {
          id: 'opt3',
          text: 'The money is increased 18% so we are very happy.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'ضعيفة الصياغة.',
        },
      ],
      audioSnippet: 'Our Q3 performance outpaced our initial forecasts by a healthy 18%.',
    },
  ],
  freelance: [
    {
      id: 'free_q1',
      stageLevel: 'B1',
      scenarioAr: 'تريد إرسال عرض أولي (Proposal) لعميل على Upwork يجذب انتباهه في أول سطرين:',
      scenarioEn: 'Opening a high-converting freelance proposal on Upwork:',
      prompt: 'Which opening hooks the client most effectively?',
      options: [
        {
          id: 'opt1',
          text: 'Hello, I saw your job and I have 5 years experience, I can do it easily.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'ممل ومكرر، معظم المستقلين يكتبون هذه البداية ويتجاهلها العميل.',
        },
        {
          id: 'opt2',
          text: 'Hi [Name], I noticed you are struggling with checkout conversion rates. I recently solved this exact issue for an e-commerce brand by redesigning their 3-step funnel.',
          levelScore: 'B2',
          isBest: true,
          explanationAr: 'بداية تركز على ألم العميل وحل واقعي مثبت بالنتائج، تجبر العميل على الرد.',
        },
        {
          id: 'opt3',
          text: 'Respected Sir, kindly hire me for this prestigious assignment.',
          levelScore: 'A1',
          isBest: false,
          explanationAr: 'صيغة قديمة وتوحي بالضعف.',
        },
      ],
      audioSnippet: 'I noticed you are struggling with checkout conversion rates. I recently solved this exact issue.',
    },
    {
      id: 'free_q2',
      stageLevel: 'B2',
      scenarioAr: 'العميل يطلب مكالمة فيديو سريعة وأنت تريد حجز موعد محدد مع إظهار احترام الوقت وتحديد جدول أعمال المكالمة:',
      scenarioEn: 'Scheduling a discovery call with a clear agenda and time boundaries:',
      prompt: 'Which response demonstrates high professionalism?',
      options: [
        {
          id: 'opt1',
          text: 'Call me anytime, I am free all day.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'يوحي بأنك غير مشغول أو غير مطلوب، ويقلل قيمتك السوقية.',
        },
        {
          id: 'opt2',
          text: 'I would be happy to jump on a brief 20-minute discovery call to align on your goals. Here is my Calendly link, or let me know if 3:00 PM EST works for you.',
          levelScore: 'B2',
          isBest: true,
          explanationAr: 'احترافي، محدد بالوقت (20 دقيقة)، ويوفر خيارين مريحين للحجز.',
        },
        {
          id: 'opt3',
          text: 'We must talk on Zoom now to finish the details.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'لهجة جافة وأمرية.',
        },
      ],
      audioSnippet: 'I would be happy to jump on a brief 20-minute discovery call to align on your goals.',
    },
  ],
  general: [
    {
      id: 'gen_q1',
      stageLevel: 'A2',
      scenarioAr: 'زميل في العمل يسألك عن رأيك في فكرة مشروع جديدة وتريد إبداء الإعجاب مع التحفظ الإيجابي:',
      scenarioEn: 'Giving constructive feedback on a colleague’s new proposal:',
      prompt: 'Which response sounds natural and collaborative?',
      options: [
        {
          id: 'opt1',
          text: 'The concept sounds very promising, though we should double-check the implementation timeline before committing.',
          levelScore: 'B2',
          isBest: true,
          explanationAr: 'توازن رائع بين التشجيع والحذر المنطقي.',
        },
        {
          id: 'opt2',
          text: 'Good idea, but maybe problem with time.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'مقتضبة وركيكة.',
        },
        {
          id: 'opt3',
          text: 'I have severe doubts concerning the feasibility of this undertaking.',
          levelScore: 'C1',
          isBest: false,
          explanationAr: 'محبطة وقاسية للزملاء دون داعٍ.',
        },
      ],
      audioSnippet: 'The concept sounds very promising, though we should double-check the implementation timeline.',
    },
    {
      id: 'gen_q2',
      stageLevel: 'B1',
      scenarioAr: 'تريد الاعتذار عن حضور اجتماع بسبب تعارض في جدول المواعيد واقتراح موعد بديل:',
      scenarioEn: 'Politely declining a meeting invitation due to a schedule conflict:',
      prompt: 'Which response is the most considerate and clear?',
      options: [
        {
          id: 'opt1',
          text: 'Unfortunately, I have a prior commitment at that time. Would Thursday morning work better for you?',
          levelScore: 'B2',
          isBest: true,
          explanationAr: 'اعتذار رسمي موجز واقتراح بديل فوري.',
        },
        {
          id: 'opt2',
          text: 'I cannot come because I have another thing.',
          levelScore: 'A2',
          isBest: false,
          explanationAr: 'عامية وجافة.',
        },
        {
          id: 'opt3',
          text: 'Cancel this meeting, I am busy.',
          levelScore: 'A1',
          isBest: false,
          explanationAr: 'فظة وغير لائقة في العمل.',
        },
      ],
      audioSnippet: 'Unfortunately, I have a prior commitment at that time. Would Thursday morning work better?',
    },
  ],
};

export const EnglishPlacementDiagnosticModal: React.FC<EnglishPlacementDiagnosticModalProps> = ({
  isOpen,
  onClose,
  isAr,
  onPlacementApplied,
  onRewardToast,
}) => {
  const [step, setStep] = useState<'profile' | 'test' | 'result'>('profile');
  const [selectedCareer, setSelectedCareer] = useState<CareerDomainId>('tech');
  const [selectedRegion, setSelectedRegion] = useState<RegionalContextId>('gulf');

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selectedId: string; level: CefrLevel; isBest: boolean }>>({});
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [calculatedLevel, setCalculatedLevel] = useState<CefrLevel>('B1');

  if (!isOpen) return null;

  const currentQuestions = DIAGNOSTIC_QUESTIONS[selectedCareer] || DIAGNOSTIC_QUESTIONS.tech;
  const currentQ = currentQuestions[currentQIndex] || currentQuestions[0];

  const handleStartTest = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setStep('test');
    setCurrentQIndex(0);
    setAnswers({});
    setSelectedOptId(null);
    setIsAnswerSubmitted(false);
  };

  const handleSelectOption = (optId: string) => {
    if (isAnswerSubmitted) return;
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setSelectedOptId(optId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOptId) return;
    const opt = currentQ.options.find((o) => o.id === selectedOptId);
    if (!opt) return;

    setIsAnswerSubmitted(true);
    if (opt.isBest) {
      soundSynth.playStreakMilestoneChime();
      haptic.vibrateSprintCelebration();
    } else {
      soundSynth.playWarningSound();
      haptic.vibrateWarning();
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQIndex]: {
        selectedId: selectedOptId,
        level: opt.levelScore,
        isBest: opt.isBest,
      },
    }));
  };

  const handleNextQuestion = () => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    if (currentQIndex + 1 < currentQuestions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOptId(null);
      setIsAnswerSubmitted(false);
    } else {
      // Calculate overall diagnosed CEFR level
      const allAns = Object.values(answers);
      const bestCount = allAns.filter((a) => a.isBest).length;
      const ratio = bestCount / currentQuestions.length;

      let finalLevel: CefrLevel = 'B1';
      if (ratio >= 0.85) finalLevel = 'C1';
      else if (ratio >= 0.65) finalLevel = 'B2';
      else if (ratio >= 0.40) finalLevel = 'B1';
      else finalLevel = 'A2';

      setCalculatedLevel(finalLevel);
      setStep('result');
      soundSynth.playStreakMilestoneChime();
      haptic.vibrateSprintCelebration();
    }
  };

  const handleApplyPlacement = () => {
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    // 1. Record passed levels up to diagnosed level
    const levelOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const idx = levelOrder.indexOf(calculatedLevel);
    for (let i = 0; i <= idx; i++) {
      spacedRepetition.recordExamPassed(levelOrder[i], 'en');
    }

    // 2. Save career & region persona in localStorage
    localStorage.setItem(
      'midmar_english_persona',
      JSON.stringify({
        career: selectedCareer,
        region: selectedRegion,
        level: calculatedLevel,
        diagnosedAt: new Date().toISOString(),
      })
    );

    onRewardToast?.(
      isAr
        ? `🎯 تم اعتماد مستواك (${calculatedLevel}) وتخصيص المنهج لـ ${selectedCareer.toUpperCase()}!`
        : `Placement applied: ${calculatedLevel} for ${selectedCareer.toUpperCase()}!`
    );

    onPlacementApplied?.(calculatedLevel);
    onClose();
  };

  const handleSpeak = (text: string) => {
    speechService.speak(text, 'en');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="w-full max-w-lg rounded-3xl bg-slate-900/98 dark:bg-black/98 text-white border border-white/15 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center text-base shadow-sm">
              🎯
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                {isAr ? 'اختبار تحديد المستوى والتشخيص المهني' : 'Career English Diagnostic'}
              </h2>
              <span className="text-[10px] text-amber-300 font-mono block">
                {isAr ? 'ذكاء اصطناعي تكيفي • مخصص لوظيفتك ومكانك' : 'Adaptive Placement Test'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Personalization Setup */}
        {step === 'profile' && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
              <span className="font-bold block text-white mb-0.5">
                {isAr ? '💡 لماذا هذا الاختبار مختلف؟' : 'Why this diagnostic?'}
              </span>
              {isAr
                ? 'لن نختبرك في قواعد مدرسية مملة، بل سنحدد مستواك الحقيقي من خلال مواقف عملية تواجهها في وظيفتك ومجال عملك!'
                : 'No boring grammar tests. We assess your real workplace fluency in real scenarios.'}
            </div>

            {/* Career Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'ما هو مجالك المهني الأساسي؟' : 'Primary Career Domain:'}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CAREER_DOMAINS.map((c) => {
                  const isSelected = selectedCareer === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCareer(c.id)}
                      className={`text-start p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400/40 shadow-sm'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{c.icon}</span>
                        <span className="text-xs font-bold">{isAr ? c.titleAr : c.titleEn}</span>
                      </div>
                      <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed">
                        {isAr ? c.descAr : c.titleEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Region Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>{isAr ? 'ما هي بيئة العمل التي تستهدفها؟' : 'Target Regional Environment:'}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {REGIONAL_CONTEXTS.map((r) => {
                  const isSelected = selectedRegion === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRegion(r.id)}
                      className={`text-start p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400 text-white ring-1 ring-sky-400/40 shadow-sm'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-base">{r.icon}</span>
                        <span className="text-xs font-bold leading-tight">{isAr ? r.titleAr.split('(')[0] : r.titleEn}</span>
                      </div>
                      <p className="text-[10px] text-white/50 line-clamp-2">
                        {isAr ? r.descAr : r.titleEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartTest}
              className="tap-spring w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <span>{isAr ? 'بدء اختبار التشخيص التفاعلي' : 'Start Adaptive Diagnostic'}</span>
              <ArrowLeft className={`w-4 h-4 ${!isAr ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* STEP 2: The Interactive Challenge */}
        {step === 'test' && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>
                {isAr ? 'السؤال' : 'Question'} {currentQIndex + 1} {isAr ? 'من' : 'of'}{' '}
                {currentQuestions.length}
              </span>
              <span className="font-mono text-amber-300 font-bold">
                {currentQ.stageLevel} Stage
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${((currentQIndex + 1) / currentQuestions.length) * 100}%`,
                }}
              />
            </div>

            {/* Scenario Card */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                {isAr ? '📍 الموقف الواقعي في العمل:' : 'Workplace Context:'}
              </span>
              <p className="text-xs sm:text-sm font-medium text-white/90 leading-relaxed">
                {isAr ? currentQ.scenarioAr : currentQ.scenarioEn}
              </p>
              {currentQ.audioSnippet && (
                <button
                  type="button"
                  onClick={() => handleSpeak(currentQ.audioSnippet!)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-[11px] font-bold border border-indigo-500/30 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استمع للنطق الصوتي' : 'Listen with Audio'}</span>
                </button>
              )}
            </div>

            {/* Prompt */}
            <p className="text-xs font-bold text-slate-300">{currentQ.prompt}</p>

            {/* Options */}
            <div className="space-y-2">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOptId === opt.id;
                let optStyle = 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white';

                if (isAnswerSubmitted) {
                  if (opt.isBest) {
                    optStyle = 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400';
                  } else if (isSelected && !opt.isBest) {
                    optStyle = 'bg-rose-500/25 border-rose-400 text-rose-200 ring-1 ring-rose-400';
                  } else {
                    optStyle = 'bg-white/5 border-white/5 text-white/40';
                  }
                } else if (isSelected) {
                  optStyle = 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-start p-3 rounded-2xl border transition-all cursor-pointer ${optStyle}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">
                        {opt.text}
                      </span>
                      {isAnswerSubmitted && opt.isBest && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {isAnswerSubmitted && (isSelected || opt.isBest) && (
                      <p className="text-[10px] mt-2 pt-2 border-t border-white/10 text-white/70 leading-normal">
                        {opt.explanationAr}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="pt-2">
              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOptId}
                  className="tap-spring w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors shadow-md cursor-pointer"
                >
                  {isAr ? 'تأكيد الإجابة' : 'Submit Answer'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="tap-spring w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm hover:bg-emerald-400 transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>
                    {currentQIndex + 1 < currentQuestions.length
                      ? isAr
                        ? 'السؤال التالي'
                        : 'Next Question'
                      : isAr
                      ? 'عرض نتيجة التشخيص'
                      : 'View Diagnostic Result'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: The Result & Custom Curriculum Activation */}
        {step === 'result' && (
          <div className="space-y-4 text-center">
            <div className="inline-flex p-3 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-3xl mb-1 shadow-inner">
              🏆
            </div>

            <div>
              <span className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider block">
                {isAr ? 'تم تشخيص مستواك بنجاح' : 'Diagnostic Complete'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {isAr ? 'المستوى الموصى به:' : 'Your Diagnosed Level:'}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">
                  {calculatedLevel}
                </span>
              </h3>
              <p className="text-xs text-white/70 mt-1 max-w-sm mx-auto leading-relaxed">
                {CEFR_LEVELS_INFO.find((l) => l.level === calculatedLevel)?.descriptionAr}
              </p>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-2 gap-2 text-start p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="text-[10px] text-white/50 block">{isAr ? 'المجال المهني' : 'Career'}</span>
                <span className="font-bold text-white">
                  {CAREER_DOMAINS.find((c) => c.id === selectedCareer)?.titleAr.split('(')[0]}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/50 block">{isAr ? 'البيئة المستهدفة' : 'Environment'}</span>
                <span className="font-bold text-sky-300">
                  {REGIONAL_CONTEXTS.find((r) => r.id === selectedRegion)?.titleAr.split('(')[0]}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 text-start space-y-1">
              <span className="font-bold block text-white">
                {isAr ? '✨ ماذا يحدث عند التطبيق؟' : 'What happens next?'}
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-100/80">
                <li>{isAr ? 'فتح جميع مستويات الكلمات حتى هذا المستوى فوراً.' : 'Unlock all vocabulary up to this level.'}</li>
                <li>{isAr ? 'تخصيص الكلمات اليومية لتناسب مجالك وبيئتك بدقة.' : 'Tailor daily flashcards to your career domain.'}</li>
                <li>{isAr ? 'حفظ إعداداتك لتعمل دائماً دون حاجة لإعادة الاختبار.' : 'Save preferences permanently.'}</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleStartTest}
                className="tap-spring flex-1 py-3 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-colors cursor-pointer"
              >
                {isAr ? 'إعادة الاختبار' : 'Retake'}
              </button>
              <button
                type="button"
                onClick={handleApplyPlacement}
                className="tap-spring flex-[2] py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isAr ? 'تطبيق المستوى وتخصيص المنهج' : 'Apply & Activate Plan'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
