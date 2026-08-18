import { useCallback, useEffect, useState } from 'react';

// Theme follows the guest's actual local clock (sunrise/sunset), not the device's
// dark-mode setting — a resort map should look like poolside daylight or evening
// dusk, whichever it actually is outside right now.
const SUNRISE_HOUR = 6.5;
const SUNSET_HOUR = 19.5;

type ThemeMode = 'auto' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

function timeOfDayTheme(): ResolvedTheme {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  return h >= SUNRISE_HOUR && h < SUNSET_HOUR ? 'light' : 'dark';
}

export function useTimeOfDayTheme() {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [resolved, setResolved] = useState<ResolvedTheme>(() => timeOfDayTheme());

  useEffect(() => {
    const apply = () => setResolved(mode === 'auto' ? timeOfDayTheme() : mode);
    apply();
    const interval = window.setInterval(() => {
      if (mode === 'auto') apply();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  const cycle = useCallback(() => {
    setMode((current) => (current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto'));
  }, []);

  return { mode, resolved, cycle };
}
