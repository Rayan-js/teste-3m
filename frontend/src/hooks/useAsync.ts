import { useCallback, useEffect, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
}

/** Aborts the previous request and keeps the old data on screen while reloading. */
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, error: null, loading: true }));

    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState((current) => ({ ...current, error, loading: false }));
      });

    return () => controller.abort();
  }, [loader, attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  const setData = useCallback((data: T) => setState({ data, error: null, loading: false }), []);

  return { ...state, reload, setData };
}
