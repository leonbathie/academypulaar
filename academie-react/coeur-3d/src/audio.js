/**
 * Cardiac Heartbeat Audio Synthesizer (Web Audio API)
 * Simulates realistic acoustic heart sounds (S1 'Lub' and S2 'Dub')
 * perfectly synchronized with ventricular systole and diastole.
 */

class HeartAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isEnabled = false;
    this.volume = 0.6;
    this.lastBeatTime = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported or blocked:", e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  toggle() {
    this.ensureContext();
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  playHeartbeat(bpm = 72) {
    if (!this.isEnabled) return;
    this.ensureContext();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    // Prevent overlapping trigger spam
    if (now - this.lastBeatTime < (60 / bpm) * 0.6) return;
    this.lastBeatTime = now;

    // S1 Sound ("Lub" - closure of AV valves, longer, lower pitch ~60Hz)
    this.createThump(now, 58, 0.16, 0.9);

    // S2 Sound ("Dub" - closure of Semilunar valves, crisper, higher pitch ~90Hz)
    // S2 occurs at roughly 35% of the total cardiac cycle time
    const cycleDuration = 60 / bpm;
    const s2Delay = Math.max(0.18, cycleDuration * 0.35);
    this.createThump(now + s2Delay, 88, 0.11, 0.75);
  }

  createThump(time, freq, duration, intensity) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Natural low acoustic resonance
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.25, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + duration);

    // Low pass filter for fleshy cardiac chest resonance
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, time);
    filter.Q.setValueAtTime(3.5, time);

    // Attack, sustain, exponential decay envelope
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(intensity, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
}

export const heartAudio = new HeartAudioSynthesizer();
