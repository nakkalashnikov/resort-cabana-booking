import type { Identity, MapDto } from '../api';

// Small enough to reason about at a glance: 3 cabanas (one free, one taken by
// someone else, one taken by "me"), one pool tile, one chalet tile, one path
// tile — exercises every legend character without depending on the shape of
// the real map.ascii.
export const sampleMap: MapDto = {
  width: 4,
  height: 5,
  grid: ['....', '.WWc', '.pp.', '.##.', '.W..'],
  cabanas: [
    { id: '1-1', row: 1, col: 1, available: true, mine: false },
    // GET /api/map never returns who booked a cabana someone else holds — only
    // whether it's available and whether it's mine — the fixture mirrors that.
    { id: '1-2', row: 1, col: 2, available: false, mine: false },
    { id: '4-1', row: 4, col: 1, available: false, mine: true },
  ],
};

export const identity: Identity = { room: '102', guestName: 'Bob Jones' };
