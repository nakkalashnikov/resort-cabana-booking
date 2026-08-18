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
  const [confirmedBooking, setConfirmedBooking] = useState<{ cabanaId: string; room: string; guestName: string } | null>(null);

  if (selected && confirmedBooking?.cabanaId === selected.id) {
    return (
      <aside className="rail">
        <p className="rail-eyebrow">Cabana {selected.id}</p>
        <span className="pill booked">Confirmed</span>
        <h3 style={{ marginTop: 10 }}>Booking confirmed</h3>
        <div className="guest-card">
          <span className="g-name">{confirmedBooking.guestName}</span>
          <span className="g-room">Room {confirmedBooking.room}</span>
        </div>
        <p className="hint" style={{ marginBottom: 14 }}>
          The map has been updated — this cabana now shows as booked. You can release it later by
          returning to this cabana and entering the same room and name.
        </p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            setConfirmedBooking(null);
            onDeselect();
          }}
        >
          Back to overview
        </button>
      </aside>
    );
  }

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
        <BookForm
          cabana={selected}
          onDeselect={onDeselect}
          onBooked={(cabanaId, room, guestName) => {
            onBooked(cabanaId, room, guestName);
            setConfirmedBooking({ cabanaId, room, guestName });
          }}
        />
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
  const [room, setRoom] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Releasing re-checks room+name against the API just like booking does — the panel never
  // trusts locally-cached guest info as proof, since anyone with the page open could otherwise
  // release someone else's cabana with a single click.
  const handleRelease = async () => {
    if (!room.trim() || !guestName.trim()) {
      setError('Enter both a room number and a guest name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await cancelBooking(cabana.id, room.trim(), guestName.trim());
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
      <h3 style={{ marginTop: 10 }}>This cabana is taken</h3>
      <p className="hint" style={{ marginBottom: 14 }}>
        Enter the room number and guest name it was booked under to release it.
      </p>
      <div className="field">
        <label htmlFor="rRoom">Room number</label>
        <input
          id="rRoom"
          placeholder="e.g. 101"
          autoComplete="off"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="rName">Guest name</label>
        <input
          id="rName"
          placeholder="As on the reservation"
          autoComplete="off"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
      </div>
      <button className="btn btn-danger" type="button" onClick={handleRelease} disabled={submitting}>
        {submitting ? 'Releasing…' : 'Release cabana'}
      </button>
      {error && <div className="error-note">{error}</div>}
    </>
  );
}
