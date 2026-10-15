# خطة الهوية الهجينة الموحّدة — Celestial Obsidian + 3D Tactile Bento

**المصدر:** محادثة التصميم `a6bd91da` (2026-10-16 00:18 → 01:14). **الحالة:** معتمدة من Ahmad، قيد التنفيذ.
**المهام:** `TASK-0036` … `TASK-0040` في `project-management/state/tasks.jsonl`.

## التصميم
- مسرح سَبَجي علوي منحني `#141517` بإشعاع ذهبي/زمردي، وقوس الصلوات الخمس (شمس ← هلال).
- بطاقات بينتو باستيل مجسّمة: Lavender / Rose / Mint / Amber (حواف بيضاء + ظل داخلي)، وتتحول في `html.dark` لزجاج سَبَجي.
- بطاقة محراب زمردية بإطار ذهبي `.mihrab-emerald-arch` لآية اليوم والورد والتسبيح.
- كرونوغراف منحوت `.chronograph-3d-ring` لمؤقتات العمل والراحة.
- تذكرة فخر ذهبية مسائية `.pride-golden-ticket`.

## ترتيب التنفيذ (بوابة بعد كل خطوة: `npx tsc -b` + `npm run lint` = صفر أخطاء)
| # | المهمة | الملفات |
|---|---|---|
| 1 | TASK-0036 | `src/index.css` |
| 2 | TASK-0037 | `src/components/dashboard/HomeDashboardView.tsx` |
| 3 | TASK-0038 | `CommuteMorningView.tsx`, `SmartTasbihModal.tsx` |
| 4 | TASK-0039 | `WorkMicroSprintView.tsx`, `GymAnchorView.tsx` |
| 5 | TASK-0040 | `RetrospectiveCheckinView.tsx`, `EveningSprintView.tsx` + `npm run build` + `node scripts/state.mjs compile` |

## قيود إلزامية (GEMINI.md)
- خط عربي `font-weight ≤ 700`، `letter-spacing: normal`، `line-height ≥ 2.2` للنص المشكول (`.tashkeel-text`).
- أهداف لمس ≥ 44px، لا `data-no-swipe` على الحاويات الخارجية، اتجاه الأسهم صحيح في RTL.
- لا مكتبات خارجية جديدة؛ المحلّية أولاً؛ الوضع الليلي لكل فئة جديدة.
- مراجعة بصرية على 390px وعلى الديسكتوب (السيرفر `http://127.0.0.1:5173/`).
