import { useState } from 'react';
import type { Identity } from '../api';

interface LoginGateProps {
  onLogin: (identity: Identity) => Promise<void>;
}

export function LoginGate({ onLogin }: LoginGateProps) {
  const [room, setRoom] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim() || !guestName.trim()) {
      setError('Enter both a room number and a guest name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onLogin({ room: room.trim(), guestName: guestName.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="login-card">
        <span className="eyebrow">Poolside Reservations</span>
        <h1 className="login-title">Cabana Deck</h1>
        <p className="hint" style={{ marginBottom: 20 }}>
          Enter your room number and name to see the map and your bookings.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="lRoom">Room number</label>
            <input
              id="lRoom"
              placeholder="e.g. 101"
              autoComplete="off"
              autoFocus
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="lName">Guest name</label>
            <input
              id="lName"
              placeholder="As on the reservation"
              autoComplete="off"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Checking…' : 'View the map'}
          </button>
          {error && <div className="error-note">{error}</div>}
        </form>
      </div>
    </div>
  );
}
