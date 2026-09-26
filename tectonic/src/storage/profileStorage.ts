import { ActiveGameState, Difficulty, UserHistoryEntry, UserProfile } from '../types';

const STORAGE_KEY_PROFILES = 'suguru_profiles_v1';
const STORAGE_KEY_ACTIVE_PROFILE_ID = 'suguru_active_profile_id_v1';

function createDefaultProfile(id: string = 'default-player', name: string = 'Player 1'): UserProfile {
  return {
    id,
    name,
    avatarSeed: 'avatar-1',
    createdAt: Date.now(),
    stats: {
      totalPlayed: 0,
      totalCompleted: 0,
      bestTimeByDifficulty: {
        easy: null,
        medium: null,
        hard: null,
        expert: null
      },
      averageTimeByDifficulty: {
        easy: null,
        medium: null,
        hard: null,
        expert: null
      },
      currentStreak: 0,
      bestStreak: 0
    },
    history: [],
    savedActiveGame: null
  };
}

export function loadProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (!raw) {
      const initial = [createDefaultProfile()];
      saveProfiles(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const initial = [createDefaultProfile()];
    saveProfiles(initial);
    return initial;
  } catch (err) {
    console.warn('Failed to parse profiles from localStorage', err);
    return [createDefaultProfile()];
  }
}

export function saveProfiles(profiles: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to save profiles to localStorage', err);
  }
}

export function getActiveProfileId(): string {
  const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE_ID);
  if (activeId) return activeId;
  const profiles = loadProfiles();
  const defaultId = profiles[0]?.id || 'default-player';
  localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE_ID, defaultId);
  return defaultId;
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE_ID, id);
}

export function getActiveProfile(): UserProfile {
  const profiles = loadProfiles();
  const activeId = getActiveProfileId();
  const found = profiles.find(p => p.id === activeId);
  if (found) return found;
  return profiles[0] || createDefaultProfile();
}

export function updateActiveProfile(updater: (profile: UserProfile) => UserProfile): UserProfile {
  const profiles = loadProfiles();
  const activeId = getActiveProfileId();
  const index = profiles.findIndex(p => p.id === activeId);

  let updatedProfile: UserProfile;
  if (index >= 0) {
    updatedProfile = updater(profiles[index]);
    profiles[index] = updatedProfile;
  } else {
    updatedProfile = updater(createDefaultProfile(activeId));
    profiles.push(updatedProfile);
  }

  saveProfiles(profiles);
  return updatedProfile;
}

export function recordGameFinished(
  entry: Omit<UserHistoryEntry, 'id' | 'date' | 'timestamp'>
): void {
  updateActiveProfile(profile => {
    const newEntry: UserHistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      timestamp: Date.now()
    };

    const stats = { ...profile.stats };
    stats.totalPlayed += 1;

    if (entry.status === 'completed') {
      stats.totalCompleted += 1;
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak;
      }

      const diff = entry.difficulty;
      const time = entry.timeSpentSeconds;

      // Update best time
      const currBest = stats.bestTimeByDifficulty[diff];
      if (currBest === null || time < currBest) {
        stats.bestTimeByDifficulty[diff] = time;
      }

      // Update average time
      const solvedInDiff = profile.history.filter(
        h => h.difficulty === diff && h.status === 'completed'
      );
      const totalPastTime = solvedInDiff.reduce((acc, h) => acc + h.timeSpentSeconds, 0);
      const newCount = solvedInDiff.length + 1;
      stats.averageTimeByDifficulty[diff] = Math.round((totalPastTime + time) / newCount);
    } else {
      stats.currentStreak = 0;
    }

    // Keep up to 100 recent entries
    const history = [newEntry, ...profile.history].slice(0, 100);

    return {
      ...profile,
      stats,
      history,
      savedActiveGame: null // clear active saved game
    };
  });
}

export function saveActiveGameToProfile(activeGame: ActiveGameState | null): void {
  updateActiveProfile(profile => ({
    ...profile,
    savedActiveGame: activeGame
  }));
}

export function exportAllDataAsJson(): string {
  const profiles = loadProfiles();
  const activeId = getActiveProfileId();
  return JSON.stringify({ version: 1, exportedAt: Date.now(), activeId, profiles }, null, 2);
}

export function importAllDataFromJson(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data && Array.isArray(data.profiles)) {
      saveProfiles(data.profiles);
      if (data.activeId) {
        setActiveProfileId(data.activeId);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
