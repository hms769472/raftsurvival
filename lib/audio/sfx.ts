import { gameStore } from '@/lib/store';
import { debug } from '@/lib/logger';

type AudioCtxRef = { current: AudioContext | null };
type WaveSoundRef = {
  current: { noiseSource: AudioBufferSourceNode; lfo: OscillatorNode } | null;
};

export function startWaveSound(audioCtxRef: AudioCtxRef, waveSoundRef: WaveSoundRef) {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (waveSoundRef.current) return;

    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 1;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.08;

    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start();
    lfo.start();

    waveSoundRef.current = { noiseSource: noise, lfo };
  } catch (e) {
    debug('wave sound error', e);
  }
}

export function getAudioCtx(audioCtxRef: AudioCtxRef): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  return audioCtxRef.current;
}

export function isSfxEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return gameStore.sfxEnabled !== false;
}

export function playFootstepSound(audioCtxRef: AudioCtxRef): void {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getAudioCtx(audioCtxRef);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {}
}

export function playChopSound(audioCtxRef: AudioCtxRef): void {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getAudioCtx(audioCtxRef);
    const now = ctx.currentTime;
    // Quick snap/crack
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
    // Wood crack (noise burst)
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  } catch {}
}

// RAFT-108: distinct impact SFX played only when an attack connects.
export function playHitSound(audioCtxRef: AudioCtxRef): void {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getAudioCtx(audioCtxRef);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  } catch {}
}

export function playCraftSound(audioCtxRef: AudioCtxRef): void {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getAudioCtx(audioCtxRef);
    const now = ctx.currentTime;
    // Happy ascending arpeggio
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  } catch {}
}

export function playEatSound(audioCtxRef: AudioCtxRef): void {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getAudioCtx(audioCtxRef);
    const now = ctx.currentTime;
    // Two quick munch sounds
    [0, 0.12].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now + delay);
      osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.08);
      gain.gain.setValueAtTime(0.1, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    });
  } catch {}
}

export function playDamageSound(audioCtxRef: AudioCtxRef): void {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    [0, 0.25].forEach((delay) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now + delay);
      osc.frequency.exponentialRampToValueAtTime(40, now + delay + 0.15);
      gain.gain.setValueAtTime(0.4, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  } catch (e) {
    debug('audio error', e);
  }
}
