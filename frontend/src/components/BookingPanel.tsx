import { useState } from 'react';
import type { CabanaDto } from '../api';
import { cancelBooking, postBooking } from '../api';

interface BookingPanelProps {
  cabanas: CabanaDto[];
  selected: CabanaDto | null;
  onDeselect: () => void;
  onBooked: (cabanaId: string, room: string, guestName: string) => void;
  onCancelled: (cabanaId: string) => void;
}

export function BookingPanel({ cabanas, selected, onDeselect, onBooked, onCancelled }: BookingPanelProps) {
  if (!selected) {
    const available = cabanas.filter((c) => c.available).length;
    return (
      <aside className="rail">
        <p className="rail-eyebrow">Overview</p>
        <h3>Pick a cabana</h3>
        <div className="summary-list">
          <div className="summary-row">
            <span>Available now</span>
            <span className="n" style={{ color: 'var(--available)' }}>{available}</span>
          </div>
          <div className="summary-row">
            <span>Currently booked</span>
            <span className="n" style={{ color: 'var(--accent-ink)' }}>{cabanas.length - available}</span>
          </div>
          <div className="summary-row">
            <span>Total cabanas</span>
            <span className="n">{cabanas.length}</span>
          </div>
        </div>
        <p className="hint">Click a cabana. Green books in one step; terracotta shows who's staying and lets you release it.</p>
      </aside>
    );
  }

  return (
    <aside className="rail">
      {selected.available ? (
        <BookForm cabana={selected} onDeselect={onDeselect} onBooked={onBooked} />
      ) : (
        <BookedDetails cabana={selected} onDeselect={onDeselect} onCancelled={onCancelled} />
      )}
    </aside>
  );
}

function BookForm({
  cabana,
  onDeselect,
  onBooked,
}: {
  cabana: CabanaDto;
  onDeselect: () => void;
  onBooked: (cabanaId: string, room: string, guestName: string) => void;
}) {
  const [room, setRoom] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!room.trim() || !guestName.trim()) {
      setError('Enter both a room number and a guest name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await postBooking(cabana.id, room.trim(), guestName.trim());
      onBooked(cabana.id, room.trim(), guestName.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="back-link" type="button" onClick={onDeselect}>
        &larr; Back to overview
      </button>
      <p className="rail-eyebrow">Cabana {cabana.id}</p>
      <span className="pill available">Available</span>
      <h3 style={{ marginTop: 10 }}>Book this cabana</h3>
      <div className="field">
        <label htmlFor="fRoom">Room number</label>
        <input
          id="fRoom"
          placeholder="e.g. 101"
          autoComplete="off"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="fName">Guest name</label>
        <input
          id="fName"
          placeholder="As on the reservation"
          autoComplete="off"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Confirming…' : 'Confirm booking'}
      </button>
      {error && <div className="error-note">{error}</div>}
    </>
  );
}

function BookedDetails({
  cabana,
  onDeselect,
  onCancelled,
}: {
  cabana: CabanaDto;
  onDeselect: () => void;
  onCancelled: (cabanaId: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRelease = async () => {
    if (!cabana.room || !cabana.guestName) return;
    setSubmitting(true);
    setError(null);
    try {
      await cancelBooking(cabana.id, cabana.room, cabana.guestName);
      onCancelled(cabana.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="back-link" type="button" onClick={onDeselect}>
        &larr; Back to overview
      </button>
      <p className="rail-eyebrow">Cabana {cabana.id}</p>
      <span className="pill booked">Booked</span>
      <h3 style={{ marginTop: 10 }}>Reserved</h3>
      <div className="guest-card">
        <span className="g-name">{cabana.guestName}</span>
        <span className="g-room">Room {cabana.room}</span>
      </div>
      {!confirming ? (
        <button className="btn btn-danger" type="button" onClick={() => setConfirming(true)}>
          Release cabana
        </button>
      ) : (
        <>
          <button className="btn btn-danger" type="button" onClick={handleRelease} disabled={submitting}>
            {submitting ? 'Releasing…' : 'Confirm release'}
          </button>
          <div className="confirm-note">This frees the cabana for other guests immediately.</div>
        </>
      )}
      {error && <div className="error-note">{error}</div>}
    </>
  );
}
