import React, { useState, useEffect } from 'react';
import {
  X,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Zap,
  BookOpen,
  Check,
} from 'lucide-react';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { awardSpiritualHabitPoints } from '../../utils/gamification';

export interface AdhkarItem {
  id: string;
  title: string;
  shortSnippet: string; // المطالع المختصرة للحافظ السريع
  fullText: string;     // النص الكامل مع التشكيل للحفظ والتدبر
  target: number;
  virtue: string;
  source: string;
  time: 'both' | 'morning' | 'evening';
}

export const AUTHENTIC_ADHKAR: AdhkarItem[] = [
  {
    id: 'ayat_kursi',
    title: 'آية الكرسي',
    shortSnippet: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ ... وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    fullText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    target: 1,
    virtue: 'من قالها حين يصبح أُجير من الجن حتى يمسي، ومن قالها حين يمسي أُجير منهم حتى يصبح.',
    source: 'صحيح الترغيب والترهيب',
    time: 'both',
  },
  {
    id: 'muawwidhat',
    title: 'المعوذات وسورة الإخلاص (3 مرات)',
    shortSnippet: 'سورة الإخلاص + سورة الفلق + سورة الناس (3 مرات)',
    fullText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ: قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ.\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ: قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ.\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ: قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ.',
    target: 3,
    virtue: 'قال ﷺ: قل هو الله أحد والمعوذتين حين تمسي وحين تصبح ثلاث مرات تكفيك من كل شيء.',
    source: 'صحيح أبي داود والترمذي',
    time: 'both',
  },
  {
    id: 'asbahna_wa_asbah',
    title: 'أصبحنا وأصبح الملك لله / أمسينا وأمسى الملك لله',
    shortSnippet: 'أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له...',
    fullText: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ [وفي المساء: أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ]، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ.',
    target: 1,
    virtue: 'سؤال الله خير اليوم والتعوذ من الكسل وعذاب القبر والنار.',
    source: 'صحيح مسلم',
    time: 'both',
  },
  {
    id: 'sayyid_istighfar',
    title: 'سيد الاستغفار (أعظم أدعية التوبة)',
    shortSnippet: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ...',
    fullText: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.',
    target: 1,
    virtue: 'من قالها موقناً بها حين يمسي فمات من ليلته دخل الجنة، وكذلك إذا أصبح.',
    source: 'صحيح البخاري',
    time: 'both',
  },
  {
    id: 'bika_asbahna',
    title: 'اللهم بك أصبحنا وبك أمسينا',
    shortSnippet: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ...',
    fullText: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ. [وفي المساء: اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ].',
    target: 1,
    virtue: 'إعلان التوكل والافتقار إلى الله في الحياة والممات والبعث.',
    source: 'صحيح الترمذي',
    time: 'both',
  },
  {
    id: 'allahumma_innee_asbahtu_ushhiduk',
    title: 'اللهم إني أصبحت أُشهدك وأُشهد حملة عرشك (4 مرات)',
    shortSnippet: 'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ...',
    fullText: 'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ. (4 مرات)',
    target: 4,
    virtue: 'من قالها حين يصبح أو يمسي أربع مرات أعتقه الله من النار.',
    source: 'صحيح أبي داود',
    time: 'both',
  },
  {
    id: 'bismillahi_alladhi',
    title: 'بسم الله الذي لا يضر مع اسمه شيء (3 مرات)',
    shortSnippet: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ...',
    fullText: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ. (3 مرات)',
    target: 3,
    virtue: 'من قالها ثلاثاً إذا أصبح وثلاثاً إذا أمسى لم يضره شيء ولم تصبه فجأة بلاء.',
    source: 'صحيح الترمذي وأبي داود',
    time: 'both',
  },
  {
    id: 'radeetu_billah',
    title: 'رضيت بالله رباً وبالإسلام ديناً وبمحمد ﷺ نبياً (3 مرات)',
    shortSnippet: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا...',
    fullText: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا. (3 مرات)',
    target: 3,
    virtue: 'من قالها حين يصبح وحين يمسي ثلاثاً كان حقاً على الله أن يرضيه يوم القيامة.',
    source: 'صحيح أحمد والترمذي',
    time: 'both',
  },
  {
    id: 'ya_hayyu_ya_qayyoom',
    title: 'يا حي يا قيوم برحمتك أستغيث',
    shortSnippet: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ...',
    fullText: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ.',
    target: 1,
    virtue: 'وصية النبي ﷺ لفاطمة رضي الله عنها في الصباح والمساء لحفظ الشؤون كلها.',
    source: 'صحيح الحاكم والنسائي',
    time: 'both',
  },
  {
    id: 'afiyah_dua',
    title: 'سؤال العفو والعافية ودعاء الحفظ التام',
    shortSnippet: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ...',
    fullText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي.',
    target: 1,
    virtue: 'لم يكن رسول الله ﷺ يدع هؤلاء الدعوات حين يمسي وحين يصبح قط للحفظ من كل جهة.',
    source: 'صحيح أبي داود وابن ماجه',
    time: 'both',
  },
  {
    id: 'hasbiya_allahu',
    title: 'حسبي الله لا إله إلا هو (7 مرات)',
    shortSnippet: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ...',
    fullText: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ. (7 مرات)',
    target: 7,
    virtue: 'من قالها حين يصبح وحين يمسي سبع مرات كفاه الله ما أهمه من أمر الدنيا والآخرة.',
    source: 'صحيح أبي داود موقوفاً وله حكم الرفع',
    time: 'both',
  },
  {
    id: 'subhanallahi_wa_bihamdihi_100',
    title: 'سبحان الله وبحمده (100 مرة)',
    shortSnippet: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ (100 مرة)',
    fullText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ. (100 مرة)',
    target: 100,
    virtue: 'حطت خطاياه وإن كانت مثل زبد البحر، ولم يأت أحد يوم القيامة بأفضل مما جاء به إلا من قال مثله أو زاد.',
    source: 'صحيح مسلم',
    time: 'both',
  },
  {
    id: 'tahlil_100',
    title: 'التهليل التام (10 أو 100 مرة)',
    shortSnippet: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ...',
    fullText: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. (10 مرات أو 100 مرة)',
    target: 10,
    virtue: 'كانت له عدل عشر رقاب، وكُتبت له مائة حسنة، ومُحيت عنه مائة سيئة، وكانت له حرزاً من الشيطان يومه ذلك.',
    source: 'متفق عليه',
    time: 'both',
  },
  {
    id: 'aoodhu_bikalimat_allah',
    title: 'أعوذ بكلمات الله التامات من شر ما خلق (3 مرات - للمساء)',
    shortSnippet: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ...',
    fullText: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ. (3 مرات)',
    target: 3,
    virtue: 'من قالها حين يمسي ثلاث مرات لم تضره حُمة (لدغة أو سم) تلك الليلة.',
    source: 'صحيح مسلم',
    time: 'evening',
  },
];

export interface MorningEveningAdhkarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'morning' | 'evening';
  isCompleted?: boolean;
  onCompleted?: () => void;
  onRewardToast?: (msg: string) => void;
}

export const MorningEveningAdhkarModal: React.FC<MorningEveningAdhkarModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'morning',
  isCompleted = false,
  onCompleted,
  onRewardToast,
}) => {
  const [timeMode, setTimeMode] = useState<'morning' | 'evening'>(initialMode);
  // Concise view for quick memorizers vs Full text for memorization and contemplation
  const [viewMode, setViewMode] = useState<'concise' | 'full'>('concise');
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [done, setDone] = useState(isCompleted);

  useEffect(() => {
    setTimeMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setDone(isCompleted);
  }, [isCompleted]);

  // Filter adhkar according to timeMode (morning or evening)
  const filteredAdhkar = AUTHENTIC_ADHKAR.filter(
    (a) => a.time === 'both' || a.time === timeMode
  );

  const completedCount = filteredAdhkar.filter(
    (a) => (counters[a.id] || 0) >= a.target || done
  ).length;

  const handleTap = (id: string, target: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();

    setCounters((prev) => {
      const cur = prev[id] || 0;
      const next = cur >= target ? 0 : cur + 1;
      if (next === target) {
        soundSynth.playStreakMilestoneChime();
        haptic.vibrateWorkDone();
      }
      return { ...prev, [id]: next };
    });
  };

  const handleFastComplete = (id: string, target: number) => {
    soundSynth.playTactileClick();
    haptic.vibrateLight();
    setCounters((prev) => ({ ...prev, [id]: target }));
  };

  const handleFinishSession = async () => {
    soundSynth.playStreakMilestoneChime();
    haptic.vibrateSprintCelebration();

    setDone(true);
    const habitKey = timeMode === 'morning' ? 'adhkar_morning' : 'adhkar_evening';
    const habitLabel = timeMode === 'morning' ? 'أذكار الصباح المباركة' : 'أذكار المساء وحصن المسلم';

    const res = await awardSpiritualHabitPoints(habitKey, habitLabel);
    if (onRewardToast && res.message) {
      onRewardToast(res.message);
    } else if (onRewardToast) {
      onRewardToast(
        timeMode === 'morning'
          ? '☀️ تقبل الله منك! تم تسجيل أذكار الصباح في صحيفتك (+20 نقطة) 🤍'
          : '🌙 حرسك الله! تم تسجيل أذكار المساء في صحيفتك (+20 نقطة) 🤍'
      );
    }

    if (onCompleted) {
      onCompleted();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="أذكار الصباح والمساء"
        className="w-full max-w-2xl h-[90dvh] sm:h-auto sm:max-h-[92dvh] rounded-[28px] modal-surface border border-white/15 shadow-2xl flex flex-col overflow-hidden text-start cursor-default animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="celestial-obsidian-stage text-white p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-white/15 ${
                timeMode === 'morning'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-indigo-500/20 text-indigo-300'
              }`}
            >
              {timeMode === 'morning' ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 dir="rtl" lang="ar" className="text-base sm:text-lg font-bold text-white tashkeel-text">
                  {timeMode === 'morning' ? 'أَذْكَارُ الصَّبَاحِ الْمُبَارَكَةُ' : 'أَذْكَارُ الْمَسَاءِ وَحِصْنُ الْمُسْلِمِ'}
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#bce8c2] text-emerald-950">
                  <bdi dir="ltr">{completedCount}/{filteredAdhkar.length}</bdi> مكتمل
                </span>
              </div>
              <p dir="rtl" lang="ar" className="text-[11px] text-zinc-300 tashkeel-text mt-0.5">
                {timeMode === 'morning'
                  ? '«مَنْ قَالَهَا حِينَ يُصْبِحُ أُجِيرَ مِنَ الْجِنِّ حَتَّى يُمْسِيَ»'
                  : '«مَنْ قَالَهَا حِينَ يُمْسِي كَانَ فِي حِفْظِ اللَّهِ حَتَّى يُصْبِحَ»'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Morning / Evening Switcher */}
            <div className="flex items-center bg-white/10 p-0.5 rounded-full border border-white/15">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setTimeMode('morning');
                }}
                className={`min-w-[38px] min-h-[38px] flex items-center justify-center p-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  timeMode === 'morning'
                    ? 'bg-amber-400 text-zinc-950 shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title="أذكار الصباح"
                aria-label="أذكار الصباح"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playTactileClick();
                  setTimeMode('evening');
                }}
                className={`min-w-[38px] min-h-[38px] flex items-center justify-center p-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  timeMode === 'evening'
                    ? 'bg-[#5448e8] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title="أذكار المساء"
                aria-label="أذكار المساء"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher: Concise vs Full */}
        <div className="px-4 py-2.5 surface-card-3d border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-bold">نمط القراءة:</span>
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setViewMode('concise');
              }}
              className={`min-h-[34px] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'concise'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>مختصر للحافظ ⚡</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundSynth.playTactileClick();
                setViewMode('full');
              }}
              className={`min-h-[34px] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'full'
                  ? 'bg-[#141517] dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              <span>النص الكامل للتدبر 📖</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5">
          <div
            className="bg-gradient-to-r from-[#5448e8] to-[#1eb814] h-1.5 transition-all duration-300"
            style={{ width: `${filteredAdhkar.length > 0 ? Math.min(100, Math.round((completedCount / filteredAdhkar.length) * 100)) : 0}%` }}
          />
        </div>

        {/* Adhkar List Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin">
          {filteredAdhkar.map((item, idx) => {
            const currentCount = counters[item.id] || 0;
            const isItemDone = currentCount >= item.target || done;

            return (
              <div
                key={item.id}
                onClick={() => handleTap(item.id, item.target)}
                className={`p-4 rounded-[24px] border transition-all text-start space-y-2 cursor-pointer active:scale-[0.99] ${
                  isItemDone
                    ? 'bento-3d-mint border-[#22c55e]/50 text-emerald-950 dark:text-emerald-100'
                    : 'surface-card-3d border-zinc-200/80 dark:border-white/10'
                }`}
              >
                {/* Title & Counter Controls */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#141517] dark:bg-white/15 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 shrink-0">
                      {item.target > 1 ? `${item.target} مرات` : 'مرة واحدة'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleTap(item.id, item.target)}
                      className={`min-h-[40px] min-w-[44px] px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer select-none active:scale-90 flex items-center justify-center gap-1.5 ${
                        isItemDone
                          ? 'bg-habit-green-ink text-white shadow-xs'
                          : 'bg-[#5448e8] hover:bg-indigo-600 text-white shadow-md'
                      }`}
                    >
                      {isItemDone ? <Check className="w-3.5 h-3.5" /> : null}
                      <bdi dir="ltr">{currentCount} / {item.target}</bdi>
                    </button>

                    {!isItemDone && item.target > 1 && (
                      <button
                        type="button"
                        onClick={() => handleFastComplete(item.id, item.target)}
                        className="min-h-[40px] min-w-[40px] px-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700/80 hover:bg-habit-green-ink hover:text-white text-zinc-700 dark:text-zinc-200 text-[11px] font-bold flex items-center justify-center cursor-pointer transition-colors"
                        title="إتمام سريع"
                        aria-label="إتمام سريع"
                      >
                        ✔
                      </button>
                    )}
                  </div>
                </div>

                {/* Text Display: Concise vs Full */}
                {viewMode === 'concise' ? (
                  <p dir="rtl" lang="ar" className="text-xs sm:text-sm tashkeel-text leading-[2.2] text-zinc-800 dark:text-zinc-200 font-quran select-text ps-7">
                    {item.shortSnippet}
                  </p>
                ) : (
                  <p dir="rtl" lang="ar" className="text-xs sm:text-sm tashkeel-text leading-[2.2] text-zinc-900 dark:text-zinc-100 font-quran select-text ps-7 whitespace-pre-line bg-white/80 dark:bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/10">
                    {item.fullText}
                  </p>
                )}

                {/* Virtue & Hadith Reference */}
                <div className="text-[10px] text-zinc-600 dark:text-zinc-400 ps-7 flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/60 dark:border-white/10">
                  <span>{item.virtue}</span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400 shrink-0">{item.source}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] surface-card-3d border-t border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 w-full sm:w-auto justify-between sm:justify-start">
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>مكافأة الحصن: +20 نقطة طمأنينة وإيمان</span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleFinishSession}
              className="flex-1 sm:flex-initial min-h-[44px] px-6 py-2.5 rounded-full bg-habit-green-ink hover:bg-habit-green-ink-deep text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{done ? 'تم إنجاز الأذكار بنجاح اليوم ✔' : 'أتممت قراءة الأذكار كاملة 🤍 (+20 XP)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
