// Dedicated Web Worker for drift-free background timing on mobile devices
let intervalId: any = null;
let endTime = 0;
let remainingMs = 0;
let isPaused = false;

self.onmessage = (e: MessageEvent) => {
  const { action, durationSec } = e.data;

  switch (action) {
    case 'START': {
      if (intervalId) clearInterval(intervalId);
      remainingMs = durationSec * 1000;
      endTime = performance.now() + remainingMs;
      isPaused = false;

      intervalId = setInterval(() => {
        if (isPaused) return;

        const now = performance.now();
        const diffMs = endTime - now;

        if (diffMs <= 0) {
          clearInterval(intervalId);
          intervalId = null;
          self.postMessage({ type: 'TICK', remainingSec: 0 });
          self.postMessage({ type: 'COMPLETE' });
        } else {
          self.postMessage({
            type: 'TICK',
            remainingSec: Math.ceil(diffMs / 1000),
          });
        }
      }, 250);
      break;
    }

    case 'PAUSE': {
      if (!isPaused && intervalId) {
        isPaused = true;
        const now = performance.now();
        remainingMs = Math.max(0, endTime - now);
        clearInterval(intervalId);
        intervalId = null;
      }
      break;
    }

    case 'RESUME': {
      if (remainingMs > 0 && !intervalId) {
        isPaused = false;
        endTime = performance.now() + remainingMs;
        intervalId = setInterval(() => {
          const now = performance.now();
          const diffMs = endTime - now;

          if (diffMs <= 0) {
            clearInterval(intervalId);
            intervalId = null;
            self.postMessage({ type: 'TICK', remainingSec: 0 });
            self.postMessage({ type: 'COMPLETE' });
          } else {
            self.postMessage({
              type: 'TICK',
              remainingSec: Math.ceil(diffMs / 1000),
            });
          }
        }, 250);
      }
      break;
    }

    case 'STOP':
    case 'RESET': {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      remainingMs = 0;
      isPaused = false;
      self.postMessage({ type: 'TICK', remainingSec: 0 });
      break;
    }
  }
};
