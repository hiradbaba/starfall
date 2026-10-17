import { noteFreq, THEME } from './theme';

export type Sound =
  'move' | 'select' | 'shot' | 'special' | 'rpgLaunch' | 'rpgBoom' | 'explode' | 'levelUp' | 'hit';

type Wave = OscillatorType;

/**
 * All sound is synthesised with Web Audio — no files. The AudioContext is
 * created on the first user gesture (browser autoplay rules).
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor(public muted: boolean) {}

  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.35;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.35;
  }

  play(sound: Sound): void {
    switch (sound) {
      case 'move':
        return this.tone(300, 60, 'square', 0.15);
      case 'select':
        return this.tone(500, 120, 'square', 0.2);
      case 'shot':
        return this.tone(880, 50, 'square', 0.08, 0, 440);
      case 'special':
        return this.tone(330, 90, 'sawtooth', 0.12, 0, 660);
      case 'rpgLaunch':
        return this.tone(200, 250, 'triangle', 0.25, 0, 900);
      case 'rpgBoom':
        return this.noise(600, 0.6);
      case 'explode':
        return this.noise(160, 0.25);
      case 'levelUp':
        this.tone(523, 90, 'square', 0.15);
        this.tone(659, 90, 'square', 0.15, 90);
        return this.tone(784, 160, 'square', 0.15, 180);
      case 'hit':
        this.noise(700, 0.7);
        return this.tone(220, 700, 'sawtooth', 0.3, 0, 40);
    }
  }

  /** Plays the original theme; returns its length in ms. */
  playTheme(bpm = 132): number {
    const beat = 60_000 / bpm;
    let at = 0;
    for (const [note, beats] of THEME) {
      if (note) this.tone(noteFreq(note), beats * beat * 0.9, 'square', 0.18, at);
      at += beats * beat;
    }
    return at;
  }

  private tone(
    freq: number,
    ms: number,
    type: Wave,
    gain: number,
    delayMs = 0,
    slideTo?: number,
  ): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    const t0 = ctx.currentTime + delayMs / 1000;
    const t1 = t0 + ms / 1000;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t1);
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.001, t1);
    osc.connect(env).connect(master);
    osc.start(t0);
    osc.stop(t1);
  }

  private noise(ms: number, gain: number): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    const length = Math.floor((ctx.sampleRate * ms) / 1000);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = ctx.createBufferSource();
    const env = ctx.createGain();
    src.buffer = buffer;
    env.gain.value = gain;
    src.connect(env).connect(master);
    src.start();
  }
}
