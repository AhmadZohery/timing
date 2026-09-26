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

export type StudioTab = 'simulator' | 'templates' | 'drills';

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

const MEETING_SCENARIOS: MeetingScenario[] = [
  {
    id: 'scope_creep_ambush',
    category: 'scope',
    badgeAr: 'حماية النطاق',
    badgeEn: 'Scope Defense',
    titleAr: 'كمين زحف النطاق المفاجئ قبل العرض التجريبي',
    titleEn: 'Mid-Sprint Scope Creep from C-Level',
    contextAr: 'المدير التنفيذي يطلب في محادثة سريعة إضافة داشبورد ذكاء اصطناعي قبل يوم الجمعة لتقديمها للمستثمرين، والنسخة الحالية ملتزمة بإطلاق بوابة الدفع.',
    contextEn: 'The VP asks to slip in an AI Analytics Dashboard before Friday demo, while the sprint is fully committed to Payment Gateway.',
    stakeholderSpeaker: 'VP of Product / Stakeholder',
    stakeholderPromptEn:
      'Hey! The investors are super keen on seeing our AI dashboard on Friday. It is just a simple summary widget—can we quickly squeeze it into this sprint?',
    stakeholderPromptAr:
      'مرحباً! المستثمرون مهتمون للغاية برؤية لوحة تحكم الذكاء الاصطناعي يوم الجمعة. هي مجرد بطاقة ملخصة بسيطة، هل يمكننا حشرها سريعاً في هذا الشوط؟',
    options: [
      {
        id: 'weak',
        type: 'weak',
        labelAr: 'رد ضعيف ومرتبك (Weak / Reactive)',
        labelEn: 'Weak / Reactive Compromise',
        textEn:
          "Um, sure, I guess we can ask the engineers to work over the weekend and try our best to squeeze it in.",
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
        textEn:
          "No, the sprint is completely locked. You should have requested this during sprint planning last week.",
        textAr:
          'لا، الشوط مغلق تماماً. كان ينبغي عليك طلب هذا أثناء التخطيط الأسبوع الماضي.',
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
          "I completely understand the strategic leverage for the investor demo. However, our sprint capacity is at 100% focused on the Payment Gateway. Committing to the AI widget right now directly pushes Payments to next cycle. Are you comfortable swapping Payments out, or should we prepare an interactive Figma click-through for Friday so we keep both tracks winning?",
        textAr:
          'أتفهم تماماً الأهمية الاستراتيجية للعرض أمام المستثمرين. ومع ذلك، طاقتنا الاستيعابية للشوط الحالي عند 100% ومكرسة لبوابة الدفع. الالتزام ببطاقة الذكاء الاصطناعي الآن سيرحل بوابة الدفع للدورة القادمة. هل يناسبك إجراء هذه المقايضة، أم نعد نموذج Figma تفاعلياً ليوم الجمعة لنحمي مسار الإنتاج ونلبي حاجة العرض معاً؟',
        whyResultAr:
          '✅ يظهر ذكاءً إدارياً فائقاً: يعترف بالقيمة التجارية، يوضح مقايضة السعة (Capacity Trade-off) بالأدلة، ويطرح بديلاً ذكياً فوز-فوز.',
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
    contextAr: 'قبل يوم واحد من الإطلاق الرسمي الموعود للعملاء، اكتشف فريق الـ QA خللاً في تزامن البيانات تحت الضغط العالي يتطلب 48 ساعة تثبيت.',
    contextEn: 'QA discovered a concurrency edge-case under load 24 hours before public release.',
    stakeholderSpeaker: 'Engineering Director / VP Tech',
    stakeholderPromptEn:
      'We just reproduced a race condition in the checkout microservice. If we launch tomorrow, 2% of transactions could duplicate. We cannot ship this.',
    stakeholderPromptAr:
      'لقد قمنا للتو بإعادة إنتاج حالة تسابق في خدمة الدفع. إذا أطلقنا غداً، قد تتكرر 2% من المعاملات. لا يمكننا الشحن.',
    options: [
      {
        id: 'weak',
        type: 'weak',
        labelAr: 'رد ضعيف واعتذاري مفرط (Apologetic & Blaming)',
        labelEn: 'Apologetic & Finger-Pointing',
        textEn:
          "I am so sorry, the backend developers missed this and now everything is ruined. We will have to cancel the launch indefinitely.",
        textAr:
          'أنا آسف جداً، مطورو الواجهة الخلفية غفلوا عن هذا والآن كل شيء تدمر. سنضطر لإلغاء الإطلاق لأجل غير مسمى.',
        whyResultAr:
          '❌ يلقي اللوم على الزملاء، يثير الذعر في المؤسسة، ويهدم الثقة في كفاءة إدارة المشروع.',
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
        textEn:
          "2% is acceptable. Let's just ship on schedule and patch it silently in production over the weekend.",
        textAr:
          '2% نسبة مقبولة. دعونا نشحن في الموعد ونرقعها سراً في بيئة الإنتاج خلال العطلة.',
        whyResultAr:
          '⚠️ مقامرة انتحارية بسمعة المنتج وحسابات العملاء، تؤدي لفقدان الوظيفة والمسؤولية القانونية.',
        whyResultEn:
          '⚠️ Suicide mission gambling with user trust and financial integrity. Unforgivable engineering negligence.',
        executiveTacticAr: 'أمان البيانات ومصداقية العلامة التجارية خط أحمر.',
        executiveTacticEn: 'Never trade data integrity and customer trust for cosmetic calendar deadlines.',
      },
      {
        id: 'executive',
        type: 'executive',
        labelAr: 'المعيار الذهبي الدبلوماسي (Executive Gold Standard)',
        labelEn: 'Resilient Stabilization Protocol',
        textEn:
          "During our final load stress-testing, our automated suites caught a high-severity concurrency edge case that would corrupt checkout state under peak traffic. To safeguard financial integrity and user trust, we are activating a 48-hour stabilization window. Our revised deployment target is Tuesday at 9:00 AM. I have established a war-room cadence and will publish an operational progress memo every 6 hours until greenlight.",
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
    contextAr: 'فريق الـ Data Platform تأخر أسبوعين عن تسليم الـ API المشترطة لإنهاء ميزة البحث، وفريقك أصبح عاطلاً عن التقدم.',
    contextEn: 'Core Data team is 2 weeks late on the search API endpoint, idling your frontend developers.',
    stakeholderSpeaker: 'Lead Engineer / Team Rep',
    stakeholderPromptEn:
      'We cannot proceed with the search filters. We have been waiting on the Data Platform API for 14 days and our sprint is grinding to a halt.',
    stakeholderPromptAr:
      'لا يمكننا الاستمرار في فلاتر البحث. نحن ننتظر واجهة برمجة تطبيقات فريق البيانات منذ 14 يوماً والشوط يتوقف تماماً.',
    options: [
      {
        id: 'weak',
        type: 'weak',
        labelAr: 'رد سلبي متفرج (Passive Bystander)',
        labelEn: 'Passive Wait-and-See',
        textEn:
          "Well, there's nothing we can do until they reply to our Slack messages. Just find something else to work on.",
        textAr:
          'حسناً، لا يمكننا فعل شيء حتى يردوا على رسائلنا في سلاك. ابحثوا عن أي شيء آخر للعمل عليه.',
        whyResultAr:
          '❌ تخلي صريح عن دور مدير المشروع في فتح الممرات وتفكيك العوائق (Clearing the Runway).',
        whyResultEn:
          '❌ Total failure of PM ownership. Leaves team adrift and wastes costly sprint engineering hours.',
        executiveTacticAr: 'دور الـ PM الحقيقي هو فتح الطريق أمام الفريق.',
        executiveTacticEn: 'A PM is fundamentally an unblocker and runway clearer.',
      },
      {
        id: 'aggressive',
        type: 'aggressive',
        labelAr: 'تصعيد عدائي في القنوات العامة (Public Shaming)',
        labelEn: 'Public Channel Shaming',
        textEn:
          "@channel Data Platform team is completely blocking our release and ignoring commitments. This is unacceptable.",
        textAr:
          '@channel فريق منصة البيانات يعطل إطلاقنا تماماً ويتجاهل التزاماته. هذا غير مقبول.',
        whyResultAr:
          '⚠️ يخلق عداوات بين الفرق ويعطل التعاون المستقبلي ويظهر عدم نضج في قنوات التواصل.',
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
    options: [
      {
        id: 'weak',
        type: 'weak',
        labelAr: 'موافقة مذعنة كارثية (Yes-Man Compliance)',
        labelEn: 'Yes-Man Compliance',
        textEn: "Understood, we will tell the team to cancel leaves and push through.",
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
        textEn: "That is completely impossible and detached from technical reality.",
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
🎯 **[Primary Sprint Objective - e.g., Shapping Stripe Billing Migration]**

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

I am raising an immediate flag regarding our dependency on [Team/System Name].

**Current Blocker:**
Our engineers are currently blocked on [Specific Component/API/Approval] which was scheduled for completion on [Agreed Date].

**Velocity Impact:**
- [Number] developers are currently stalled or context-switching.
- Without resolution by [Time/Date], our committed release of [Milestone Name] will slip by at least [Number] days.

**Proposed Resolution:**
1. Provide a temporary mock contract by [Time today], OR
2. Reallocate [Specific Engineer/Resource] for a 30-minute unblocking pairing session.

Let me know if you need a quick huddle to unlock this.`,
    templateAr: `مرحباً [اسم المدير / قائد الفريق المعني]،

أود رفع إشعار تصعيد فوري بخصوص ارتباطنا البرمجي مع [اسم الفريق / النظام].

**العائق الحالي:**
مهندسونا معطلون حالياً بانتظار [المكون / واجهة الـ API / الاعتماد المطلوب] والذي كان مجدولاً للانتهاء في [التاريخ المتفق عليه].

**الأثر على سرعة الشحن:**
- عدد [العدد] مطورين متوقفون حالياً أو يضطرون لتغيير سياق تركيزهم.
- بدون حل هذه النقطة بحلول [الوقت/اليوم]، سيتأخر إطلاقنا الملتزم به لـ [اسم المعلم] بما لا يقل عن [المدة] أيام.

**الحلول المقترحة لفتح الطريق:**
1. توفير واجهة محاكاة تجريبية (Mock Contract) بحلول [الوقت اليوم]، أو
2. تفريغ المهندس المعني لجلسة برمجة مشتركة مدتها 30 دقيقة لحسم الربط.

أنا متاح لوقفة سريعة لحسم هذا العائق وتجنيب المشروع التأخير.`,
    tipsAr: 'حدد الأثر بالأرقام والتواريخ وقدم حلولاً محددة سلفاً بدلاً من الشكوى المجردة.',
    tipsEn: 'Always quantify the business drag and propose concrete solutions when escalating.',
  },
];

const FLUENCY_DRILLS: FluencyDrill[] = [
  {
    id: 'drill_tradeoff',
    hookEn: 'The trade-off we are looking at is...',
    hookAr: 'المقايضة التي ننظر إليها هنا هي...',
    usageContextAr: 'تستخدم عندما يطلب أحد أصحاب المصلحة ميزة إضافية، لتبين له أن كل ميزة لها ثمن.',
    usageContextEn: 'Used to introduce capacity trade-offs without sounding negative.',
    exampleEn:
      'The trade-off we are looking at is either shipping on Friday with Core Search, or postponing to Tuesday to include Advanced Filters.',
    exampleAr:
      'المقايضة التي ننظر إليها هي إما الشحن الجمعة بالبحث الأساسي، أو التأجيل للثلاثاء لتضمين الفلاتر المتقدمة.',
    drillCategory: 'tradeoff',
  },
  {
    id: 'drill_perspective',
    hookEn: 'To put this into strategic perspective...',
    hookAr: 'لوضع هذا في سياقه الاستراتيجي الصحيح...',
    usageContextAr: 'تستخدم لرفع مستوى النقاش من التفاصيل التقنية الدقيقة إلى الأثر التجاري العالي.',
    usageContextEn: 'Used to zoom out from trivial debates to overarching business impact.',
    exampleEn:
      'To put this into strategic perspective, optimizing this query saves us 15 milliseconds, but fixing our onboarding drop-off doubles our user conversion.',
    exampleAr:
      'لوضع هذا في سياقه الاستراتيجي، تحسين هذا الاستعلام يوفر 15 جزءاً من الثانية، لكن إصلاح التسرب في التسجيل يضاعف تحويل العملاء.',
    drillCategory: 'perspective',
  },
  {
    id: 'drill_root_cause',
    hookEn: "Let's take a step back and examine the root cause...",
    hookAr: 'دعونا نأخذ خطوة للوراء ونفحص السبب الجذري الحقيقي...',
    usageContextAr: 'تستخدم لتهدئة اللوم وتوجيه النقاش نحو الخلل الهيكلي بدلاً من معاتبة الأفراد.',
    usageContextEn: 'Used in retrospectives to steer the room away from blame toward systemic analysis.',
    exampleEn:
      "Let's take a step back and examine the root cause: why did this regression bypass our automated staging pipelines?",
    exampleAr:
      'دعونا نأخذ خطوة للوراء ونفحص السبب الجذري: لماذا تخطى هذا الخلل بيئات الاختبار الآلية قبل الإنتاج؟',
    drillCategory: 'root_cause',
  },
  {
    id: 'drill_decouple',
    hookEn: "Let's decouple these two issues so we don't stall...",
    hookAr: 'دعونا نفصل بين هذين المسارين حتى لا يتوقف العمل...',
    usageContextAr: 'تستخدم عندما يتشابك نقاشان تقنيان مختلفان ويعطلان مسار اتخاذ القرار.',
    usageContextEn: 'Used to break architectural deadlocks by isolating independent streams.',
    exampleEn:
      "Let's decouple the authentication redesign from the UI refresh so frontend development can continue unimpeded.",
    exampleAr:
      'دعونا نفصل إعادة تصميم المصادقة عن تجديد واجهة المستخدم لكي يستمر تطوير الواجهة بلا عوائق.',
    drillCategory: 'tradeoff',
  },
  {
    id: 'drill_bandwidth',
    hookEn: 'The bottleneck right now is not bandwidth, but alignment...',
    hookAr: 'عنق الزجاجة الآن ليس ضيق الوقت أو الجهد، بل وضوح الرؤية والاتساق...',
    usageContextAr: 'تستخدم لتوضيح أن المشكلة ليست في عدد المهندسين، بل في غموض المواصفات.',
    usageContextEn: 'Used when leadership suggests throwing more headcount at an ambiguous problem.',
    exampleEn:
      'The bottleneck right now is not bandwidth, but alignment on the checkout edge-cases.',
    exampleAr:
      'عنق الزجاجة الآن ليس نقص المهندسين، بل الاتساق حول الحالات الخاصة لعملية الدفع.',
    drillCategory: 'boundary',
  },
  {
    id: 'drill_hard_stop',
    hookEn: 'I have a hard stop at [Time], so let us crystallize the action items...',
    hookAr: 'لدي التزام حتمي عند الساعة [الوقت]، لذا دعونا نبلور المهام التنفيذية المحددة...',
    usageContextAr: 'تستخدم لإنهاء الاجتماعات المائعة وتلخيص القرارات قبل الخروج.',
    usageContextEn: 'Used to respectfully end meandering meetings and force clear ownership.',
    exampleEn:
      'I have a hard stop at 2:00 PM, so let us crystallize who owns the schema definition and when it will be merged.',
    exampleAr:
      'لدي التزام حاسم في تمام الثانية، لذا دعونا نحدد بدقة من المسؤول عن دمج مخطط البيانات وموعد اكتماله.',
    drillCategory: 'boundary',
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

  // Simulator State
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isPlayingSpeaker, setIsPlayingSpeaker] = useState(false);
  const [isPlayingModelAnswer, setIsPlayingModelAnswer] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  // Voice Recording / Shadowing Practice State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [recordingScore, setRecordingScore] = useState<number | null>(null);

  // Drills State
  const [selectedDrillIndex, setSelectedDrillIndex] = useState(0);
  const [isPlayingDrill, setIsPlayingDrill] = useState(false);

  // Template Search / Filter
  const [templateFilter, setTemplateFilter] = useState<'all' | 'sprint' | 'boundary' | 'escalation' | 'focus'>('all');

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
    speechService.stopListening();
  }, [selectedScenarioIndex]);

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

  const filteredTemplates = useMemo(() => {
    if (templateFilter === 'all') return EXECUTIVE_TEMPLATES;
    return EXECUTIVE_TEMPLATES.filter((t) => t.category === templateFilter);
  }, [templateFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800/80 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/40 dark:via-zinc-950 dark:to-purple-950/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-zinc-100">
                  {isAr ? 'أستوديو القيادة الإنجليزية ومحاكي الاجتماعات' : 'Executive English PM Studio'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 uppercase">
                  Silicon Valley Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isAr
                  ? 'تمكين لغوي إداري عالي المستوى لإدارة أصحاب المصلحة والمفاوضات التقنية بثقة'
                  : 'High-stakes meeting simulations, diplomatic scripts, and executive fluency'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher Navigation */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 bg-slate-50/50 dark:bg-zinc-900/40">
          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('simulator');
            }}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isAr ? 'محاكي الاجتماعات القيادية' : 'Meeting Simulator'}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20">8</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('templates');
            }}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isAr ? 'ترسانة رسائل سلاك والبريد' : 'Slack & Email Arsenal'}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20">4</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playTactileClick();
              setActiveTab('drills');
            }}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'drills'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isAr ? 'مناورات الطلاقة والتخلص من التردد' : 'Fluency Drills'}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20">6</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: MEETING SIMULATOR */}
          {activeTab === 'simulator' && currentScenario && (
            <div className="space-y-6">
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
                    <span>{isPlayingSpeaker ? (isAr ? 'جارٍ الاستماع...' : 'Speaking...') : (isAr ? 'استمع للموقف 🔊' : 'Listen 🔊')}</span>
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
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                    {isAr ? 'كيف سترد كقائد مشروع محترف؟ (اختر استراتيجيتك)' : 'Choose Your Executive Response Strategy:'}
                  </h5>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {selectedOptionId ? (isAr ? 'تم تقييم الإجابة' : 'Graded') : (isAr ? 'اختر خياراً لتقييمه' : 'Select an option')}
                  </span>
                </div>

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
                                <span>{isPlayingModelAnswer ? (isAr ? 'جارٍ الاستماع...' : 'Speaking...') : (isAr ? 'استمع للنطق النموذجي 🎙️' : 'Hear Native Model 🎙️')}</span>
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
                                <span>{copiedTemplateId === opt.id ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ لسلاك' : 'Copy for Slack')}</span>
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
                                <span>{isRecording ? (isAr ? 'أوقف التحدث وقيم' : 'Stop & Grade') : (isAr ? 'تمرن وتحدث بالمايك 🎤' : 'Practice Speaking 🎤')}</span>
                              </button>
                            </div>

                            {/* Voice Feedback Wave if active */}
                            {isRecording && (
                              <div className="p-3 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between gap-2 animate-pulse mt-2">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  <span>{isAr ? 'تحدث بالإنجليزية الآن مستخدماً نفس العبارة...' : 'Speak the phrase aloud in English now...'}</span>
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
                        <span>{copiedTemplateId === item.id ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ القالب' : 'Copy Template')}</span>
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
                    <span>{isPlayingDrill ? (isAr ? 'جارٍ التشغيل...' : 'Playing...') : (isAr ? 'استمع للنطق والموسيقى الإدارية 🔊' : 'Listen with Audio 🔊')}</span>
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
        </div>

        {/* Footer Bar */}
        <div className="p-3.5 px-5 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{isAr ? 'تدريب فوري غير متزامن 100% داخل المتصفح' : '100% Offline & Free In-Browser Studio'}</span>
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
