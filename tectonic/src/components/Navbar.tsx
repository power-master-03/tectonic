import React from 'react';
import {
  Grid,
  Printer,
  User,
  HelpCircle,
  Sparkles,
  Palette,
  FileDown,
  Flame,
  ChevronDown
} from 'lucide-react';
import { Difficulty, GRID_PRESETS, GridSize, UserProfile } from '../types';

interface NavbarProps {
  currentDifficulty: Difficulty;
  currentSize: GridSize;
  showColorCages: boolean;
  activeProfile: UserProfile;
  onSelectDifficulty: (diff: Difficulty) => void;
  onSelectSize: (size: GridSize) => void;
  onNewPuzzle: () => void;
  onToggleColorCages: () => void;
  onOpenBatchPrint: () => void;
  onOpenProfile: () => void;
  onOpenHowToPlay: () => void;
  onExportSinglePdf: () => void;
  isGenerating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDifficulty,
  currentSize,
  showColorCages,
  activeProfile,
  onSelectDifficulty,
  onSelectSize,
  onNewPuzzle,
  onToggleColorCages,
  onOpenBatchPrint,
  onOpenProfile,
  onOpenHowToPlay,
  onExportSinglePdf,
  isGenerating,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black shadow-xs tracking-tighter">
            <span className="text-base">5</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                Kemaru <span className="text-blue-600 font-extrabold">• Suguru</span>
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-sm border border-slate-200 uppercase hidden sm:inline">
                Tectonic
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
              Generator, Solver & Print Engine
            </p>
          </div>
        </div>

        {/* Puzzle Quick Configurations */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Grid Size dropdown */}
          <div className="relative">
            <select
              value={`${currentSize.rows}x${currentSize.cols}`}
              onChange={e => {
                const found = GRID_PRESETS.find(
                  p => `${p.rows}x${p.cols}` === e.target.value
                );
                if (found) onSelectSize(found);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-bold py-1.5 pl-2.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {GRID_PRESETS.map(preset => (
                <option key={preset.label} value={`${preset.rows}x${preset.cols}`}>
                  {preset.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Difficulty dropdown */}
          <div className="relative">
            <select
              value={currentDifficulty}
              onChange={e => onSelectDifficulty(e.target.value as Difficulty)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-bold py-1.5 pl-2.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* New Puzzle Button */}
          <button
            type="button"
            onClick={onNewPuzzle}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Color Cages Toggle */}
          <button
            type="button"
            onClick={onToggleColorCages}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              showColorCages
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={showColorCages ? 'Switch to Monochrome Paper Style' : 'Switch to Pastel Colored Cages'}
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Export single PDF */}
          <button
            type="button"
            onClick={onExportSinglePdf}
            className="p-1.5 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Download this board as PDF"
          >
            <FileDown className="w-4 h-4 text-rose-500" />
          </button>

          {/* Batch Print Button */}
          <button
            type="button"
            onClick={onOpenBatchPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Generate and print multiple grids"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Batch Print</span>
          </button>

          {/* How to Play Guide */}
          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="How to Play & Rules"
          >
            <HelpCircle className="w-4.5 h-4.5" />
          </button>

          {/* User Profile Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
          >
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
              {activeProfile.name.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[70px] truncate hidden sm:inline">{activeProfile.name}</span>
            {activeProfile.stats.currentStreak > 0 && (
              <span className="flex items-center text-amber-600 font-bold text-[10px]">
                <Flame className="w-3 h-3 fill-amber-500" />
                {activeProfile.stats.currentStreak}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
