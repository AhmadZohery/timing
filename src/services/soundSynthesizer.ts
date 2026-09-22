import type { AmbientSoundType } from '../types';
import { audioCoordinator } from './audioCoordinator';

// 100% Free Algorithmic Web Audio Synthesizer (0 External MP3s / 0 Cloud Bandwidth)
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private currentAmbientType: AmbientSoundType = 'none';
  private isMuted: boolean = typeof window !== 'undefined' && localStorage.getItem('midmar_sound_muted') === 'true';
  private ambientListeners: Set<(isPlaying: boolean, type: AmbientSoundType) => void> = new Set();

  constructor() {
    audioCoordinator.register('ambient', () => this.stopAmbient());
  }

  public subscribeAmbient(listener: (isPlaying: boolean, type: AmbientSoundType) => void): () => void {
    this.ambientListeners.add(listener);
    listener(this.isAmbientPlaying, this.currentAmbientType);
    return () => {
      this.ambientListeners.delete(listener);
    };
  }

  private notifyAmbient() {
    this.ambientListeners.forEach((fn) => {
      try {
        fn(this.isAmbientPlaying, this.currentAmbientType);
      } catch (_) {}
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('midmar_sound_muted', String(muted));
    } catch (_) {}
    if (muted) {
      this.stopAmbient();
    }
  }

  public toggleMuted(): boolean {
    const next = !this.isMuted;
    this.setMuted(next);
    return next;
  }

  public isAudioMuted(): boolean {
    return this.isMuted;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generate Brownian Noise mathematically (Integrated white noise)
  private createBrownNoiseBuffer(durationSeconds = 5): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain boost for deep low-end rumble
    }
    return buffer;
  }

  // Generate Gentle Light Rain Noise (Soft whisper drizzle on window)
  private createLightRainBuffer(durationSeconds = 6): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.045;
      b1 = 0.99332 * b1 + white * 0.06;
      b2 = 0.96900 * b2 + white * 0.12;
      b3 = 0.86650 * b3 + white * 0.25;
      b4 = 0.55000 * b4 + white * 0.42;
      b5 = -0.7616 * b5 - white * 0.012;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.42;
      b6 = white * 0.09;

      // Soft delicate droplet impulses
      const t = i / ctx.sampleRate;
      const breezeMod = 0.88 + 0.12 * Math.sin(2 * Math.PI * 0.2 * t);
      const drop = Math.random() > 0.9992 ? (Math.random() * 0.15 - 0.075) : 0;
      data[i] = (pink * 0.048 * breezeMod) + drop;
    }
    return buffer;
  }

  // Generate Heavy Rain Noise (Immersive continuous downpour)
  private createHeavyRainBuffer(durationSeconds = 5): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;

      // Regular droplet impulses
      const drop = Math.random() > 0.997 ? (Math.random() * 0.4 - 0.2) : 0;
      data[i] = (pink * 0.11) + drop;
    }
    return buffer;
  }


  // Generate Stereo Binaural Beats (Left ear f1, Right ear f2)
  // Alpha: 10 Hz difference (210 Hz carrier) for focused calm
  // Theta: 6 Hz difference (200 Hz carrier) for deep learning & flow
  private createBinauralBuffer(beatType: 'alpha' | 'theta', durationSeconds = 6): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    const baseFreq = 200;
    const beatFreq = beatType === 'alpha' ? 10 : 6;
    const leftFreq = baseFreq;
    const rightFreq = baseFreq + beatFreq;

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      // Pure sine waves with subtle warm sub-bed
      const leftSine = Math.sin(2 * Math.PI * leftFreq * t) * 0.35;
      const rightSine = Math.sin(2 * Math.PI * rightFreq * t) * 0.35;
      const pinkBed = (Math.random() * 2 - 1) * 0.02;

      leftChannel[i] = leftSine + pinkBed;
      rightChannel[i] = rightSine + pinkBed;
    }
    return buffer;
  }

  // Start continuous ambient sound loop
  public startAmbient(type: AmbientSoundType, volume = 0.5) {
    if (this.isMuted || type === 'none') {
      this.stopAmbient();
      return;
    }

    // If already playing the same, just adjust volume
    if (this.isAmbientPlaying && this.currentAmbientType === type && this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(volume, this.getContext().currentTime);
      return;
    }

    this.stopAmbient();

    try {
      const ctx = this.getContext();
      let buffer: AudioBuffer;
      let filterFreq = 1000;

      if (type === 'brown') {
        buffer = this.createBrownNoiseBuffer();
        filterFreq = 400;
      } else if (type === 'rain_light') {
        buffer = this.createLightRainBuffer();
        filterFreq = 700;
      } else if (type === 'rain_heavy' || type === 'rain') {
        buffer = this.createHeavyRainBuffer();
        filterFreq = 1200;
      } else {
        buffer = this.createBinauralBuffer(type);
        filterFreq = 1800;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Soft lowpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume), ctx.currentTime + 1.2);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(0);

      this.ambientSource = source;
      this.ambientGain = gain;
      this.isAmbientPlaying = true;
      this.currentAmbientType = type;
      this.notifyAmbient();
    } catch (e) {
      console.warn('Audio synthesis not allowed before user interaction', e);
    }
  }

  // Stop ambient sound with smooth fade-out
  public stopAmbient() {
    if (!this.isAmbientPlaying || !this.ambientSource) return;

    this.isAmbientPlaying = false;
    this.currentAmbientType = 'none';
    this.notifyAmbient();

    try {
      const ctx = this.getContext();
      if (this.ambientGain) {
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, ctx.currentTime);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      }
      setTimeout(() => {
        try {
          this.ambientSource?.stop();
          this.ambientSource?.disconnect();
        } catch (_) {}
        this.ambientSource = null;
        this.ambientGain = null;
        this.isAmbientPlaying = false;
        this.currentAmbientType = 'none';
        this.notifyAmbient();
      }, 500);
    } catch (_) {
      this.ambientSource = null;
      this.ambientGain = null;
      this.isAmbientPlaying = false;
      this.currentAmbientType = 'none';
      this.notifyAmbient();
    }
  }

  // Polyphonic harmonic celebration chime with dual-oscillator acoustic richness (C5 -> E5 -> G5 -> C6)
  public playCompletionChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.08;

        // Primary fundamental oscillator
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, startTime);

        // Secondary harmonic overtone (2f) for acoustic warmth & presence
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, startTime);

        // Soft 65ms exponential attack to eliminate earbud click transients
        gain1.gain.setValueAtTime(0.0001, startTime);
        gain1.gain.exponentialRampToValueAtTime(0.14, startTime + 0.065);
        gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.25);

        gain2.gain.setValueAtTime(0.0001, startTime);
        gain2.gain.exponentialRampToValueAtTime(0.05, startTime + 0.065);
        gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.95);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.onended = () => {
          try {
            osc1.disconnect();
            gain1.disconnect();
            osc2.disconnect();
            gain2.disconnect();
          } catch (_) {}
        };

        osc1.start(startTime);
        osc1.stop(startTime + 1.3);
        osc2.start(startTime);
        osc2.stop(startTime + 1.0);
      });
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  // Pure 528 Hz Solfeggio restorative frequency for deep recovery & rest milestones
  public playSolfeggioChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freq = 528.0; // Ancient Solfeggio "MI" Transformation & Serenity Frequency

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };

      osc.start(now);
      osc.stop(now + 1.9);
    } catch (_) {}
  }

  // Major triumphant streak fanfare (Ascending harmonic arpeggio F4 -> A4 -> C5 -> E5 -> F5 -> A5)
  public playStreakMilestoneChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [349.23, 440.0, 523.25, 659.25, 698.46, 880.0]; // F4, A4, C5, E5, F5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 1.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (_) {}
        };
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 1.5);
      });
    } catch (_) {}
  }

  // Loss Aversion Penalty / Warning sound (Dignified minor tone)
  public playWarningSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (_) {}
  }

  // Tactile UI click sound (Pristine zero-crossing exponential decay with 0 DC-offset)
  public playTactileClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (_) {}
  }

  // 10-Second Combat Sports Clapper Warning (Double wooden block strike for final round flurry)
  public playCombatClapper() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      [0, 0.12].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now + delay);
        osc.frequency.exponentialRampToValueAtTime(220, now + delay + 0.05);

        gain.gain.setValueAtTime(0.25, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (_) {}
        };
        osc.start(now + delay);
        osc.stop(now + delay + 0.07);
      });
    } catch (_) {}
  }

  // Gym Rest Timer Bell (Tibetan singing bowl / gong harmonic)
  public playGymRestChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      [880, 1320, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12 / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (_) {}
        };
        osc.start(now);
        osc.stop(now + 1.9);
      });
    } catch (_) {}
  }

  // Boxing Ring Bell: Authentic Double Brass Ding ("Ding! ... Ding!") with high-frequency metallic harmonics
  public playBoxingBell() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const strike = (startTime: number) => {
        // Brass bell acoustic harmonics: fundamental + metallic overtones
        const partials = [
          { freq: 880, gain: 0.22, decay: 1.4 },
          { freq: 1560, gain: 0.16, decay: 1.1 },
          { freq: 2420, gain: 0.12, decay: 0.8 },
          { freq: 3150, gain: 0.08, decay: 0.5 },
        ];
        partials.forEach((p) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(p.freq, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.exponentialRampToValueAtTime(p.gain, startTime + 0.003); // sharp metallic strike
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + p.decay);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.onended = () => {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (_) {}
          };
          osc.start(startTime);
          osc.stop(startTime + p.decay + 0.05);
        });
      };

      const now = ctx.currentTime;
      strike(now); // First strike: "Ding!"
      strike(now + 0.22); // Second strike: "Ding!"
    } catch (_) {}
  }

  // Authentic 10-Second Combat Warning Clapper ("Clack! ... Clack! ... Clack!")
  public playTripleWoodenClapper() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const playClack = (time: number) => {
        // High-attack wood block impulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(840, time);
        osc.frequency.exponentialRampToValueAtTime(320, time + 0.038);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.38, time + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (_) {}
        };

        osc.start(time);
        osc.stop(time + 0.05);
      };

      const now = ctx.currentTime;
      playClack(now);
      playClack(now + 0.15);
      playClack(now + 0.30);
    } catch (_) {}
  }

  // Interval Beep for HIIT / Tabata / EMOM countdown (Low: 750Hz, High: 1650Hz)
  public playIntervalBeep(isHigh = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const freq = isHigh ? 1650 : 750;
      const duration = isHigh ? 0.35 : 0.16;
      const peakGain = isHigh ? 0.28 : 0.18;

      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };

      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (_) {}
  }

  // 10 Hz Binaural Alpha Waves for Deep Work Focus (Left: 200Hz, Right: 210Hz)
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;

  public startBinauralAlpha(carrierFreq = 200) {
    if (this.isMuted) return;
    try {
      this.stopBinauralAlpha();
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const leftOsc = ctx.createOscillator();
      const rightOsc = ctx.createOscillator();
      const leftPan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const rightPan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const masterGain = ctx.createGain();

      leftOsc.type = 'sine';
      leftOsc.frequency.setValueAtTime(carrierFreq, now);

      rightOsc.type = 'sine';
      rightOsc.frequency.setValueAtTime(carrierFreq + 10, now);

      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.06, now + 1.5);

      if (leftPan && rightPan) {
        leftPan.pan.value = -1;
        rightPan.pan.value = 1;
        leftOsc.connect(leftPan);
        leftPan.connect(masterGain);
        rightOsc.connect(rightPan);
        rightPan.connect(masterGain);
      } else {
        leftOsc.connect(masterGain);
        rightOsc.connect(masterGain);
      }

      masterGain.connect(ctx.destination);
      leftOsc.start(now);
      rightOsc.start(now);

      this.binauralLeftOsc = leftOsc;
      this.binauralRightOsc = rightOsc;
      this.binauralGain = masterGain;
    } catch (_) {}
  }

  public stopBinauralAlpha() {
    if (!this.binauralGain) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      this.binauralGain.gain.setValueAtTime(this.binauralGain.gain.value, now);
      this.binauralGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      setTimeout(() => {
        try {
          this.binauralLeftOsc?.stop();
          this.binauralLeftOsc?.disconnect();
          this.binauralRightOsc?.stop();
          this.binauralRightOsc?.disconnect();
          this.binauralGain?.disconnect();
        } catch (_) {}
        this.binauralLeftOsc = null;
        this.binauralRightOsc = null;
        this.binauralGain = null;
      }, 650);
    } catch (_) {
      this.binauralLeftOsc = null;
      this.binauralRightOsc = null;
      this.binauralGain = null;
    }
  }
}

export const soundSynth = new SoundSynthesizer();
