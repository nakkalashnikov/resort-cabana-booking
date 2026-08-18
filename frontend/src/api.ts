export interface CabanaDto {
  id: string;
  row: number;
  col: number;
  available: boolean;
  mine: boolean;
}

export interface MapDto {
  width: number;
  height: number;
  grid: string[];
  cabanas: CabanaDto[];
}

export interface ApiError {
  error: string;
}

export interface Identity {
  room: string;
  guestName: string;
}

// Kept in sync with BookingService.MaxCabanasPerGuest on the backend — the backend is the
// source of truth and enforces this independently; this is only used for "You have X/N" copy.
export const MAX_CABANAS_PER_GUEST = 2;

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    const message = (body as ApiError)?.error ?? 'Something went wrong. Please try again.';
    throw new Error(message);
  }
  return body as T;
}

export function fetchMap(identity: Identity): Promise<MapDto> {
  const params = new URLSearchParams({ room: identity.room, guestName: identity.guestName });
  return fetch(`/api/map?${params}`).then((res) => readJson<MapDto>(res));
}

export function postBooking(cabanaId: string, identity: Identity) {
  return fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cabanaId, room: identity.room, guestName: identity.guestName }),
  }).then((res) => readJson<{ cabanaId: string; room: string; guestName: string; confirmed: boolean }>(res));
}

export function cancelBooking(cabanaId: string, identity: Identity) {
  return fetch(`/api/bookings/${encodeURIComponent(cabanaId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: identity.room, guestName: identity.guestName }),
  }).then((res) => readJson<{ cabanaId: string; released: boolean }>(res));
}
