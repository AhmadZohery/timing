import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  parseDelimitedText,
  parseJsonDeck,
  parseRawTextCards,
  exportDeckToAnkiTsv,
  type ParsedCardPreview,
  type ImportValidationReport,
} from '../../services/customDeckService';
import { spacedRepetition } from '../../services/spacedRepetitionService';

interface CustomDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (count: number) => void;
}

export const CustomDeckModal: React.FC<CustomDeckModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'export'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [deckTitle, setDeckTitle] = useState('');
  const [targetLevel, setTargetLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1');
  const [report, setReport] = useState<ImportValidationReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (!deckTitle) {
        setDeckTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      if (file.name.endsWith('.json')) {
        setReport(parseJsonDeck(content));
      } else {
        setReport(parseDelimitedText(content));
      }
    };
    reader.readAsText(file);
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) return;
    const rep = parseRawTextCards(pastedText);
    setReport(rep);
  };

  const handleSaveCards = () => {
    if (!report || report.validCards.length === 0) return;
    setIsProcessing(true);

    let savedCount = 0;
    try {
      const currentLang = spacedRepetition.getActiveLanguage();
      report.validCards.forEach((card: ParsedCardPreview) => {
        spacedRepetition.addCustomWord({
          word: card.term,
          translationAr: card.translation,
          phonetic: card.pronunciation || '',
          contextSentence: card.exampleSentence || '',
          contextSentenceAr: card.exampleTranslation || '',
          level: card.cefrLevel || targetLevel,
          partOfSpeech: 'noun',
          category: 'daily_fluency',
          lang: currentLang,
          collocations: card.tags.length > 0 ? card.tags : [deckTitle || 'مخصص'],
        });
        savedCount++;
      });

      setSuccessMsg(`تم استيراد ${savedCount} بطاقة بنجاح إلى بنك المفردات المخصص! 🎉`);
      if (onImportComplete) {
        onImportComplete(savedCount);
      }
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1400);
    } catch (e) {
      console.error('Failed to save cards:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportExisting = () => {
    const currentWords = spacedRepetition.getAllWordsForLanguage();
    const formatted: ParsedCardPreview[] = currentWords.map((w) => ({
      term: w.word,
      translation: w.translationAr,
      pronunciation: w.phonetic,
      exampleSentence: w.contextSentence,
      exampleTranslation: w.contextSentenceAr,
      cefrLevel: w.level,
      tags: w.collocations || [],
      isValid: true,
    }));

    const tsvContent = exportDeckToAnkiTsv(formatted);
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `midmar_vocabulary_anki_export_${Date.now()}.tsv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                استيراد وتخصيص حزم البطاقات (CEFR / Anki)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                توسيع حصيلتك اللغوية باستيراد ملفات CSV، TSV، أو حزم Anki مع تطهير فوري للبيانات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Badge */}
        <div className="px-6 py-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-emerald-500/10 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>🔒 سيادة بيانات كاملة: معالجة الملفات تتم محلياً 100% داخل متصفحك دون رفع أي بيانات لأي خادم.</span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-zinc-800/80 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            استيراد ملف (CSV / TSV / JSON)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'paste'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            لصق مباشر
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'export'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            تصدير بصيغة Anki
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    اسم الحزمة أو الموضوع
                  </label>
                  <input
                    type="text"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    placeholder="مثلاً: مفردات الذكاء الاصطناعي / القانون"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    مستوى الإتقان المستهدف (CEFR)
                  </label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="A1">A1 - مبتدئ تأسيسي</option>
                    <option value="A2">A2 - أساسي يومي</option>
                    <option value="B1">B1 - متوسط مستقل</option>
                    <option value="B2">B2 - فوق المتوسط كفء</option>
                    <option value="C1">C1 - متقدم احترافي</option>
                    <option value="C2">C2 - طلاقة متناهية</option>
                  </select>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  انقر لاختيار ملف أو اسحبه إلى هنا
                </span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  يدعم صيغ .csv, .tsv, .txt, .json وحزم Anki المصدرة
                </span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                الصق الكلمات وترجماتها (سطر لكل كلمة: الكلمة - الترجمة)
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Cognitive - الإدراك والمعرفة\nPerseverance - المثابرة والاستمرار\nEquanimity - رباطة الجأش والسكينة`}
                className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleParsePasted}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-emerald-600 transition-colors"
              >
                تحليل وتدقيق الأسطر
              </button>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="p-8 text-center space-y-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800">
              <Download className="w-10 h-10 text-emerald-500 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  تصدير بنك المفردات بصيغة Anki المعتمدة
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                  تنزيل ملف .tsv جاهز للاستيراد الفوري في برنامج Anki لسطح المكتب أو الهاتف المحمول.
                </p>
              </div>
              <button
                onClick={handleExportExisting}
                className="px-6 py-2.5 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/20"
              >
                تنزيل ملف Anki (.tsv)
              </button>
            </div>
          )}

          {/* Validation & Preview Report */}
          {report && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-zinc-300">
                  معاينة البطاقات ({report.validCards.length} صالحة / {report.invalidCards.length} استثناء)
                </span>
                {report.detectedDelimiter && (
                  <span className="text-[11px] text-slate-400">
                    الفاصل التلقائي: {report.detectedDelimiter === '\t' ? 'Tab' : report.detectedDelimiter}
                  </span>
                )}
              </div>

              {report.invalidCards.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">تم تجاهل {report.invalidCards.length} أسطر لعدم اكتمال الحقول.</span>
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 dark:bg-zinc-800/80 text-[11px] font-bold text-slate-500 dark:text-zinc-400 sticky top-0">
                    <tr>
                      <th className="p-2.5">المصطلح</th>
                      <th className="p-2.5">المعنى / الترجمة</th>
                      <th className="p-2.5">المستوى</th>
                      <th className="p-2.5">الوسوم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200">
                    {report.validCards.slice(0, 10).map((card, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                        <td className="p-2.5 font-bold">{card.term}</td>
                        <td className="p-2.5">{card.translation}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                            {card.cefrLevel}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400 text-[11px]">
                          {card.tags.join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            إلغاء
          </button>

          {report && report.validCards.length > 0 && (
            <button
              onClick={handleSaveCards}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>استيراد {report.validCards.length} بطاقة إلى بنكي</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
