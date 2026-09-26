import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  X,
  Sparkles,
  Layers,
  Settings2,
  Check,
  Eye,
  Loader2
} from 'lucide-react';
import { Difficulty, GRID_PRESETS, PuzzleDefinition } from '../types';
import { generatePuzzle } from '../logic/gridGenerator';
import { exportPuzzlesToPdf } from '../logic/pdfExport';
import { PrintSheetView } from './PrintSheetView';

interface BatchPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPuzzleToPlay?: (puzzle: PuzzleDefinition) => void;
  onPuzzlesUpdated?: (puzzles: PuzzleDefinition[], layout: 1 | 2 | 4, includeSolutions: boolean) => void;
}

export const BatchPrintModal: React.FC<BatchPrintModalProps> = ({
  isOpen,
  onClose,
  onSelectPuzzleToPlay,
  onPuzzlesUpdated,
}) => {
  const [count, setCount] = useState<number>(4);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(1); // 6x6 default
  const [difficultyChoice, setDifficultyChoice] = useState<Difficulty | 'mixed'>('medium');
  const [layoutChoice, setLayoutChoice] = useState<1 | 2 | 4>(2);
  const [includeSolutions, setIncludeSolutions] = useState<boolean>(true);

  const [generatedPuzzles, setGeneratedPuzzles] = useState<PuzzleDefinition[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'configure' | 'preview'>('configure');

  if (!isOpen) return null;

  const currentPreset = GRID_PRESETS[selectedSizeIndex];

  const handleGenerate = () => {
    setIsGenerating(true);
    // Use timeout to allow UI update with loader
    setTimeout(() => {
      const puzzles: PuzzleDefinition[] = [];
      const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

      for (let i = 0; i < count; i++) {
        let diff: Difficulty;
        if (difficultyChoice === 'mixed') {
          diff = difficulties[i % difficulties.length];
        } else {
          diff = difficultyChoice;
        }

        const p = generatePuzzle(currentPreset.rows, currentPreset.cols, diff);
        puzzles.push(p);
      }

      setGeneratedPuzzles(puzzles);
      setIsGenerating(false);
      setActiveTab('preview');
      if (onPuzzlesUpdated) {
        onPuzzlesUpdated(puzzles, layoutChoice, includeSolutions);
      }
    }, 50);
  };

  const handlePrint = () => {
    if (onPuzzlesUpdated) {
      onPuzzlesUpdated(generatedPuzzles, layoutChoice, includeSolutions);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportPdf = () => {
    if (generatedPuzzles.length === 0) return;
    exportPuzzlesToPdf(generatedPuzzles, {
      title: `Suguru / Kemaru Puzzle Collection (${currentPreset.label})`,
      puzzlesPerPage: layoutChoice,
      includeSolutions,
    });
  };

  return (
    <div
      id="batch-print-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Batch Generate & Print / PDF
              </h2>
              <p className="text-xs text-slate-500">
                Generate multiple solvable Kemaru / Suguru grids at once for printing or offline play.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher if puzzles are generated */}
        {generatedPuzzles.length > 0 && (
          <div className="flex border-b border-slate-200 px-6 bg-white no-print">
            <button
              type="button"
              onClick={() => setActiveTab('configure')}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'configure'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings2 className="w-4 h-4 inline mr-1.5" />
              Settings & Options
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1.5" />
              Preview Grids ({generatedPuzzles.length})
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'configure' || generatedPuzzles.length === 0 ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Count selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Number of Puzzles to Generate
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[2, 4, 6, 8, 12].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                        count === num
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {num} grids
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Size */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Grid Dimensions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GRID_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSelectedSizeIndex(idx)}
                      className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                        selectedSizeIndex === idx
                          ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">{preset.label}</div>
                      <div className="text-[11px] text-slate-500">
                        {preset.rows * preset.cols} cells
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Difficulty
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'easy', label: 'Easy' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'hard', label: 'Hard' },
                    { id: 'expert', label: 'Expert' },
                    { id: 'mixed', label: 'Mixed Mix' },
                  ].map(diff => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setDifficultyChoice(diff.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                        difficultyChoice === diff.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout & Solutions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Print Page Layout
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 1, label: '1 / Page' },
                      { val: 2, label: '2 / Page' },
                      { val: 4, label: '4 / Page' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setLayoutChoice(opt.val as any)}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          layoutChoice === opt.val
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Solutions & Answer Keys
                  </label>
                  <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/60">
                    <input
                      type="checkbox"
                      checked={includeSolutions}
                      onChange={e => setIncludeSolutions(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-800">
                      Include answer keys on separate solution pages
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating and Verifying Unique Solvability...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate {count} Puzzles Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 rounded-xl">
                <div className="text-xs font-medium text-slate-700">
                  <span className="font-bold text-slate-900">{generatedPuzzles.length}</span>{' '}
                  puzzles ready • {layoutChoice} per page •{' '}
                  {includeSolutions ? 'With Solutions' : 'No Solutions'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-800 hover:text-blue-600 font-semibold text-xs rounded-lg border border-slate-300 shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-rose-500" />
                    Download PDF
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print Now
                  </button>
                </div>
              </div>

              {/* Printable sheet preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-100 p-2 sm:p-4 max-h-[500px] overflow-y-auto">
                <PrintSheetView
                  puzzles={generatedPuzzles}
                  layout={layoutChoice}
                  includeSolutions={includeSolutions}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Printable format works with standard A4 / Letter paper.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
