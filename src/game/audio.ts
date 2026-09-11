// Motor de audio procedural — sin archivos externos, todo sintetizado con WebAudio.
export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private muted = false;
  private stepTimer = 0;

  private ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.1);
    }
  }
  getMuted() { return this.muted; }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.5, when = 0, slideTo?: number) {
    if (!this.ensure() || !this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol = 0.3, when = 0, filterFreq = 800, type: BiquadFilterType = 'lowpass') {
    if (!this.ensure() || !this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + when;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  }

  click() { this.tone(660, 0.08, 'triangle', 0.25); }
  hover() { this.tone(440, 0.05, 'sine', 0.12); }

  checkpoint() {
    // Arpegio brillante de checkpoint
    this.tone(523.25, 0.22, 'sine', 0.4, 0);
    this.tone(659.25, 0.22, 'sine', 0.4, 0.09);
    this.tone(783.99, 0.32, 'sine', 0.45, 0.18);
    this.tone(1046.5, 0.5, 'triangle', 0.25, 0.27);
    this.noise(0.4, 0.08, 0, 4000, 'highpass');
  }

  locked() {
    this.tone(220, 0.15, 'square', 0.15);
    this.tone(180, 0.2, 'square', 0.15, 0.12);
  }

  victory() {
    const seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    seq.forEach((f, i) => {
      this.tone(f, 0.35, 'triangle', 0.35, i * 0.14);
      this.tone(f / 2, 0.4, 'sine', 0.2, i * 0.14);
    });
    this.noise(1.4, 0.06, 0.2, 6000, 'highpass');
  }

  countTick() { this.tone(880, 0.07, 'square', 0.15); }
  go() { this.tone(1046, 0.3, 'triangle', 0.4); this.tone(1318, 0.4, 'sine', 0.3, 0.08); }

  footstep(sprint: boolean) {
    const now = performance.now();
    if (now - this.stepTimer < (sprint ? 260 : 380)) return;
    this.stepTimer = now;
    this.noise(0.09, sprint ? 0.16 : 0.1, 0, 500 + Math.random() * 300);
  }

  startAmbient() {
    if (!this.ensure() || !this.ctx || !this.master || this.ambientNodes.length) return;
    const ctx = this.ctx;
    // Viento suave: ruido filtrado con LFO
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 320;
    filt.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(filt).connect(g).connect(this.master);
    src.start();
    lfo.start();
    // Pájaros ocasionales
    const birdTimer = window.setInterval(() => {
      if (this.muted || document.hidden) return;
      if (Math.random() < 0.4) {
        const base = 2400 + Math.random() * 1200;
        this.tone(base, 0.12, 'sine', 0.05, 0, base * 1.3);
        this.tone(base * 1.1, 0.1, 'sine', 0.04, 0.15, base * 0.9);
      }
    }, 5000);
    this.ambientNodes = [src, lfo, { disconnect: () => window.clearInterval(birdTimer) } as unknown as AudioNode];
  }

  stopAmbient() {
    this.ambientNodes.forEach((n) => {
      try {
        if (n instanceof AudioBufferSourceNode || n instanceof OscillatorNode) (n as OscillatorNode).stop();
        n.disconnect();
      } catch { /* noop */ }
    });
    this.ambientNodes = [];
  }
}

export const gameAudio = new GameAudio();
