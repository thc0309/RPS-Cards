import { useEffect, useState } from 'react';

export function remainingSeconds(deadlineAt: number | undefined, now = Date.now()): number {
  return deadlineAt ? Math.max(0, Math.ceil((deadlineAt - now) / 1_000)) : 0;
}

export function useCountdownSeconds(deadlineAt: number | undefined): number {
  const [seconds, setSeconds] = useState(() => remainingSeconds(deadlineAt));
  useEffect(() => {
    const update = () => setSeconds(remainingSeconds(deadlineAt));
    update();
    if (!deadlineAt) return;
    const handle = setInterval(update, 250);
    return () => clearInterval(handle);
  }, [deadlineAt]);
  return seconds;
}
