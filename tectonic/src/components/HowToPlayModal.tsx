import React from 'react';
import { X, HelpCircle, Check, AlertTriangle, ShieldAlert } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="how-to-play-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                How to Play Kemaru / Suguru / Tectonic
              </h2>
              <p className="text-xs text-slate-500">
                A captivating Japanese polyomino number-placement logic puzzle.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Rule 1 */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Fill each block with numbers 1 to N
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                The grid is divided into thick-bordered blocks (cages) of different sizes (usually from 1 to 5 cells).
                Each block of size <strong className="text-slate-900">N</strong> must contain all numbers from <strong className="text-slate-900">1 to N</strong> with no repeats.
              </p>
              <div className="mt-2 text-xs bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                • A 1-cell block must contain <strong className="text-blue-700">1</strong><br />
                • A 3-cell block contains <strong className="text-blue-700">1, 2, and 3</strong><br />
                • A 5-cell block contains <strong className="text-blue-700">1, 2, 3, 4, and 5</strong>
              </div>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                The 8-Neighbor Adjacency Rule (Crucial!)
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                <strong className="text-rose-600">Two identical numbers cannot touch each other anywhere</strong> — whether horizontally, vertically, OR <strong className="text-rose-600">diagonally</strong>!
              </p>
              <div className="mt-2 text-xs bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  Even across different blocks, if cell (R, C) contains a 3, none of its 8 surrounding neighbor cells can contain a 3.
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Solving Strategy & Tips
              </h3>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-4">
                <li>
                  <strong className="text-slate-800">Naked Singles:</strong> Look for cells surrounded by many filled neighbors. Often only one digit remains valid.
                </li>
                <li>
                  <strong className="text-slate-800">Diagonal Blocking:</strong> A number in one block can eliminate candidate positions in multiple neighboring blocks.
                </li>
                <li>
                  <strong className="text-slate-800">Use Notes (Pencil mode):</strong> Press <span className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">N</span> or click Notes to write down candidates.
                </li>
              </ul>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">1-5</kbd>
                <span>Input number</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">Back / Del</kbd>
                <span>Erase cell</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">Arrows</kbd>
                <span>Move selection</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">N</kbd>
                <span>Toggle Notes</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">Ctrl + Z</kbd>
                <span>Undo</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">H</kbd>
                <span>Hint</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer"
          >
            Got it! Let's Play
          </button>
        </div>
      </div>
    </div>
  );
};
