import type { Identity } from '../api';

const KEY = 'cabana-deck.identity';

export function loadIdentity(): Identity | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.room === 'string' && typeof parsed?.guestName === 'string') {
      return parsed;
    }
  } catch {
    // ignore malformed storage, treat as logged out
  }
  return null;
}

export function saveIdentity(identity: Identity) {
  sessionStorage.setItem(KEY, JSON.stringify(identity));
}

export function clearIdentity() {
  sessionStorage.removeItem(KEY);
}
