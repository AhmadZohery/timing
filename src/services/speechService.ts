// Web Speech API for 100% Free In-Browser Arabic Voice-to-Text
export class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ar-SA'; // Arabic (Saudi/Egyptian standard recognized universally)
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public setLang(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ) {
    if (!this.recognition) {
      onError?.('متصفحك لا يدعم التعرف الصوتي المباشر');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      onResult(final || interim, !!final);
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      const friendlyMsg =
        event.error === 'no-speech'
          ? 'لم يتم التقاط أي صوت، يرجى المحاولة والتحدث بالقرب من الميكروفون'
          : event.error === 'not-allowed'
          ? 'تم رفض إذن الوصول إلى الميكروفون، يرجى تفعيله من إعدادات المتصفح'
          : event.error;
      onError?.(friendlyMsg);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd?.();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      onError?.(e.message || 'تعذر بدء التسجيل الصوتي');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.isListening = false;
    }
  }

  // Web Speech API for Arabic, English & Multilingual Audio Guidance (100% Free / In-Browser)
  public speak(
    text: string,
    onEndOrLang?: (() => void) | string,
    onErrorOrRate?: ((error: any) => void) | number,
    onEnd?: () => void,
    onError?: (error: any) => void
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (typeof onErrorOrRate === 'function') onErrorOrRate('Speech synthesis not supported');
      if (onError) onError('Speech synthesis not supported');
      return false;
    }

    let lang = 'ar-SA';
    let rate = 0.95;
    let endCb: (() => void) | undefined;
    let errCb: ((error: any) => void) | undefined;

    if (typeof onEndOrLang === 'function') {
      endCb = onEndOrLang;
      errCb = typeof onErrorOrRate === 'function' ? onErrorOrRate : undefined;
    } else {
      if (typeof onEndOrLang === 'string') lang = onEndOrLang;
      if (typeof onErrorOrRate === 'number') rate = onErrorOrRate;
      endCb = onEnd;
      errCb = onError;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1.0;

      // Smart Voice Matching: choose native matching voice from device
      const voices =
        this.cachedVoices && this.cachedVoices.length > 0
          ? this.cachedVoices
          : window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = lang.split('-')[0].toLowerCase();
        const bestVoice =
          voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      utterance.onend = () => endCb?.();
      utterance.onerror = (e) => errCb?.(e);
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      errCb?.(e);
      return false;
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public stop() {
    this.stopSpeaking();
    this.stopListening();
  }

  public isSpeaking(): boolean {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }
}

export const speechService = new SpeechService();

