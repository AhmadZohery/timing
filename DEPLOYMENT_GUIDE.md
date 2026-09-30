# 🚀 دليل النشر السحابي والرفع على الموقع — مضمار | Midmar LifeOS
## Comprehensive Production Deployment & Cloud Hosting Guide

تم إعداد وتحصين مشروع **مضمار (Midmar LifeOS)** ليعمل بكفاءة فائقة وسرعة إقلاع قياسية كـ **PWA** وتطبيق ويب إنتاجي متكامل وفق أعلى معايير الأمان وسيادة البيانات (Local-First).

---

## 📋 الفحص التلقائي الشامل قبل الرفع (Pre-Deployment Gate)
للتأكد من سلامة كافة أجزاء المشروع بضغطة واحدة قبل النشر:
```bash
node scripts/deploy-check.mjs
```
يقوم هذا السكريبت باختبار الـ 7 بوابات الأمنية والهندسية:
1. تجميع وإسقاط حالة المشروع المعيارية (`state compile`).
2. فحص تطابق أنواع تايب سكريبت الصارم بدون أخطاء (`tsc -b`).
3. الفحص البرمجي السريع بلغة ريست (`oxlint`).
4. تشغيل الاختبارات الآلية والانحدارية (`vitest` - 42 اختبار).
5. بناء حزم الإنتاج الموزعة بنجاح (`vite build`).
6. اختبار بوابات الحوكمة وسياسات التوجيه (`run-evals.mjs`).
7. اختبار الحماية ضد هجمات التوقيت وحقن الشيفرات (`security-pen-test.mjs`).

---

## 🌐 خيارات النشر والرفع (Deployment Options)

### الخيار 1: النشر على خادم خاص أو سحابة عبر Docker & Coolify (الموصى به للمنظومة المتكاملة)
هذا الخيار يُشغل التطبيق بالكامل مع السيرفر المرافق (Companion Server) وقاعدة بيانات PostgreSQL 16 السحابية ومزامنة الدلتا ومنبهات الويب الخلفية:

1. تأكد من وجود ملف `.env` (يمكنك نسخه من `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. شغل المنظومة عبر Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. سيعمل التطبيق مباشرة على المنفذ `80` (أو المنفذ المحدد في `PORT`)، مع تشغيل التخزين الدائم لبيانات PostgreSQL في المجلد المخصص.

> **ملاحظة لـ Coolify:** يمكنك ربط مستودع GitHub في لوحة Coolify واختيار `Docker Compose`، وسيقوم ببناء وتشغيل التطبيق وقاعدة البيانات تلقائياً مع شهادة SSL مجانية (Let's Encrypt).

---

### الخيار 2: الرفع على منصات الاستضافة الثابتة (Vercel / Netlify / Cloudflare Pages)
نظراً لأن مضمار مبني بمعمارية **Local-First Pure Client**، يمكنك رفع واجهة العميل كاملة لتعمل أوفلاين 100%:

#### أ) النشر على Vercel:
- تم تجهيز ملف `vercel.json` بإعدادات التوجيه (SPA Rewrites) وكاش ترويسات الأمان.
- للأمر السريع عبر الـ CLI:
  ```bash
  npx vercel --prod
  ```
- أو عبر ربط المستودع في dashboard.vercel.com واختيار إطار العمل `Vite`.

#### ب) النشر على Netlify:
- تم تجهيز ملف `netlify.toml` وملف `public/_redirects`.
- أمر النشر عبر الـ CLI:
  ```bash
  npx netlify deploy --prod --dir=dist
  ```
- أمر البناء هو `npm run build` ومجلد النشر هو `dist`.

#### ج) النشر على Cloudflare Pages أو GitHub Pages:
- Build Command: `npm run build`
- Output Directory: `dist`

---

### الخيار 3: التشغيل على VPS (Ubuntu / Debian) التقليدي بواسطة PM2
إذا كنت تفضل تشغيل السيرفر مباشرة دون دوكر:
```bash
# 1. بناء ملفات الواجهة
npm run build

# 2. تشغيل السيرفر بواسطة PM2
pm2 start server/index.mjs --name "midmar-lifeos" --env production

# 3. حفظ حالة PM2 لإعادة التشغيل التلقائي مع السيرفر
pm2 save
pm2 startup
```

---

## 🔐 إدارة المفاتيح والخصوصية (Environment & Secrets)
- جميع مفاتيح الذكاء الاصطناعي (`DEEPSEEK_API_KEY` و `GEMINI_API_KEY`) وسر السيرفر (`SERVER_API_SECRET`) يتم تمريرها في بيئة السيرفر فقط.
- كود العميل (Frontend) نظيف 100% وخالٍ من أي مفاتيح مسربة بفضل سياسة العزل الصارم.
