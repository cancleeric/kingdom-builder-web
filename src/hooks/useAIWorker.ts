import { useCallback, useEffect, useRef } from 'react';
import type { AIComputeRequest, AIComputeResult } from '../workers/aiWorker';

type ResultCallback = (result: AIComputeResult) => void;
type ErrorCallback = (error: string) => void;

/**
 * React hook that manages a persistent AI Web Worker.
 * The worker is created once and terminated when the component unmounts.
 */
export function useAIWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbackRef = useRef<ResultCallback | null>(null);
  const errorRef = useRef<ErrorCallback | null>(null);

  useEffect(() => {
    // Vite resolves `new URL(…, import.meta.url)` as a worker URL at build time.
    const worker = new Worker(
      new URL('../workers/aiWorker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.addEventListener('message', (event: MessageEvent) => {
      const { type, payload } = event.data as
        | { type: 'MOVE_RESULT'; payload: AIComputeResult }
        | { type: 'ERROR'; payload: string };

      if (type === 'MOVE_RESULT') {
        callbackRef.current?.(payload);
      } else if (type === 'ERROR') {
        errorRef.current?.(payload);
      }
    });

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const computeMove = useCallback(
    (
      request: AIComputeRequest,
      onResult: ResultCallback,
      onError?: ErrorCallback,
    ) => {
      callbackRef.current = onResult;
      errorRef.current = onError ?? null;
      workerRef.current?.postMessage({ type: 'COMPUTE_MOVE', payload: request });
    },
    [],
  );

  return { computeMove };
}
