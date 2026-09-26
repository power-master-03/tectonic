import React from 'react';
import { Cage, PlayerCellState, PuzzleDefinition } from '../types';

interface PuzzleBoardProps {
  puzzle: PuzzleDefinition;
  board: PlayerCellState[][];
  selectedCell: { r: number; c: number } | null;
  conflicts: Set<string>;
  highlightedCell?: { r: number; c: number } | null;
  hintCell?: { r: number; c: number } | null;
  showColorCages?: boolean;
  onCellClick: (r: number, c: number) => void;
  isReadOnly?: boolean;
}

// Harmonious soft pastel colors for polyomino cages
const CAGE_BG_COLORS = [
  'bg-amber-50/70 hover:bg-amber-100/70',
  'bg-sky-50/70 hover:bg-sky-100/70',
  'bg-emerald-50/70 hover:bg-emerald-100/70',
  'bg-rose-50/70 hover:bg-rose-100/70',
  'bg-indigo-50/70 hover:bg-indigo-100/70',
  'bg-teal-50/70 hover:bg-teal-100/70',
  'bg-violet-50/70 hover:bg-violet-100/70',
  'bg-orange-50/70 hover:bg-orange-100/70',
];

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  puzzle,
  board,
  selectedCell,
  conflicts,
  highlightedCell,
  hintCell,
  showColorCages = true,
  onCellClick,
  isReadOnly = false,
}) => {
  const { rows, cols, cellCageMap, cages } = puzzle;

  // Selected cell value for highlighting all matching numbers
  const selectedVal = selectedCell ? board[selectedCell.r]?.[selectedCell.c]?.value : 0;
  const selectedCageId = selectedCell ? cellCageMap[selectedCell.r]?.[selectedCell.c] : -1;

  // Find the top-left cell of each cage to optionally display cage size badge
  const cageTopLeftMap = new Map<number, string>();
  cages.forEach((cage: Cage) => {
    let best = cage.cells[0];
    for (const cell of cage.cells) {
      if (cell.r < best.r || (cell.r === best.r && cell.c < best.c)) {
        best = cell;
      }
    }
    cageTopLeftMap.set(cage.id, `${best.r},${best.c}`);
  });

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div
        id="suguru-puzzle-grid"
        className="relative bg-white shadow-md rounded-lg overflow-hidden border-2 border-slate-900 inline-block max-w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const cellState = board[r]?.[c] || { value: 0, notes: [], isClue: false };
            const cageId = cellCageMap[r][c];
            const cage = cages.find(cg => cg.id === cageId);
            const cageSize = cage?.size || 5;
            const isCageOrigin = cageTopLeftMap.get(cageId) === `${r},${c}`;

            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
            const isMatchingVal = selectedVal > 0 && cellState.value === selectedVal;
            const isInSelectedCage = selectedCageId === cageId;
            const isConflict = conflicts.has(`${r},${c}`);
            const isHint = hintCell?.r === r && hintCell?.c === c;
            const isHighlighted = highlightedCell?.r === r && highlightedCell?.c === c;

            // Compute border styles depending on adjacent cells' cage
            const topSameCage = r > 0 && cellCageMap[r - 1][c] === cageId;
            const bottomSameCage = r < rows - 1 && cellCageMap[r + 1][c] === cageId;
            const leftSameCage = c > 0 && cellCageMap[r][c - 1] === cageId;
            const rightSameCage = c < cols - 1 && cellCageMap[r][c + 1] === cageId;

            // Cage border: thick (border-2 / border-slate-900), intra-cage border: thin dashed/light
            const borderTop = topSameCage ? 'border-t border-dashed border-slate-300' : 'border-t-2 border-slate-900';
            const borderBottom = bottomSameCage ? 'border-b border-dashed border-slate-300' : 'border-b-2 border-slate-900';
            const borderLeft = leftSameCage ? 'border-l border-dashed border-slate-300' : 'border-l-2 border-slate-900';
            const borderRight = rightSameCage ? 'border-r border-dashed border-slate-300' : 'border-r-2 border-slate-900';

            // Background color computation
            let bgClass = 'bg-white hover:bg-slate-50';
            if (showColorCages) {
              const colorIdx = cage?.colorIndex ?? (cageId % CAGE_BG_COLORS.length);
              bgClass = CAGE_BG_COLORS[colorIdx];
            }

            if (isInSelectedCage && !isSelected) {
              bgClass = showColorCages ? 'bg-indigo-100/60' : 'bg-slate-100';
            }

            if (isMatchingVal && !isSelected) {
              bgClass = 'bg-amber-100/90 text-amber-900 font-semibold';
            }

            if (isSelected) {
              bgClass = 'bg-blue-100 ring-2 ring-blue-600 ring-inset z-10';
            }

            if (isHint) {
              bgClass = 'bg-emerald-100 ring-2 ring-emerald-500 ring-inset animate-pulse z-10';
            }

            if (isConflict) {
              bgClass = 'bg-red-100 ring-2 ring-red-500 ring-inset text-red-700 z-10';
            }

            return (
              <button
                key={`${r}-${c}`}
                id={`cell-${r}-${c}`}
                type="button"
                disabled={isReadOnly}
                onClick={() => onCellClick(r, c)}
                className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transition-colors duration-150 cursor-pointer focus:outline-none ${borderTop} ${borderBottom} ${borderLeft} ${borderRight} ${bgClass}`}
                aria-label={`Row ${r + 1}, Column ${c + 1}, Cage ${cageId}, Value ${cellState.value || 'empty'}`}
              >
                {/* Tiny Cage Size Indicator on top-left of cage's anchor cell */}
                {isCageOrigin && (
                  <span className="absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-semibold text-slate-400 select-none leading-none pointer-events-none">
                    {cageSize}
                  </span>
                )}

                {/* Primary Number display */}
                {cellState.value > 0 ? (
                  <span
                    className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight select-none ${
                      cellState.isClue
                        ? 'text-slate-900'
                        : isConflict
                        ? 'text-red-600'
                        : 'text-blue-600 font-extrabold'
                    }`}
                  >
                    {cellState.value}
                  </span>
                ) : cellState.notes && cellState.notes.length > 0 ? (
                  /* Pencil Marks / Notes 3x2 Mini Grid */
                  <div className="grid grid-cols-3 gap-0.5 w-full h-full p-1 pointer-events-none items-center justify-items-center">
                    {[1, 2, 3, 4, 5].map(num => (
                      <span
                        key={num}
                        className={`text-[9px] sm:text-[11px] font-medium leading-none ${
                          cellState.notes.includes(num) ? 'text-slate-600' : 'invisible'
                        }`}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
