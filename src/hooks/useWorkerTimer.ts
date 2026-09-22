import { useState, useEffect, useRef, useCallback } from 'react';

export function useWorkerTimer() {
  const [remainingSec, setRemainingSec] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/timer.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { type, remainingSec: rem } = e.data;
      if (type === 'TICK') {
        setRemainingSec(rem);
      } else if (type === 'COMPLETE') {
        setIsRunning(false);
        setIsCompleted(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const startTimer = useCallback((durationSec: number, onComplete?: () => void) => {
    setTotalDuration(durationSec);
    setRemainingSec(durationSec);
    setIsRunning(true);
    setIsCompleted(false);
    onCompleteRef.current = onComplete || null;
    workerRef.current?.postMessage({ action: 'START', durationSec });
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    workerRef.current?.postMessage({ action: 'PAUSE' });
  }, []);

  const resumeTimer = useCallback(() => {
    setIsRunning(true);
    workerRef.current?.postMessage({ action: 'RESUME' });
  }, []);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setIsCompleted(false);
    setRemainingSec(0);
    workerRef.current?.postMessage({ action: 'STOP' });
  }, []);

  return {
    remainingSec,
    totalDuration,
    isRunning,
    isCompleted,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  };
}
