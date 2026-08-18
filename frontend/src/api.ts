export interface CabanaDto {
  id: string;
  row: number;
  col: number;
  available: boolean;
  room?: string;
  guestName?: string;
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

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    const message = (body as ApiError)?.error ?? 'Something went wrong. Please try again.';
    throw new Error(message);
  }
  return body as T;
}

export function fetchMap(): Promise<MapDto> {
  return fetch('/api/map').then((res) => readJson<MapDto>(res));
}

export function postBooking(cabanaId: string, room: string, guestName: string) {
  return fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cabanaId, room, guestName }),
  }).then((res) => readJson<{ cabanaId: string; room: string; guestName: string; confirmed: boolean }>(res));
}

export function cancelBooking(cabanaId: string, room: string, guestName: string) {
  return fetch(`/api/bookings/${encodeURIComponent(cabanaId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room, guestName }),
  }).then((res) => readJson<{ cabanaId: string; released: boolean }>(res));
}
