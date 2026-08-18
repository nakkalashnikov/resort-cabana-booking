import type { CabanaDto, MapDto } from '../api';
import { pathNeighbors, pathTile, PATH_ASSET_SRC } from '../lib/pathTiles';

const TILE_SIZE = 26;

interface MapViewProps {
  map: MapDto;
  selectedCabanaId: string | null;
  onSelectCabana: (id: string) => void;
}

export function MapView({ map, selectedCabanaId, onSelectCabana }: MapViewProps) {
  const cabanaByCoord = new Map<string, CabanaDto>();
  for (const cabana of map.cabanas) {
    cabanaByCoord.set(`${cabana.row}-${cabana.col}`, cabana);
  }

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${map.width}, ${TILE_SIZE}px)` }}
    >
      {map.grid.map((rowStr, row) =>
        rowStr.split('').map((ch, col) => {
          const key = `${row}-${col}`;

          if (ch === 'p') {
            return <div key={key} className="cell pool" />;
          }

          if (ch === 'c') {
            return (
              <div key={key} className="cell chalet">
                <img src="/assets/houseChimney.png" alt="" />
              </div>
            );
          }

          if (ch === '#') {
            const tile = pathTile(pathNeighbors(map.grid, row, col));
            return (
              <div key={key} className="cell path">
                <img
                  src={PATH_ASSET_SRC[tile.asset]}
                  alt=""
                  style={{ transform: `rotate(${tile.rotationDeg}deg)` }}
                />
              </div>
            );
          }

          if (ch === 'W') {
            const cabana = cabanaByCoord.get(key);
            if (!cabana) return <div key={key} className="cell empty" />;
            const stateClass = cabana.available ? 'state-available' : 'state-booked';
            const selectedClass = cabana.id === selectedCabanaId ? 'is-selected' : '';
            return (
              <button
                key={key}
                type="button"
                className={`cell cabana ${stateClass} ${selectedClass}`}
                aria-label={`Cabana ${cabana.id}, ${cabana.available ? 'available' : 'booked'}`}
                onClick={() => onSelectCabana(cabana.id)}
              >
                <img src="/assets/cabana.png" alt="" />
              </button>
            );
          }

          return <div key={key} className="cell empty" />;
        }),
      )}
    </div>
  );
}
