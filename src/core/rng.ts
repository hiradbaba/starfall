// mulberry32: tiny seeded PRNG whose whole state is one uint32,
// so it can live inside GameState and be saved.
export interface Roll {
  value: number;
  rng: number;
}

export function nextFloat(rng: number): Roll {
  const next = (rng + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: next };
}

/** Integer in [0, max). */
export function nextInt(rng: number, max: number): Roll {
  const roll = nextFloat(rng);
  return { value: Math.floor(roll.value * max), rng: roll.rng };
}
