// Navigator Vibration API Haptic Controller for Wear OS & Android Phones
class VibrationService {
  private hasVibration(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  // Work micro sprint completion: Discreet double-buzz
  public vibrateWorkDone() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate([100, 60, 100]);
      } catch (_) {}
    }
  }

  // Grand sprint / Session completion: Deep celebration crescendo pattern
  public vibrateSprintCelebration() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate([180, 80, 180, 80, 350]);
      } catch (_) {}
    }
  }

  // Loss aversion penalty or urgent alert
  public vibrateWarning() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate([350]);
      } catch (_) {}
    }
  }

  // Medium tap haptic
  public vibrateMedium() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate(60);
      } catch (_) {}
    }
  }

  // Double buzz haptic (e.g. 10s warning)
  public vibrateDouble() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate([70, 50, 70]);
      } catch (_) {}
    }
  }

  // Subtle tap haptic
  public vibrateLight() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate(25);
      } catch (_) {}
    }
  }

  // Haute-Horlogerie Mechanical Chronograph Click (crisp 12ms tactile impulse)
  public vibrateChronographClick() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate(12);
      } catch (_) {}
    }
  }

  // Silk Glide: ultra-micro 8ms tick for smooth scrolling / stepper nudges
  public vibrateSilkGlide() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate(8);
      } catch (_) {}
    }
  }

  // Vault Lock: heavy twin-thud [40, 30, 80] for completing milestones or locking records
  public vibrateVaultLock() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate([40, 30, 80]);
      } catch (_) {}
    }
  }

  // Cardiac Heartbeat Pulse: [50, 100, 30] for recovery tests and mindful breathing
  public vibrateHeartbeatPulse() {
    if (this.hasVibration()) {
      try {
        navigator.vibrate([50, 100, 30]);
      } catch (_) {}
    }
  }
}

export const haptic = new VibrationService();
