// ============================================================================
// خدمة التلاوة الصوتية المعتمدة لآيات القرآن الكريم (Quran Audio Recitation Service)
// سيرفرات EveryAyah CDN عالية الدقة والنقاء - كبار قراء العالم الإسلامي
// ============================================================================

import { audioCoordinator } from './audioCoordinator';

export interface QuranReciter {
  id: string;
  nameAr: string;
  nameEn: string;
  subfolder: string;
  badgeAr: string;
}

export const QURAN_RECITERS: QuranReciter[] = [
  {
    id: 'minshawi',
    nameAr: 'الشيخ محمد صديق المنشاوي',
    nameEn: 'Minshawy (Murattal)',
    subfolder: 'Minshawy_Murattal_128kbps',
    badgeAr: 'مرتل • ترتيل خاشع',
  },
  {
    id: 'husary',
    nameAr: 'الشيخ محمود خليل الحصري',
    nameEn: 'Al-Husary',
    subfolder: 'Husary_128kbps',
    badgeAr: 'شيخ المقارئ • ضبط وإتقان',
  },
  {
    id: 'ali_jaber',
    nameAr: 'الشيخ علي عبد الله جابر',
    nameEn: 'Ali Jaber (Haram Makkah)',
    subfolder: 'Ali_Jaber_64kbps',
    badgeAr: 'إمام المسجد الحرام • ترتيل خاشع',
  },
  {
    id: 'abdulbasit',
    nameAr: 'الشيخ عبد الباسط عبد الصمد',
    nameEn: 'Abdul Basit (Murattal)',
    subfolder: 'Abdul_Basit_Murattal_192kbps',
    badgeAr: 'مرتل • هيبة وجلال',
  },
];

export interface QuranAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentSurah: number | null;
  currentAyah: number | null;
  startAyah: number | null;
  endAyah: number | null;
  reciterId: string;
  repeatCount: number; // 1 to 10 repeats per ayah
  currentRepeat: number; // which repeat we are on
  echoGapSeconds: number; // pause after ayah for student repetition
  error: string | null;
}

type AudioStateListener = (state: QuranAudioState) => void;

class QuranAudioService {
  private audio: HTMLAudioElement | null = null;
  private currentReciterId: string = 'minshawi';
  private repeatCount: number = 1;
  private echoGapSeconds: number = 0;
  private currentRepeat: number = 1;
  private echoTimeout: NodeJS.Timeout | null = null;
  private listeners: Set<AudioStateListener> = new Set();

  private state: QuranAudioState = {
    isPlaying: false,
    isLoading: false,
    currentSurah: null,
    currentAyah: null,
    startAyah: null,
    endAyah: null,
    reciterId: 'minshawi',
    repeatCount: 1,
    currentRepeat: 1,
    echoGapSeconds: 0,
    error: null,
  };

  constructor() {
    audioCoordinator.register('quran', () => this.stop());
    if (typeof window !== 'undefined') {
      const savedReciter = localStorage.getItem('midmar_quran_reciter');
      if (savedReciter && QURAN_RECITERS.some((r) => r.id === savedReciter)) {
        this.currentReciterId = savedReciter;
        this.state.reciterId = savedReciter;
      }
      const savedRepeat = localStorage.getItem('midmar_quran_repeat');
      if (savedRepeat) {
        this.repeatCount = Number(savedRepeat) || 1;
        this.state.repeatCount = this.repeatCount;
      }
      const savedEcho = localStorage.getItem('midmar_quran_echo_gap');
      if (savedEcho) {
        this.echoGapSeconds = Number(savedEcho) || 0;
        this.state.echoGapSeconds = this.echoGapSeconds;
      }
    }
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.state });
      } catch (e) {
        console.error('Quran audio listener error', e);
      }
    });
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  public getState(): QuranAudioState {
    return { ...this.state };
  }

  public getReciters(): QuranReciter[] {
    return QURAN_RECITERS;
  }

  public setReciter(reciterId: string) {
    if (!QURAN_RECITERS.some((r) => r.id === reciterId)) return;
    this.currentReciterId = reciterId;
    this.state.reciterId = reciterId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('midmar_quran_reciter', reciterId);
    }
    // If currently playing, reload current ayah with new reciter
    if (this.state.isPlaying && this.state.currentSurah && this.state.currentAyah) {
      this.playSingleAyah(
        this.state.currentSurah,
        this.state.currentAyah,
        this.state.startAyah,
        this.state.endAyah
      );
    } else {
      this.notify();
    }
  }

  public getActiveReciter(): QuranReciter {
    return (
      QURAN_RECITERS.find((r) => r.id === this.currentReciterId) || QURAN_RECITERS[0]
    );
  }

  private formatAyahUrl(surah: number, ayah: number): string {
    const reciter = this.getActiveReciter();
    const padSurah = String(surah).padStart(3, '0');
    const padAyah = String(ayah).padStart(3, '0');
    return `https://everyayah.com/data/${reciter.subfolder}/${padSurah}${padAyah}.mp3`;
  }

  public setRepeatCount(count: number) {
    this.repeatCount = Math.max(1, Math.min(10, count));
    this.state.repeatCount = this.repeatCount;
    if (typeof window !== 'undefined') {
      localStorage.setItem('midmar_quran_repeat', String(this.repeatCount));
    }
    this.notify();
  }

  public setEchoGapSeconds(seconds: number) {
    this.echoGapSeconds = Math.max(0, Math.min(10, seconds));
    this.state.echoGapSeconds = this.echoGapSeconds;
    if (typeof window !== 'undefined') {
      localStorage.setItem('midmar_quran_echo_gap', String(this.echoGapSeconds));
    }
    this.notify();
  }

  public playAyahRange(surah: number, startAyah: number, endAyah: number) {
    this.stop();
    this.currentRepeat = 1;
    this.state.currentRepeat = 1;
    this.state.startAyah = startAyah;
    this.state.endAyah = endAyah;
    this.playSingleAyah(surah, startAyah, startAyah, endAyah);
  }

  private playSingleAyah(
    surah: number,
    ayah: number,
    startAyah: number | null,
    endAyah: number | null
  ) {
    if (typeof window === 'undefined') return;

    if (!this.audio) {
      this.audio = new Audio();
    }

    // Stop competing audio streams (Gym Faith stream, ambient noises)
    audioCoordinator.requestExclusive('quran');

    const url = this.formatAyahUrl(surah, ayah);

    this.state.isPlaying = true;
    this.state.isLoading = true;
    this.state.currentSurah = surah;
    this.state.currentAyah = ayah;
    this.state.startAyah = startAyah;
    this.state.endAyah = endAyah;
    this.state.error = null;
    this.notify();

    this.audio.src = url;
    this.audio.oncanplay = () => {
      this.state.isLoading = false;
      this.notify();
    };

    this.audio.onended = () => {
      // 1. Check if current ayah needs repeating (Memorizer loop)
      if (this.currentRepeat < this.repeatCount) {
        this.currentRepeat += 1;
        this.state.currentRepeat = this.currentRepeat;
        this.notify();
        const delay = this.echoGapSeconds * 1000;
        if (delay > 0) {
          this.echoTimeout = setTimeout(() => {
            this.playSingleAyah(surah, ayah, startAyah, endAyah);
          }, delay);
        } else {
          this.playSingleAyah(surah, ayah, startAyah, endAyah);
        }
        return;
      }

      // 2. Ayah repeat completed, reset repeat counter
      this.currentRepeat = 1;
      this.state.currentRepeat = 1;

      // 3. Advance to next ayah in range with optional echo gap
      if (endAyah && ayah < endAyah) {
        const delay = this.echoGapSeconds * 1000;
        if (delay > 0) {
          this.echoTimeout = setTimeout(() => {
            this.playSingleAyah(surah, ayah + 1, startAyah, endAyah);
          }, delay);
        } else {
          this.playSingleAyah(surah, ayah + 1, startAyah, endAyah);
        }
      } else {
        this.stop();
      }
    };

    this.audio.onerror = () => {
      this.state.isPlaying = false;
      this.state.isLoading = false;
      this.state.error = 'تعذر تشغيل التلاوة. تحقق من اتصال الإنترنت.';
      this.notify();
    };

    this.audio.play().catch((err) => {
      console.warn('Audio play prevented', err);
      this.state.isPlaying = false;
      this.state.isLoading = false;
      this.notify();
    });
  }

  public pause() {
    if (this.echoTimeout) {
      clearTimeout(this.echoTimeout);
      this.echoTimeout = null;
    }
    if (this.audio && this.state.isPlaying) {
      this.audio.pause();
      this.state.isPlaying = false;
      this.notify();
    }
  }

  public resume() {
    if (this.audio && !this.state.isPlaying && this.audio.src) {
      this.audio.play().then(() => {
        this.state.isPlaying = true;
        this.notify();
      }).catch((e) => console.warn(e));
    }
  }

  public togglePlay(surah: number, startAyah: number, endAyah: number) {
    if (
      this.state.isPlaying &&
      this.state.currentSurah === surah &&
      this.state.startAyah === startAyah &&
      this.state.endAyah === endAyah
    ) {
      this.pause();
    } else if (
      !this.state.isPlaying &&
      this.state.currentSurah === surah &&
      this.state.startAyah === startAyah &&
      this.state.endAyah === endAyah
    ) {
      this.resume();
    } else {
      this.playAyahRange(surah, startAyah, endAyah);
    }
  }

  public stop() {
    if (this.echoTimeout) {
      clearTimeout(this.echoTimeout);
      this.echoTimeout = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.removeAttribute('src');
    }
    this.currentRepeat = 1;
    this.state.isPlaying = false;
    this.state.isLoading = false;
    this.state.currentSurah = null;
    this.state.currentAyah = null;
    this.state.startAyah = null;
    this.state.endAyah = null;
    this.state.currentRepeat = 1;
    this.state.error = null;
    this.notify();
  }
}

export const quranAudio = new QuranAudioService();

export function parseAyahRange(rangeStr: string): { start: number; end: number } {
  const numbers = rangeStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return { start: 1, end: 1 };
  }
  const start = parseInt(numbers[0], 10);
  const end = numbers.length > 1 ? parseInt(numbers[1], 10) : start;
  return { start, end };
}
