'use client';

/**
 * Optional sound feedback.
 *
 * Sounds are synthesized with the Web Audio API, so nothing is downloaded
 * and no audio file needs to ship with the app. They are short, subtle,
 * and disabled by default. Sound is never required to understand the UI.
 */

export type SoundKind =
  | 'copy'
  | 'save'
  | 'added'
  | 'removed'
  | 'selected'
  | 'command'
  | 'shortcut'
  | 'error';

let enabled = false;
let ctx: AudioContext | null = null;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

function getContext(): AudioContext | null {
  if (!enabled) return null;
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  return ctx;
}

interface SoundSpec {
  freq: number;
  duration: number;
  gain?: number;
  type?: OscillatorType;
}

const SOUNDS: Record<SoundKind, SoundSpec> = {
  copy: { freq: 880, duration: 0.05, gain: 0.05 },
  save: { freq: 720, duration: 0.07, gain: 0.05 },
  added: { freq: 640, duration: 0.07, gain: 0.05 },
  removed: { freq: 320, duration: 0.09, gain: 0.05 },
  selected: { freq: 540, duration: 0.05, gain: 0.04 },
  command: { freq: 760, duration: 0.08, gain: 0.05 },
  shortcut: { freq: 980, duration: 0.06, gain: 0.05 },
  error: { freq: 180, duration: 0.12, gain: 0.06 },
};

export function playSound(kind: SoundKind): void {
  const ac = getContext();
  if (!ac) return;

  const spec = SOUNDS[kind];
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = spec.type ?? 'sine';
  osc.frequency.value = spec.freq;
  gain.gain.setValueAtTime(spec.gain ?? 0.05, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + spec.duration);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + spec.duration);
}