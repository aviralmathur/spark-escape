// Tiny synthesized sound effects using the Web Audio API — no audio files.

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AC) ctx = new AC();
  }
  // Browsers suspend audio until a user gesture; resume on demand.
  if (ctx && ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(v: boolean) {
  muted = v;
}
export function isMuted() {
  return muted;
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.18
) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

export function playClick() {
  if (muted) return;
  tone(420, 0, 0.06, "triangle", 0.12);
}

export function playSuccess() {
  if (muted) return;
  // Rising major arpeggio.
  tone(523.25, 0, 0.14, "sine", 0.2); // C5
  tone(659.25, 0.12, 0.14, "sine", 0.2); // E5
  tone(783.99, 0.24, 0.22, "sine", 0.22); // G5
  tone(1046.5, 0.4, 0.3, "sine", 0.2); // C6
}

export function playError() {
  if (muted) return;
  tone(180, 0, 0.18, "sawtooth", 0.14);
  tone(120, 0.12, 0.22, "sawtooth", 0.14);
}

export function playVictory() {
  if (muted) return;
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => tone(f, i * 0.16, 0.28, "triangle", 0.2));
  // Sparkle on top.
  tone(1567.98, 1.1, 0.5, "sine", 0.16);
}
