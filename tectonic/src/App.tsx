import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  FileDown
} from 'lucide-react';
import {
  ActiveGameState,
  Difficulty,
  GRID_PRESETS,
  GridSize,
  HintResult,
  PlayerCellState,
  PuzzleDefinition,
  UserProfile
} from './types';
import { generatePuzzle } from './logic/gridGenerator';
import { findBoardConflicts, getCageMap, getSmartHint } from './logic/solver';
import { exportPuzzlesToPdf } from './logic/pdfExport';
import {
  getActiveProfile,
  recordGameFinished,
  saveActiveGameToProfile
} from './storage/profileStorage';
import { Navbar } from './components/Navbar';
import { PuzzleBoard } from './components/PuzzleBoard';
import { GameControls } from './components/GameControls';
import { BatchPrintModal } from './components/BatchPrintModal';
import { ProfileModal } from './components/ProfileModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PrintSheetView } from './components/PrintSheetView';

function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function App() {
  // Navigation & Preferences State
  const [currentSize, setCurrentSize] = useState<GridSize>(GRID_PRESETS[1]); // 6x6
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium');
  const [showColorCages, setShowColorCages] = useState<boolean>(true);
  const [activeProfile, setActiveProfile] = useState<UserProfile>(getActiveProfile());

  // Modals
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);

  // Batch print cached data
  const [batchPuzzles, setBatchPuzzles] = useState<PuzzleDefinition[]>([]);
  const [batchLayout, setBatchLayout] = useState<1 | 2 | 4>(2);
  const [batchIncludeSolutions, setBatchIncludeSolutions] = useState<boolean>(true);

  // Active Game State
  const [puzzle, setPuzzle] = useState<PuzzleDefinition | null>(null);
  const [board, setBoard] = useState<PlayerCellState[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [mistakesCount, setMistakesCount] = useState<number>(0);

  // History for Undo / Redo
  const [history, setHistory] = useState<PlayerCellState[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Hint feedback & alerts
  const [activeHint, setActiveHint] = useState<HintResult | null>(null);
  const [hintCell, setHintCell] = useState<{ r: number; c: number } | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Initialize or resume game
  const initBoardFromPuzzle = (puz: PuzzleDefinition, savedState?: ActiveGameState | null) => {
    if (savedState && savedState.puzzle.id === puz.id) {
      setBoard(savedState.board);
      setElapsedSeconds(savedState.elapsedSeconds || 0);
      setIsCompleted(savedState.isCompleted || false);
      setHistory(savedState.history || [savedState.board]);
      setHistoryIndex(savedState.historyIndex || 0);
      setHintsUsed(savedState.hintsUsed || 0);
      setMistakesCount(savedState.mistakesCount || 0);
      return;
    }

    const initialBoard: PlayerCellState[][] = Array.from({ length: puz.rows }, (_, r) =>
      Array.from({ length: puz.cols }, (_, c) => {
        const val = puz.clues[r][c];
        return {
          value: val,
          notes: [],
          isClue: val > 0,
          isError: false
        };
      })
    );

    setBoard(initialBoard);
    setElapsedSeconds(0);
    setIsCompleted(false);
    setHistory([initialBoard]);
    setHistoryIndex(0);
    setHintsUsed(0);
    setMistakesCount(0);
    setSelectedCell(null);
    setActiveHint(null);
    setHintCell(null);
  };

  const createNewGame = useCallback((size: GridSize, diff: Difficulty) => {
    setIsGenerating(true);
    setStatusNotification('Generating and verifying puzzle...');
    setTimeout(() => {
      const newPuzzle = generatePuzzle(size.rows, size.cols, diff);
      setPuzzle(newPuzzle);
      initBoardFromPuzzle(newPuzzle);
      setIsGenerating(false);
      setStatusNotification(null);
    }, 40);
  }, []);

  // Initial load: restore active game or generate fresh
  useEffect(() => {
    const prof = getActiveProfile();
    setActiveProfile(prof);

    if (prof.savedActiveGame && !prof.savedActiveGame.isCompleted) {
      setPuzzle(prof.savedActiveGame.puzzle);
      setCurrentSize({
        rows: prof.savedActiveGame.puzzle.rows,
        cols: prof.savedActiveGame.puzzle.cols,
        label: `${prof.savedActiveGame.puzzle.rows} × ${prof.savedActiveGame.puzzle.cols}`
      });
      setCurrentDifficulty(prof.savedActiveGame.puzzle.difficulty);
      initBoardFromPuzzle(prof.savedActiveGame.puzzle, prof.savedActiveGame);
    } else {
      createNewGame(currentSize, currentDifficulty);
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (isPaused || isCompleted || !puzzle || isBatchPrintOpen || isProfileOpen || isHowToPlayOpen) {
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isCompleted, puzzle, isBatchPrintOpen, isProfileOpen, isHowToPlayOpen]);

  // Auto-save active game to profile
  useEffect(() => {
    if (!puzzle || isCompleted) return;
    const activeState: ActiveGameState = {
      puzzle,
      board,
      elapsedSeconds,
      isCompleted,
      isPaused,
      history,
      historyIndex,
      hintsUsed,
      mistakesCount
    };
    saveActiveGameToProfile(activeState);
  }, [puzzle, board, elapsedSeconds, isCompleted, isPaused, history, historyIndex, hintsUsed, mistakesCount]);

  // Check victory condition
  const checkVictory = (currentBoard: PlayerCellState[][], puz: PuzzleDefinition) => {
    // All cells must be filled correctly
    for (let r = 0; r < puz.rows; r++) {
      for (let c = 0; c < puz.cols; c++) {
        if (currentBoard[r][c].value !== puz.solution[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  // Push new board state to undo history
  const pushBoardState = (newBoard: PlayerCellState[][]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBoard);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setBoard(newBoard);

    if (puzzle && checkVictory(newBoard, puzzle)) {
      setIsCompleted(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      recordGameFinished({
        puzzleId: puzzle.id,
        rows: puzzle.rows,
        cols: puzzle.cols,
        difficulty: puzzle.difficulty,
        timeSpentSeconds: elapsedSeconds,
        hintsUsed,
        status: 'completed',
        puzzle,
        finalBoard: newBoard.map(row => row.map(c => c.value))
      });
      setActiveProfile(getActiveProfile());
    }
  };

  // User input handling (numbers 1-5)
  const handleNumberInput = (num: number) => {
    if (!selectedCell || !puzzle || isCompleted) return;
    const { r, c } = selectedCell;
    const cell = board[r][c];
    if (cell.isClue) return; // Cannot modify given clue

    if (isNotesMode) {
      // Toggle note candidate
      const currentNotes = cell.notes || [];
      const newNotes = currentNotes.includes(num)
        ? currentNotes.filter(n => n !== num)
        : [...currentNotes, num].sort();

      const newBoard = board.map((row, rowIdx) =>
        row.map((col, colIdx) => {
          if (rowIdx === r && colIdx === c) {
            return { ...col, notes: newNotes, value: 0 };
          }
          return col;
        })
      );
      pushBoardState(newBoard);
    } else {
      // Direct number entry
      const newValue = cell.value === num ? 0 : num;
      const newBoard = board.map((row, rowIdx) =>
        row.map((col, colIdx) => {
          if (rowIdx === r && colIdx === c) {
            return { ...col, value: newValue, notes: [] };
          }
          return col;
        })
      );
      pushBoardState(newBoard);
    }
  };

  const handleErase = () => {
    if (!selectedCell || !puzzle || isCompleted) return;
    const { r, c } = selectedCell;
    if (board[r][c].isClue) return;

    const newBoard = board.map((row, rowIdx) =>
      row.map((col, colIdx) => {
        if (rowIdx === r && colIdx === c) {
          return { ...col, value: 0, notes: [] };
        }
        return col;
      })
    );
    pushBoardState(newBoard);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setBoard(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setBoard(history[nextIndex]);
    }
  };

  const handleRestart = () => {
    if (!puzzle) return;
    initBoardFromPuzzle(puzzle);
  };

  const handleCheckMistakes = () => {
    if (!puzzle) return;
    let mistakes = 0;
    const newBoard = board.map((row, r) =>
      row.map((cell, c) => {
        if (!cell.isClue && cell.value > 0 && cell.value !== puzzle.solution[r][c]) {
          mistakes++;
          return { ...cell, isError: true };
        }
        return { ...cell, isError: false };
      })
    );

    setBoard(newBoard);
    setMistakesCount(prev => prev + mistakes);

    if (mistakes === 0) {
      setStatusNotification('Great job! No mistakes found on the board.');
    } else {
      setStatusNotification(`Found ${mistakes} incorrect cell${mistakes > 1 ? 's' : ''}.`);
    }
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleHint = () => {
    if (!puzzle || isCompleted) return;
    const rawBoard = board.map(row => row.map(c => c.value));
    const hint = getSmartHint(
      rawBoard,
      puzzle.solution,
      puzzle.rows,
      puzzle.cols,
      puzzle.cages,
      puzzle.cellCageMap
    );

    if (hint) {
      setActiveHint(hint);
      setHintCell({ r: hint.r, c: hint.c });
      setSelectedCell({ r: hint.r, c: hint.c });
      setHintsUsed(prev => prev + 1);
    } else {
      setStatusNotification('All filled cells match the solution!');
      setTimeout(() => setStatusNotification(null), 3000);
    }
  };

  const applyActiveHint = () => {
    if (!activeHint || !puzzle) return;
    const { r, c, value } = activeHint;
    const newBoard = board.map((row, rowIdx) =>
      row.map((col, colIdx) => {
        if (rowIdx === r && colIdx === c) {
          return { ...col, value, notes: [], isError: false };
        }
        return col;
      })
    );
    pushBoardState(newBoard);
    setActiveHint(null);
    setHintCell(null);
  };

  const handleRevealSolution = () => {
    if (!puzzle || isCompleted) return;
    const solvedBoard = board.map((row, r) =>
      row.map((cell, c) => ({
        ...cell,
        value: puzzle.solution[r][c],
        notes: []
      }))
    );
    setBoard(solvedBoard);
    setIsCompleted(true);
    setStatusNotification('Full solution revealed.');
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleExportSinglePdf = () => {
    if (!puzzle) return;
    exportPuzzlesToPdf([puzzle], {
      title: `Suguru / Kemaru Puzzle (${puzzle.rows}×${puzzle.cols})`,
      puzzlesPerPage: 1,
      includeSolutions: true
    });
  };

  const handleMoveSelection = (dr: number, dc: number) => {
    if (!puzzle) return;
    if (!selectedCell) {
      setSelectedCell({ r: 0, c: 0 });
      return;
    }
    const nr = Math.max(0, Math.min(puzzle.rows - 1, selectedCell.r + dr));
    const nc = Math.max(0, Math.min(puzzle.cols - 1, selectedCell.c + dc));
    setSelectedCell({ r: nr, c: nc });
  };

  // Compute live conflicts
  const conflicts = puzzle
    ? findBoardConflicts(
        board.map(r => r.map(c => c.value)),
        puzzle.rows,
        puzzle.cols,
        getCageMap(puzzle.rows, puzzle.cols, puzzle.cages),
        puzzle.cellCageMap
      )
    : new Set<string>();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentDifficulty={currentDifficulty}
        currentSize={currentSize}
        showColorCages={showColorCages}
        activeProfile={activeProfile}
        onSelectDifficulty={diff => {
          setCurrentDifficulty(diff);
          createNewGame(currentSize, diff);
        }}
        onSelectSize={size => {
          setCurrentSize(size);
          createNewGame(size, currentDifficulty);
        }}
        onNewPuzzle={() => createNewGame(currentSize, currentDifficulty)}
        onToggleColorCages={() => setShowColorCages(prev => !prev)}
        onOpenBatchPrint={() => setIsBatchPrintOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onExportSinglePdf={handleExportSinglePdf}
        isGenerating={isGenerating}
      />

      {/* Main Game Stage */}
      <main className="flex-1 flex flex-col items-center justify-start px-3 py-4 sm:py-6 max-w-4xl mx-auto w-full no-print">
        {/* Status notification toast */}
        {statusNotification && (
          <div className="mb-3 px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 animate-fade-in no-print">
            <AlertCircle className="w-4 h-4" />
            <span>{statusNotification}</span>
          </div>
        )}

        {/* Game Header: Stats Bar (Timer, Difficulty, Clues, Pause) */}
        {puzzle && (
          <div className="w-full max-w-md flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs mb-4 no-print">
            <div className="flex items-center gap-2">
              <span className="uppercase text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                {puzzle.difficulty}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {puzzle.rows}×{puzzle.cols}
              </span>
            </div>

            {/* Timer & Pause */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-700 font-mono font-bold text-sm">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaused(p => !p)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5 fill-slate-700" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Hint Explanation Dialog Banner */}
        {activeHint && (
          <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 shadow-sm text-xs text-amber-900 flex flex-col gap-2 no-print">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Logical Deduction Hint</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveHint(null);
                  setHintCell(null);
                }}
                className="text-amber-500 hover:text-amber-800 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-700 leading-relaxed">{activeHint.reason}</p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={applyActiveHint}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
              >
                Fill with {activeHint.value}
              </button>
            </div>
          </div>
        )}

        {/* Victory Celebration Banner */}
        {isCompleted && (
          <div className="w-full max-w-md bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 mb-5 shadow-md text-center no-print">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-emerald-900">Puzzle Solved!</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Completed in <strong className="font-bold">{formatTimer(elapsedSeconds)}</strong> on{' '}
              <span className="uppercase font-bold">{puzzle?.difficulty}</span> mode.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => createNewGame(currentSize, currentDifficulty)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Next Puzzle
              </button>
            </div>
          </div>
        )}

        {/* Active Board */}
        {puzzle && !isPaused ? (
          <div className="w-full flex justify-center mb-6">
            <PuzzleBoard
              puzzle={puzzle}
              board={board}
              selectedCell={selectedCell}
              conflicts={conflicts}
              hintCell={hintCell}
              showColorCages={showColorCages}
              onCellClick={(r, c) => {
                setSelectedCell({ r, c });
                setActiveHint(null);
                setHintCell(null);
              }}
            />
          </div>
        ) : isPaused ? (
          <div className="w-full max-w-md h-64 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-500 mb-6">
            <Pause className="w-10 h-10 text-slate-400" />
            <span className="font-bold text-sm">Game Paused</span>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg cursor-pointer"
            >
              Resume Game
            </button>
          </div>
        ) : null}

        {/* Gamepad / Numpad Controls */}
        <div className="w-full no-print">
          <GameControls
            maxCageSize={5}
            isNotesMode={isNotesMode}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onNumberInput={handleNumberInput}
            onErase={handleErase}
            onToggleNotesMode={() => setIsNotesMode(n => !n)}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onHint={handleHint}
            onCheck={handleCheckMistakes}
            onRevealSolution={handleRevealSolution}
            onRestart={handleRestart}
            onMoveSelection={handleMoveSelection}
            disabled={isCompleted || isPaused}
          />
        </div>
      </main>

      {/* Modals */}
      <BatchPrintModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
        onPuzzlesUpdated={(puzzles, layout, solutions) => {
          setBatchPuzzles(puzzles);
          setBatchLayout(layout);
          setBatchIncludeSolutions(solutions);
        }}
        onSelectPuzzleToPlay={p => {
          setPuzzle(p);
          setCurrentSize({ rows: p.rows, cols: p.cols, label: `${p.rows} × ${p.cols}` });
          setCurrentDifficulty(p.difficulty);
          initBoardFromPuzzle(p);
          setIsBatchPrintOpen(false);
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileChanged={() => setActiveProfile(getActiveProfile())}
        onLoadPuzzleFromHistory={p => {
          setPuzzle(p);
          setCurrentSize({ rows: p.rows, cols: p.cols, label: `${p.rows} × ${p.cols}` });
          setCurrentDifficulty(p.difficulty);
          initBoardFromPuzzle(p);
        }}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* Clean Paper Printable Output Container */}
      <div className="print-only">
        {batchPuzzles.length > 0 ? (
          <PrintSheetView
            puzzles={batchPuzzles}
            layout={batchLayout}
            includeSolutions={batchIncludeSolutions}
          />
        ) : puzzle ? (
          <PrintSheetView
            puzzles={[puzzle]}
            layout={1}
            includeSolutions={true}
          />
        ) : null}
      </div>
    </div>
  );
}
