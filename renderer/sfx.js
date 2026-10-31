// ACE AI: Procedural Sci-Fi Audio Synthesizer (Web Audio API)
// Provides instant, zero-latency high-tech UI feedback sounds without external audio assets.

class AceSoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.analyser = null;
    this.analyserData = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.analyser) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  getSpectralBands() {
    if (!this.analyser || !this.analyserData) return { low: 0, mid: 0, high: 0 };
    this.analyser.getByteFrequencyData(this.analyserData);
    const bins = this.analyserData;
    let lowSum = 0;
    for (let i = 0; i < 4; i++) lowSum += bins[i];
    let midSum = 0;
    for (let i = 4; i < 20; i++) midSum += bins[i];
    let highSum = 0;
    for (let i = 20; i < 50; i++) highSum += bins[i];

    return {
      low: lowSum / (4 * 255),
      mid: midSum / (16 * 255),
      high: highSum / (30 * 255)
    };
  }

  // Sci-Fi Activation / Awakening Chime
  playActivation() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    // Dual harmonized tones (D5 and A5) with metallic ring
    [587.33, 880.00].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + i * 0.08 + 0.25);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.5);
    });
  }

  // Listening Started Chime
  playListening() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.12);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.20);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Command Executed / Confirmation Beep
  playConfirm() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    [900, 1350].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.001, t + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.06 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.20);
    });
  }

  // Thinking Pulsing Hum
  playThinking() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(440, t + 0.15);
    osc.frequency.linearRampToValueAtTime(320, t + 0.30);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.38);
  }

  // Warning / Alert Sound
  playAlert() {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;

    [440, 370].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);

      gain.gain.setValueAtTime(0.001, t + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.10, t + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.18);
    });
  }
}

window.aceSFX = new AceSoundEffects();
