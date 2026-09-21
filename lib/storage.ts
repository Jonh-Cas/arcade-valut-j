// ===== lib/storage.ts — localStorage-backed mock persistence =====

export interface StoredUser {
  name: string;
}

export interface StoredScoreEntry {
  game: string;
  score: number;
  name: string;
  at: number;
}

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

export function getStoredUser(): StoredUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function getStoredScores(): StoredScoreEntry[] {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addStoredScore(entry: Omit<StoredScoreEntry, "at">): void {
  const all = getStoredScores();
  all.push({ ...entry, at: Date.now() });
  localStorage.setItem(SCORES_KEY, JSON.stringify(all));
}
