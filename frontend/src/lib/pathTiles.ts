export interface PathNeighbors {
  N: boolean;
  E: boolean;
  S: boolean;
  W: boolean;
}

export type PathAssetKey = 'straight' | 'corner' | 'crossing' | 'end' | 'split';

export interface PathTile {
  asset: PathAssetKey;
  rotationDeg: number;
}

export function pathNeighbors(grid: string[], row: number, col: number): PathNeighbors {
  const isPath = (r: number, c: number) =>
    r >= 0 && r < grid.length && c >= 0 && c < grid[r].length && grid[r][c] === '#';
  return {
    N: isPath(row - 1, col),
    E: isPath(row, col + 1),
    S: isPath(row + 1, col),
    W: isPath(row, col - 1),
  };
}

export function pathTile(n: PathNeighbors): PathTile {
  const count = [n.N, n.E, n.S, n.W].filter(Boolean).length;

  if (count >= 4) return { asset: 'crossing', rotationDeg: 0 };

  if (count === 3) {
    if (!n.N) return { asset: 'split', rotationDeg: 180 };
    if (!n.E) return { asset: 'split', rotationDeg: 270 };
    if (!n.S) return { asset: 'split', rotationDeg: 0 };
    return { asset: 'split', rotationDeg: 90 };
  }

  if (count === 2) {
    if (n.N && n.S) return { asset: 'straight', rotationDeg: 0 };
    if (n.E && n.W) return { asset: 'straight', rotationDeg: 90 };
    if (n.N && n.E) return { asset: 'corner', rotationDeg: 90 };
    if (n.E && n.S) return { asset: 'corner', rotationDeg: 180 };
    if (n.S && n.W) return { asset: 'corner', rotationDeg: 270 };
    return { asset: 'corner', rotationDeg: 0 };
  }

  if (count === 1) {
    if (n.N) return { asset: 'end', rotationDeg: 180 };
    if (n.E) return { asset: 'end', rotationDeg: 270 };
    if (n.S) return { asset: 'end', rotationDeg: 0 };
    return { asset: 'end', rotationDeg: 90 };
  }

  return { asset: 'straight', rotationDeg: 0 };
}

export const PATH_ASSET_SRC: Record<PathAssetKey, string> = {
  straight: '/assets/arrowStraight.png',
  corner: '/assets/arrowCornerSquare.png',
  crossing: '/assets/arrowCrossing.png',
  end: '/assets/arrowEnd.png',
  split: '/assets/arrowSplit.png',
};
