import { Cage, Difficulty, PuzzleDefinition } from '../types';
import { DIRECTIONS_8, getCageMap, getCandidates, solveBoard } from './solver';

// Orthogonal 4 directions for polyomino connectivity
const DIRECTIONS_4 = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1]
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Partitions a rows x cols grid into connected polyomino cages of sizes 1..maxCageSize (standard 5)
 */
export function generateCages(rows: number, cols: number, maxCageSize = 5): { cages: Cage[]; cellCageMap: number[][] } {
  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const cellCageMap: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
    const cages: Cage[] = [];
    let cageIdCounter = 0;

    // List all unassigned cells
    const getUnassigned = () => {
      const list: { r: number; c: number }[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (cellCageMap[r][c] === -1) list.push({ r, c });
        }
      }
      return list;
    };

    let unassigned = getUnassigned();

    while (unassigned.length > 0) {
      // Pick a random unassigned seed cell
      const seed = unassigned[Math.floor(Math.random() * unassigned.length)];
      const targetSize = Math.floor(Math.random() * (maxCageSize - 2)) + 3; // 3, 4, or 5
      const currentCageCells: { r: number; c: number }[] = [seed];
      cellCageMap[seed.r][seed.c] = cageIdCounter;

      while (currentCageCells.length < targetSize) {
        // Find orthogonal unassigned neighbors of any cell in currentCageCells
        const frontier: { r: number; c: number }[] = [];
        for (const cell of currentCageCells) {
          for (const [dr, dc] of DIRECTIONS_4) {
            const nr = cell.r + dr;
            const nc = cell.c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cellCageMap[nr][nc] === -1) {
              if (!frontier.some(f => f.r === nr && f.c === nc)) {
                frontier.push({ r: nr, c: nc });
              }
            }
          }
        }

        if (frontier.length === 0) break;
        const nextCell = frontier[Math.floor(Math.random() * frontier.length)];
        cellCageMap[nextCell.r][nextCell.c] = cageIdCounter;
        currentCageCells.push(nextCell);
      }

      cages.push({
        id: cageIdCounter,
        cells: currentCageCells,
        size: currentCageCells.length,
        colorIndex: cageIdCounter % 8
      });
      cageIdCounter++;
      unassigned = getUnassigned();
    }

    // Repair small cages (size 1 or 2) by merging them into an adjacent cage if adjacent cage size + current <= maxCageSize
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < cages.length; i++) {
        const cage = cages[i];
        if (cage.size <= 2) {
          // Find adjacent cages
          const neighborCageIds = new Set<number>();
          for (const cell of cage.cells) {
            for (const [dr, dc] of DIRECTIONS_4) {
              const nr = cell.r + dr;
              const nc = cell.c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const adjId = cellCageMap[nr][nc];
                if (adjId !== cage.id) neighborCageIds.add(adjId);
              }
            }
          }

          let merged = false;
          for (const adjId of neighborCageIds) {
            const adjCage = cages.find(c => c.id === adjId);
            if (adjCage && adjCage.size + cage.size <= maxCageSize) {
              // Merge cage into adjCage
              for (const cell of cage.cells) {
                cellCageMap[cell.r][cell.c] = adjId;
                adjCage.cells.push(cell);
              }
              adjCage.size = adjCage.cells.length;
              cages.splice(i, 1);
              changed = true;
              merged = true;
              break;
            }
          }
          if (merged) break;
        }
      }
    }

    // Re-index cage IDs
    cages.forEach((cage, index) => {
      cage.id = index;
      cage.size = cage.cells.length;
      cage.colorIndex = index % 8;
      for (const cell of cage.cells) {
        cellCageMap[cell.r][cell.c] = index;
      }
    });

    // Check that all cages have size between 1 and maxCageSize
    const validSizes = cages.every(c => c.size >= 1 && c.size <= maxCageSize);
    if (validSizes) {
      return { cages, cellCageMap };
    }
  }

  // Fallback default simple partitioning if random tries failed
  return generateFallbackCages(rows, cols, maxCageSize);
}

function generateFallbackCages(rows: number, cols: number, maxCageSize: number): { cages: Cage[]; cellCageMap: number[][] } {
  const cellCageMap: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const cages: Cage[] = [];
  let currentId = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c += 4) {
      const cells: { r: number; c: number }[] = [];
      const endC = Math.min(cols, c + 4);
      for (let col = c; col < endC; col++) {
        cellCageMap[r][col] = currentId;
        cells.push({ r, c: col });
      }
      cages.push({
        id: currentId,
        cells,
        size: cells.length,
        colorIndex: currentId % 8
      });
      currentId++;
    }
  }
  return { cages, cellCageMap };
}

/**
 * Fills the board completely with a valid Suguru solution
 */
export function fillBoardRandom(
  rows: number,
  cols: number,
  cages: Cage[],
  cellCageMap: number[][]
): number[][] | null {
  const board: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  const cagesMap = getCageMap(rows, cols, cages);

  function backtrack(): boolean {
    // Find unassigned cell with MRV (fewest candidates)
    let bestR = -1;
    let bestC = -1;
    let minCandidates = 999;
    let bestCandidates: number[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === 0) {
          const cands = getCandidates(board, rows, cols, cagesMap, cellCageMap, r, c);
          if (cands.length === 0) return false; // dead end
          if (cands.length < minCandidates) {
            minCandidates = cands.length;
            bestR = r;
            bestC = c;
            bestCandidates = cands;
            if (minCandidates === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    if (bestR === -1) {
      return true; // All filled
    }

    const shuffled = shuffle(bestCandidates);
    for (const val of shuffled) {
      board[bestR][bestC] = val;
      if (backtrack()) return true;
      board[bestR][bestC] = 0;
    }

    return false;
  }

  const success = backtrack();
  return success ? board : null;
}

/**
 * Generates a complete verified puzzle with unique solution and target difficulty
 */
export function generatePuzzle(
  rows: number,
  cols: number,
  difficulty: Difficulty = 'medium',
  maxCageSize = 5
): PuzzleDefinition {
  const totalCells = rows * cols;

  // Clue target ratio depending on difficulty
  const targetRatioMap: Record<Difficulty, { minClues: number; maxClues: number }> = {
    easy: { minClues: Math.round(totalCells * 0.42), maxClues: Math.round(totalCells * 0.48) },
    medium: { minClues: Math.round(totalCells * 0.32), maxClues: Math.round(totalCells * 0.38) },
    hard: { minClues: Math.round(totalCells * 0.24), maxClues: Math.round(totalCells * 0.29) },
    expert: { minClues: Math.round(totalCells * 0.18), maxClues: Math.round(totalCells * 0.23) },
  };

  const targetRange = targetRatioMap[difficulty];

  // Try generating a valid solution board
  let solution: number[][] | null = null;
  let cages: Cage[] = [];
  let cellCageMap: number[][] = [];

  for (let attempt = 0; attempt < 25; attempt++) {
    const partitioned = generateCages(rows, cols, maxCageSize);
    cages = partitioned.cages;
    cellCageMap = partitioned.cellCageMap;

    solution = fillBoardRandom(rows, cols, cages, cellCageMap);
    if (solution) break;
  }

  if (!solution) {
    // Ultimate fallback if random tries struggled
    const partitioned = generateFallbackCages(rows, cols, maxCageSize);
    cages = partitioned.cages;
    cellCageMap = partitioned.cellCageMap;
    solution = fillBoardRandom(rows, cols, cages, cellCageMap)!;
  }

  // Clone solution into working clues board
  const clues: number[][] = solution.map(row => [...row]);

  // Coordinates to thin out
  const coords: { r: number; c: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      coords.push({ r, c });
    }
  }

  const shuffledCoords = shuffle(coords);
  let currentClueCount = totalCells;

  for (const { r, c } of shuffledCoords) {
    if (currentClueCount <= targetRange.minClues) break;

    const originalVal = clues[r][c];
    clues[r][c] = 0;

    // Check if uniquely solvable
    const testResult = solveBoard(clues, rows, cols, cages, cellCageMap, 2);

    if (testResult.isUnique) {
      currentClueCount--;
      // If we are in the target range and difficulty criteria matches
      if (currentClueCount <= targetRange.maxClues) {
        if (difficulty === 'easy' && testResult.backtracks === 0) {
          break;
        } else if (difficulty === 'medium' && testResult.backtracks === 0) {
          // Great medium puzzle
          if (currentClueCount <= (targetRange.minClues + targetRange.maxClues) / 2) {
            break;
          }
        }
      }
    } else {
      // Must keep this clue to preserve uniqueness!
      clues[r][c] = originalVal;
    }
  }

  // Final verification run
  const finalSolve = solveBoard(clues, rows, cols, cages, cellCageMap, 2);

  return {
    id: `suguru-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
    rows,
    cols,
    cages,
    cellCageMap,
    clues,
    solution,
    difficulty,
    clueCount: currentClueCount,
    totalCells,
    solverSteps: finalSolve.logicalSteps,
    backtracksNeeded: finalSolve.backtracks
  };
}
