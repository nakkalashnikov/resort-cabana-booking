import { useState } from 'react';
import type { CabanaDto, Identity } from '../api';
import { cancelBooking, MAX_CABANAS_PER_GUEST, postBooking } from '../api';

interface BookingPanelProps {
  cabanas: CabanaDto[];
  identity: Identity;
  selected: CabanaDto | null;
  onDeselect: () => void;
  onBooked: (cabanaId: string) => void;
  onCancelled: (cabanaId: string) => void;
}

export function BookingPanel({ cabanas, identity, selected, onDeselect, onBooked, onCancelled }: BookingPanelProps) {
  const mineCount = cabanas.filter((c) => c.mine).length;

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
            <span>You have</span>
            <span className="n" style={{ color: 'var(--pool)' }}>{mineCount}/{MAX_CABANAS_PER_GUEST}</span>
          </div>
        </div>
        <p className="hint">Click a cabana. Green books instantly; teal is yours and releases in one click; terracotta is someone else's.</p>
      </aside>
    );
  }

  if (selected.mine) {
    return (
      <aside className="rail">
        <ReleaseAction cabana={selected} identity={identity} onDeselect={onDeselect} onCancelled={onCancelled} />
      </aside>
    );
  }

  if (!selected.available) {
    return (
      <aside className="rail">
        <button className="back-link" type="button" onClick={onDeselect}>
          &larr; Back to overview
        </button>
        <p className="rail-eyebrow">Cabana {selected.id}</p>
        <span className="pill booked">Booked</span>
        <h3 style={{ marginTop: 10 }}>This cabana is taken</h3>
        <p className="hint">It's booked by another guest — nothing to do here.</p>
      </aside>
    );
  }

  return (
    <aside className="rail">
      <BookAction
        cabana={selected}
        identity={identity}
        atLimit={mineCount >= MAX_CABANAS_PER_GUEST}
        onDeselect={onDeselect}
        onBooked={onBooked}
      />
    </aside>
  );
}

function BookAction({
  cabana,
  identity,
  atLimit,
  onDeselect,
  onBooked,
}: {
  cabana: CabanaDto;
  identity: Identity;
  atLimit: boolean;
  onDeselect: () => void;
  onBooked: (cabanaId: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleBook = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await postBooking(cabana.id, identity);
      onBooked(cabana.id);
      onDeselect();
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
      <h3 style={{ marginTop: 10 }}>Book for {identity.guestName}?</h3>
      <p className="hint" style={{ marginBottom: 14 }}>Room {identity.room}</p>
      {atLimit ? (
        <div className="error-note">
          You already have {MAX_CABANAS_PER_GUEST} cabanas booked. Release one first.
        </div>
      ) : (
        <button className="btn btn-primary" type="button" onClick={handleBook} disabled={submitting}>
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      )}
      {error && <div className="error-note">{error}</div>}
    </>
  );
}

function ReleaseAction({
  cabana,
  identity,
  onDeselect,
  onCancelled,
}: {
  cabana: CabanaDto;
  identity: Identity;
  onDeselect: () => void;
  onCancelled: (cabanaId: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRelease = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await cancelBooking(cabana.id, identity);
      onCancelled(cabana.id);
      onDeselect();
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
      <span className="pill mine">Yours</span>
      <h3 style={{ marginTop: 10 }}>This is your cabana</h3>
      <p className="hint" style={{ marginBottom: 14 }}>Booked for {identity.guestName}, room {identity.room}.</p>
      <button className="btn btn-danger" type="button" onClick={handleRelease} disabled={submitting}>
        {submitting ? 'Releasing…' : 'Release cabana'}
      </button>
      {error && <div className="error-note">{error}</div>}
    </>
  );
}
