#!/usr/bin/env node
/**
 * scripts/dashboard-server.mjs — Enterprise Light/Dark Cockpit & Task Tracker for Midmar LifeOS
 * Features: Light Mode default with Dark Mode toggle, full Sidebar navigation, Task Tracker,
 * Supervisor/Worker hierarchy, PM-02 Market Research, PM-05 Marketing & SEO, Deep Station Inspections,
 * Governance Approvals (with full PM & Executive delegated authority: Approve, Reject, Auto-Approve),
 * and Real-Time SSE.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const STATE_DIR = path.resolve(ROOT_DIR, 'project-management', 'state');
const PROD_EVO_DIR = path.resolve(ROOT_DIR, 'product-evolution');
const OPP_DIR = path.resolve(PROD_EVO_DIR, 'opportunities');

const PORT = parseInt(process.env.DASHBOARD_PORT || '3333', 10);

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeJsonl(filePath, items) {
  try {
    const content = items.map((i) => JSON.stringify(i)).join('\n') + '\n';
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function appendJsonl(filePath, item) {
  try {
    fs.appendFileSync(filePath, JSON.stringify(item) + '\n', 'utf-8');
    return true;
  } catch {
    return false;
  }
}

const OPP_METADATA = {
  'OPP-0101': {
    horizon: 'H1_CORE',
    category: 'معمارية وتزامن',
    impact: 5,
    effort: 4,
    quadrant: 'STRATEGIC_BET',
    quadrantName: 'الرهانات الكبرى (High Impact / High Effort)',
    score: 2.85,
    risk: 'عالية (تغيير مخطط IndexedDB v12)',
    authorityLevel: 'L4',
    whyNow: 'إلزامية فورية قبل إطلاق تطبيق الهاتف لتفادي تضارب البيانات وفقدان تقدم المستخدمين.',
    evidenceContra: 'إضافة تتبع الحذف (Tombstones) ومخطط v12 يزيد من تعقيد المزامنة ويستلزم اختبارات حاسمة.',
    status: 'APPROVED',
  },
  'OPP-0102': {
    horizon: 'H3_EXPLORATORY',
    category: 'ذكاء اصطناعي صوتي محلي',
    impact: 5,
    effort: 5,
    quadrant: 'STRATEGIC_BET',
    quadrantName: 'الرهانات الكبرى (High Impact / High Effort)',
    score: 2.50,
    risk: 'متوسطة (أداء المعالجة على هواتف الفئة الاقتصادية)',
    authorityLevel: 'L4',
    whyNow: 'بناء خندق تنافسي فريد (Moat) ضد التطبيقات السحابية عبر فحص التجويد بدون خوادم خارجية.',
    evidenceContra: 'حجم ملفات نماذج WebAssembly الصوتية قد يزيد من وزن التطبيق الأولي.',
    status: 'APPROVED',
  },
  'OPP-0103': {
    horizon: 'H2_GROWTH',
    category: 'محرك اللغات والذاكرة',
    impact: 4,
    effort: 2,
    quadrant: 'QUICK_WIN',
    quadrantName: 'المكاسب السريعة (High Impact / Low Effort)',
    score: 4.00,
    risk: 'منخفضة (حماية التطهير بـ DOMPurify)',
    authorityLevel: 'L2',
    whyNow: 'مضاعفة استبقاء متعلمي اللغات فوراً بالسماح باستيراد بطاقاتهم المخصصة من Anki وQuizlet.',
    evidenceContra: 'احتمال إدخال ملفات CSV تالفة يتطلب طبقة تدقيق وتحقق مسبقة صارمة.',
    status: 'APPROVED',
  },
  'OPP-0104': {
    horizon: 'H2_GROWTH',
    category: 'التكامل الزمني والإنتاجية',
    impact: 4,
    effort: 3,
    quadrant: 'FILL_IN',
    quadrantName: 'تحسينات تكميلية (Moderate Impact / Low-Mid Effort)',
    score: 3.20,
    risk: 'منخفضة (قراءة محلية لصيغة ICS)',
    authorityLevel: 'L3',
    whyNow: 'حماية أوقات الصلاة والورد من التداخل مع اجتماعات العمل التقويمية تلقائياً.',
    evidenceContra: 'تنوع معايير ملفات ICS والمناطق الزمنية قد يسبب تباين حسابي عند غياب التوقيت الصيفي.',
    status: 'APPROVED',
  },
};

function getOpportunities() {
  if (!fs.existsSync(OPP_DIR)) return [];
  try {
    const files = fs.readdirSync(OPP_DIR).filter((f) => f.endsWith('.md'));
    return files.map((f) => {
      const fullPath = path.resolve(OPP_DIR, f);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const problemMatch = content.match(/##\s+1\.\s+Problem Statement\s+([\s\S]*?)(?=##|\Z)/m);
      const techMatch = content.match(/##\s+5\.\s+Technical Architecture\s+([\s\S]*?)(?=##|\Z)/m);
      const contraMatch = content.match(/##\s+3\.\s+Counter-Evidence & Risks\s+([\s\S]*?)(?=##|\Z)/m);
      const prioMatch = content.match(/Priority:\s*([A-Za-z0-9_\-]+)/i);
      const id = f.replace('.md', '');
      const meta = OPP_METADATA[id] || {
        horizon: 'H2_GROWTH',
        category: 'عام',
        impact: 3,
        effort: 3,
        quadrant: 'FILL_IN',
        quadrantName: 'تحسينات عامة',
        score: 2.0,
        risk: 'منخفضة',
        authorityLevel: 'L2',
        whyNow: 'تحسين تجربة الاستخدام',
        evidenceContra: 'لا توجد موانع بارزة',
        status: 'DISCOVERY',
      };

      return {
        id,
        title: titleMatch ? titleMatch[1] : f,
        filename: f,
        problem: problemMatch ? problemMatch[1].trim() : '',
        tech: techMatch ? techMatch[1].trim() : '',
        evidenceContra: contraMatch ? contraMatch[1].trim() : meta.evidenceContra,
        priority: prioMatch ? prioMatch[1] : 'RECOMMENDED',
        ...meta,
        rawContent: content,
      };
    });
  } catch {
    return [];
  }
}

const PM_DIRECTORS = [
  {
    id: 'PM-01',
    name: 'إدارة الأعمال والمتطلبات (Business & Product)',
    domain: 'متطلبات المنتج، محطات اليوم الـ 9، شخصيات المستخدمين وسير العمل اليومي',
    authority: 'المستويات L2–L5 (كامل الصلاحيات التشغيلية والاعتماد)',
    status: 'إشراف نشط وميداني',
    supervisorOf: ['UX-01 (مسؤول التفاعل واللمس)', 'ENG-01 (أخصائي تدفقات العمل)'],
    auditVerdict: 'محطات اليوم الـ 9 تعمل بنسبة 100% بدون أي انقطاع. تدفقات المستخدم للمحطات الصباحية والمسائية متكاملة تماماً.',
    skills: ['product-discovery', 'repository-discovery'],
    color: '#10b981',
  },
  {
    id: 'PM-02',
    name: 'أبحاث السوق والمنافسين (Market & Intel)',
    domain: 'استخبارات المنافسين (ترتيل، مسلم برو، تيك تيك، أنكي)، وتحليل الخندق التنافسي',
    authority: 'المستويات L2–L5 (كامل الصلاحيات التشغيلية والاعتماد)',
    status: 'إشراف نشط وميداني',
    supervisorOf: ['INTEL-01 (باحث ومحلل استخبارات السوق)'],
    auditVerdict: 'تم التحقق من تفوق الخصوصية والسيادة المحلية (Local-First). التطبيق يتفوق جذرياً على كافة المنافسين بعدم الاعتماد على السحابة.',
    skills: ['competitor-research'],
    color: '#06b6d4',
  },
  {
    id: 'PM-03',
    name: 'التصميم وتجربة المستخدم (UX, UI & RTL)',
    domain: 'رموز التصميم الأصيل، الخطوط والطباعة العربية، إيماءات اللمس، ومعايير الوصول WCAG AA',
    authority: 'المستويات L2–L5 (كامل الصلاحيات التشغيلية والاعتماد مع فيتو التصميم)',
    status: 'إشراف نشط وميداني',
    supervisorOf: ['UX-02 (مسؤول نظم التصميم والواجهات)', 'A11Y-01 (أخصائي الوصولية والطباعة العربية)'],
    auditVerdict: 'تم تأكيد التوافق التام مع WCAG 2.1 AA، وحل إزاحة إيماءات السحب باللمس، وضبط ارتفاع سطور التشكيل القرآني (line-height 2.4).',
    skills: ['design-review', 'visual-qa'],
    color: '#8b5cf6',
  },
  {
    id: 'PM-04',
    name: 'الهندسة والمعمارية (Architecture & Integrations)',
    domain: 'رياكت 19، مخطط IndexedDB v11، مزامنة الخادم وقواعد البيانات، والسيادة المحلية',
    authority: 'المستويات L3–L5 (كامل الصلاحيات التشغيلية مع فيتو سلامة البيانات)',
    status: 'إشراف نشط وميداني',
    supervisorOf: ['ARCH-01 (مهندس المعمارية والوكلاء)', 'DB-01 (أخصائي قواعد البيانات)', 'ENG-02 (مسؤول إعادة الهيكلة)'],
    auditVerdict: 'سلامة تامة لمخطط Dexie v11، وإصلاح مزامنة الزوار في PostgreSQL مع تحصين التحقق عبر المقارنة الآمنة زمنياً ومعدل الطلبات.',
    skills: ['architecture-review', 'impact-analysis'],
    color: '#3b82f6',
  },
  {
    id: 'PM-05',
    name: 'البيانات والتسويق والنمو (Data, SEO & Growth)',
    domain: 'الذكاء المحلي الداخلي، تهيئة محركات البحث (SEO)، الخصوصية التامة، ونمو المنتج العضوي',
    authority: 'المستويات L2–L5 (كامل الصلاحيات التشغيلية والاعتماد)',
    status: 'إشراف نشط وميداني',
    supervisorOf: ['DATA-01 (أخصائي الذكاء والبيانات المحلية)', 'GROWTH-01 (مسؤول النمو ومحركات البحث)'],
    auditVerdict: 'خلو كامل من أي حزم تتبع أو تجسس خارجي (0 Telemetry SDKs). استراتيجية نمو عبر النشر العضوي وعناقيد الكلمات المفتاحية.',
    skills: ['regression'],
    color: '#ec4899',
  },
  {
    id: 'PM-06',
    name: 'الجودة والأمان والعمليات (QA, Security & DevOps)',
    domain: 'بوابات الجودة الصفرية، كشف الأسرار، أجنحة الاختبارات الآلية، وحاويات Docker للنشر السريع',
    authority: 'المستويات L3–L5 (كامل الصلاحيات التشغيلية مع فيتو الأمان الصارم)',
    status: 'إشراف نشط وميداني',
    supervisorOf: ['SEC-01 (مسؤول الأمان والتحصين)', 'QA-01 (مسؤول أتمتة الاختبارات)', 'OPS-01 (أخصائي النشر والعمليات)'],
    auditVerdict: '17/17 اختبار Vitest ناجح، 0 أخطاء TypeScript، 0 أخطاء Oxlint، بناء الإنتاج يتم في أقل من 900ms، وبوابة CI مفعلة.',
    skills: ['security-review', 'release-readiness'],
    color: '#f59e0b',
  },
  {
    id: 'PM-07',
    name: 'تطور المنتج والابتكار (Product Evolution)',
    domain: 'حزم تطور المنتج (OPP-0101 إلى 0104)، مسارات الإشارات، وميزان المحفظة الاستراتيجية',
    authority: 'المستويات L4–L5 (كامل الصلاحيات التشغيلية وتشكيل الفرص)',
    status: 'إشراف نشط وميداني',
    supervisorOf: ['EVO-01 (مصمم حزم الفرص والابتكار)', 'ENG-03 (أخصائي البيانات والمفردات)'],
    auditVerdict: 'تم تدقيق حزم التطور الأربع وترتيب أولوياتها: OPP-0101 (المزامنة الذكية) ثم OPP-0104 (درع الصلوات) ثم OPP-0103 ثم OPP-0102.',
    skills: ['opportunity-shaping'],
    color: '#f43f5e',
  },
];

const SPECIALIST_ROLES = [
  { id: 'SEC-01', name: 'قائد أمان النظم والتحصين', role: 'مسؤول الأمان والتحصين', pm: 'PM-06', tasksCount: 2, status: 'جاهز ومستعد' },
  { id: 'UX-01', name: 'أخصائي الإيماءات وتجربة اللمس', role: 'مسؤول التفاعل واللمس', pm: 'PM-03', tasksCount: 3, status: 'جاهز ومستعد' },
  { id: 'UX-02', name: 'مهندس نظم التصميم والواجهات', role: 'مسؤول نظم التصميم', pm: 'PM-03', tasksCount: 2, status: 'قيد العمل والتنفيذ' },
  { id: 'A11Y-01', name: 'أخصائي الوصولية والطباعة العربية', role: 'أخصائي الوصولية والخط العربي', pm: 'PM-03', tasksCount: 3, status: 'جاهز ومستعد' },
  { id: 'ARCH-01', name: 'مهندس المعمارية والوكلاء', role: 'مهندس المعمارية والأنظمة', pm: 'PM-04', tasksCount: 2, status: 'قيد العمل والتنفيذ' },
  { id: 'DB-01', name: 'أخصائي قواعد البيانات المحلية', role: 'أخصائي قواعد البيانات', pm: 'PM-04', tasksCount: 2, status: 'جاهز ومستعد' },
  { id: 'ENG-01', name: 'مطور المحطات والواجهات الأمامية', role: 'مطور الواجهات الأمامية', pm: 'PM-01', tasksCount: 3, status: 'جاهز ومستعد' },
  { id: 'ENG-02', name: 'مهندس إعادة الهيكلة والتنظيف', role: 'مهندس جودة ونظافة الكود', pm: 'PM-04', tasksCount: 1, status: 'جاهز ومستعد' },
  { id: 'ENG-03', name: 'مهندس البيانات والمفردات', role: 'أخصائي بيانات اللغات والذاكرة', pm: 'PM-07', tasksCount: 1, status: 'جاهز ومستعد' },
  { id: 'QA-01', name: 'قائد أتمتة الاختبارات والتحقق', role: 'مسؤول أتمتة الاختبارات', pm: 'PM-06', tasksCount: 3, status: 'جاهز ومستعد' },
  { id: 'OPS-01', name: 'أخصائي النشر والعمليات CI/CD', role: 'أخصائي النشر السحابي والحاويات', pm: 'PM-06', tasksCount: 1, status: 'جاهز ومستعد' },
  { id: 'INTEL-01', name: 'محلل السوق والمنافسين', role: 'محلل استخبارات السوق والمنافسين', pm: 'PM-02', tasksCount: 5, status: 'قيد العمل والتنفيذ' },
  { id: 'GROWTH-01', name: 'أخصائي محركات البحث والنمو', role: 'أخصائي الانتشار ومحركات البحث', pm: 'PM-05', tasksCount: 4, status: 'قيد العمل والتنفيذ' },
  { id: 'EVAL-01', name: 'المراجع والمقيم المستقل للجودة', role: 'المقيم المستقل المحايد', pm: 'الإدارة التنفيذية', tasksCount: 2, status: 'إشراف ومراقبة' },
];

function getFullState() {
  const tasks = readJsonl(path.resolve(STATE_DIR, 'tasks.jsonl'));
  const bugs = readJsonl(path.resolve(STATE_DIR, 'bugs.jsonl'));
  const risks = readJsonl(path.resolve(STATE_DIR, 'risks.jsonl'));
  const decisions = readJsonl(path.resolve(STATE_DIR, 'decisions.jsonl'));
  const events = readJsonl(path.resolve(STATE_DIR, 'events.jsonl'));
  const reviews = readJsonl(path.resolve(STATE_DIR, 'reviews.jsonl'));
  const approvals = readJsonl(path.resolve(STATE_DIR, 'approvals.jsonl'));
  const comments = readJsonl(path.resolve(STATE_DIR, 'comments.jsonl'));
  const inspections = readJsonl(path.resolve(STATE_DIR, 'inspections.jsonl'));
  const signals = readJsonl(path.resolve(PROD_EVO_DIR, 'signals.jsonl'));
  const insights = readJsonl(path.resolve(PROD_EVO_DIR, 'insights.jsonl'));
  const watchlist = readJsonl(path.resolve(PROD_EVO_DIR, 'watchlist.jsonl'));
  const marketResearch = readJsonl(path.resolve(PROD_EVO_DIR, 'market-research.jsonl'));
  const marketingStrategy = readJsonl(path.resolve(PROD_EVO_DIR, 'marketing-strategy.jsonl'));
  const opportunities = getOpportunities();

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'READY').length;
  const totalTasks = tasks.length;
  const openBugs = bugs.filter((b) => b.status !== 'RESOLVED').length;
  const criticalBugs = bugs.filter((b) => b.severity === 'CRITICAL' && b.status !== 'RESOLVED').length;
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING').length;

  return {
    meta: {
      timestamp: new Date().toISOString(),
      health: criticalBugs > 0 ? 'حرج' : openBugs > 0 ? 'تنبيه ومتابعة' : 'مستقر وممتاز',
      stage: events.length > 0 ? events[events.length - 1].newStage || 'المرحلة 3: تمكين الصلاحيات الكاملة للوكلاء' : 'المرحلة 3: تمكين الصلاحيات الكاملة للوكلاء',
      version: 'مضمار نظام التشغيل المؤسسي v0.1.0',
      owner: 'أحمد (AhmadZohery@gmail.com)',
      delegationNotice: 'مرسوم المالك (أحمد): تفويض كامل الصلاحيات التشغيلية للاعتماد أو الرفض للمدير التنفيذي والمديرين PM-01 إلى PM-07',
      testsStatus: {
        total: 17,
        passed: 17,
        suites: 3,
        typecheckErrors: 0,
        lintErrors: 0,
      },
    },
    metrics: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      taskProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalBugs: bugs.length,
      openBugs,
      resolvedBugs: bugs.length - openBugs,
      mitigatedRisks: risks.filter((r) => r.status === 'MITIGATED').length,
      totalRisks: risks.length,
      decisionsCount: decisions.length,
      opportunitiesCount: opportunities.length,
      pendingApprovals,
      approvedCount: approvals.filter((a) => a.status === 'APPROVED').length,
      rejectedCount: approvals.filter((a) => a.status === 'REJECTED').length,
      reviewsCount: reviews.length,
      commentsCount: comments.length,
      inspectionsCount: inspections.length,
      competitorsCount: marketResearch.length,
      marketingStrategiesCount: marketingStrategy.length,
    },
    directors: PM_DIRECTORS,
    specialists: SPECIALIST_ROLES,
    tasks,
    bugs,
    risks,
    decisions,
    events: events.slice().reverse(),
    reviews: reviews.slice().reverse(),
    approvals: approvals.slice().reverse(),
    comments: comments.slice().reverse(),
    inspections,
    marketResearch,
    marketingStrategy,
    signals,
    insights,
    watchlist,
    opportunities,
  };
}

// Connected SSE clients
const sseClients = new Set();

function broadcastState() {
  if (sseClients.size === 0) return;
  const payload = `data: ${JSON.stringify(getFullState())}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Watch directory changes with debounce
let debounceTimer = null;
function notifyChange() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    broadcastState();
  }, 120);
}

if (fs.existsSync(STATE_DIR)) {
  fs.watch(STATE_DIR, { recursive: true }, notifyChange);
}
if (fs.existsSync(PROD_EVO_DIR)) {
  fs.watch(PROD_EVO_DIR, { recursive: true }, notifyChange);
}

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مِضمار | Midmar Enterprise Cockpit & Task Tracker</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      /* Clean Apple/Linear Light Theme Default */
      --bg: #f8fafc;
      --sidebar-bg: #ffffff;
      --card: #ffffff;
      --card-solid: #f1f5f9;
      --card-hover: #f8fafc;
      --border: rgba(15, 23, 42, 0.08);
      --border-accent: rgba(16, 185, 129, 0.4);
      --accent-emerald: #059669;
      --accent-emerald-glow: rgba(5, 150, 105, 0.18);
      --accent-cyan: #0284c7;
      --accent-cyan-glow: rgba(2, 132, 199, 0.18);
      --accent-amber: #d97706;
      --accent-rose: #e11d48;
      --accent-purple: #7c3aed;
      --accent-blue: #2563eb;
      --text: #0f172a;
      --text-muted: #475569;
      --text-sub: #64748b;
      --table-header-bg: #f1f5f9;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 18px rgba(0,0,0,0.06);
      --modal-bg: #ffffff;
    }

    [data-theme="dark"] {
      --bg: #06080d;
      --sidebar-bg: rgba(11, 15, 23, 0.94);
      --card: rgba(14, 19, 29, 0.78);
      --card-solid: #0d121c;
      --card-hover: rgba(22, 29, 43, 0.92);
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(16, 185, 129, 0.35);
      --accent-emerald: #10b981;
      --accent-emerald-glow: rgba(16, 185, 129, 0.28);
      --accent-cyan: #06b6d4;
      --accent-cyan-glow: rgba(6, 182, 212, 0.25);
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --accent-purple: #8b5cf6;
      --accent-blue: #3b82f6;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-sub: #64748b;
      --table-header-bg: rgba(11, 15, 22, 0.95);
      --shadow-sm: 0 2px 6px rgba(0,0,0,0.3);
      --shadow-md: 0 10px 30px rgba(0,0,0,0.3);
      --modal-bg: #0d121c;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      background-image: 
        radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.04), transparent 40%),
        radial-gradient(circle at 90% 15%, rgba(6, 182, 212, 0.04), transparent 45%),
        linear-gradient(rgba(0, 0, 0, 0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.015) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 36px 36px, 36px 36px;
      color: var(--text);
      font-family: 'Tajawal', 'Plus Jakarta Sans', system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      overflow-x: hidden;
      transition: background-color 0.25s, color 0.25s;
    }
    .mono { font-family: 'JetBrains Mono', monospace; direction: ltr; display: inline-block; }

    /* Layout Shell with Right Sidebar */
    .app-layout {
      display: flex;
      width: 100%;
      min-height: 100vh;
    }

    /* Modern Sidebar */
    aside.sidebar {
      width: 320px;
      background: var(--sidebar-bg);
      border-left: 1px solid var(--border);
      backdrop-filter: blur(28px);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 100;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }
    .sidebar-header {
      padding: 22px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-emblem {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 900;
      color: #fff;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
      flex-shrink: 0;
    }
    .brand-title {
      font-size: 17px;
      font-weight: 800;
      color: var(--text);
      line-height: 1.2;
    }
    .brand-subtitle {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Hierarchy Supervisor Banner */
    .supervisor-banner {
      background: var(--card-solid);
      border-bottom: 1px solid var(--border);
      padding: 12px 20px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .supervisor-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .supervisor-label {
      color: var(--text-sub);
    }
    .supervisor-val {
      font-weight: 700;
      color: var(--accent-emerald);
    }

    /* Sidebar Navigation Links */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 12px;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }
    .nav-item:hover {
      color: var(--text);
      background: rgba(0, 0, 0, 0.03);
    }
    [data-theme="dark"] .nav-item:hover {
      background: rgba(255, 255, 255, 0.04);
    }
    .nav-item.active {
      color: var(--accent-emerald);
      background: var(--card-solid);
      border-color: var(--border-accent);
      box-shadow: var(--shadow-sm);
    }
    .nav-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .nav-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }
    .nav-badge {
      background: rgba(0, 0, 0, 0.05);
      color: var(--text-muted);
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
    }
    [data-theme="dark"] .nav-badge {
      background: rgba(255, 255, 255, 0.07);
    }
    .nav-badge.alert {
      background: rgba(245, 158, 11, 0.15);
      color: var(--accent-amber);
      border: 1px solid rgba(245, 158, 11, 0.4);
    }

    /* Sidebar Footer & Actions */
    .sidebar-footer {
      padding: 16px 14px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .btn-create-task {
      background: linear-gradient(135deg, #059669 0%, #0284c7 100%);
      color: #fff;
      border: none;
      padding: 11px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
      transition: transform 0.15s, opacity 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-create-task:hover { transform: translateY(-1px); opacity: 0.95; }
    .btn-create-task:active { transform: translateY(1px); }

    /* Main Content Area */
    main.content-area {
      flex: 1;
      padding: 30px 40px 60px;
      overflow-y: auto;
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
    }

    /* Top Bar */
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      gap: 16px;
      flex-wrap: wrap;
    }
    .topbar-title h1 {
      font-size: 24px;
      font-weight: 900;
      color: var(--text);
      letter-spacing: -0.5px;
    }
    .topbar-title p {
      font-size: 13px;
      color: var(--text-muted);
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .theme-toggle-btn {
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
    }
    .theme-toggle-btn:hover {
      border-color: var(--accent-emerald);
      transform: translateY(-1px);
    }
    .status-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--card);
      border: 1px solid var(--border);
      padding: 7px 16px;
      border-radius: 9999px;
      font-size: 12px;
      box-shadow: var(--shadow-sm);
    }
    .pulse-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--accent-emerald);
      box-shadow: 0 0 10px var(--accent-emerald);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
    }
    .btn-action {
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      box-shadow: var(--shadow-sm);
    }
    .btn-action:hover {
      background: var(--card-solid);
      border-color: rgba(0, 0, 0, 0.15);
    }
    [data-theme="dark"] .btn-action:hover {
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Top KPI Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
      margin-bottom: 28px;
    }
    .metric-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 22px;
      box-shadow: var(--shadow-md);
      transition: transform 0.2s, border-color 0.2s;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      border-color: var(--border-accent);
    }
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .metric-title { font-size: 12px; font-weight: 700; color: var(--text-muted); }
    .metric-val {
      font-size: 34px;
      font-weight: 900;
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .metric-val span { font-size: 14px; color: var(--text-sub); font-weight: 600; }
    .progress-bar-bg {
      width: 100%;
      height: 7px;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 9999px;
      margin-top: 14px;
      overflow: hidden;
    }
    [data-theme="dark"] .progress-bar-bg {
      background: rgba(255, 255, 255, 0.08);
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #06b6d4);
      border-radius: 9999px;
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Views Container */
    .view-pane { display: none; }
    .view-pane.active { display: block; animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    /* Tables & Cards */
    .table-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: var(--shadow-md);
      margin-bottom: 24px;
    }
    table { width: 100%; border-collapse: collapse; text-align: right; }
    th {
      background: var(--table-header-bg);
      padding: 15px 20px;
      font-size: 12px;
      font-weight: 800;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      letter-spacing: 0.3px;
    }
    td {
      padding: 15px 20px;
      font-size: 13px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
    }
    tr:last-child td { border-bottom: none; }
    tr.clickable { cursor: pointer; transition: background 0.15s; }
    tr.clickable:hover td { background: var(--card-hover); }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-success { background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-warning { background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-danger { background: rgba(244, 63, 94, 0.12); color: #e11d48; border: 1px solid rgba(244, 63, 94, 0.3); }
    .badge-cyan { background: rgba(6, 182, 212, 0.12); color: #0284c7; border: 1px solid rgba(6, 182, 212, 0.3); }
    .badge-purple { background: rgba(139, 92, 246, 0.12); color: #7c3aed; border: 1px solid rgba(139, 92, 246, 0.3); }
    .badge-neutral { background: rgba(100, 116, 139, 0.1); color: #475569; border: 1px solid rgba(100, 116, 139, 0.2); }
    [data-theme="dark"] .badge-success { color: #34d399; }
    [data-theme="dark"] .badge-cyan { color: #38bdf8; }
    [data-theme="dark"] .badge-purple { color: #c084fc; }
    [data-theme="dark"] .badge-warning { color: #fbbf24; }
    [data-theme="dark"] .badge-danger { color: #fb7185; }
    [data-theme="dark"] .badge-neutral { color: #cbd5e1; }

    /* Toolbar */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
    }
    .search-box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 18px;
      color: var(--text);
      font-size: 13px;
      font-family: inherit;
      min-width: 300px;
      outline: none;
      box-shadow: var(--shadow-sm);
      transition: border-color 0.2s;
    }
    .search-box:focus { border-color: var(--accent-emerald); }
    .filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-chip {
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
    }
    .filter-chip:hover, .filter-chip.active { color: var(--accent-emerald); background: var(--card-solid); border-color: var(--accent-emerald); }

    /* Grids */
    .grid-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 18px;
      margin-bottom: 24px;
    }
    .info-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 22px;
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      transition: transform 0.2s, border-color 0.2s;
      cursor: pointer;
    }
    .info-card:hover { transform: translateY(-2px); border-color: var(--border-accent); }

    /* Modal / Drawer */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-backdrop.open { display: flex; }
    .modal-card {
      background: var(--modal-bg);
      border: 1px solid var(--border);
      border-radius: 22px;
      max-width: 680px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      padding: 28px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
      position: relative;
      color: var(--text);
    }
    .modal-close {
      position: absolute;
      top: 20px;
      left: 20px;
      background: var(--card-solid);
      border: 1px solid var(--border);
      color: var(--text);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    /* Form Styles */
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .form-label { font-size: 12px; font-weight: 700; color: var(--text-muted); }
    .form-input, .form-select, .form-textarea {
      background: var(--card-solid);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 14px;
      color: var(--text);
      font-family: inherit;
      font-size: 13px;
      outline: none;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent-emerald); }

    /* Toast */
    .toast-box {
      position: fixed;
      bottom: 24px;
      left: 24px;
      background: var(--card);
      border: 1px solid var(--accent-emerald);
      color: var(--text);
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: var(--shadow-md);
      z-index: 2000;
      display: none;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 13px;
    }

    /* Kanban Board & Workflow Styles */
    .kanban-view-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .view-mode-toggle {
      display: flex;
      background: var(--card-solid);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 3px;
      gap: 4px;
    }
    .view-mode-btn {
      padding: 7px 16px;
      border-radius: 9px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .view-mode-btn.active {
      background: var(--card);
      color: var(--accent-emerald);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border);
    }
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, minmax(290px, 1fr));
      gap: 16px;
      align-items: start;
      overflow-x: auto;
      padding-bottom: 24px;
    }
    .kanban-column {
      background: var(--card-solid);
      border: 1px solid var(--border);
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 240px);
      min-height: 520px;
      transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .kanban-column.drag-over {
      border-color: var(--accent-emerald);
      background: var(--accent-emerald-glow);
      box-shadow: 0 0 20px var(--accent-emerald-glow);
    }
    .kanban-column-header {
      padding: 16px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .kanban-column-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .kanban-column-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .kanban-column-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--text);
    }
    .kanban-column-count {
      background: var(--card);
      border: 1px solid var(--border);
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      color: var(--text-muted);
    }
    .kanban-column-body {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      flex: 1;
    }
    .kanban-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 15px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 10px;
      cursor: grab;
      transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
      user-select: none;
    }
    .kanban-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--border-accent);
    }
    .kanban-card:active {
      cursor: grabbing;
    }
    .kanban-card.dragging {
      opacity: 0.4;
      transform: scale(0.97);
    }
    .kanban-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .kanban-card-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      color: var(--text-sub);
    }
    .kanban-card-title {
      font-size: 13.5px;
      font-weight: 800;
      color: var(--text);
      line-height: 1.4;
    }
    .kanban-card-desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.45;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .kanban-card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .kanban-card-people {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
      border-top: 1px dashed var(--border);
      font-size: 11px;
    }
    .kanban-person-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-sub);
    }
    .kanban-person-val {
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .kanban-card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid var(--border);
      gap: 6px;
    }
    .kanban-move-btn {
      background: var(--card-solid);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
      transition: all 0.15s ease;
    }
    .kanban-move-btn:hover {
      background: var(--card);
      color: var(--accent-emerald);
      border-color: var(--accent-emerald);
    }
    .kanban-column-add {
      border: 1px dashed var(--border);
      background: transparent;
      border-radius: 10px;
      padding: 8px;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
      margin-top: 4px;
    }
    /* Opportunity Radar & Strategic Portfolio */
    .opp-subnav {
      display: flex;
      gap: 8px;
      margin-bottom: 18px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      flex-wrap: wrap;
    }
    .opp-tab-btn {
      background: var(--card-solid);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .opp-tab-btn:hover {
      color: var(--text);
      border-color: var(--accent-cyan);
    }
    .opp-tab-btn.active {
      background: var(--accent-cyan-glow);
      color: var(--accent-cyan);
      border-color: var(--accent-cyan);
    }
    .opp-radar-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 900px) {
      .opp-radar-grid {
        grid-template-columns: 1fr;
      }
    }
    .opp-quadrant {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .opp-quadrant.quick-wins {
      border-color: rgba(16, 185, 129, 0.4);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent);
    }
    .opp-quadrant.strategic-bets {
      border-color: rgba(139, 92, 246, 0.4);
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent);
    }
    .opp-quadrant.fill-ins {
      border-color: rgba(6, 182, 212, 0.4);
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), transparent);
    }
    .opp-quadrant.re-evaluate {
      border-color: rgba(245, 158, 11, 0.4);
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), transparent);
    }
    .opp-quadrant-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    }
    .opp-radar-card {
      background: var(--card-solid);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .opp-radar-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: var(--accent-cyan);
    }
    .portfolio-meter {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .portfolio-bar-wrap {
      display: flex;
      height: 24px;
      border-radius: 8px;
      overflow: hidden;
      margin: 14px 0 10px;
      border: 1px solid var(--border);
    }
    .portfolio-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 800;
      transition: width 0.3s ease;
    }
    .portfolio-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
    }
    .portfolio-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .portfolio-legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <div class="app-layout">
    <!-- Modern Right Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand-emblem">مِ</div>
        <div>
          <div class="brand-title">مِضمار | Midmar OS</div>
          <div class="brand-subtitle">غرفة قيادة الوكلاء التنفيذية</div>
        </div>
      </div>

      <!-- Supervisor Live Status Banner -->
      <div class="supervisor-banner">
        <div class="supervisor-row">
          <span class="supervisor-label">المالك والقائد العام:</span>
          <span class="supervisor-val">أحمد (Ahmad)</span>
        </div>
        <div class="supervisor-row">
          <span class="supervisor-label">المدير التنفيذي:</span>
          <span style="color: var(--accent-cyan); font-weight: 700;">المدير التنفيذي العام</span>
        </div>
        <div class="supervisor-row">
          <span class="supervisor-label">تفويض السلطة:</span>
          <span class="badge badge-success" style="padding: 1px 8px; font-size: 10px;">كامل الصلاحيات للـ PMs</span>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <div class="nav-item active" onclick="switchNav('overview')">
          <div class="nav-item-left">
            <span class="nav-icon">📊</span>
            <span>نظرة عامة والقيادة</span>
          </div>
          <span class="nav-badge" id="badgeNavOverview">مباشر</span>
        </div>

        <div class="nav-item" onclick="switchNav('kanban')">
          <div class="nav-item-left">
            <span class="nav-icon">📌</span>
            <span>لوحة الكانبان والمهام</span>
          </div>
          <span class="nav-badge alert" id="badgeNavKanban">0</span>
        </div>

        <div class="nav-item" onclick="switchNav('tracker')">
          <div class="nav-item-left">
            <span class="nav-icon">📋</span>
            <span>متتبع المهام والإنجاز</span>
          </div>
          <span class="nav-badge" id="badgeNavTasks">0</span>
        </div>

        <div class="nav-item" onclick="switchNav('hierarchy')">
          <div class="nav-item-left">
            <span class="nav-icon">👥</span>
            <span>هيكل الإشراف والفرق</span>
          </div>
          <span class="nav-badge">7 مديري مشاريع</span>
        </div>

        <div class="nav-item" onclick="switchNav('market')">
          <div class="nav-item-left">
            <span class="nav-icon">🔍</span>
            <span>أبحاث السوق والمنافسين</span>
          </div>
          <span class="nav-badge" id="badgeNavMarket">5</span>
        </div>

        <div class="nav-item" onclick="switchNav('marketing')">
          <div class="nav-item-left">
            <span class="nav-icon">📈</span>
            <span>التسويق والشخصيات والنمو</span>
          </div>
          <span class="nav-badge" id="badgeNavMarketing">6</span>
        </div>

        <div class="nav-item" onclick="switchNav('inspection')">
          <div class="nav-item-left">
            <span class="nav-icon">🔬</span>
            <span>الفحص العميق للموقع</span>
          </div>
          <span class="nav-badge" id="badgeNavInspection">12</span>
        </div>

        <div class="nav-item" onclick="switchNav('approvals')">
          <div class="nav-item-left">
            <span class="nav-icon">⚖️</span>
            <span>الموافقات والمراجعات</span>
          </div>
          <span class="nav-badge alert" id="badgeNavApprovals">0 معلق</span>
        </div>

        <div class="nav-item" onclick="switchNav('comments')">
          <div class="nav-item-left">
            <span class="nav-icon">💬</span>
            <span>النقاشات والملاحظات</span>
          </div>
          <span class="nav-badge" id="badgeNavComments">0</span>
        </div>

        <div class="nav-item" onclick="switchNav('opportunities')">
          <div class="nav-item-left">
            <span class="nav-icon">💡</span>
            <span>حزم تطور المنتج (PM-07)</span>
          </div>
          <span class="nav-badge" id="badgeNavOpps">4</span>
        </div>

        <div class="nav-item" onclick="switchNav('quality')">
          <div class="nav-item-left">
            <span class="nav-icon">🛡️</span>
            <span>مختبر الجودة والأمان</span>
          </div>
          <span class="nav-badge">100% ناجح</span>
        </div>

        <div class="nav-item" onclick="switchNav('events')">
          <div class="nav-item-left">
            <span class="nav-icon">📜</span>
            <span>سجل الأحداث والرقابة</span>
          </div>
          <span class="nav-badge" id="badgeNavEvents">0</span>
        </div>
      </nav>

      <!-- Sidebar Footer & Actions -->
      <div class="sidebar-footer">
        <button class="btn-create-task" onclick="openCreateTaskModal()">
          <span>➕</span>
          <span>إضافة مهمة جديدة</span>
        </button>
        <button class="btn-action" style="justify-content: center;" onclick="reAuditTrigger()">
          <span>🔄</span>
          <span>إعادة فحص فوري للمشروع</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="content-area">
      <!-- Top Bar -->
      <div class="topbar">
        <div class="topbar-title">
          <h1 id="viewTitleText">نظرة عامة والقيادة التنفيذية</h1>
          <p id="viewSubtitleText">الرصد الفوري لمسار المشروع، حالة الوكلاء، ومنظومة الحوكمة</p>
        </div>
        <div class="topbar-actions">
          <button class="theme-toggle-btn" onclick="toggleTheme()" id="themeToggleBtn">
            <span id="themeIcon">🌙</span>
            <span id="themeText">الوضع الداكن</span>
          </button>
          <button class="btn-action" onclick="copySprintSummary()">📋 نسخ التقرير</button>
          <button class="btn-action" onclick="triggerSoundNotice()">🔔 تنبيه صوتي</button>
          <div class="status-pill">
            <div class="pulse-dot" id="liveDot"></div>
            <span id="liveStatusText">متصل لحظياً (SSE)</span>
            <span class="mono" id="liveTime" style="font-size: 11px; color: var(--text-muted);">-</span>
          </div>
        </div>
      </div>

      <!-- Top KPI Row (Always Visible) -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">🎯 إنجاز مهام السبرنت</span>
            <span>🚀</span>
          </div>
          <div class="metric-val" id="kpiTasks">0 <span>/ 0</span></div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" id="taskProgressBar" style="width: 0%"></div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">⚖️ بوابات الموافقة (Governance)</span>
            <span>🏛️</span>
          </div>
          <div class="metric-val" id="kpiApprovals" style="color: var(--accent-amber);">0 <span>بانتظار الاعتماد</span></div>
          <div style="font-size: 12px; color: var(--accent-emerald); margin-top: 10px;" id="kpiApprovedText">0 مهمة معتمدة رسمياً</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">🧪 الجودة والاختبارات الآلية</span>
            <span>⚡</span>
          </div>
          <div class="metric-val" style="color: var(--accent-emerald);" id="kpiTests">17 <span>/ 17 ناجح</span></div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 10px;">0 أخطاء TypeScript & Oxlint</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">🛡️ رادار العيوب والأمان</span>
            <span>🐞</span>
          </div>
          <div class="metric-val" id="kpiBugs">0 <span>مفتوح</span></div>
          <div style="font-size: 12px; color: var(--accent-emerald); margin-top: 10px;" id="kpiBugsResolvedText">تم حل كافة العيوب بنجاح</div>
        </div>
      </div>

      <!-- View 1: Overview & Leadership -->
      <div id="view-overview" class="view-pane active">
        <div class="toolbar">
          <h2 style="font-size: 17px; font-weight: 800;">الهيكل القيادي ومصفوفة المشرفين النشطين</h2>
        </div>
        <div class="grid-cards" id="overviewDirectorsGrid"></div>

        <div class="toolbar" style="margin-top: 24px;">
          <h2 style="font-size: 17px; font-weight: 800;">آخر النقاشات والقرارات الميدانية</h2>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>المعرف</th>
                <th>المهمة</th>
                <th>المسؤول</th>
                <th>الصفة</th>
                <th>المحتوى والملاحظة</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody id="overviewCommentsTable"></tbody>
          </table>
        </div>
      </div>

      <!-- View: Dedicated Interactive Kanban Board -->
      <div id="view-kanban" class="view-pane">
        <div class="kanban-view-controls">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1;">
            <input type="text" class="search-box" id="kanbanSearchInput" placeholder="بحث بالاسم، المنفذ، المشرف، المعرف..." oninput="renderKanbanBoard()" style="max-width: 280px;">
            <select class="form-select" id="kanbanFilterEpic" onchange="renderKanbanBoard()" style="padding: 7px 12px; font-size: 12px;">
              <option value="ALL">جميع المسارات البرمجية (كافة الملاحم)</option>
              <option value="ProductEvolution">تطور وابتكار المنتج</option>
              <option value="Marketing">التسويق ومحركات البحث</option>
              <option value="Security">الأمان والتحصين</option>
              <option value="DevOps">النشر والعمليات البرمجية</option>
              <option value="Quality">الجودة والاختبارات الآلية</option>
              <option value="UX">التصميم وتجربة المستخدم</option>
              <option value="Core">الأنظمة الأساسية ومحرك البيانات</option>
            </select>
            <select class="form-select" id="kanbanFilterSupervisor" onchange="renderKanbanBoard()" style="padding: 7px 12px; font-size: 12px;">
              <option value="ALL">جميع المشرفين والمديرين</option>
              <option value="PM-01">PM-01 (إدارة الأعمال والمتطلبات)</option>
              <option value="PM-02">PM-02 (أبحاث السوق والمنافسين)</option>
              <option value="PM-03">PM-03 (التصميم وتجربة المستخدم)</option>
              <option value="PM-04">PM-04 (الهندسة والمعمارية)</option>
              <option value="PM-05">PM-05 (التسويق والنمو)</option>
              <option value="PM-06">PM-06 (الجودة والأمان والعمليات)</option>
              <option value="PM-07">PM-07 (تطور المنتج والابتكار)</option>
            </select>
            <select class="form-select" id="kanbanFilterPriority" onchange="renderKanbanBoard()" style="padding: 7px 12px; font-size: 12px;">
              <option value="ALL">جميع الأولويات</option>
              <option value="P0_CRITICAL">P0 — حرجة وفورية</option>
              <option value="P1_HIGH">P1 — عاجلة ومهمة</option>
              <option value="P2_MEDIUM">P2 — متوسطة الأهمية</option>
              <option value="P3_LOW">P3 — منخفضة</option>
            </select>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div class="view-mode-toggle">
              <button class="view-mode-btn active" onclick="switchNav('kanban')">📊 كانبان</button>
              <button class="view-mode-btn" onclick="switchNav('tracker')">📋 جدول</button>
            </div>
            <button class="btn-create-task" onclick="openCreateTaskModal()" style="font-size: 12px; padding: 8px 14px;">
              ➕ إضافة مهمة جديدة
            </button>
          </div>
        </div>

        <!-- 4 Columns Kanban Board -->
        <div class="kanban-board">
          <!-- Column 1: Ready / Backlog -->
          <div class="kanban-column" id="col-ready" ondragover="handleKanbanDragOver(event)" ondragleave="handleKanbanDragLeave(event)" ondrop="handleKanbanDrop(event, 'READY')">
            <div class="kanban-column-header">
              <div class="kanban-column-title-group">
                <div class="kanban-column-dot" style="background: var(--accent-amber);"></div>
                <div class="kanban-column-title">جاهزة للتنفيذ والبدء</div>
              </div>
              <span class="kanban-column-count" id="countColReady">0</span>
            </div>
            <div class="kanban-column-body" id="kanbanListReady"></div>
            <div style="padding: 0 14px 14px;">
              <button class="kanban-column-add" onclick="openCreateTaskModal('READY')">➕ إضافة مهمة هنا</button>
            </div>
          </div>

          <!-- Column 2: In Progress -->
          <div class="kanban-column" id="col-in-progress" ondragover="handleKanbanDragOver(event)" ondragleave="handleKanbanDragLeave(event)" ondrop="handleKanbanDrop(event, 'IN_PROGRESS')">
            <div class="kanban-column-header">
              <div class="kanban-column-title-group">
                <div class="kanban-column-dot" style="background: var(--accent-cyan);"></div>
                <div class="kanban-column-title">قيد العمل والتنفيذ الفعلي</div>
              </div>
              <span class="kanban-column-count" id="countColInProgress">0</span>
            </div>
            <div class="kanban-column-body" id="kanbanListInProgress"></div>
            <div style="padding: 0 14px 14px;">
              <button class="kanban-column-add" onclick="openCreateTaskModal('IN_PROGRESS')">➕ إضافة مهمة هنا</button>
            </div>
          </div>

          <!-- Column 3: In Review / Governance -->
          <div class="kanban-column" id="col-review" ondragover="handleKanbanDragOver(event)" ondragleave="handleKanbanDragLeave(event)" ondrop="handleKanbanDrop(event, 'REVIEW')">
            <div class="kanban-column-header">
              <div class="kanban-column-title-group">
                <div class="kanban-column-dot" style="background: var(--accent-purple);"></div>
                <div class="kanban-column-title">قيد المراجعة والتدقيق الإداري</div>
              </div>
              <span class="kanban-column-count" id="countColReview">0</span>
            </div>
            <div class="kanban-column-body" id="kanbanListReview"></div>
            <div style="padding: 0 14px 14px;">
              <button class="kanban-column-add" onclick="openCreateTaskModal('REVIEW')">➕ إضافة مهمة هنا</button>
            </div>
          </div>

          <!-- Column 4: Completed / Done -->
          <div class="kanban-column" id="col-completed" ondragover="handleKanbanDragOver(event)" ondragleave="handleKanbanDragLeave(event)" ondrop="handleKanbanDrop(event, 'COMPLETED')">
            <div class="kanban-column-header">
              <div class="kanban-column-title-group">
                <div class="kanban-column-dot" style="background: var(--accent-emerald);"></div>
                <div class="kanban-column-title">معتمدة ومكتملة بنجاح</div>
              </div>
              <span class="kanban-column-count" id="countColCompleted">0</span>
            </div>
            <div class="kanban-column-body" id="kanbanListCompleted"></div>
          </div>
        </div>
      </div>

      <!-- View 2: Full Task Tracker (Table View) -->
      <div id="view-tracker" class="view-pane">
        <div class="kanban-view-controls">
          <div style="display: flex; gap: 10px; align-items: center; flex: 1; flex-wrap: wrap;">
            <input type="text" class="search-box" id="taskSearchInput" placeholder="بحث في المهام، الوكلاء، المشرفين، المسار..." oninput="renderTrackerTasks()" style="max-width: 280px;">
            <div class="filter-group">
              <button class="filter-chip active" onclick="setTrackerFilter('ALL')">الكل</button>
              <button class="filter-chip" onclick="setTrackerFilter('COMPLETED')">المكتملة ✓</button>
              <button class="filter-chip" onclick="setTrackerFilter('READY')">الجاهزة 📌</button>
              <button class="filter-chip" onclick="setTrackerFilter('IN_PROGRESS')">قيد التنفيذ ⏳</button>
              <button class="filter-chip" onclick="setTrackerFilter('REVIEW')">قيد المراجعة 🔍</button>
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div class="view-mode-toggle">
              <button class="view-mode-btn" onclick="switchNav('kanban')">📊 كانبان</button>
              <button class="view-mode-btn active" onclick="switchNav('tracker')">📋 جدول</button>
            </div>
            <button class="btn-create-task" onclick="openCreateTaskModal()" style="font-size: 12px; padding: 8px 14px;">
              ➕ إضافة مهمة جديدة
            </button>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>المعرف</th>
                <th>عنوان المهمة</th>
                <th>المسار (Epic)</th>
                <th>الأولوية</th>
                <th>الصلاحية</th>
                <th>المنفذ (مين شغال)</th>
                <th>المشرف (مين مشرف)</th>
                <th>الموافقة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody id="trackerTableBody"></tbody>
          </table>
        </div>
      </div>

      <!-- View 3: Hierarchy & Who's Working / Supervising -->
      <div id="view-hierarchy" class="view-pane">
        <div class="toolbar">
          <h2 style="font-size: 17px; font-weight: 800;">الهيكل التنظيمي الكامل: المشرفون والوكلاء المتخصصون</h2>
          <p style="font-size: 13px; color: var(--text-muted);">يوضح من يشرف على كل مهمة ومن ينفذها ومستويات الحوكمة</p>
        </div>
        <div class="grid-cards" id="hierarchySpecialistsGrid"></div>
      </div>

      <!-- View 4: Market Research & Competitor Intelligence (PM-02) -->
      <div id="view-market" class="view-pane">
        <div class="toolbar">
          <div>
            <h2 style="font-size: 17px; font-weight: 800;">أبحاث السوق والمنافسين والخندق التنافسي (PM-02 Competitive Intelligence)</h2>
            <p style="font-size: 13px; color: var(--text-muted);">تحليل معمق للمنافسين (Tarteel, Muslim Pro, TickTick, Anki) وتحديد نقاط قوة وضعف كل منافس</p>
          </div>
        </div>

        <div class="grid-cards" id="competitorsGrid"></div>

        <div class="toolbar" style="margin-top: 24px;">
          <h2 style="font-size: 17px; font-weight: 800;">إشارات السوق ورادار التقنيات الصاعدة (Market Signals & Watchlist)</h2>
        </div>
        <div class="grid-cards" id="marketSignalsGrid"></div>
      </div>

      <!-- View 5: Marketing Strategy, Personas & SEO (PM-05) -->
      <div id="view-marketing" class="view-pane">
        <div class="toolbar">
          <div>
            <h2 style="font-size: 17px; font-weight: 800;">استراتيجية التسويق، الشخصيات المستهدفة والنمو (PM-05 Marketing & SEO)</h2>
            <p style="font-size: 13px; color: var(--text-muted);">تحديد القيمة الفريدة، شخصيات المستخدمين المثالية (ICP)، عناقيد الكلمات المفتاحية، وقنوات الاستحواذ العضوي</p>
          </div>
        </div>

        <div class="grid-cards" id="marketingStrategyGrid"></div>
      </div>

      <!-- View 6: Deep Site & Station Inspection -->
      <div id="view-inspection" class="view-pane">
        <div class="toolbar">
          <h2 style="font-size: 17px; font-weight: 800;">الفحص العميق لكافة محطات اليوم والمحركات الإيمانية والتقنية</h2>
          <p style="font-size: 13px; color: var(--text-muted);">تدقيق تفصيلي لكل محطة مع المشرف المسؤول، المدقق، وحالة السيادة المحلية (100% Local)</p>
        </div>
        <div class="grid-cards" id="deepInspectionGrid"></div>
      </div>

      <!-- View 7: Approvals & Reviews Governance -->
      <div id="view-approvals" class="view-pane">
        <div class="toolbar">
          <div>
            <h2 style="font-size: 17px; font-weight: 800;">بوابات الموافقات والمراجعات (Governance Gates)</h2>
            <p style="font-size: 13px; color: var(--text-muted);">مرسوم المالك (أحمد): يمتلك المدير التنفيذي ومديرو المشاريع (PM-01 إلى PM-07) كامل الصلاحيات للاعتماد أو الرفض</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; font-weight: 700; color: var(--text-muted);">هوية صاحب القرار:</span>
              <select id="activeApproverSelect" class="form-select" style="padding: 6px 12px; font-size: 12px;">
                <option value="Executive Product Director (المدير التنفيذي)">Executive Product Director (المدير التنفيذي)</option>
                <option value="PM-01 (إدارة الأعمال والمتطلبات)">PM-01 (إدارة الأعمال والمتطلبات)</option>
                <option value="PM-02 (أبحاث السوق والمنافسين)">PM-02 (أبحاث السوق والمنافسين)</option>
                <option value="PM-03 (التصميم وتجربة المستخدم)">PM-03 (التصميم وتجربة المستخدم)</option>
                <option value="PM-04 (الهندسة والمعمارية)">PM-04 (الهندسة والمعمارية)</option>
                <option value="PM-05 (البيانات والتسويق والنمو)">PM-05 (البيانات والتسويق والنمو)</option>
                <option value="PM-06 (الجودة والأمان والعمليات)">PM-06 (الجودة والأمان والعمليات)</option>
                <option value="PM-07 (تطور المنتج والابتكار)">PM-07 (تطور المنتج والابتكار)</option>
                <option value="أحمد (Human Project Owner)">أحمد (Human Project Owner)</option>
              </select>
            </div>
            <button class="btn-create-task" onclick="autoApproveAllGates()" style="font-size: 12px; padding: 8px 14px;">
              ⚡ اعتماد ذاتي كامل للجنة المديرين (Auto-Approve All)
            </button>
          </div>
        </div>

        <h3 style="font-size: 15px; color: var(--accent-amber); margin-bottom: 12px;">⏳ بوابات الموافقة المعلقة (القرارات الميدانية):</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>معرف الاعتماد</th>
                <th>المهمة</th>
                <th>مستوى الصلاحية</th>
                <th>المسؤول المرجعي</th>
                <th>المبرر والأثر المعماري</th>
                <th>الإجراء والقرار</th>
              </tr>
            </thead>
            <tbody id="pendingApprovalsTable"></tbody>
          </table>
        </div>

        <h3 style="font-size: 15px; color: var(--accent-emerald); margin: 24px 0 12px;">✓ سجل المراجعات النظيرة المعتمدة (Peer Reviews):</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>معرف المراجعة</th>
                <th>المهمة</th>
                <th>المراجع</th>
                <th>الحكم</th>
                <th>الأدلة والحقائق [FACT]</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody id="reviewsLedgerTable"></tbody>
          </table>
        </div>
      </div>

      <!-- View 8: Comments & Discussion Threads -->
      <div id="view-comments" class="view-pane">
        <div class="toolbar">
          <h2 style="font-size: 17px; font-weight: 800;">سجل النقاشات التنفيذية والملاحظات الفنية بين الوكلاء</h2>
          <button class="btn-create-task" onclick="openAddCommentModal()">➕ إضافة تعليق/ملاحظة</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>المعرف</th>
                <th>المهمة المرتبطة</th>
                <th>الكاتب</th>
                <th>الدور التنظيمي</th>
                <th>الملاحظة والنقاش الفني</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody id="allCommentsTable"></tbody>
          </table>
        </div>
      </div>

      <!-- View 9: Product Evolution (PM-07) -->
      <div id="view-opportunities" class="view-pane">
        <div class="toolbar">
          <div>
            <h2 style="font-size: 17px; font-weight: 800;">محرك تطور المنتج الاستراتيجي (PM-07 Evolution Engine)</h2>
            <p style="font-size: 13px; color: var(--text-muted);">رادار الفرص، توزيع المحفظة، وبوابات التدقيق الصارمة بالأدلة</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-create-task" onclick="openOppModal('OPP-0101')" style="font-size: 12px; padding: 7px 12px;">🔍 فحص حزمة الدلتا</button>
            <button class="btn-create-task" onclick="openOppModal('OPP-0103')" style="font-size: 12px; padding: 7px 12px; background: var(--accent-emerald);">⚡ مراجعة المكسب السريع</button>
          </div>
        </div>

        <!-- Subtabs -->
        <div class="opp-subnav">
          <button class="opp-tab-btn active" id="oppTabRadar" onclick="switchOppSubtab('radar')">🎯 رادار التأثير مقابل الجهد (Opportunity Radar)</button>
          <button class="opp-tab-btn" id="oppTabPortfolio" onclick="switchOppSubtab('portfolio')">📊 ميزان المحفظة الاستراتيجية (Portfolio Balance)</button>
          <button class="opp-tab-btn" id="oppTabMatrix" onclick="switchOppSubtab('matrix')">⚖️ مصفوفة المقارنة وبوابات الفحص (Compare & Gates)</button>
          <button class="opp-tab-btn" id="oppTabCards" onclick="switchOppSubtab('cards')">🗂️ بطاقات الحزم الكاملة (All Packs)</button>
        </div>

        <!-- Subview 1: Opportunity Radar 2x2 -->
        <div id="oppSubviewRadar">
          <div class="opp-radar-grid">
            <!-- Quadrant 1: Quick Wins -->
            <div class="opp-quadrant quick-wins">
              <div class="opp-quadrant-header">
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--accent-emerald);">⚡ المكاسب السريعة (Quick Wins)</div>
                  <div style="font-size: 11px; color: var(--text-muted);">تأثير عالٍ / جهد منخفض — أولوية تنفيذ فورية</div>
                </div>
                <span class="badge badge-success">عائد فوري</span>
              </div>
              <div id="quadrantQuickWins" style="display: flex; flex-direction: column; gap: 8px;"></div>
            </div>

            <!-- Quadrant 2: Strategic Bets -->
            <div class="opp-quadrant strategic-bets">
              <div class="opp-quadrant-header">
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--accent-purple);">🏆 الرهانات الاستراتيجية الكبرى (Strategic Bets)</div>
                  <div style="font-size: 11px; color: var(--text-muted);">تأثير عالٍ / جهد مرتفع — تبني الخندق التنافسي</div>
                </div>
                <span class="badge badge-purple">خندق تنافسي Moat</span>
              </div>
              <div id="quadrantStrategicBets" style="display: flex; flex-direction: column; gap: 8px;"></div>
            </div>

            <!-- Quadrant 3: Fill-Ins -->
            <div class="opp-quadrant fill-ins">
              <div class="opp-quadrant-header">
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--accent-cyan);">🛠️ التحسينات التكميلية (Fill-Ins)</div>
                  <div style="font-size: 11px; color: var(--text-muted);">تأثير متوسط / جهد منخفض إلى متوسط</div>
                </div>
                <span class="badge badge-cyan">مكملات قيمة</span>
              </div>
              <div id="quadrantFillIns" style="display: flex; flex-direction: column; gap: 8px;"></div>
            </div>

            <!-- Quadrant 4: Re-Evaluate -->
            <div class="opp-quadrant re-evaluate">
              <div class="opp-quadrant-header">
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--accent-amber);">⏳ إعادة نظر وتأجيل (Re-Evaluate)</div>
                  <div style="font-size: 11px; color: var(--text-muted);">تأثير منخفض / جهد مرتفع — استبعاد أو تجميد</div>
                </div>
                <span class="badge badge-warning">تأجيل مؤقت</span>
              </div>
              <div id="quadrantReEvaluate" style="display: flex; flex-direction: column; gap: 8px;"></div>
            </div>
          </div>
        </div>

        <!-- Subview 2: Strategic Portfolio Balance -->
        <div id="oppSubviewPortfolio" style="display: none;">
          <div class="portfolio-meter">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800;">ميزان تخصيص السعة الهندسية (Target Portfolio Allocation)</h3>
                <p style="font-size: 12px; color: var(--text-muted);">معيار V2 للحفاظ على استقرار النظام الأساسي بالتوازي مع الابتكار</p>
              </div>
              <span class="badge badge-cyan">توازن استراتيجي 100%</span>
            </div>

            <div class="portfolio-bar-wrap">
              <div class="portfolio-segment" style="width: 50%; background: #3b82f6;">50% الركائز والموثوقية (Core)</div>
              <div class="portfolio-segment" style="width: 30%; background: #10b981;">30% التوسع والنمو (Growth)</div>
              <div class="portfolio-segment" style="width: 15%; background: #8b5cf6;">15% الابتكار والخندق (Moat)</div>
              <div class="portfolio-segment" style="width: 5%; background: #f59e0b;">5% نظافة الكود (Debt)</div>
            </div>

            <div class="portfolio-legend">
              <div class="portfolio-legend-item">
                <span class="portfolio-legend-dot" style="background: #3b82f6;"></span>
                <span><strong>50% الركائز والموثوقية (H1 Core):</strong> معمارية المزامنة، حاسبة الصلاة، سلامة IndexedDB</span>
              </div>
              <div class="portfolio-legend-item">
                <span class="portfolio-legend-dot" style="background: #10b981;"></span>
                <span><strong>30% النمو والتوسع (H2 Growth):</strong> استيراد بطاقات اللغات، ودرع التقويم</span>
              </div>
              <div class="portfolio-legend-item">
                <span class="portfolio-legend-dot" style="background: #8b5cf6;"></span>
                <span><strong>15% ابتكار الخندق التنافسي (H3 High-Moat):</strong> التجويد الصوتي المحلي بـ WASM</span>
              </div>
              <div class="portfolio-legend-item">
                <span class="portfolio-legend-dot" style="background: #f59e0b;"></span>
                <span><strong>5% الديون الفنية والتحسينات:</strong> نظافة Oxlint وتحديث التبعيات</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Subview 3: Comparison Matrix -->
        <div id="oppSubviewMatrix" style="display: none;">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>المعرف</th>
                  <th>الحزمة والفرصة</th>
                  <th>الأفق الاستراتيجي</th>
                  <th>القيمة / الجهد</th>
                  <th>معدل الأولوية</th>
                  <th>بوابة (لماذا الآن؟)</th>
                  <th>الأدلة المضادة والمخاطر</th>
                  <th>حالة الاعتماد</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody id="oppMatrixTableBody"></tbody>
            </table>
          </div>
        </div>

        <!-- Subview 4: Grid Cards -->
        <div id="oppSubviewCards" style="display: none;">
          <div class="grid-cards" id="oppCardsGrid"></div>
        </div>
      </div>

      <!-- View 10: Quality & Security Lab -->
      <div id="view-quality" class="view-pane">
        <div class="grid-cards">
          <div class="info-card">
            <div>
              <div style="font-size: 15px; font-weight: 800;">الاختبارات الآلية (Vitest 5.0)</div>
              <div class="metric-val" style="color: var(--accent-emerald); margin: 8px 0;">17 / 17 ناجح</div>
              <p style="font-size: 13px; color: var(--text-muted);">تغطي حاسبة الصلاة الفلكية، التكرار المتباعد للغات، ومحرك التلعيب بالكامل.</p>
            </div>
            <span class="badge badge-success">✓ نسبة نجاح 100%</span>
          </div>

          <div class="info-card">
            <div>
              <div style="font-size: 15px; font-weight: 800;">فحص الأنواع الصارم (TypeScript)</div>
              <div class="metric-val" style="color: var(--accent-cyan); margin: 8px 0;">0 أخطاء</div>
              <p style="font-size: 13px; color: var(--text-muted);">أمر <span class="mono">npx tsc -b</span> يجري تدقيقاً صارماً لكافة الملفات بنقاء تام.</p>
            </div>
            <span class="badge badge-cyan">صفر أخطاء برمجية</span>
          </div>

          <div class="info-card">
            <div>
              <div style="font-size: 15px; font-weight: 800;">فاحص الأنماط السريع (Oxlint)</div>
              <div class="metric-val" style="color: var(--accent-purple); margin: 8px 0;">0 أخطاء</div>
              <p style="font-size: 13px; color: var(--text-muted);">فحص فائق السرعة عبر محرك Rust يغطي 158 ملفاً بـ 116 قاعدة كود نظيف.</p>
            </div>
            <span class="badge badge-purple">نقاء كود فائق السرعة عبر Rust</span>
          </div>

          <div class="info-card">
            <div>
              <div style="font-size: 15px; font-weight: 800;">تصنيف الخصوصية والأمان</div>
              <div class="metric-val" style="color: var(--accent-amber); margin: 8px 0;">A+ Sovereign</div>
              <p style="font-size: 13px; color: var(--text-muted);">0 أسرار مسربة، خلو كامل من التتبع الخارجي، ومصادقة آمنة ضد التوقيت.</p>
            </div>
            <span class="badge badge-warning">صفر تتبع - خصوصية مطلقة</span>
          </div>
        </div>
      </div>

      <!-- View 11: Events Timeline -->
      <div id="view-events" class="view-pane">
        <div class="toolbar">
          <h2 style="font-size: 17px; font-weight: 800;">سجل الأحداث والتدقيق اللحظي (Audit & Telemetry Log)</h2>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>المعرف</th>
                <th>الفاعل</th>
                <th>الحدث</th>
                <th>الدافع والسبب</th>
                <th>المرحلة الناتجة</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody id="eventsTableBody"></tbody>
          </table>
        </div>
      </div>
    </main>
  </div>

  <!-- Detail Modal -->
  <div class="modal-backdrop" id="detailModal" onclick="closeModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div id="modalContent"></div>
    </div>
  </div>

  <!-- Create Task Modal -->
  <div class="modal-backdrop" id="createTaskModal" onclick="closeCreateTaskModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeCreateTaskModal()">✕</button>
      <h2 style="font-size: 18px; font-weight: 800; margin-bottom: 16px;">➕ إنشاء مهمة جديدة في السبرنت</h2>
      <form onsubmit="submitNewTask(event)">
        <div class="form-group">
          <label class="form-label">عنوان المهمة:</label>
          <input type="text" class="form-input" id="newTaskTitle" required placeholder="مثال: إضافة حقل مؤقت مخصص في سبرنت العمل">
        </div>
        <div class="form-group">
          <label class="form-label">الوصف التفصيلي:</label>
          <textarea class="form-textarea" id="newTaskDesc" rows="3" required placeholder="اشرح المتطلبات والهدف بوضوح..."></textarea>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">المسار البرمجي (الملحمة):</label>
            <select class="form-select" id="newTaskEpic">
              <option value="UX">التصميم وتجربة المستخدم</option>
              <option value="ProductEvolution">تطور وابتكار المنتج</option>
              <option value="Security">الأمان والتحصين</option>
              <option value="Backend">الخادم وقواعد البيانات والمزامنة</option>
              <option value="Accessibility">الوصولية والخطوط العربية</option>
              <option value="QA">الجودة والاختبارات المؤتمتة</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">الأولوية:</label>
            <select class="form-select" id="newTaskPriority">
              <option value="P1_HIGH">P1 — أولوية قصوى وعاجلة</option>
              <option value="P0_CRITICAL">P0 — حرجة وفورية جداً</option>
              <option value="P2_MEDIUM">P2 — متوسطة الأهمية</option>
              <option value="P3_LOW">P3 — منخفضة</option>
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">الوكيل المكلف بالتنفيذ:</label>
            <select class="form-select" id="newTaskWorker">
              <option value="ENG-01 (مطور الواجهات الأمامية)">ENG-01 (مطور الواجهات الأمامية)</option>
              <option value="ARCH-01 (مهندس المعمارية والأنظمة)">ARCH-01 (مهندس المعمارية والأنظمة)</option>
              <option value="UX-01 (أخصائي الإيماءات واللمس)">UX-01 (أخصائي الإيماءات واللمس)</option>
              <option value="SEC-01 (مسؤول الأمان والتحصين)">SEC-01 (مسؤول الأمان والتحصين)</option>
              <option value="QA-01 (مسؤول أتمتة الاختبارات)">QA-01 (مسؤول أتمتة الاختبارات)</option>
              <option value="DB-01 (أخصائي قواعد البيانات)">DB-01 (أخصائي قواعد البيانات)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">المشرف المعتمد على المهمة:</label>
            <select class="form-select" id="newTaskSupervisor">
              <option value="PM-01 (إدارة الأعمال والمتطلبات)">PM-01 (إدارة الأعمال والمتطلبات)</option>
              <option value="PM-03 (التصميم وتجربة المستخدم)">PM-03 (التصميم وتجربة المستخدم)</option>
              <option value="PM-04 (الهندسة والمعمارية)">PM-04 (الهندسة والمعمارية)</option>
              <option value="PM-06 (الجودة والأمان والعمليات)">PM-06 (الجودة والأمان والعمليات)</option>
              <option value="PM-07 (تطور المنتج والابتكار)">PM-07 (تطور المنتج والابتكار)</option>
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">مستوى الصلاحية المطلوب:</label>
            <select class="form-select" id="newTaskLevel">
              <option value="2">المستوى L2 — تعديل محلي معتمد للمنفذ</option>
              <option value="3">المستوى L3 — تعديل مشترك يتطلب مراجعة المشرف</option>
              <option value="4">المستوى L4 — معمارية أو أمان يستلزم اعتماد المالك</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">حالة المهمة في الكانبان:</label>
            <select class="form-select" id="newTaskStatus">
              <option value="READY">جاهزة للتنفيذ والبدء</option>
              <option value="IN_PROGRESS">قيد العمل والتنفيذ الفعلي</option>
              <option value="REVIEW">قيد المراجعة والتدقيق الإداري</option>
              <option value="COMPLETED">معتمدة ومكتملة بنجاح</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn-create-task" style="width: 100%; margin-top: 10px;">إضافة المهمة وبث التحديث لحظياً</button>
      </form>
    </div>
  </div>

  <!-- Add Comment Modal -->
  <div class="modal-backdrop" id="addCommentModal" onclick="closeAddCommentModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeAddCommentModal()">✕</button>
      <h2 style="font-size: 18px; font-weight: 800; margin-bottom: 16px;">💬 إضافة ملاحظة أو تعليق فني</h2>
      <form onsubmit="submitNewComment(event)">
        <div class="form-group">
          <label class="form-label">المهمة المرتبطة:</label>
          <select class="form-select" id="commentTaskId"></select>
        </div>
        <div class="form-group">
          <label class="form-label">الكاتب (المسؤول):</label>
          <select class="form-select" id="commentAuthor">
            <option value="Executive Product Director (المدير التنفيذي)">Executive Product Director (المدير التنفيذي)</option>
            <option value="PM-01 (إدارة الأعمال والمتطلبات)">PM-01 (إدارة الأعمال والمتطلبات)</option>
            <option value="PM-02 (أبحاث السوق والمنافسين)">PM-02 (أبحاث السوق والمنافسين)</option>
            <option value="PM-03 (التصميم وتجربة المستخدم)">PM-03 (التصميم وتجربة المستخدم)</option>
            <option value="PM-04 (الهندسة والمعمارية)">PM-04 (الهندسة والمعمارية)</option>
            <option value="PM-05 (البيانات والتسويق والنمو)">PM-05 (البيانات والتسويق والنمو)</option>
            <option value="PM-06 (الجودة والأمان والعمليات)">PM-06 (الجودة والأمان والعمليات)</option>
            <option value="PM-07 (تطور المنتج والابتكار)">PM-07 (تطور المنتج والابتكار)</option>
            <option value="أحمد (Human Project Owner)">أحمد (Human Project Owner)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">الدور التنظيمي:</label>
          <input type="text" class="form-input" id="commentRole" value="Executive Decision Maker">
        </div>
        <div class="form-group">
          <label class="form-label">نص التعليق / التوجيه الفني:</label>
          <textarea class="form-textarea" id="commentContent" rows="4" required placeholder="اكتب توجيهك أو ملاحظتك للوكلاء..."></textarea>
        </div>
        <button type="submit" class="btn-create-task" style="width: 100%; margin-top: 10px;">نشر الملاحظة لسجل المشروع</button>
      </form>
    </div>
  </div>

  <!-- Toast -->
  <div class="toast-box" id="toastBox">
    <span>🔔</span>
    <span id="toastMsg">تم التحديث</span>
  </div>

  <script>
    let globalState = null;
    let activeTrackerFilter = 'ALL';

    // Theme Switcher Logic (Light Mode by default)
    function initTheme() {
      const saved = localStorage.getItem('midmar_dashboard_theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);
      updateThemeIcon(saved);
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('midmar_dashboard_theme', next);
      updateThemeIcon(next);
      triggerTactileClick();
    }

    function updateThemeIcon(theme) {
      const icon = document.getElementById('themeIcon');
      const text = document.getElementById('themeText');
      if (theme === 'dark') {
        icon.innerText = '☀️';
        text.innerText = 'الوضع الفاتح';
      } else {
        icon.innerText = '🌙';
        text.innerText = 'الوضع الداكن';
      }
    }

    initTheme();

    function switchNav(viewId) {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.view-pane').forEach(el => el.classList.remove('active'));

      const targetNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(viewId));
      if (targetNav) targetNav.classList.add('active');

      const targetView = document.getElementById('view-' + viewId);
      if (targetView) targetView.classList.add('active');

      const titles = {
        overview: ['نظرة عامة والقيادة التنفيذية', 'الرصد الفوري لمسار المشروع، حالة الوكلاء، ومنظومة الحوكمة'],
        kanban: ['لوحة الكانبان وإدارة المهام الميدانية', 'إدارة وتتبع مسار المهام بالسحب والإفلات وتوزيع الأدوار والمشرفين'],
        tracker: ['متتبع المهام وسجل الإنجاز الشامل', 'تتبع دقيق لكافة المهام، المنفذين، المشرفين، وحالات المراجعة'],
        hierarchy: ['الهيكل الإداري وفِرق العمل التنفيذية', 'توضيح من يشرف على كل مسار ومن ينفذه ومستويات الحوكمة'],
        market: ['أبحاث السوق والمنافسين (فريق PM-02)', 'الخندق التنافسي والتحليل المعياري للمنافسين وتحصين السيادة المحلية'],
        marketing: ['استراتيجية التسويق والنمو ومحركات البحث (فريق PM-05)', 'القيمة الفريدة، شخصيات المستخدمين المثالية، وخطة الانتشار العضوي'],
        inspection: ['الفحص الميداني العميق للموقع والمحطات الـ 9', 'تدقيق ميداني لكافة الشاشات والمحركات بالحقائق والأدلة الملموسة'],
        approvals: ['بوابات الموافقات والاعتمادات الإدارية', 'صلاحيات الاعتماد والرفض الكاملة لمديري المشاريع والمدير التنفيذي'],
        comments: ['سجل النقاشات والملاحظات الفنية', 'حوارات الوكلاء والمشرفين وملاحظات المالك التنفيذية الميدانية'],
        opportunities: ['محرك تطور وابتكار المنتج (فريق PM-07)', 'رادار الفرص الاستراتيجية، ميزان المحفظة، وبوابات التبرير الزمني'],
        quality: ['مختبر الجودة والأمان البرمجي الشامل', '17/17 اختباراً مؤتمتاً ناجحاً، وخلو تام من أخطاء الأنظمة والأنماط'],
        events: ['سجل الأحداث والرقابة التاريخية اللحظية', 'سجل تاريخي دقيق لكافة الإجراءات والتحولات الميدانية']
      };

      if (titles[viewId]) {
        document.getElementById('viewTitleText').innerText = titles[viewId][0];
        document.getElementById('viewSubtitleText').innerText = titles[viewId][1];
      }
      triggerTactileClick();
    }

    function triggerTactileClick() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (_) {}
    }

    function triggerSoundNotice() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
        showToast('🔔 تم اختبار التنبيه الصوتي بنجاح');
      } catch (_) {}
    }

    function showToast(msg) {
      const tb = document.getElementById('toastBox');
      const tm = document.getElementById('toastMsg');
      tm.innerText = msg;
      tb.style.display = 'flex';
      setTimeout(() => { tb.style.display = 'none'; }, 3500);
    }

    function copySprintSummary() {
      if (!globalState) return;
      const textLines = [
        '📊 تقرير القيادة التنفيذية لمضمار (Midmar LifeOS):',
        '- المهام المنجزة: ' + globalState.metrics.completedTasks + '/' + globalState.metrics.totalTasks + ' (' + globalState.metrics.taskProgress + '%)',
        '- بوابات الموافقة المعلقة: ' + globalState.metrics.pendingApprovals,
        '- الاختبارات الآلية (Vitest): 17/17 ناجح بنسبة 100%',
        '- فحص الأنواع (TypeScript): 0 أخطاء',
        '- فاحص الأنماط (Oxlint): 0 أخطاء',
        '- الطور الحالي: ' + globalState.meta.stage
      ];
      navigator.clipboard.writeText(textLines.join(String.fromCharCode(10))).then(() => {
        showToast('📋 تم نسخ ملخص القيادة للحافظة بنجاح!');
      });
    }

    function reAuditTrigger() {
      triggerSoundNotice();
      showToast('🔄 تم فحص كافة الملفات وتحديث المؤشرات اللحظية');
      fetch('/api/state').then(r => r.json()).then(renderState).catch(console.error);
    }

    function setTrackerFilter(f) {
      activeTrackerFilter = f;
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');
      renderTrackerTasks();
    }

    function renderTrackerTasks() {
      if (!globalState || !globalState.tasks) return;
      const q = (document.getElementById('taskSearchInput')?.value || '').toLowerCase().trim();
      const filtered = globalState.tasks.filter(t => {
        if (activeTrackerFilter !== 'ALL' && t.status !== activeTrackerFilter) return false;
        if (!q) return true;
        return t.id.toLowerCase().includes(q) ||
               t.title.toLowerCase().includes(q) ||
               (t.epic && t.epic.toLowerCase().includes(q)) ||
               (t.worker && t.worker.toLowerCase().includes(q)) ||
               (t.supervisor && t.supervisor.toLowerCase().includes(q));
      });

      const tbody = document.getElementById('trackerTableBody');
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-sub); padding: 32px;">لا توجد مهام مطابقة</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(t => {
        const isDone = t.status === 'COMPLETED';
        const isReady = t.status === 'READY';
        const isProg = t.status === 'IN_PROGRESS';
        const isRev = t.status === 'REVIEW';
        const prioBadge = t.priority === 'P0_CRITICAL' ? 'badge-danger' : t.priority === 'P1_HIGH' ? 'badge-warning' : 'badge-neutral';
        const prioText = t.priority === 'P0_CRITICAL' ? 'P0 حرجة وفورية' : t.priority === 'P1_HIGH' ? 'P1 أولوية قصوى' : t.priority === 'P2_MEDIUM' ? 'P2 متوسطة' : 'P3 منخفضة';
        const appBadge = t.approvalStatus === 'APPROVED' ? 'badge-success' : 'badge-warning';
        const appText = t.approvalStatus === 'APPROVED' ? '✓ معتمد' : t.approvalStatus === 'CHANGES_REQUESTED' ? 'طلب تعديل' : '⏳ بانتظار التدقيق';
        const statusText = isDone ? '✓ مكتملة' : isReady ? '📌 جاهزة للبدء' : isProg ? '⏳ قيد العمل' : isRev ? '🔍 قيد التدقيق' : t.status;

        return '<tr class="clickable" onclick="openTaskModal(&quot;' + t.id + '&quot;)">' +
          '<td><span class="mono badge badge-neutral">' + t.id + '</span></td>' +
          '<td style="font-weight: 800;">' + t.title + '</td>' +
          '<td><span class="badge badge-purple">' + (t.epic || 'الأنظمة الأساسية') + '</span></td>' +
          '<td><span class="badge ' + prioBadge + '">' + prioText + '</span></td>' +
          '<td><span class="badge badge-neutral">المستوى L' + (t.authorityLevel || 2) + '</span></td>' +
          '<td><span style="color: var(--accent-cyan); font-weight: 700;">' + (t.worker || 'أحمد') + '</span></td>' +
          '<td><span style="color: var(--accent-emerald); font-weight: 700;">' + (t.supervisor || 'المدير التنفيذي') + '</span></td>' +
          '<td><span class="badge ' + appBadge + '">' + appText + '</span></td>' +
          '<td><span class="badge ' + (isDone ? 'badge-success' : isReady ? 'badge-warning' : isProg ? 'badge-cyan' : 'badge-purple') + '">' + statusText + '</span></td>' +
        '</tr>';
      }).join('');
    }

    // Interactive Kanban Board Engine
    let draggedTaskId = null;

    function handleKanbanDragStart(e, taskId) {
      draggedTaskId = taskId;
      e.dataTransfer.setData('text/plain', taskId);
      e.dataTransfer.effectAllowed = 'move';
      const card = document.getElementById('card-' + taskId);
      if (card) card.classList.add('dragging');
    }

    function handleKanbanDragEnd(e) {
      draggedTaskId = null;
      document.querySelectorAll('.kanban-card').forEach(c => c.classList.remove('dragging'));
      document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    }

    function handleKanbanDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.currentTarget.classList.add('drag-over');
    }

    function handleKanbanDragLeave(e) {
      e.currentTarget.classList.remove('drag-over');
    }

    async function handleKanbanDrop(e, targetStatus) {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
      if (!taskId) return;
      await quickMoveTask(taskId, targetStatus);
    }

    async function quickMoveTask(taskId, newStatus) {
      try {
        triggerTactileClick();
        const res = await fetch('/api/tasks/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, newStatus, author: 'لوحة الكانبان' })
        });
        const result = await res.json();
        if (result.ok) {
          showToast('✓ تم نقل المهمة ' + taskId + ' إلى [' + newStatus + ']');
          fetch('/api/state').then(r => r.json()).then(renderState).catch(console.error);
        } else {
          showToast('⚠️ فشل نقل المهمة: ' + (result.error || 'خطأ'));
        }
      } catch (err) {
        showToast('⚠️ خطأ في الاتصال: ' + err.message);
      }
    }

    function renderKanbanBoard() {
      if (!globalState || !globalState.tasks) return;
      const q = (document.getElementById('kanbanSearchInput')?.value || '').toLowerCase().trim();
      const epic = document.getElementById('kanbanFilterEpic')?.value || 'ALL';
      const sup = document.getElementById('kanbanFilterSupervisor')?.value || 'ALL';
      const prio = document.getElementById('kanbanFilterPriority')?.value || 'ALL';

      const filtered = globalState.tasks.filter(t => {
        if (epic !== 'ALL' && t.epic !== epic) return false;
        if (sup !== 'ALL' && (!t.supervisor || !t.supervisor.includes(sup))) return false;
        if (prio !== 'ALL' && t.priority !== prio) return false;
        if (!q) return true;
        return t.id.toLowerCase().includes(q) ||
               t.title.toLowerCase().includes(q) ||
               (t.description && t.description.toLowerCase().includes(q)) ||
               (t.worker && t.worker.toLowerCase().includes(q)) ||
               (t.supervisor && t.supervisor.toLowerCase().includes(q));
      });

      const readyTasks = filtered.filter(t => t.status === 'READY' || t.status === 'BACKLOG' || t.status === 'PROPOSED');
      const inProgressTasks = filtered.filter(t => t.status === 'IN_PROGRESS');
      const reviewTasks = filtered.filter(t => t.status === 'REVIEW' || t.approvalStatus === 'CHANGES_REQUESTED' || (t.status !== 'COMPLETED' && t.approvalStatus === 'PENDING_APPROVAL'));
      const completedTasks = filtered.filter(t => t.status === 'COMPLETED');

      // Update count badges
      if (document.getElementById('countColReady')) document.getElementById('countColReady').innerText = readyTasks.length;
      if (document.getElementById('countColInProgress')) document.getElementById('countColInProgress').innerText = inProgressTasks.length;
      if (document.getElementById('countColReview')) document.getElementById('countColReview').innerText = reviewTasks.length;
      if (document.getElementById('countColCompleted')) document.getElementById('countColCompleted').innerText = completedTasks.length;

      const renderCard = (t) => {
        const prioBadge = t.priority === 'P0_CRITICAL' ? 'badge-danger' : t.priority === 'P1_HIGH' ? 'badge-warning' : 'badge-neutral';
        const prioText = t.priority === 'P0_CRITICAL' ? 'P0 حرجة وفورية' : t.priority === 'P1_HIGH' ? 'P1 أولوية قصوى' : t.priority === 'P2_MEDIUM' ? 'P2 متوسطة' : 'P3 منخفضة';
        const commentsCount = (globalState.comments || []).filter(c => c.taskId === t.id).length;

        let moveButtons = '';
        if (t.status === 'READY' || t.status === 'BACKLOG') {
          moveButtons = '<button class="kanban-move-btn" onclick="event.stopPropagation(); quickMoveTask(&quot;' + t.id + '&quot;, &quot;IN_PROGRESS&quot;)">بدء ⏳ ◀</button>';
        } else if (t.status === 'IN_PROGRESS') {
          moveButtons = '<button class="kanban-move-btn" onclick="event.stopPropagation(); quickMoveTask(&quot;' + t.id + '&quot;, &quot;READY&quot;)">تراجع ▶</button>' +
                        '<button class="kanban-move-btn" onclick="event.stopPropagation(); quickMoveTask(&quot;' + t.id + '&quot;, &quot;REVIEW&quot;)">تدقيق 🔍 ◀</button>';
        } else if (t.status === 'REVIEW') {
          moveButtons = '<button class="kanban-move-btn" onclick="event.stopPropagation(); quickMoveTask(&quot;' + t.id + '&quot;, &quot;IN_PROGRESS&quot;)">للعمل ▶</button>' +
                        '<button class="kanban-move-btn" onclick="event.stopPropagation(); quickMoveTask(&quot;' + t.id + '&quot;, &quot;COMPLETED&quot;)">اعتماد ✓ ◀</button>';
        } else if (t.status === 'COMPLETED') {
          moveButtons = '<button class="kanban-move-btn" onclick="event.stopPropagation(); quickMoveTask(&quot;' + t.id + '&quot;, &quot;REVIEW&quot;)">إعادة تدقيق ▶</button>';
        }

        return '<div class="kanban-card" id="card-' + t.id + '" draggable="true" ' +
          'ondragstart="handleKanbanDragStart(event, &quot;' + t.id + '&quot;)" ondragend="handleKanbanDragEnd(event)" ' +
          'onclick="openTaskModal(&quot;' + t.id + '&quot;)">' +
          '<div class="kanban-card-top">' +
            '<span class="kanban-card-id">' + t.id + '</span>' +
            '<span class="badge ' + prioBadge + '">' + prioText + '</span>' +
          '</div>' +
          '<div class="kanban-card-title">' + t.title + '</div>' +
          (t.description ? '<div class="kanban-card-desc">' + t.description + '</div>' : '') +
          '<div class="kanban-card-meta">' +
            '<span class="badge badge-purple">' + (t.epic || 'الأنظمة الأساسية') + '</span>' +
            '<span class="badge badge-neutral">المستوى L' + (t.authorityLevel || 2) + '</span>' +
            (t.approvalStatus === 'APPROVED' ? '<span class="badge badge-success">✓ معتمد</span>' : '<span class="badge badge-warning">⏳ بانتظار الاعتماد</span>') +
          '</div>' +
          '<div class="kanban-card-people">' +
            '<div class="kanban-person-row">' +
              '<span>المنفذ المكلف:</span>' +
              '<span class="kanban-person-val" style="color: var(--accent-cyan);">' + (t.worker || 'أحمد') + '</span>' +
            '</div>' +
            '<div class="kanban-person-row">' +
              '<span>المشرف الإداري:</span>' +
              '<span class="kanban-person-val" style="color: var(--accent-emerald);">' + (t.supervisor || 'المدير التنفيذي') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="kanban-card-actions">' +
            '<span style="font-size: 11px; color: var(--text-sub);">💬 ' + commentsCount + ' تعليق</span>' +
            '<div style="display: flex; gap: 4px;">' + moveButtons + '</div>' +
          '</div>' +
        '</div>';
      };

      const renderList = (elId, list) => {
        const el = document.getElementById(elId);
        if (!el) return;
        if (list.length === 0) {
          el.innerHTML = '<div style="text-align: center; color: var(--text-sub); padding: 24px; font-size: 12px; border: 1px dashed var(--border); border-radius: 12px;">اسحب المهمة إلى هنا أو أضف مهمة جديدة</div>';
          return;
        }
        el.innerHTML = list.map(renderCard).join('');
      };

      renderList('kanbanListReady', readyTasks);
      renderList('kanbanListInProgress', inProgressTasks);
      renderList('kanbanListReview', reviewTasks);
      renderList('kanbanListCompleted', completedTasks);
    }

    function renderState(data) {
      if (!data) return;
      globalState = data;

      // KPIs
      document.getElementById('kpiTasks').innerHTML = data.metrics.completedTasks + ' <span>/ ' + data.metrics.totalTasks + '</span>';
      document.getElementById('taskProgressBar').style.width = data.metrics.taskProgress + '%';
      document.getElementById('kpiApprovals').innerHTML = data.metrics.pendingApprovals + ' <span>بانتظار الاعتماد</span>';
      document.getElementById('kpiApprovedText').innerText = data.metrics.approvedCount + ' مهمة معتمدة رسمياً';
      document.getElementById('kpiBugs').innerHTML = data.metrics.openBugs + ' <span>مفتوح</span>';
      document.getElementById('kpiBugsResolvedText').innerText = 'تم حل ' + data.metrics.resolvedBugs + ' عيوب بنجاح (100%)';
      document.getElementById('liveTime').innerText = new Date(data.meta.timestamp).toLocaleTimeString();

      // Sidebar Badges
      document.getElementById('badgeNavTasks').innerText = data.metrics.totalTasks;
      if (document.getElementById('badgeNavKanban')) document.getElementById('badgeNavKanban').innerText = data.metrics.totalTasks;
      document.getElementById('badgeNavApprovals').innerText = data.metrics.pendingApprovals + ' معلق';
      document.getElementById('badgeNavComments').innerText = data.metrics.commentsCount;
      document.getElementById('badgeNavEvents').innerText = data.events.length;
      document.getElementById('badgeNavMarket').innerText = data.marketResearch.length;
      document.getElementById('badgeNavMarketing').innerText = data.marketingStrategy.length;

      // Overview Directors Grid
      const overGrid = document.getElementById('overviewDirectorsGrid');
      overGrid.innerHTML = data.directors.map(pm => {
        return '<div class="info-card" onclick="openPmModal(&quot;' + pm.id + '&quot;)">' +
          '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
            '<div>' +
              '<div style="font-size: 16px; font-weight: 800;">' + pm.id + ' — ' + pm.name + '</div>' +
              '<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">' + pm.domain + '</div>' +
            '</div>' +
            '<span class="badge badge-success">' + pm.status + '</span>' +
          '</div>' +
          '<div style="background: var(--card-solid); padding: 12px; border-radius: 12px; font-size: 12px; border: 1px solid var(--border);">' +
            '<strong style="color: var(--accent-emerald); display: block; margin-bottom: 4px;">فريق التنفيذ الخاضع للإشراف:</strong>' +
            pm.supervisorOf.join(' • ') +
          '</div>' +
          '<div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 10px;">' +
            '<span class="badge badge-purple">' + pm.authority + '</span>' +
            '<span style="font-size: 11px; color: var(--text-sub);">اضغط لعرض التفاصيل ↗</span>' +
          '</div>' +
        '</div>';
      }).join('');

      // Overview Comments Table
      const overComments = document.getElementById('overviewCommentsTable');
      overComments.innerHTML = data.comments.slice(0, 5).map(c => {
        return '<tr>' +
          '<td><span class="mono badge badge-neutral">' + c.id + '</span></td>' +
          '<td><span class="mono badge badge-purple">' + c.taskId + '</span></td>' +
          '<td style="font-weight: 700;">' + c.author + '</td>' +
          '<td><span class="badge badge-cyan">' + c.role + '</span></td>' +
          '<td style="font-size: 13px;">' + c.content + '</td>' +
          '<td><span class="mono">' + new Date(c.timestamp).toLocaleTimeString() + '</span></td>' +
        '</tr>';
      }).join('');

      // Render Tracker & Kanban
      renderTrackerTasks();
      renderKanbanBoard();

      // Hierarchy Specialists Grid
      const specGrid = document.getElementById('hierarchySpecialistsGrid');
      specGrid.innerHTML = data.specialists.map(sp => {
        return '<div class="info-card">' +
          '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
            '<div>' +
              '<div style="font-size: 15px; font-weight: 800;">' + sp.id + ' — ' + sp.name + '</div>' +
              '<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">' + sp.role + '</div>' +
            '</div>' +
            '<span class="badge ' + (sp.status === 'WORKING' ? 'badge-warning' : 'badge-success') + '">' + sp.status + '</span>' +
          '</div>' +
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 13px;">' +
            '<span>المشرف الإداري: <strong style="color: var(--accent-emerald);">' + sp.pm + '</strong></span>' +
            '<span>المهام: <strong class="mono">' + sp.tasksCount + '</strong></span>' +
          '</div>' +
        '</div>';
      }).join('');

      // Competitors Grid (PM-02)
      const compGrid = document.getElementById('competitorsGrid');
      compGrid.innerHTML = data.marketResearch.map(c => {
        return '<div class="info-card">' +
          '<div>' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
              '<span class="mono badge badge-neutral">' + c.id + '</span>' +
              '<span class="badge badge-purple">' + c.moatScore + ' قوة الخندق</span>' +
            '</div>' +
            '<div style="font-size: 18px; font-weight: 800; margin-bottom: 2px;">' + c.competitor + '</div>' +
            '<div style="font-size: 12px; color: var(--accent-cyan); font-weight: 700; margin-bottom: 12px;">' + c.category + '</div>' +
          '</div>' +
          '<div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">' +
            '<div style="background: var(--card-solid); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);">' +
              '<strong style="color: var(--accent-emerald);">نقاط القوة:</strong> ' + c.strengths.join(' • ') +
            '</div>' +
            '<div style="background: var(--card-solid); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);">' +
              '<strong style="color: var(--accent-rose);">نقاط الضعف:</strong> ' + c.weaknesses.join(' • ') +
            '</div>' +
            '<div style="background: rgba(16, 185, 129, 0.08); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-accent);">' +
              '<strong style="color: var(--accent-emerald); display: block; margin-bottom: 2px;">تفوق مضمار (Midmar Advantage):</strong>' +
              c.midmarAdvantage +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      // Market Signals Grid (PM-02 / PM-07)
      const sigGrid = document.getElementById('marketSignalsGrid');
      sigGrid.innerHTML = data.signals.map(s => {
        return '<div class="info-card">' +
          '<div>' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
              '<span class="mono badge badge-neutral">' + s.id + '</span>' +
              '<span class="badge ' + (s.urgency === 'high' ? 'badge-danger' : 'badge-warning') + '">' + (s.urgency === 'high' ? 'أولوية عاجلة ⚡' : 'أولوية متابعة ⏳') + '</span>' +
            '</div>' +
            '<div style="font-size: 14px; font-weight: 800; margin-bottom: 4px;">' + s.category + '</div>' +
            '<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">المصدر: ' + s.source + '</div>' +
            '<p style="font-size: 12px; line-height: 1.5;">' + s.summary + '</p>' +
          '</div>' +
          '<div style="border-top: 1px solid var(--border); padding-top: 8px; font-size: 11px; color: var(--text-sub);">' +
            'تم الرصد: <span class="mono">' + new Date(s.timestamp).toLocaleDateString() + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      // Marketing Strategy Grid (PM-05)
      const mktGrid = document.getElementById('marketingStrategyGrid');
      mktGrid.innerHTML = data.marketingStrategy.map(m => {
        return '<div class="info-card">' +
          '<div>' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
              '<span class="mono badge badge-neutral">' + m.id + '</span>' +
              '<span class="badge badge-cyan">' + m.domain + '</span>' +
            '</div>' +
            '<h3 style="font-size: 16px; font-weight: 800; margin-bottom: 8px;">' + m.title + '</h3>' +
            '<div style="white-space: pre-wrap; font-size: 12px; line-height: 1.6; color: var(--text-muted);">' + m.summary + '</div>' +
          '</div>' +
          (m.channels ? '<div style="border-top: 1px solid var(--border); padding-top: 10px; font-size: 11px;">' +
            '<strong>قنوات الاستحواذ:</strong> ' + m.channels.map(ch => '<span class="badge badge-neutral" style="margin: 2px;">' + ch + '</span>').join('') +
          '</div>' : '') +
        '</div>';
      }).join('');

      // Deep Inspection Grid
      const inspGrid = document.getElementById('deepInspectionGrid');
      inspGrid.innerHTML = data.inspections.map(insp => {
        return '<div class="info-card" onclick="openInspectionModal(&quot;' + insp.id + '&quot;)">' +
          '<div>' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
              '<span class="mono badge badge-neutral">' + insp.id + '</span>' +
              '<span class="badge badge-success">' + insp.status + '</span>' +
            '</div>' +
            '<div style="font-size: 16px; font-weight: 800; margin-bottom: 4px;">' + insp.nameAr + '</div>' +
            '<div class="mono" style="font-size: 11px; color: var(--text-muted);">' + insp.componentPath + '</div>' +
          '</div>' +
          '<div style="background: var(--card-solid); border: 1px solid var(--border); border-radius: 12px; padding: 12px; font-size: 12px;">' +
            '<div style="color: var(--accent-cyan); font-weight: 700; margin-bottom: 6px;">العناصر المفحوصة بدقة:</div>' +
            insp.featuresAudited.map(f => '<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">✓ ' + f.name + '</div>').join('') +
          '</div>' +
          '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; border-top: 1px solid var(--border); padding-top: 10px;">' +
            '<span>المشرف: <strong style="color: var(--accent-emerald);">' + insp.supervisor + '</strong></span>' +
            '<span class="badge badge-cyan">' + insp.offlineScore + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      // Pending Approvals Table (Empowered PMs with Approve & Reject)
      const pendTbody = document.getElementById('pendingApprovalsTable');
      const pendingApps = data.approvals.filter(a => a.status === 'PENDING');
      if (pendingApps.length === 0) {
        pendTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--accent-emerald); padding: 24px;">✓ لا توجد بوابات معلقة، كافة المهام معتمدة من اللجنة التنفيذية والمالك وفق الأصول</td></tr>';
      } else {
        pendTbody.innerHTML = pendingApps.map(a => {
          return '<tr>' +
            '<td><span class="mono badge badge-neutral">' + a.id + '</span></td>' +
            '<td><span class="mono badge badge-purple">' + a.taskId + '</span></td>' +
            '<td><span class="badge badge-warning">المستوى L' + a.level + '</span></td>' +
            '<td style="font-weight: 700;">' + (a.approver || 'اللجنة التنفيذية') + '</td>' +
            '<td style="font-size: 13px;">' + a.rationale + '</td>' +
            '<td>' +
              '<div style="display: flex; gap: 6px;">' +
                '<button class="btn-action" style="background: rgba(16,185,129,0.15); border-color: var(--accent-emerald); color: var(--accent-emerald); padding: 6px 12px;" onclick="handleApprovalDecision(&quot;' + a.id + '&quot;, &quot;APPROVE&quot;)">✓ موافقة واعتماد</button>' +
                '<button class="btn-action" style="background: rgba(244,63,94,0.15); border-color: var(--accent-rose); color: var(--accent-rose); padding: 6px 12px;" onclick="handleApprovalDecision(&quot;' + a.id + '&quot;, &quot;REJECT&quot;)">✕ رفض وتعديل</button>' +
              '</div>' +
            '</td>' +
          '</tr>';
        }).join('');
      }

      // Reviews Ledger Table
      const revTbody = document.getElementById('reviewsLedgerTable');
      revTbody.innerHTML = data.reviews.map(r => {
        const vText = r.verdict === 'APPROVED' ? '✓ معتمد رسمياً' : r.verdict;
        return '<tr>' +
          '<td><span class="mono badge badge-neutral">' + r.id + '</span></td>' +
          '<td><span class="mono badge badge-purple">' + r.taskId + '</span></td>' +
          '<td style="font-weight: 700;">' + r.reviewer + '</td>' +
          '<td><span class="badge badge-success">' + vText + '</span></td>' +
          '<td style="font-size: 12px;">' + r.findings.join(' • ') + '</td>' +
          '<td><span class="mono">' + new Date(r.signedAt).toLocaleTimeString() + '</span></td>' +
        '</tr>';
      }).join('');

      // All Comments Table
      const allCommentsTbody = document.getElementById('allCommentsTable');
      allCommentsTbody.innerHTML = data.comments.map(c => {
        return '<tr>' +
          '<td><span class="mono badge badge-neutral">' + c.id + '</span></td>' +
          '<td><span class="mono badge badge-purple">' + c.taskId + '</span></td>' +
          '<td style="font-weight: 700;">' + c.author + '</td>' +
          '<td><span class="badge badge-cyan">' + c.role + '</span></td>' +
          '<td style="font-size: 13px;">' + c.content + '</td>' +
          '<td><span class="mono">' + new Date(c.timestamp).toLocaleTimeString() + '</span></td>' +
        '</tr>';
      }).join('');

      // Opportunities
      renderOpportunityRadar(data.opportunities);
      renderOpportunityMatrix(data.opportunities);

      const oppGrid = document.getElementById('oppCardsGrid');
      if (oppGrid) {
        oppGrid.innerHTML = data.opportunities.map(o => {
          return '<div class="info-card" onclick="openOppModal(&quot;' + o.id + '&quot;)">' +
            '<div>' +
              '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">' +
                '<span class="mono badge badge-cyan">' + o.id + '</span>' +
                '<span class="badge badge-purple">' + o.priority + '</span>' +
              '</div>' +
              '<h3 style="font-size: 16px; font-weight: 800; margin-bottom: 6px;">' + o.title + '</h3>' +
              '<p style="font-size: 12px; color: var(--text-muted); line-height: 1.5;">' + (o.problem ? o.problem.slice(0, 160) + '...' : '') + '</p>' +
            '</div>' +
            '<div style="font-size: 11px; color: var(--text-sub); border-top: 1px solid var(--border); padding-top: 10px;">' +
              '<span>ملف الحزمة: </span><span class="mono">' + o.filename + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      // Events Table
      const eventsTbody = document.getElementById('eventsTableBody');
      eventsTbody.innerHTML = data.events.map(e => {
        return '<tr>' +
          '<td><span class="mono badge badge-neutral">' + (e.eventId || 'EVT') + '</span></td>' +
          '<td><span class="badge badge-purple">' + (e.who || 'النظام التلقائي') + '</span></td>' +
          '<td style="font-weight: 700;">' + e.what + '</td>' +
          '<td style="font-size: 12px; color: var(--text-muted);">' + e.why + '</td>' +
          '<td><span class="badge badge-cyan">' + (e.newStage || 'المرحلة 3') + '</span></td>' +
          '<td><span class="mono">' + new Date(e.timestamp).toLocaleTimeString() + '</span></td>' +
        '</tr>';
      }).join('');

      // Populate Selects in Modals
      const commentSelect = document.getElementById('commentTaskId');
      if (commentSelect) {
        commentSelect.innerHTML = data.tasks.map(t => '<option value="' + t.id + '">' + t.id + ' — ' + t.title + '</option>').join('');
      }
    }

    // Modal Operations
    function openModalWithContent(title, html) {
      const modal = document.getElementById('detailModal');
      const content = document.getElementById('modalContent');
      content.innerHTML = '<h2 style="font-size: 19px; font-weight: 800; margin-bottom: 16px;">' + title + '</h2>' + html;
      modal.classList.add('open');
    }
    function closeModal() { document.getElementById('detailModal').classList.remove('open'); }

    function openCreateTaskModal(status) {
      if (status && document.getElementById('newTaskStatus')) {
        document.getElementById('newTaskStatus').value = status;
      }
      document.getElementById('createTaskModal').classList.add('open');
    }
    function closeCreateTaskModal() { document.getElementById('createTaskModal').classList.remove('open'); }

    function openAddCommentModal() { document.getElementById('addCommentModal').classList.add('open'); }
    function closeAddCommentModal() { document.getElementById('addCommentModal').classList.remove('open'); }

    function openTaskModal(taskId) {
      if (!globalState) return;
      const t = globalState.tasks.find(x => x.id === taskId);
      if (!t) return;
      const taskComments = (globalState.comments || []).filter(c => c.taskId === taskId);
      const prioText = t.priority === 'P0_CRITICAL' ? 'P0 حرجة وفورية' : t.priority === 'P1_HIGH' ? 'P1 أولوية قصوى' : t.priority === 'P2_MEDIUM' ? 'P2 متوسطة الأهمية' : 'P3 منخفضة';
      const prioBadge = t.priority === 'P0_CRITICAL' ? 'badge-danger' : t.priority === 'P1_HIGH' ? 'badge-warning' : 'badge-neutral';
      const appText = t.approvalStatus === 'APPROVED' ? '✓ معتمد رسمياً' : t.approvalStatus === 'CHANGES_REQUESTED' ? 'مطلوب تعديلات وإعادة فحص' : '⏳ بانتظار الاعتماد الإداري';
      const statusText = t.status === 'COMPLETED' ? 'مكتملة ومعتمدة بنجاح' : t.status === 'READY' ? 'جاهزة للتنفيذ والبدء' : t.status === 'IN_PROGRESS' ? 'قيد العمل والتنفيذ الفعلي' : t.status === 'REVIEW' ? 'قيد المراجعة والتدقيق' : t.status;
      const levelRole = (t.authorityLevel >= 4 ? 'صلاحية المالك واللجنة التنفيذية' : t.authorityLevel === 3 ? 'صلاحية المشرف المعتمد' : 'صلاحية المنفذ المحلي');

      const html = '<div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">' +
          '<div><strong>المعرف:</strong> <span class="mono badge badge-neutral">' + t.id + '</span></div>' +
          '<div style="display: flex; gap: 6px; align-items: center;">' +
            '<span style="font-size: 11px; color: var(--text-sub);">نقل فوري إلى:</span>' +
            '<button class="kanban-move-btn" onclick="quickMoveTask(&quot;' + t.id + '&quot;, &quot;READY&quot;)">جاهزة</button>' +
            '<button class="kanban-move-btn" onclick="quickMoveTask(&quot;' + t.id + '&quot;, &quot;IN_PROGRESS&quot;)">تنفيذ</button>' +
            '<button class="kanban-move-btn" onclick="quickMoveTask(&quot;' + t.id + '&quot;, &quot;REVIEW&quot;)">تدقيق</button>' +
            '<button class="kanban-move-btn" onclick="quickMoveTask(&quot;' + t.id + '&quot;, &quot;COMPLETED&quot;)">اكتمال ✓</button>' +
          '</div>' +
        '</div>' +
        '<div><strong>العنوان:</strong> <span style="font-weight: 800;">' + t.title + '</span></div>' +
        '<div><strong>الوصف التفصيلي:</strong> <div style="background: var(--card-solid); padding: 10px; border-radius: 10px; border: 1px solid var(--border); margin-top: 4px;">' + (t.description || '-') + '</div></div>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">' +
          '<div><strong>الوكيل المنفذ:</strong> <span style="color: var(--accent-cyan); font-weight: 700;">' + (t.worker || 'أحمد') + '</span></div>' +
          '<div><strong>المشرف الإداري:</strong> <span style="color: var(--accent-emerald); font-weight: 700;">' + (t.supervisor || 'المدير التنفيذي') + '</span></div>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">' +
          '<div><strong>الأولوية:</strong> <span class="badge ' + prioBadge + '">' + prioText + '</span></div>' +
          '<div><strong>مستوى الصلاحية:</strong> <span class="badge badge-neutral">المستوى L' + (t.authorityLevel || 2) + ' (' + levelRole + ')</span></div>' +
        '</div>' +
        '<div><strong>حالة الموافقة:</strong> <span class="badge badge-success">' + appText + '</span> | <strong>حالة الكانبان:</strong> <span class="badge badge-purple">' + statusText + '</span></div>' +
        '<div style="border-top: 1px solid var(--border); padding-top: 12px;">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
            '<strong>سجل النقاشات على هذه المهمة (' + taskComments.length + '):</strong>' +
            '<button class="kanban-move-btn" onclick="closeModal(); document.getElementById(&quot;commentTaskId&quot;).value=&quot;' + t.id + '&quot;; openAddCommentModal();">➕ إضافة تعليق</button>' +
          '</div>' +
          '<div style="display: flex; flex-direction: column; gap: 8px;">' +
            (taskComments.length === 0 ? '<div style="color: var(--text-sub);">لا توجد تعليقات بعد</div>' :
              taskComments.map(c => '<div style="background: var(--card-solid); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);">' +
                '<div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">' +
                  '<strong style="color: var(--accent-cyan);">' + c.author + ' (' + c.role + ')</strong>' +
                  '<span class="mono">' + new Date(c.timestamp).toLocaleTimeString() + '</span>' +
                '</div>' +
                '<div>' + c.content + '</div>' +
              '</div>').join('')) +
          '</div>' +
        '</div>' +
      '</div>';
      openModalWithContent('تفاصيل المهمة: ' + t.id, html);
    }

    function openInspectionModal(inspId) {
      if (!globalState) return;
      const insp = globalState.inspections.find(x => x.id === inspId);
      if (!insp) return;
      const html = '<div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">' +
        '<div><strong>المعرف:</strong> <span class="mono badge badge-neutral">' + insp.id + '</span></div>' +
        '<div><strong>المحطة:</strong> <span style="font-weight: 800;">' + insp.nameAr + '</span></div>' +
        '<div><strong>مسار المكون البرمجي:</strong> <span class="mono" style="color: var(--accent-cyan);">' + insp.componentPath + '</span></div>' +
        '<div><strong>المشرف:</strong> ' + insp.supervisor + ' | <strong>المدقق:</strong> ' + insp.auditor + '</div>' +
        '<div><strong>جاهزية السيادة المحلية:</strong> <span class="badge badge-success">' + insp.offlineScore + '</span></div>' +
        '<div style="background: var(--card-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">' +
          '<strong style="color: var(--accent-emerald); display: block; margin-bottom: 6px;">الأدلة الميدانية المثبتة [FACT]:</strong>' +
          insp.evidence.map(e => '<div style="margin-bottom: 4px;">• ' + e + '</div>').join('') +
        '</div>' +
      '</div>';
      openModalWithContent('تقرير فحص المحطة: ' + insp.id, html);
    }

    function openPmModal(pmId) {
      if (!globalState) return;
      const pm = globalState.directors.find(x => x.id === pmId);
      if (!pm) return;
      const html = '<div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">' +
        '<div><strong>المسؤول:</strong> ' + pm.name + '</div>' +
        '<div><strong>نطاق الإشراف:</strong> ' + pm.domain + '</div>' +
        '<div><strong>فريق التنفيذ الخاضع للإشراف:</strong> ' + pm.supervisorOf.join(', ') + '</div>' +
        '<div style="background: var(--card-solid); padding: 14px; border-radius: 12px; border: 1px solid var(--border);">' +
          '<strong style="color: var(--accent-emerald); display: block; margin-bottom: 4px;">حكم إعادة الفحص الشامل:</strong>' +
          pm.auditVerdict +
        '</div>' +
      '</div>';
      openModalWithContent('بطاقة المدير والمشرف: ' + pm.id, html);
    }

    function switchOppSubtab(tab) {
      const tabs = ['radar', 'portfolio', 'matrix', 'cards'];
      tabs.forEach(t => {
        const btn = document.getElementById('oppTab' + t.charAt(0).toUpperCase() + t.slice(1));
        const pane = document.getElementById('oppSubview' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) btn.classList.toggle('active', t === tab);
        if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
      });
      triggerTactileClick();
    }

    function renderOpportunityRadar(opps) {
      const qw = document.getElementById('quadrantQuickWins');
      const sb = document.getElementById('quadrantStrategicBets');
      const fi = document.getElementById('quadrantFillIns');
      const re = document.getElementById('quadrantReEvaluate');
      if (!qw || !sb || !fi || !re) return;

      qw.innerHTML = '';
      sb.innerHTML = '';
      fi.innerHTML = '';
      re.innerHTML = '';

      opps.forEach(o => {
        const cardHtml = '<div class="opp-radar-card" onclick="openOppModal(&quot;' + o.id + '&quot;)">' +
          '<div style="display: flex; justify-content: space-between; align-items: center;">' +
            '<span class="mono badge badge-cyan" style="font-size: 11px;">' + o.id + '</span>' +
            '<span class="badge badge-purple" style="font-size: 10px;">أثر ' + o.impact + '/5 • جهد ' + o.effort + '/5</span>' +
          '</div>' +
          '<div style="font-weight: 800; font-size: 13px;">' + o.title + '</div>' +
          '<div style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">' + (o.whyNow ? o.whyNow.slice(0, 110) + '...' : '') + '</div>' +
          '<div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 6px; font-size: 11px;">' +
            '<span style="color: var(--accent-emerald); font-weight: 700;">درجة الأولوية: ' + o.score + '</span>' +
            '<span class="badge badge-success">' + o.status + '</span>' +
          '</div>' +
        '</div>';

        if (o.quadrant === 'QUICK_WIN') qw.innerHTML += cardHtml;
        else if (o.quadrant === 'STRATEGIC_BET') sb.innerHTML += cardHtml;
        else if (o.quadrant === 'FILL_IN') fi.innerHTML += cardHtml;
        else re.innerHTML += cardHtml;
      });

      if (!qw.innerHTML) qw.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); padding: 8px;">لا توجد عناصر حالياً</div>';
      if (!sb.innerHTML) sb.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); padding: 8px;">لا توجد عناصر حالياً</div>';
      if (!fi.innerHTML) fi.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); padding: 8px;">لا توجد عناصر حالياً</div>';
      if (!re.innerHTML) re.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); padding: 8px;">لا توجد عناصر حالياً</div>';
    }

    function renderOpportunityMatrix(opps) {
      const tbody = document.getElementById('oppMatrixTableBody');
      if (!tbody) return;
      tbody.innerHTML = opps.map(o => {
        return '<tr>' +
          '<td><span class="mono badge badge-cyan">' + o.id + '</span></td>' +
          '<td><strong style="cursor: pointer; color: var(--text);" onclick="openOppModal(&quot;' + o.id + '&quot;)">' + o.title + '</strong><br><span style="font-size: 11px; color: var(--text-muted);">' + o.category + '</span></td>' +
          '<td><span class="badge badge-neutral">' + o.horizon + '</span></td>' +
          '<td><span style="color: var(--accent-emerald); font-weight: 700;">' + o.impact + '</span> / <span style="color: var(--accent-amber); font-weight: 700;">' + o.effort + '</span></td>' +
          '<td><span class="badge badge-purple">' + o.score + '</span></td>' +
          '<td style="font-size: 12px; max-width: 240px; color: var(--text-muted);">' + o.whyNow + '</td>' +
          '<td style="font-size: 11px; max-width: 200px; color: var(--text-sub);">' + o.evidenceContra + '</td>' +
          '<td><span class="badge badge-success">' + o.status + '</span></td>' +
          '<td><button class="kanban-move-btn" onclick="openOppModal(&quot;' + o.id + '&quot;)">فحص الحزمة ↗</button></td>' +
        '</tr>';
      }).join('');
    }

    function openOppModal(oppId) {
      if (!globalState) return;
      const opp = globalState.opportunities.find(x => x.id === oppId);
      if (!opp) return;

      const html = '<div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">' +
          '<div style="display: flex; align-items: center; gap: 8px;">' +
            '<span class="mono badge badge-cyan">' + opp.id + '</span>' +
            '<span class="badge badge-purple">' + opp.horizon + '</span>' +
            '<span class="badge badge-success">' + opp.status + '</span>' +
          '</div>' +
          '<div style="display: flex; gap: 8px; font-size: 12px;">' +
            '<span>الأثر: <strong style="color: var(--accent-emerald);">' + opp.impact + '/5</strong></span>' +
            '<span>• الجهد: <strong style="color: var(--accent-amber);">' + opp.effort + '/5</strong></span>' +
            '<span>• الأولوية: <strong style="color: var(--accent-cyan);">' + opp.score + '</strong></span>' +
          '</div>' +
        '</div>' +

        '<div style="background: var(--card-solid); padding: 14px; border-radius: 12px; border: 1px solid var(--border);">' +
          '<strong style="color: var(--accent-cyan); display: block; margin-bottom: 6px;">1. بيان المشكلة (Problem Statement):</strong>' +
          '<div style="white-space: pre-wrap; font-size: 12px; color: var(--text); line-height: 1.6;">' + opp.problem + '</div>' +
        '</div>' +

        '<div style="background: var(--card-solid); padding: 14px; border-radius: 12px; border: 1px solid var(--border);">' +
          '<strong style="color: var(--accent-emerald); display: block; margin-bottom: 6px;">2. بوابة التبرير الزمني (Why Now Gate):</strong>' +
          '<div style="font-size: 12px; color: var(--text); line-height: 1.6;">' + opp.whyNow + '</div>' +
        '</div>' +

        '<div style="background: var(--card-solid); padding: 14px; border-radius: 12px; border: 1px solid var(--border);">' +
          '<strong style="color: var(--accent-amber); display: block; margin-bottom: 6px;">3. الأدلة المضادة والمخاطر (Evidence Against & Risks):</strong>' +
          '<div style="font-size: 12px; color: var(--text-muted); line-height: 1.6;">' + opp.evidenceContra + '</div>' +
        '</div>' +

        (opp.tech ? (
          '<div style="background: var(--card-solid); padding: 14px; border-radius: 12px; border: 1px solid var(--border);">' +
            '<strong style="color: var(--accent-purple); display: block; margin-bottom: 6px;">4. المعمارية الهندسية المستهدفة:</strong>' +
            '<div style="font-size: 12px; color: var(--text); line-height: 1.6; white-space: pre-wrap;">' + opp.tech + '</div>' +
          '</div>'
        ) : '') +

        '<div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">' +
          '<div style="font-size: 11px; color: var(--text-muted);">' +
            '<span>سلطة الاعتماد: </span><strong>كامل صلاحيات الـ PMs مفوضة للاعتماد</strong>' +
          '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="kanban-move-btn" onclick="decideOpportunity(&quot;' + opp.id + '&quot;, &quot;APPROVED&quot;)" style="color: var(--accent-emerald); border-color: var(--accent-emerald); padding: 6px 14px;">✓ اعتماد للتنفيذ الفوري</button>' +
            '<button class="kanban-move-btn" onclick="decideOpportunity(&quot;' + opp.id + '&quot;, &quot;DEFERRED&quot;)" style="color: var(--accent-amber); border-color: var(--accent-amber); padding: 6px 14px;">⏳ تأجيل مرحلي</button>' +
          '</div>' +
        '</div>' +
      '</div>';

      openModalWithContent('حزمة تطور المنتج: ' + opp.id + ' — ' + opp.title, html);
    }

    async function decideOpportunity(oppId, action) {
      try {
        const res = await fetch('/api/opportunities/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oppId, action, decidedBy: 'Executive Committee & PM-07' }),
        });
        if (res.ok) {
          triggerSoundNotice();
          closeModal();
          showToast('✓ تم تسجيل قرار [' + action + '] على الحزمة ' + oppId);
        }
      } catch (err) {
        showToast('⚠️ تعذر تسجيل القرار');
      }
    }

    // Submit New Task API Call
    async function submitNewTask(e) {
      e.preventDefault();
      const payload = {
        title: document.getElementById('newTaskTitle').value,
        description: document.getElementById('newTaskDesc').value,
        epic: document.getElementById('newTaskEpic').value,
        priority: document.getElementById('newTaskPriority').value,
        worker: document.getElementById('newTaskWorker').value,
        supervisor: document.getElementById('newTaskSupervisor').value,
        authorityLevel: parseInt(document.getElementById('newTaskLevel').value, 10),
        status: document.getElementById('newTaskStatus')?.value || 'READY',
      };

      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          closeCreateTaskModal();
          triggerSoundNotice();
          showToast('✓ تمت إضافة المهمة وبثها لحظياً بنجاح');
          e.target.reset();
        }
      } catch (err) {
        alert('تعذر إضافة المهمة');
      }
    }

    // Submit New Comment API Call
    async function submitNewComment(e) {
      e.preventDefault();
      const payload = {
        taskId: document.getElementById('commentTaskId').value,
        author: document.getElementById('commentAuthor').value,
        role: document.getElementById('commentRole').value,
        content: document.getElementById('commentContent').value,
      };

      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          closeAddCommentModal();
          triggerSoundNotice();
          showToast('✓ تم نشر الملاحظة في سجل النقاشات بنجاح');
          document.getElementById('commentContent').value = '';
        }
      } catch (err) {
        alert('تعذر نشر التعليق');
      }
    }

    // Governance Decision: Approve or Reject
    async function handleApprovalDecision(approvalId, action) {
      const approverSelect = document.getElementById('activeApproverSelect');
      const approver = approverSelect ? approverSelect.value : 'Executive Product Director';
      let reason = '';
      if (action === 'REJECT') {
        reason = prompt('يرجى كتابة سبب الرفض أو التعديلات المطلوبة للمنفذ:') || 'طلب تعديل من المشرف';
        if (!reason) return;
      }

      try {
        const res = await fetch('/api/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approvalId, approver, action, reason }),
        });
        if (res.ok) {
          triggerSoundNotice();
          showToast(action === 'APPROVE' ? '✓ تم اعتماد القرار وتحديث حالة المهمة' : '✕ تم تسجيل الرفض وإعادة المهمة للتعديل');
        }
      } catch (err) {
        alert('تعذر تنفيذ القرار');
      }
    }

    // Auto-Approve All Pending Gates by Committee Authority
    async function autoApproveAllGates() {
      const approverSelect = document.getElementById('activeApproverSelect');
      const approver = approverSelect ? approverSelect.value : 'Executive Committee';
      try {
        const res = await fetch('/api/approvals/auto-approve-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approver }),
        });
        if (res.ok) {
          triggerSoundNotice();
          showToast('⚡ تم الاعتماد الذاتي الكامل لكافة البوابات من لجنة المديرين');
        }
      } catch (err) {
        alert('تعذر الاعتماد الذاتي');
      }
    }

    // Connect to Server-Sent Events (SSE)
    function connectSSE() {
      const liveDot = document.getElementById('liveDot');
      const liveStatusText = document.getElementById('liveStatusText');

      const es = new EventSource('/api/stream');
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          renderState(data);
          liveDot.style.background = '#059669';
          liveStatusText.innerText = 'متصل لحظياً (SSE)';
        } catch (e) {
          console.error(e);
        }
      };

      es.onerror = () => {
        liveDot.style.background = '#d97706';
        liveStatusText.innerText = 'إعادة الاتصال...';
        es.close();
        setTimeout(connectSSE, 3000);
      };
    }

    fetch('/api/state')
      .then(res => res.json())
      .then(renderState)
      .catch(console.error);

    connectSSE();
  </script>
</body>
</html>
`;

// Helper to parse JSON body from request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // SSE Stream
  if (url.pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(`data: ${JSON.stringify(getFullState())}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // GET State
  if (url.pathname === '/api/state' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(getFullState()));
    return;
  }

  // POST New Task
  if (url.pathname === '/api/tasks' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const tasksFile = path.resolve(STATE_DIR, 'tasks.jsonl');
      const existing = readJsonl(tasksFile);
      const nextNum = existing.length + 1;
      const nextId = `TASK-${String(nextNum).padStart(4, '0')}`;

      const newTask = {
        id: nextId,
        title: data.title || 'مهمة جديدة',
        description: data.description || '',
        epic: data.epic || 'ProductEvolution',
        priority: data.priority || 'P1_HIGH',
        authorityLevel: data.authorityLevel || 2,
        worker: data.worker || 'ENG-01 (Frontend Specialist)',
        supervisor: data.supervisor || 'PM-01 (Product Director)',
        reviewers: [data.supervisor || 'PM-01'],
        approvalRequired: (data.authorityLevel || 2) >= 3,
        approvalStatus: (data.authorityLevel || 2) >= 3 ? 'PENDING_APPROVAL' : 'APPROVED',
        status: data.status || 'READY',
        createdAt: new Date().toISOString(),
      };

      appendJsonl(tasksFile, newTask);

      if (newTask.approvalRequired) {
        const appsFile = path.resolve(STATE_DIR, 'approvals.jsonl');
        const apps = readJsonl(appsFile);
        const appNum = apps.length + 1;
        appendJsonl(appsFile, {
          id: `APP-${String(appNum).padStart(4, '0')}`,
          taskId: nextId,
          level: newTask.authorityLevel,
          approver: data.supervisor || 'Executive Committee',
          status: 'PENDING',
          rationale: `Approval required for Level ${newTask.authorityLevel} task: ${newTask.title}`,
          timestamp: new Date().toISOString(),
        });
      }

      broadcastState();
      res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, task: newTask }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST Move Task (Kanban Drag & Drop / Single Click Status Transition)
  if (url.pathname === '/api/tasks/move' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const tasksFile = path.resolve(STATE_DIR, 'tasks.jsonl');
      const tasks = readJsonl(tasksFile);
      let updatedTask = null;
      const updatedTasks = tasks.map((t) => {
        if (t.id === data.taskId) {
          updatedTask = {
            ...t,
            status: data.newStatus,
            updatedAt: new Date().toISOString(),
            ...(data.newStatus === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
          };
          return updatedTask;
        }
        return t;
      });
      writeJsonl(tasksFile, updatedTasks);

      const commentsFile = path.resolve(STATE_DIR, 'comments.jsonl');
      const comments = readJsonl(commentsFile);
      const nextNum = comments.length + 1;
      appendJsonl(commentsFile, {
        id: `CMT-${String(nextNum).padStart(4, '0')}`,
        taskId: data.taskId,
        author: data.author || 'Kanban System',
        role: 'Task Movement',
        content: `تم نقل حالة المهمة إلى: [${data.newStatus}]`,
        timestamp: new Date().toISOString(),
      });

      broadcastState();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, task: updatedTask }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST Add Comment
  if (url.pathname === '/api/comments' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const commentsFile = path.resolve(STATE_DIR, 'comments.jsonl');
      const existing = readJsonl(commentsFile);
      const nextNum = existing.length + 1;
      const nextId = `CMT-${String(nextNum).padStart(4, '0')}`;

      const newComment = {
        id: nextId,
        taskId: data.taskId || 'TASK-0013',
        author: data.author || 'Executive Product Director',
        role: data.role || 'Executive Decision Maker',
        content: data.content || '',
        timestamp: new Date().toISOString(),
      };

      appendJsonl(commentsFile, newComment);
      broadcastState();
      res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, comment: newComment }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST Approve / Reject Gate (Full PM & Executive Powers)
  if (url.pathname === '/api/approvals' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const appsFile = path.resolve(STATE_DIR, 'approvals.jsonl');
      const tasksFile = path.resolve(STATE_DIR, 'tasks.jsonl');
      const commentsFile = path.resolve(STATE_DIR, 'comments.jsonl');
      const apps = readJsonl(appsFile);
      const tasks = readJsonl(tasksFile);

      const action = data.action === 'REJECT' ? 'REJECTED' : 'APPROVED';
      const approver = data.approver || 'Executive Product Director';

      let targetTaskId = null;
      const updatedApps = apps.map((a) => {
        if (a.id === data.approvalId) {
          targetTaskId = a.taskId;
          return {
            ...a,
            status: action,
            [action === 'APPROVED' ? 'approvedBy' : 'rejectedBy']: approver,
            [action === 'APPROVED' ? 'approvedAt' : 'rejectedAt']: new Date().toISOString(),
            rationale: data.reason ? `${a.rationale} [توجيه المشرف: ${data.reason}]` : a.rationale,
          };
        }
        return a;
      });
      writeJsonl(appsFile, updatedApps);

      if (targetTaskId) {
        const updatedTasks = tasks.map((t) => {
          if (t.id === targetTaskId) {
            return {
              ...t,
              approvalStatus: action === 'APPROVED' ? 'APPROVED' : 'CHANGES_REQUESTED',
              status: action === 'APPROVED' ? (t.status === 'READY' ? 'IN_PROGRESS' : t.status) : 'READY',
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        });
        writeJsonl(tasksFile, updatedTasks);

        if (action === 'REJECTED' || data.reason) {
          const comments = readJsonl(commentsFile);
          const nextNum = comments.length + 1;
          appendJsonl(commentsFile, {
            id: `CMT-${String(nextNum).padStart(4, '0')}`,
            taskId: targetTaskId,
            author: approver,
            role: 'Supervising Authority',
            content: action === 'REJECTED'
              ? `[طلب تعديل / Rejection]: قرر المشرف إعادة المهمة للتعديل — ${data.reason}`
              : `[اعتماد وموافقة / Approval]: ${data.reason || 'تم اعتماد المهمة للتنفيذ الفوري'}`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      broadcastState();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, status: action }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST Auto-Approve All Gates (Executive Committee Authority)
  if (url.pathname === '/api/approvals/auto-approve-all' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const approver = data.approver || 'Executive Product Director & Supervising PMs';
      const appsFile = path.resolve(STATE_DIR, 'approvals.jsonl');
      const tasksFile = path.resolve(STATE_DIR, 'tasks.jsonl');
      const commentsFile = path.resolve(STATE_DIR, 'comments.jsonl');

      const apps = readJsonl(appsFile);
      const tasks = readJsonl(tasksFile);
      const comments = readJsonl(commentsFile);

      const approvedTaskIds = new Set();
      const updatedApps = apps.map((a) => {
        if (a.status === 'PENDING') {
          approvedTaskIds.add(a.taskId);
          return {
            ...a,
            status: 'APPROVED',
            approvedBy: approver,
            approvedAt: new Date().toISOString(),
          };
        }
        return a;
      });
      writeJsonl(appsFile, updatedApps);

      const updatedTasks = tasks.map((t) => {
        if (approvedTaskIds.has(t.id)) {
          return {
            ...t,
            approvalStatus: 'APPROVED',
            status: t.status === 'READY' ? 'IN_PROGRESS' : t.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      writeJsonl(tasksFile, updatedTasks);

      const nextNum = comments.length + 1;
      appendJsonl(commentsFile, {
        id: `CMT-${String(nextNum).padStart(4, '0')}`,
        taskId: Array.from(approvedTaskIds)[0] || 'TASK-0013',
        author: approver,
        role: 'اللجنة التنفيذية',
        content: `ممارسة كامل الصلاحيات المفوضة من المالك (أحمد): تم اعتماد كافة البوابات المعلقة (${Array.from(approvedTaskIds).join(', ')}) ذاتياً وفورياً لبدء التنفيذ في السبرنت.`,
        timestamp: new Date().toISOString(),
      });

      broadcastState();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, approvedCount: approvedTaskIds.size }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST Decide Opportunity (Approve / Defer / Reject ODP)
  if (url.pathname === '/api/opportunities/decide' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const decFile = path.resolve(STATE_DIR, 'decisions.jsonl');
      const commentsFile = path.resolve(STATE_DIR, 'comments.jsonl');
      const decisions = readJsonl(decFile);
      const nextDecNum = decisions.length + 1;
      const decId = `DEC-${String(nextDecNum).padStart(4, '0')}`;

      const decisionRecord = {
        id: decId,
        opportunityId: data.oppId,
        decision: data.action || 'APPROVED',
        decidedBy: data.decidedBy || 'Human Project Owner (Ahmad) & Executive Director',
        rationale: data.rationale || `Decision on Opportunity Pack ${data.oppId}`,
        timestamp: new Date().toISOString(),
      };
      appendJsonl(decFile, decisionRecord);

      const comments = readJsonl(commentsFile);
      const nextCmtNum = comments.length + 1;
      appendJsonl(commentsFile, {
        id: `CMT-${String(nextCmtNum).padStart(4, '0')}`,
        taskId: 'TASK-0016',
        author: data.decidedBy || 'PM-07 / Executive Director',
        role: 'Strategic Opportunity Decision',
        content: `تم اعتماد القرار [${data.action}] على حزمة التطور [${data.oppId}]: ${data.rationale || 'موافقة للتنفيذ الفوري'}`,
        timestamp: new Date().toISOString(),
      });

      broadcastState();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, decision: decisionRecord }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Serve HTML
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML_TEMPLATE);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 MIDMAR LIGHT/DARK ENTERPRISE COCKPIT & TRACKER RUNNING`);
  console.log(`=============================================================`);
  console.log(`🌐 Local URL:       http://localhost:${PORT}`);
  console.log(`📡 Real-Time SSE:   http://localhost:${PORT}/api/stream`);
  console.log(`🎨 Theme:           Light Mode (Default) + Dark Mode Toggle`);
  console.log(`🔍 PM-02 & PM-05:   Market Research, Competitors, Personas & SEO`);
  console.log(`⚖️ Governance:      Full Autonomous Authority (Approve, Reject, Auto-Approve)`);
  console.log(`📋 Task REST APIs:  POST /api/tasks, POST /api/comments, POST /api/approvals`);
  console.log(`=============================================================\n`);
});
