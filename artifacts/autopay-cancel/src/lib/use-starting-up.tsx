import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setStartingUpCallback, setServiceReadyCallback } from "@workspace/api-client-react";

export function useStartingUp() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const qc = useQueryClient();

  const handleStartingUp = useCallback((retryAfter: number) => {
    setSecondsLeft(retryAfter);
  }, []);

  const handleServiceReady = useCallback(() => {
    setSecondsLeft(null);
  }, []);

  useEffect(() => {
    setStartingUpCallback(handleStartingUp);
    setServiceReadyCallback(handleServiceReady);
    return () => {
      setStartingUpCallback(null);
      setServiceReadyCallback(null);
    };
  }, [handleStartingUp, handleServiceReady]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      setSecondsLeft(null);
      qc.invalidateQueries();
      return;
    }
    const t = setTimeout(
      () => setSecondsLeft((s) => (s !== null ? s - 1 : null)),
      1000,
    );
    return () => clearTimeout(t);
  }, [secondsLeft, qc]);

  return secondsLeft;
}

export function ServiceStartingBanner({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800"
    >
      <svg
        className="h-4 w-4 shrink-0 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <span>
        Service is starting up &mdash; retrying in{" "}
        <strong>{secondsLeft}s</strong>&hellip;
      </span>
    </div>
  );
}

export function StartingUpController() {
  const secondsLeft = useStartingUp();
  if (secondsLeft === null || secondsLeft <= 0) return null;
  return <ServiceStartingBanner secondsLeft={secondsLeft} />;
}
