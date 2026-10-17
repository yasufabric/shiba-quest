let context: AudioContext | null = null;
let primed = false;

function getContext(): AudioContext {
  if (!context) context = new AudioContext();
  return context;
}

/** Create or resume the audio context. Call from touchend so iOS will sound. */
export function unlockAudio(): void {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') void ctx.resume();
    if (primed) return;
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    primed = true;
  } catch {
    // The fight still plays with the sound missing.
  }
}

export function installAudioUnlock(): void {
  window.addEventListener('touchend', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio);
}

export function playCharge(): void {
  tone(220, 0.14, 'square', 0.07, 0, 520);
  tone(520, 0.16, 'square', 0.06, 0.08, 880);
}

export function playAttack(): void {
  noise(0.12, 0.1, 900);
  tone(160, 0.14, 'square', 0.06, 0, 55);
}

export function playGuard(): void {
  tone(180, 0.08, 'square', 0.06);
  tone(110, 0.1, 'square', 0.05, 0.04);
}

export function playHit(): void {
  noise(0.09, 0.14, 1400);
}

export function playShatter(): void {
  noise(0.35, 0.16, 700);
  tone(90, 0.42, 'sawtooth', 0.07, 0, 36);
  tone(440, 0.08, 'square', 0.04, 0.02, 120);
}

export function playVictory(): void {
  tone(523, 0.12, 'square', 0.05);
  tone(659, 0.12, 'square', 0.05, 0.1);
  tone(784, 0.18, 'square', 0.05, 0.2);
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  peak: number,
  delay = 0,
  slideTo?: number,
): void {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo && slideTo > 0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch {
    // Ignore autoplay failures.
  }
}

function noise(duration: number, peak: number, cutoff: number): void {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.value = peak;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // Ignore autoplay failures.
  }
}
