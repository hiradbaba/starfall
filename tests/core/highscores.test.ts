import {
  deserialiseScores,
  recordScore,
  serialiseScores,
  type HighScore,
} from '../../src/core/highscores';

const hs = (runId: number, score: number): HighScore => ({
  runId,
  name: `P${runId}`,
  score,
  level: 0,
});

describe('recordScore', () => {
  it('inserts in order and reports the rank', () => {
    const { list, rank } = recordScore([hs(1, 50), hs(2, 10)], hs(3, 30));
    expect(list.map((h) => h.runId)).toEqual([1, 3, 2]);
    expect(rank).toBe(1);
  });

  it('keeps only the top 5', () => {
    const full = [hs(1, 50), hs(2, 40), hs(3, 30), hs(4, 20), hs(5, 10)];
    expect(recordScore(full, hs(6, 5))).toEqual({ list: full, rank: null });
    expect(recordScore(full, hs(6, 45)).list.map((h) => h.runId)).toEqual([1, 6, 2, 3, 4]);
  });

  it('updates a run instead of duplicating it (save & quit, then game over)', () => {
    const afterSave = recordScore([], hs(1, 20)).list;
    const afterDeath = recordScore(afterSave, hs(1, 35)).list;
    expect(afterDeath).toEqual([hs(1, 35)]);
  });

  it('ignores zero scores', () => {
    expect(recordScore([], hs(1, 0))).toEqual({ list: [], rank: null });
  });
});

describe('score storage', () => {
  it('round-trips', () => {
    const list = [hs(1, 50), hs(2, 10)];
    expect(deserialiseScores(serialiseScores(list))).toEqual(list);
  });

  it.each([null, 'garbage', '{"version":9,"scores":[]}', '{"version":1,"scores":[{"name":5}]}'])(
    'treats %s as empty',
    (raw) => {
      expect(deserialiseScores(raw)).toEqual([]);
    },
  );
});
