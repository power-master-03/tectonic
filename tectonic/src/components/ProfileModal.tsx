import React, { useState } from 'react';
import {
  User,
  Trophy,
  History,
  Download,
  Upload,
  Plus,
  Clock,
  Flame,
  CheckCircle,
  X,
  Play,
  RotateCcw
} from 'lucide-react';
import { Difficulty, PuzzleDefinition, UserProfile } from '../types';
import {
  exportAllDataAsJson,
  getActiveProfile,
  importAllDataFromJson,
  loadProfiles,
  saveProfiles,
  setActiveProfileId,
  updateActiveProfile
} from '../storage/profileStorage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPuzzleFromHistory: (puzzle: PuzzleDefinition) => void;
  onProfileChanged: () => void;
}

function formatSeconds(secs: number | null): string {
  if (secs === null || secs === undefined) return '--:--';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onLoadPuzzleFromHistory,
  onProfileChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'profiles'>('stats');
  const [profile, setProfile] = useState<UserProfile>(getActiveProfile());
  const [profilesList, setProfilesList] = useState<UserProfile[]>(loadProfiles());
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(profile.name);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshData = () => {
    setProfile(getActiveProfile());
    setProfilesList(loadProfiles());
    onProfileChanged();
  };

  const handleSaveName = () => {
    if (!editedName.trim()) return;
    updateActiveProfile(p => ({ ...p, name: editedName.trim() }));
    setIsEditingName(false);
    refreshData();
  };

  const handleSwitchProfile = (id: string) => {
    setActiveProfileId(id);
    refreshData();
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const newId = `user-${Date.now()}`;
    const newProf: UserProfile = {
      id: newId,
      name: newProfileName.trim(),
      avatarSeed: 'seed',
      createdAt: Date.now(),
      stats: {
        totalPlayed: 0,
        totalCompleted: 0,
        bestTimeByDifficulty: { easy: null, medium: null, hard: null, expert: null },
        averageTimeByDifficulty: { easy: null, medium: null, hard: null, expert: null },
        currentStreak: 0,
        bestStreak: 0
      },
      history: [],
      savedActiveGame: null
    };

    const all = loadProfiles();
    all.push(newProf);
    saveProfiles(all);
    setActiveProfileId(newId);
    setNewProfileName('');
    refreshData();
    setActiveTab('stats');
  };

  const handleExportJson = () => {
    const json = exportAllDataAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suguru-profile-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importAllDataFromJson(content);
        if (ok) {
          setStatusMessage('Profile data successfully imported!');
          setTimeout(() => setStatusMessage(null), 3000);
          refreshData();
        } else {
          setStatusMessage('Failed to import: invalid JSON format');
          setTimeout(() => setStatusMessage(null), 3000);
        }
      }
    };
    reader.readAsText(file);
  };

  const winRate =
    profile.stats.totalPlayed > 0
      ? Math.round((profile.stats.totalCompleted / profile.stats.totalPlayed) * 100)
      : 0;

  return (
    <div
      id="profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    className="px-2 py-1 text-sm border border-slate-300 rounded-md font-semibold text-slate-800"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="px-2 py-1 text-xs bg-blue-600 text-white font-medium rounded-md cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(profile.name);
                      setIsEditingName(true);
                    }}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Personal Kemaru & Suguru Puzzle Tracker
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-1.5" />
            Statistics & Records
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4 inline mr-1.5" />
            Puzzle History ({profile.history.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profiles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 inline mr-1.5" />
            Profiles & Backup
          </button>
        </div>

        {/* Notification banner */}
        {statusMessage && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold">
            {statusMessage}
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Overview Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-900">
                    {profile.stats.totalCompleted}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Solved
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-900">{winRate}%</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Completion Rate
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5 text-amber-500" />
                    {profile.stats.currentStreak}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Current Streak
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-2xl font-black text-indigo-600">
                    {profile.stats.bestStreak}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Best Streak
                  </div>
                </div>
              </div>

              {/* Best & Average Times by Difficulty */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Time Records by Difficulty
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(diff => (
                    <div
                      key={diff}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-sm uppercase text-slate-800">
                          {diff}
                        </span>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Avg: {formatSeconds(profile.stats.averageTimeByDifficulty[diff])}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Best Time</div>
                        <div className="text-base font-extrabold text-blue-600">
                          {formatSeconds(profile.stats.bestTimeByDifficulty[diff])}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {profile.history.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No played puzzles in history yet.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Play or solve a puzzle to log it here!
                  </p>
                </div>
              ) : (
                profile.history.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-3 shadow-2xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          item.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {item.rows}×{item.cols}
                          </span>
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-sm text-slate-700 border border-slate-200">
                            {item.difficulty}
                          </span>
                          <span className="text-xs text-slate-400">{item.date}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Time: <span className="font-medium text-slate-700">{formatSeconds(item.timeSpentSeconds)}</span> • Hints: {item.hintsUsed}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onLoadPuzzleFromHistory(item.puzzle);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-blue-600" />
                      Replay
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="space-y-6">
              {/* Profile list */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Active User Profile
                </h3>
                <div className="space-y-2">
                  {profilesList.map(p => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        p.id === profile.id
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{p.name}</div>
                          <div className="text-xs text-slate-500">
                            {p.stats.totalCompleted} solved • {p.history.length} games
                          </div>
                        </div>
                      </div>

                      {p.id === profile.id ? (
                        <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-blue-100 rounded-md">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchProfile(p.id)}
                          className="text-xs font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Create new profile */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Create New Profile
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter player name..."
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateProfile}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>

              {/* Export / Import Backup (ideal for personal GitHub Pages use) */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Backup & Portability (GitHub Pages Friendly)
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Save all your puzzle records and profiles to a JSON file to transfer between devices or browsers.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    Export Data (JSON)
                  </button>

                  <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-xs cursor-pointer">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Import Data (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
