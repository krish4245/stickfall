// ============================================================
// STICKFALL Web Audio Synthesizer (Web Audio API)
// Procedural Sound Effects — Zero External Files Required
// ============================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.5;
    this.bgmPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playWhoosh() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Noise buffer for blade slice texture
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.15);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  playHit(isCrit = false) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Bass Thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = isCrit ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isCrit ? 160 : 130, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

    oscGain.gain.setValueAtTime((isCrit ? 0.6 : 0.4) * this.volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);

    // Crunch noise
    const bufferSize = this.ctx.sampleRate * (isCrit ? 0.2 : 0.1);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime((isCrit ? 0.5 : 0.3) * this.volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.2 : 0.1));

    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + (isCrit ? 0.2 : 0.1));
  }

  playJump() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.12);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playDoubleJump() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const vol = Math.max(0.01, this.volume);

    // 1. Ethereal Chime (Harmonic sine waves ascending)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(460, now);
    osc1.frequency.exponentialRampToValueAtTime(920, now + 0.18);
    gain1.gain.setValueAtTime(0.25 * vol, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.26);

    // 2. High Shimmer Harmonics
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(920, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(1450, now + 0.22);
    gain2.gain.setValueAtTime(0.16 * vol, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.28);

    // 3. Ethereal Wing Flap Gust (filtered noise burst)
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(280, now + 0.20);
      filter.Q.value = 1.2;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.20 * vol, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.22);
    } catch (e) {}
  }

  playWallJump() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const vol = Math.max(0.01, this.volume);

    // 1. Tactile wall kick thump
    const kick = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kick.type = 'triangle';
    kick.frequency.setValueAtTime(240, now);
    kick.frequency.exponentialRampToValueAtTime(45, now + 0.14);

    kickGain.gain.setValueAtTime(0.45 * vol, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    kick.connect(kickGain);
    kickGain.connect(this.ctx.destination);
    kick.start(now);
    kick.stop(now + 0.14);

    // 2. Ninja somersault air whoosh
    const whoosh = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();
    whoosh.type = 'sine';
    whoosh.frequency.setValueAtTime(340, now + 0.02);
    whoosh.frequency.exponentialRampToValueAtTime(820, now + 0.18);

    whooshGain.gain.setValueAtTime(0.3 * vol, now + 0.02);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    whoosh.connect(whooshGain);
    whooshGain.connect(this.ctx.destination);
    whoosh.start(now + 0.02);
    whoosh.stop(now + 0.18);
  }

  playWallSlide() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const vol = Math.max(0.01, this.volume);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

    gain.gain.setValueAtTime(0.15 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playDeath() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);

    gain.gain.setValueAtTime(0.4 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playDash() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playDeflect() {
    try {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const vol = Math.max(0.01, this.volume);

      // Crisp metal sword clink
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);

      gain.gain.setValueAtTime(0.4 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      // Audio safety fallback
    }
  }

  playPerfectParry() {
    try {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const vol = Math.max(0.01, this.volume);

      // 1. High-frequency anime katana parry chime (2400Hz pure bell resonance)
      const bell1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      bell1.type = 'sine';
      bell1.frequency.setValueAtTime(2400, now);
      bell1.frequency.exponentialRampToValueAtTime(2200, now + 0.4);

      gain1.gain.setValueAtTime(0.5 * vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      bell1.connect(gain1);
      gain1.connect(this.ctx.destination);
      bell1.start(now);
      bell1.stop(now + 0.4);

      // 2. Harmonic overtone (3600Hz shimmer)
      const bell2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      bell2.type = 'sine';
      bell2.frequency.setValueAtTime(3600, now);
      gain2.gain.setValueAtTime(0.3 * vol, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      bell2.connect(gain2);
      gain2.connect(this.ctx.destination);
      bell2.start(now);
      bell2.stop(now + 0.35);

      // 3. Subwoofer punch (punchy tactile thump on parry)
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(45, now + 0.15);
      subGain.gain.setValueAtTime(0.4 * vol, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.15);
    } catch (e) {
      // Audio safety fallback
    }
  }
}

const Audio = new SoundEngine();
