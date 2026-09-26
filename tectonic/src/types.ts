export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface GridSize {
  rows: number;
  cols: number;
  label: string;
}

export const GRID_PRESETS: GridSize[] = [
  { rows: 5, cols: 5, label: '5 × 5 (Quick)' },
  { rows: 6, cols: 6, label: '6 × 6 (Standard)' },
  { rows: 8, cols: 6, label: '8 × 6 (Classic)' },
  { rows: 8, cols: 8, label: '8 × 8 (Challenging)' },
  { rows: 10, cols: 8, label: '10 × 8 (Large)' },
  { rows: 10, cols: 10, label: '10 × 10 (Master)' },
];

export interface CellCoord {
  r: number;
  c: number;
}

export interface Cage {
  id: number;
  cells: CellCoord[];
  size: number;
  colorIndex: number;
}

export interface PuzzleDefinition {
  id: string;
  createdAt: number;
  rows: number;
  cols: number;
  cages: Cage[];
  // cellCageMap[r][c] = cageId
  cellCageMap: number[][];
  // initial clues: 0 if empty
  clues: number[][];
  // complete solution
  solution: number[][];
  difficulty: Difficulty;
  clueCount: number;
  totalCells: number;
  solverSteps?: number;
  backtracksNeeded?: number;
}

export interface PlayerCellState {
  value: number; // 0 for empty
  notes: number[]; // pencil candidate numbers e.g. [1, 3]
  isClue: boolean;
  isError?: boolean;
}

export interface ActiveGameState {
  puzzle: PuzzleDefinition;
  board: PlayerCellState[][];
  elapsedSeconds: number;
  isCompleted: boolean;
  isPaused: boolean;
  history: PlayerCellState[][][];
  historyIndex: number;
  hintsUsed: number;
  mistakesCount: number;
}

export interface UserHistoryEntry {
  id: string;
  puzzleId: string;
  date: string;
  timestamp: number;
  rows: number;
  cols: number;
  difficulty: Difficulty;
  timeSpentSeconds: number;
  hintsUsed: number;
  status: 'completed' | 'in_progress' | 'given_up';
  // Stores initial clues and final state for reviewing
  puzzle: PuzzleDefinition;
  finalBoard?: number[][];
}

export interface UserProfile {
  id: string;
  name: string;
  avatarSeed: string;
  createdAt: number;
  stats: {
    totalPlayed: number;
    totalCompleted: number;
    bestTimeByDifficulty: Record<Difficulty, number | null>;
    averageTimeByDifficulty: Record<Difficulty, number | null>;
    currentStreak: number;
    bestStreak: number;
  };
  history: UserHistoryEntry[];
  savedActiveGame?: ActiveGameState | null;
}

export interface HintResult {
  r: number;
  c: number;
  value: number;
  reason: string;
  technique: 'naked_single' | 'hidden_single' | 'cage_elimination' | 'neighbor_conflict' | 'reveal';
}
