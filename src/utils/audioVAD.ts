/**
 * Sovereign In-Browser Voice Activity Detector (VAD) & Recitation Cadence Engine
 * Midmar LifeOS - Local-First Sovereignty (OPP-0102 / SPEC-0102)
 * 
 * 100% Client-Side / Zero Cloud Telemetry / In-Memory Audio Analysis
 * Detects recitation cadence and breath pauses (Waqf) to automatically advance verses.
 */

export interface VadConfig {
  /** Speech energy threshold (0.01 - 0.50, default: 0.04) */
  speechThreshold?: number;
  /** Silence energy threshold (0.005 - 0.20, default: 0.02) */
  silenceThreshold?: number;
  /** Minimum sustained pause in milliseconds to trigger breath/verse advance (default: 1300ms) */
  pauseDurationMs?: number;
  /** Minimum duration of speech before a pause can be recognized as valid waqf (default: 800ms) */
  minSpeechDurationMs?: number;
}

export type VadState = 'idle' | 'listening' | 'speaking' | 'paused';

export class RecitationCadenceDetector {
  private config: Required<VadConfig>;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  private state: VadState = 'idle';
  private speechStartTime = 0;
  private silenceStartTime = 0;
  private hasSpokenEnough = false;

  private onPauseCallback?: () => void;
  private onLevelCallback?: (level: number, state: VadState) => void;

  constructor(config?: VadConfig) {
    this.config = {
      speechThreshold: config?.speechThreshold ?? 0.035,
      silenceThreshold: config?.silenceThreshold ?? 0.018,
      pauseDurationMs: config?.pauseDurationMs ?? 1300,
      minSpeechDurationMs: config?.minSpeechDurationMs ?? 800,
    };
  }

  /**
   * Check if browser supports Web Audio and MediaDevices
   */
  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!(window.AudioContext || (window as any).webkitAudioContext) &&
      !!(navigator?.mediaDevices?.getUserMedia)
    );
  }

  /**
   * Start microphone listening session
   */
  public async start(options: {
    onBreathPause: () => void;
    onAudioLevel?: (level: number, state: VadState) => void;
  }): Promise<boolean> {
    if (!RecitationCadenceDetector.isSupported()) {
      console.warn('Web Audio VAD is not supported on this browser.');
      return false;
    }

    this.onPauseCallback = options.onBreathPause;
    this.onLevelCallback = options.onAudioLevel;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;

      source.connect(this.analyser);

      this.state = 'listening';
      this.speechStartTime = 0;
      this.silenceStartTime = 0;
      this.hasSpokenEnough = false;

      this.pollAudio();
      return true;
    } catch (err) {
      console.error('Failed to initialize microphone VAD:', err);
      this.stop();
      return false;
    }
  }

  /**
   * Continuously analyze audio buffer RMS amplitude
   */
  private pollAudio = () => {
    if (!this.analyser || this.state === 'idle') return;

    const dataArray = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(dataArray);

    // Compute Root-Mean-Square (RMS)
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128; // -1.0 to 1.0
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);
    const now = Date.now();

    // State machine transitions
    if (rms >= this.config.speechThreshold) {
      if (this.state !== 'speaking') {
        this.speechStartTime = now;
        this.state = 'speaking';
      }

      if (now - this.speechStartTime >= this.config.minSpeechDurationMs) {
        this.hasSpokenEnough = true;
      }
      this.silenceStartTime = 0;
    } else if (rms <= this.config.silenceThreshold) {
      if (this.state === 'speaking') {
        this.state = 'paused';
        this.silenceStartTime = now;
      } else if (this.state === 'paused' && this.silenceStartTime > 0) {
        const pauseDuration = now - this.silenceStartTime;

        // Breath pause (Waqf) detected after sufficient recitation!
        if (pauseDuration >= this.config.pauseDurationMs && this.hasSpokenEnough) {
          this.hasSpokenEnough = false;
          this.silenceStartTime = 0;
          this.state = 'listening';

          if (this.onPauseCallback) {
            try {
              this.onPauseCallback();
            } catch (cbErr) {
              console.error('Error in VAD onPause callback:', cbErr);
            }
          }
        }
      }
    }

    // Report audio level for UI visualizer (normalized 0 to 1)
    if (this.onLevelCallback) {
      const normalizedLevel = Math.min(1, rms * 5);
      this.onLevelCallback(normalizedLevel, this.state);
    }

    this.animFrameId = requestAnimationFrame(this.pollAudio);
  };

  /**
   * Stop listening and release all audio resources
   */
  public stop() {
    this.state = 'idle';

    if (this.animFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.analyser = null;
  }

  public getState(): VadState {
    return this.state;
  }

  public isListening(): boolean {
    return this.state !== 'idle';
  }
}
