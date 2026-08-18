import { useEffect, useState } from 'react';
import type { MapDto } from './api';
import { fetchMap } from './api';
import { MapView } from './components/MapView';
import { BookingPanel } from './components/BookingPanel';
import { useTimeOfDayTheme } from './lib/useTimeOfDayTheme';

export function App() {
  const [map, setMap] = useState<MapDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const theme = useTimeOfDayTheme();

  useEffect(() => {
    fetchMap()
      .then(setMap)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load the map.'));
  }, []);

  const patchCabana = (cabanaId: string, patch: Partial<MapDto['cabanas'][number]>) => {
    setMap((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cabanas: prev.cabanas.map((c) => (c.id === cabanaId ? { ...c, ...patch } : c)),
      };
    });
  };

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
          {map.width} × {map.height} grid
          <br />
          <button className="theme-toggle" type="button" onClick={theme.cycle}>
            {themeIcon} {themeLabel}
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
          selected={selectedCabana}
          onDeselect={() => setSelectedId(null)}
          onBooked={(cabanaId, room, guestName) => {
            patchCabana(cabanaId, { available: false, room, guestName });
          }}
          onCancelled={(cabanaId) => {
            patchCabana(cabanaId, { available: true, room: undefined, guestName: undefined });
            setSelectedId(null);
          }}
        />
      </div>
    </div>
  );
}
