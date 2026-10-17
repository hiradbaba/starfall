const SEMITONES: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

/** Frequency of a note like "A4", "C#5" or "Bb3" (A4 = 440 Hz). */
export function noteFreq(note: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(note);
  if (!m) throw new Error(`Bad note: ${note}`);
  const [, letter, accidental, octave] = m;
  const semis =
    SEMITONES[letter!]! +
    (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0) +
    (Number(octave) - 4) * 12;
  return 440 * 2 ** (semis / 12);
}

/** Original STARFALL theme: [note or null for a rest, beats]. */
export const THEME: readonly (readonly [string | null, number])[] = [
  ['D4', 1],
  ['A4', 1],
  ['F4', 0.5],
  ['G4', 0.5],
  ['A4', 1],
  ['C5', 1.5],
  ['A4', 0.5],
  ['G4', 1],
  [null, 0.5],
  ['F4', 0.5],
  ['E4', 0.5],
  ['F4', 0.5],
  ['D4', 2],
];
