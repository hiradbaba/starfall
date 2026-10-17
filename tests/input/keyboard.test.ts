import { isGameKey, KeyState } from '../../src/input/keyboard';

describe('KeyState', () => {
  it('turns held arrows into a direction every tick', () => {
    const k = new KeyState();
    k.down('ArrowLeft');
    k.down('ArrowUp');
    expect(k.poll()).toMatchObject({ dx: -1, dy: -1 });
    expect(k.poll()).toMatchObject({ dx: -1, dy: -1 });
    k.up('ArrowLeft');
    expect(k.poll()).toMatchObject({ dx: 0, dy: -1 });
  });

  it('opposite keys cancel out', () => {
    const k = new KeyState();
    k.down('ArrowLeft');
    k.down('KeyD');
    expect(k.poll().dx).toBe(0);
  });

  it('keeps a tap that started and ended between ticks', () => {
    const k = new KeyState();
    k.down('Space');
    k.up('Space');
    expect(k.poll().fire).toBe(true);
    expect(k.poll().fire).toBe(false);
  });

  it('repeats fire while held, but RPG and pause only once per press', () => {
    const k = new KeyState();
    k.down('Space');
    k.down('KeyX');
    k.down('KeyP');
    expect(k.poll()).toMatchObject({ fire: true, rpg: true, pause: true });
    expect(k.poll()).toMatchObject({ fire: true, rpg: false, pause: false });
  });

  it('clear() forgets everything', () => {
    const k = new KeyState();
    k.down('ArrowRight');
    k.down('KeyC');
    k.clear();
    expect(k.poll()).toEqual({
      dx: 0,
      dy: 0,
      fire: false,
      special: false,
      rpg: false,
      pause: false,
    });
  });

  it('ignores keys the game does not use', () => {
    const k = new KeyState();
    k.down('KeyQ');
    expect(isGameKey('KeyQ')).toBe(false);
    expect(k.poll()).toEqual({
      dx: 0,
      dy: 0,
      fire: false,
      special: false,
      rpg: false,
      pause: false,
    });
  });
});
