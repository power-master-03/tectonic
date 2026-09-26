import React, { useEffect } from 'react';
import {
  RotateCcw,
  Undo2,
  Redo2,
  Lightbulb,
  Eraser,
  Pencil,
  CheckCircle2,
  Eye
} from 'lucide-react';

interface GameControlsProps {
  maxCageSize?: number;
  isNotesMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onNumberInput: (num: number) => void;
  onErase: () => void;
  onToggleNotesMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
  onCheck: () => void;
  onRevealSolution: () => void;
  onRestart: () => void;
  onMoveSelection?: (dr: number, dc: number) => void;
  disabled?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  maxCageSize = 5,
  isNotesMode,
  canUndo,
  canRedo,
  onNumberInput,
  onErase,
  onToggleNotesMode,
  onUndo,
  onRedo,
  onHint,
  onCheck,
  onRevealSolution,
  onRestart,
  onMoveSelection,
  disabled = false,
}) => {
  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      // Prevent handling if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key;

      if (['1', '2', '3', '4', '5'].includes(key)) {
        const num = parseInt(key, 10);
        if (num <= maxCageSize) {
          onNumberInput(num);
        }
      } else if (key === 'Backspace' || key === 'Delete') {
        onErase();
      } else if (key === 'n' || key === 'N') {
        onToggleNotesMode();
      } else if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (canRedo) onRedo();
        } else {
          if (canUndo) onUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'y') {
        if (canRedo) onRedo();
      } else if (key === 'h' || key === 'H') {
        onHint();
      } else if (onMoveSelection) {
        if (key === 'ArrowUp') {
          e.preventDefault();
          onMoveSelection(-1, 0);
        } else if (key === 'ArrowDown') {
          e.preventDefault();
          onMoveSelection(1, 0);
        } else if (key === 'ArrowLeft') {
          e.preventDefault();
          onMoveSelection(0, -1);
        } else if (key === 'ArrowRight') {
          e.preventDefault();
          onMoveSelection(0, 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    disabled,
    maxCageSize,
    canUndo,
    canRedo,
    onNumberInput,
    onErase,
    onToggleNotesMode,
    onUndo,
    onRedo,
    onHint,
    onMoveSelection
  ]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 select-none">
      {/* Action Toolbar: Undo, Redo, Notes Mode, Erase, Hint, Check */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 px-2 py-2 bg-slate-100/90 rounded-xl border border-slate-200">
        <button
          id="btn-undo"
          type="button"
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            canUndo && !disabled
              ? 'text-slate-700 hover:bg-white hover:shadow-xs cursor-pointer'
              : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden xs:inline">Undo</span>
        </button>

        <button
          id="btn-redo"
          type="button"
          onClick={onRedo}
          disabled={!canRedo || disabled}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            canRedo && !disabled
              ? 'text-slate-700 hover:bg-white hover:shadow-xs cursor-pointer'
              : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
          <span className="hidden xs:inline">Redo</span>
        </button>

        <button
          id="btn-notes-mode"
          type="button"
          onClick={onToggleNotesMode}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            isNotesMode
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white hover:shadow-xs'
          }`}
          title="Toggle pencil notes (N)"
        >
          <Pencil className="w-4 h-4" />
          <span>Notes {isNotesMode ? 'ON' : 'OFF'}</span>
        </button>

        <button
          id="btn-erase"
          type="button"
          onClick={onErase}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
          title="Erase cell (Backspace)"
        >
          <Eraser className="w-4 h-4 text-slate-500" />
          <span className="hidden xs:inline">Erase</span>
        </button>

        <button
          id="btn-hint"
          type="button"
          onClick={onHint}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-amber-700 hover:bg-amber-50 hover:shadow-xs transition-colors"
          title="Get a logical deduction hint (H)"
        >
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Hint</span>
        </button>
      </div>

      {/* Primary Number Pad (1 to 5) */}
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            id={`btn-numpad-${num}`}
            type="button"
            onClick={() => onNumberInput(num)}
            disabled={disabled}
            className="flex flex-col items-center justify-center h-13 sm:h-15 rounded-xl bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-900 active:scale-95 shadow-sm transition-all text-xl sm:text-2xl font-bold cursor-pointer"
          >
            <span>{num}</span>
            {isNotesMode && (
              <span className="text-[10px] text-blue-500 font-medium leading-none -mt-1">
                note
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Secondary Controls: Check, Restart, Solution */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          id="btn-check"
          type="button"
          onClick={onCheck}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Check Mistakes
        </button>

        <button
          id="btn-restart"
          type="button"
          onClick={onRestart}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          Restart Board
        </button>

        <button
          id="btn-solution"
          type="button"
          onClick={onRevealSolution}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          Reveal Solution
        </button>
      </div>
    </div>
  );
};
