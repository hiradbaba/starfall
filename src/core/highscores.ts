export interface HighScore {
  runId: number;
  name: string;
  score: number;
  level: number;
}

export const MAX_SCORES = 5;
const SCORES_VERSION = 1;

/**
 * Records a run's score. A run that already has an entry (saved earlier via
 * Save & Quit) is updated rather than duplicated. Returns the 0-based rank,
 * or null if the run didn't make the table.
 */
export function recordScore(
  list: readonly HighScore[],
  entry: HighScore,
): { list: HighScore[]; rank: number | null } {
  if (entry.score <= 0) return { list: [...list], rank: null };
  const previous = list.find((h) => h.runId === entry.runId);
  const best = previous && previous.score >= entry.score ? previous : entry;
  const others = list.filter((h) => h.runId !== entry.runId);
  // Stable sort: on equal scores the earlier entry keeps the higher rank.
  const sorted = [...others, best].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
  const rank = sorted.indexOf(best);
  return { list: sorted, rank: rank === -1 ? null : rank };
}

export function serialiseScores(list: readonly HighScore[]): string {
  return JSON.stringify({ version: SCORES_VERSION, scores: list });
}

export function deserialiseScores(raw: string | null): HighScore[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return [];
    const { version, scores } = parsed as { version?: unknown; scores?: unknown };
    if (version !== SCORES_VERSION || !Array.isArray(scores)) return [];
    return scores.filter(isHighScore).slice(0, MAX_SCORES);
  } catch {
    return [];
  }
}

function isHighScore(v: unknown): v is HighScore {
  if (typeof v !== 'object' || v === null) return false;
  const h = v as Record<string, unknown>;
  return (
    Number.isSafeInteger(h.runId) &&
    typeof h.name === 'string' &&
    h.name.length > 0 &&
    Number.isSafeInteger(h.score) &&
    Number.isSafeInteger(h.level)
  );
}
