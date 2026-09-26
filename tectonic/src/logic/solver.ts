import { Cage, HintResult } from '../types';

export interface SolverResult {
  isSolvable: boolean;
  isUnique: boolean;
  solution?: number[][];
  difficultyScore: number;
  logicalSteps: number;
  backtracks: number;
}

// 8 neighbor directions (orthogonal + diagonal)
export const DIRECTIONS_8 = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

export function getCageMap(rows: number, cols: number, cages: Cage[]): Map<number, Cage> {
  const map = new Map<number, Cage>();
  for (const cage of cages) {
    map.set(cage.id, cage);
  }
  return map;
}

export function isValidMove(
  board: number[][],
  rows: number,
  cols: number,
  cagesMap: Map<number, Cage>,
  cellCageMap: number[][],
  r: number,
  c: number,
  val: number
): boolean {
  if (val <= 0) return true;

  const cageId = cellCageMap[r][c];
  const cage = cagesMap.get(cageId);
  if (!cage) return false;

  // Rule 1: Value must not exceed cage size
  if (val > cage.size) return false;

  // Rule 2: No duplicate in the same cage
  for (const cell of cage.cells) {
    if (cell.r === r && cell.c === c) continue;
    if (board[cell.r][cell.c] === val) return false;
  }

  // Rule 3: No identical number in any of the 8 neighbors (orthogonal + diagonal)
  for (const [dr, dc] of DIRECTIONS_8) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      if (board[nr][nc] === val) return false;
    }
  }

  return true;
}

// Check for any rule conflicts on current board (for player error highlighting)
export function findBoardConflicts(
  board: number[][],
  rows: number,
  cols: number,
  cagesMap: Map<number, Cage>,
  cellCageMap: number[][]
): Set<string> {
  const conflictKeys = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = board[r][c];
      if (val <= 0) continue;

      const cageId = cellCageMap[r][c];
      const cage = cagesMap.get(cageId);
      if (cage && val > cage.size) {
        conflictKeys.add(`${r},${c}`);
      }

      // Check cage duplicates
      if (cage) {
        for (const cell of cage.cells) {
          if (cell.r === r && cell.c === c) continue;
          if (board[cell.r][cell.c] === val) {
            conflictKeys.add(`${r},${c}`);
            conflictKeys.add(`${cell.r},${cell.c}`);
          }
        }
      }

      // Check 8-neighbor duplicates
      for (const [dr, dc] of DIRECTIONS_8) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (board[nr][nc] === val) {
            conflictKeys.add(`${r},${c}`);
            conflictKeys.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  return conflictKeys;
}

export function getCandidates(
  board: number[][],
  rows: number,
  cols: number,
  cagesMap: Map<number, Cage>,
  cellCageMap: number[][],
  r: number,
  c: number
): number[] {
  if (board[r][c] !== 0) return [];
  const cageId = cellCageMap[r][c];
  const cage = cagesMap.get(cageId);
  if (!cage) return [];

  const candidates: number[] = [];
  for (let v = 1; v <= cage.size; v++) {
    if (isValidMove(board, rows, cols, cagesMap, cellCageMap, r, c, v)) {
      candidates.push(v);
    }
  }
  return candidates;
}

/**
 * Logical deductions step:
 * 1. Naked single: a cell has only 1 legal candidate.
 * 2. Hidden single in cage: for a cage and digit d (1..cage.size), only 1 cell can hold d.
 */
export function solvePureLogic(
  initialBoard: number[][],
  rows: number,
  cols: number,
  cages: Cage[],
  cellCageMap: number[][]
): { solvedBoard: number[][]; steps: number; isFilled: boolean; progressMade: boolean } {
  const board = initialBoard.map(row => [...row]);
  const cagesMap = getCageMap(rows, cols, cages);
  let steps = 0;
  let changed = true;

  while (changed) {
    changed = false;

    // 1. Naked Singles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === 0) {
          const cands = getCandidates(board, rows, cols, cagesMap, cellCageMap, r, c);
          if (cands.length === 1) {
            board[r][c] = cands[0];
            steps++;
            changed = true;
          }
        }
      }
    }

    // 2. Hidden Singles in Cages
    for (const cage of cages) {
      const emptyCells = cage.cells.filter(cell => board[cell.r][cell.c] === 0);
      const placedDigits = new Set(cage.cells.map(c => board[c.r][c.c]).filter(v => v > 0));

      for (let d = 1; d <= cage.size; d++) {
        if (placedDigits.has(d)) continue;

        const possibleCells = emptyCells.filter(cell =>
          isValidMove(board, rows, cols, cagesMap, cellCageMap, cell.r, cell.c, d)
        );

        if (possibleCells.length === 1) {
          const target = possibleCells[0];
          board[target.r][target.c] = d;
          steps++;
          changed = true;
          break; // restart logic loop
        }
      }
      if (changed) break;
    }
  }

  let isFilled = true;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === 0) {
        isFilled = false;
        break;
      }
    }
    if (!isFilled) break;
  }

  return {
    solvedBoard: board,
    steps,
    isFilled,
    progressMade: steps > 0
  };
}

/**
 * Complete solver with backtracking to check uniqueness.
 * Stops after finding 2 solutions.
 */
export function solveBoard(
  initialBoard: number[][],
  rows: number,
  cols: number,
  cages: Cage[],
  cellCageMap: number[][],
  maxSolutionsToFind: number = 2
): SolverResult {
  const cagesMap = getCageMap(rows, cols, cages);
  const board = initialBoard.map(row => [...row]);

  // First try pure logic
  const logicRes = solvePureLogic(board, rows, cols, cages, cellCageMap);
  if (logicRes.isFilled) {
    return {
      isSolvable: true,
      isUnique: true,
      solution: logicRes.solvedBoard,
      difficultyScore: logicRes.steps,
      logicalSteps: logicRes.steps,
      backtracks: 0
    };
  }

  let solutionsCount = 0;
  let firstSolution: number[][] | undefined = undefined;
  let backtracks = 0;

  function backtrack(currBoard: number[][]): boolean {
    if (solutionsCount >= maxSolutionsToFind) return true;

    // Find cell with Minimum Remaining Values (MRV heuristic)
    let bestR = -1;
    let bestC = -1;
    let minCandidates = 999;
    let bestCandidates: number[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currBoard[r][c] === 0) {
          const cands = getCandidates(currBoard, rows, cols, cagesMap, cellCageMap, r, c);
          if (cands.length === 0) {
            // Dead end
            backtracks++;
            return false;
          }
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
      // Board filled
      solutionsCount++;
      if (!firstSolution) {
        firstSolution = currBoard.map(row => [...row]);
      }
      return solutionsCount >= maxSolutionsToFind;
    }

    for (const val of bestCandidates) {
      currBoard[bestR][bestC] = val;
      const stop = backtrack(currBoard);
      if (stop) return true;
      currBoard[bestR][bestC] = 0;
    }

    backtracks++;
    return false;
  }

  backtrack(logicRes.solvedBoard);

  const isSolvable = solutionsCount > 0;
  const isUnique = solutionsCount === 1;

  return {
    isSolvable,
    isUnique,
    solution: firstSolution,
    difficultyScore: logicRes.steps + backtracks * 4,
    logicalSteps: logicRes.steps,
    backtracks
  };
}

/**
 * Generates an educational hint for the player:
 * 1. Checks if current player board has mistakes compared to the true solution.
 * 2. Checks for immediate naked singles on current board.
 * 3. Checks for immediate hidden singles in cages on current board.
 * 4. Falls back to revealing the cell with minimum candidates from true solution.
 */
export function getSmartHint(
  currentBoard: number[][],
  solution: number[][],
  rows: number,
  cols: number,
  cages: Cage[],
  cellCageMap: number[][]
): HintResult | null {
  const cagesMap = getCageMap(rows, cols, cages);

  // 1. Check for incorrect values placed by player
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = currentBoard[r][c];
      if (val !== 0 && val !== solution[r][c]) {
        return {
          r,
          c,
          value: solution[r][c],
          reason: `The value ${val} here causes a conflict. The correct number for this cell is ${solution[r][c]}.`,
          technique: 'neighbor_conflict'
        };
      }
    }
  }

  // 2. Check for Naked Single
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (currentBoard[r][c] === 0) {
        const cands = getCandidates(currentBoard, rows, cols, cagesMap, cellCageMap, r, c);
        if (cands.length === 1) {
          const val = cands[0];
          const cage = cagesMap.get(cellCageMap[r][c]);
          return {
            r,
            c,
            value: val,
            reason: `This cell in cage of size ${cage?.size} has only one valid candidate (${val}) because all other numbers (1-${cage?.size}) are blocked by neighboring cells or the cage.`,
            technique: 'naked_single'
          };
        }
      }
    }
  }

  // 3. Check for Hidden Single in cage
  for (const cage of cages) {
    const emptyCells = cage.cells.filter(cell => currentBoard[cell.r][cell.c] === 0);
    const placedDigits = new Set(cage.cells.map(c => currentBoard[c.r][c.c]).filter(v => v > 0));

    for (let d = 1; d <= cage.size; d++) {
      if (placedDigits.has(d)) continue;

      const validCells = emptyCells.filter(cell =>
        isValidMove(currentBoard, rows, cols, cagesMap, cellCageMap, cell.r, cell.c, d)
      );

      if (validCells.length === 1) {
        const target = validCells[0];
        return {
          r: target.r,
          c: target.c,
          value: d,
          reason: `In this ${cage.size}-cell block, the number ${d} can only be placed in row ${target.r + 1}, column ${target.c + 1} because neighboring cells block ${d} everywhere else in the block.`,
          technique: 'hidden_single'
        };
      }
    }
  }

  // 4. Fallback: Cell with fewest candidates
  let bestR = -1;
  let bestC = -1;
  let minCands = 999;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (currentBoard[r][c] === 0) {
        const cands = getCandidates(currentBoard, rows, cols, cagesMap, cellCageMap, r, c);
        if (cands.length < minCands) {
          minCands = cands.length;
          bestR = r;
          bestC = c;
        }
      }
    }
  }

  if (bestR !== -1) {
    return {
      r: bestR,
      c: bestC,
      value: solution[bestR][bestC],
      reason: `By analyzing surrounding blocks and cage limits, row ${bestR + 1}, column ${bestC + 1} must be ${solution[bestR][bestC]}.`,
      technique: 'reveal'
    };
  }

  return null;
}
