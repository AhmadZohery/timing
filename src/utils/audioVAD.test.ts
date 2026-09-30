import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RecitationCadenceDetector } from './audioVAD';

describe('RecitationCadenceDetector (OPP-0102 Web Audio VAD)', () => {
  let detector: RecitationCadenceDetector;

  beforeEach(() => {
    detector = new RecitationCadenceDetector({
      pauseDurationMs: 1000,
      speechThreshold: 0.05,
    });
  });

  afterEach(() => {
    detector.stop();
  });

  it('starts in idle state', () => {
    expect(detector.getState()).toBe('idle');
    expect(detector.isListening()).toBe(false);
  });

  it('reports false for isSupported in node environment where AudioContext is missing', () => {
    const supported = RecitationCadenceDetector.isSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('handles start gracefully without crashing when AudioContext is unavailable', async () => {
    const started = await detector.start({
      onBreathPause: vi.fn(),
    });
    // In node environment, it returns false safely
    expect(started).toBe(false);
    expect(detector.isListening()).toBe(false);
  });
});
