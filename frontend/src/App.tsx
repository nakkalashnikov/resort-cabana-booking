import { useEffect, useState } from 'react';
import type { Identity, MapDto } from './api';
import { fetchMap } from './api';
import { MapView } from './components/MapView';
import { BookingPanel } from './components/BookingPanel';
import { LoginGate } from './components/LoginGate';
import { useTimeOfDayTheme } from './lib/useTimeOfDayTheme';
import { clearIdentity, loadIdentity, saveIdentity } from './lib/session';

export function App() {
  const [identity, setIdentity] = useState<Identity | null>(() => loadIdentity());
  const [map, setMap] = useState<MapDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const theme = useTimeOfDayTheme();

  useEffect(() => {
    if (!identity) return;
    fetchMap(identity)
      .then(setMap)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load the map.'));
  }, [identity]);

  const patchCabana = (cabanaId: string, patch: Partial<MapDto['cabanas'][number]>) => {
    setMap((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cabanas: prev.cabanas.map((c) => (c.id === cabanaId ? { ...c, ...patch } : c)),
      };
    });
  };

  const handleLogin = async (candidate: Identity) => {
    const fetched = await fetchMap(candidate); // doubles as credential validation
    saveIdentity(candidate);
    setIdentity(candidate);
    setMap(fetched);
  };

  const handleLogout = () => {
    clearIdentity();
    setIdentity(null);
    setMap(null);
    setSelectedId(null);
  };

  if (!identity) {
    return <LoginGate onLogin={handleLogin} />;
  }

  if (loadError) {
    return (
      <div className="page">
        <p className="error-note">Couldn't load the map: {loadError}</p>
      </div>
    );
  }

  if (!map) {
    return null;
  }

  const selectedCabana = selectedId ? map.cabanas.find((c) => c.id === selectedId) ?? null : null;
  const available = map.cabanas.filter((c) => c.available).length;
  const themeIcon = theme.resolved === 'light' ? '☀️' : '🌙';
  const themeLabel =
    theme.mode === 'auto'
      ? `Auto · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : theme.mode === 'light'
        ? 'Day (fixed)'
        : 'Night (fixed)';

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <span className="eyebrow">Poolside Reservations</span>
          <h1>Cabana Deck</h1>
        </div>
        <div className="top-meta">
          {identity.guestName} · Room {identity.room}
          <br />
          <button className="theme-toggle" type="button" onClick={theme.cycle}>
            {themeIcon} {themeLabel}
          </button>{' '}
          <button className="theme-toggle" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="app-shell">
        <section className="map-card">
          <div className="map-card-head">
            <h2>Resort map</h2>
            <div className="stat-row">
              <span>
                <span className="dot available" />
                <b>{available}</b> available
              </span>
              <span>
                <span className="dot booked" />
                <b>{map.cabanas.length - available}</b> booked
              </span>
            </div>
          </div>

          <div className="map-viewport">
            <MapView map={map} selectedCabanaId={selectedId} onSelectCabana={setSelectedId} />
          </div>

          <div className="legend">
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--available-soft)' }} />
              Cabana — available
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--mine-soft)' }} />
              Cabana — yours
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--accent-soft)' }} />
              Cabana — booked
            </div>
            <div className="legend-item">
              <span
                className="legend-swatch"
                style={{ background: 'linear-gradient(160deg, var(--pool), var(--pool-deep))' }}
              />
              Pool
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: 'var(--path-tile)' }} />
              Path
            </div>
            <div className="legend-item">
              <span
                className="legend-swatch"
                style={{ background: 'color-mix(in srgb, var(--path-tile) 55%, var(--surface))' }}
              />
              Chalet
            </div>
          </div>
        </section>

        <BookingPanel
          cabanas={map.cabanas}
          identity={identity}
          selected={selectedCabana}
          onDeselect={() => setSelectedId(null)}
          onBooked={(cabanaId) => patchCabana(cabanaId, { available: false, mine: true })}
          onCancelled={(cabanaId) => patchCabana(cabanaId, { available: true, mine: false })}
        />
      </div>
    </div>
  );
}
