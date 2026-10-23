// ===== lib/storage.ts — localStorage-backed mock persistence for scores =====

export interface StoredScoreEntry {
  game: string;
  score: number;
  name: string;
  at: number;
}

const SCORES_KEY = "av_scores";

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
