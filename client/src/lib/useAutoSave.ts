import { useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved";

// Debounced auto-save: fires `run` a short moment after `deps` last changed, with no
// button click required. `enabled` gates it off while a form isn't ready to persist yet.
export function useAutoSave(enabled: boolean, deps: unknown[], run: () => Promise<void>, delay = 700) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    if (!enabled) return;
    const timeout = setTimeout(async () => {
      setStatus("saving");
      try {
        await runRef.current();
        setStatus("saved");
      } catch {
        setStatus("idle");
      }
    }, delay);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, delay, ...deps]);

  return status;
}
