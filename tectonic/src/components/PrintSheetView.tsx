import React from 'react';
import { PuzzleDefinition } from '../types';

interface PrintSheetViewProps {
  puzzles: PuzzleDefinition[];
  layout: 1 | 2 | 4;
  includeSolutions: boolean;
}

export const PrintSheetView: React.FC<PrintSheetViewProps> = ({
  puzzles,
  layout,
  includeSolutions,
}) => {
  const pagesCount = Math.ceil(puzzles.length / layout);

  return (
    <div id="print-sheet-root" className="bg-white text-slate-900 p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Puzzles Pages */}
      {Array.from({ length: pagesCount }).map((_, pageIdx) => {
        const pagePuzzles = puzzles.slice(pageIdx * layout, pageIdx * layout + layout);

        return (
          <div
            key={`page-${pageIdx}`}
            className={`min-h-[1050px] p-6 flex flex-col justify-between ${
              pageIdx > 0 ? 'page-break-before' : ''
            }`}
          >
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  SUGURU • KEMARU • TECTONIC
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Rules: Each block of size N contains numbers 1..N. Identical numbers cannot touch, even diagonally.
                </p>
              </div>
              <div className="text-right text-xs font-semibold text-slate-500">
                Page {pageIdx + 1}
              </div>
            </div>

            {/* Grids Container */}
            <div
              className={`grid gap-8 items-center justify-items-center flex-1 ${
                layout === 1
                  ? 'grid-cols-1'
                  : layout === 2
                  ? 'grid-cols-1 md:grid-cols-1 gap-12'
                  : 'grid-cols-2 gap-8'
              }`}
            >
              {pagePuzzles.map((puzzle, pIdx) => {
                const puzzleGlobalNum = pageIdx * layout + pIdx + 1;
                return (
                  <div
                    key={puzzle.id}
                    className="flex flex-col items-center avoid-break w-full max-w-sm"
                  >
                    <div className="w-full flex justify-between items-center text-xs font-bold text-slate-800 mb-2 px-1">
                      <span>Puzzle #{puzzleGlobalNum}</span>
                      <span className="uppercase text-[11px] px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-sm">
                        {puzzle.difficulty} ({puzzle.rows}×{puzzle.cols})
                      </span>
                    </div>

                    <PrintGrid puzzle={puzzle} isSolution={false} />
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
              Personal Puzzle Collection • Generated with Suguru Tectonic Puzzle Engine
            </div>
          </div>
        );
      })}

      {/* Solutions Pages */}
      {includeSolutions && (
        <div className="page-break-before pt-6">
          <div className="border-b-2 border-slate-900 pb-3 mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                SOLUTIONS & ANSWER KEYS
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Complete verified solution grids for all puzzles in this booklet.
              </p>
            </div>
            <div className="text-right text-xs font-semibold text-slate-500">
              Answer Key
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {puzzles.map((puzzle, idx) => (
              <div key={`sol-${puzzle.id}`} className="flex flex-col items-center avoid-break">
                <div className="text-xs font-bold text-slate-700 mb-1">
                  Solution #{idx + 1} ({puzzle.difficulty.slice(0, 4).toUpperCase()})
                </div>
                <PrintGrid puzzle={puzzle} isSolution={true} isCompact={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PrintGridProps {
  puzzle: PuzzleDefinition;
  isSolution?: boolean;
  isCompact?: boolean;
}

const PrintGrid: React.FC<PrintGridProps> = ({
  puzzle,
  isSolution = false,
  isCompact = false,
}) => {
  const { rows, cols, cellCageMap, clues, solution } = puzzle;

  return (
    <div
      className="bg-white border-2 border-slate-900 shadow-xs inline-block"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const cageId = cellCageMap[r][c];
          const val = isSolution ? solution[r][c] : clues[r][c];
          const isGivenClue = clues[r][c] > 0;

          const topSame = r > 0 && cellCageMap[r - 1][c] === cageId;
          const bottomSame = r < rows - 1 && cellCageMap[r + 1][c] === cageId;
          const leftSame = c > 0 && cellCageMap[r][c - 1] === cageId;
          const rightSame = c < cols - 1 && cellCageMap[r][c + 1] === cageId;

          const borderTop = topSame ? 'border-t border-slate-300' : 'border-t-2 border-slate-900';
          const borderBottom = bottomSame ? 'border-b border-slate-300' : 'border-b-2 border-slate-900';
          const borderLeft = leftSame ? 'border-l border-slate-300' : 'border-l-2 border-slate-900';
          const borderRight = rightSame ? 'border-r border-slate-300' : 'border-r-2 border-slate-900';

          const sizeClasses = isCompact
            ? 'w-7 h-7 sm:w-8 sm:h-8 text-xs'
            : 'w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg';

          return (
            <div
              key={`${r}-${c}`}
              className={`flex items-center justify-center font-bold select-none ${sizeClasses} ${borderTop} ${borderBottom} ${borderLeft} ${borderRight} ${
                isSolution && !isGivenClue ? 'text-slate-500 font-medium' : 'text-slate-900'
              }`}
            >
              {val > 0 ? val : ''}
            </div>
          );
        })
      )}
    </div>
  );
};
