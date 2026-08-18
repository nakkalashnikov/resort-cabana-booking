import type { MapDto } from '../api';

// Small enough to reason about at a glance: 2 cabanas (one booked, one free),
// one pool tile, one chalet tile, one path tile — exercises every legend
// character without depending on the shape of the real map.ascii.
export const sampleMap: MapDto = {
  width: 4,
  height: 4,
  grid: ['....', '.WWc', '.pp.', '.##.'],
  cabanas: [
    { id: '1-1', row: 1, col: 1, available: true },
    { id: '1-2', row: 1, col: 2, available: false, room: '101', guestName: 'Alice Smith' },
  ],
};

export const validGuest = { room: '102', guestName: 'Bob Jones' };
