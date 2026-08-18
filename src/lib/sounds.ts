type SoundKind = "key" | "space" | "backspace" | "enter" | "bell" | "return";

class TypewriterSoundEngine {
  private context: AudioContext | null = null;

  private masterGain: GainNode | null = null;

  private unlocked = false;

  async unlock() {
    if (this.unlocked || typeof window === "undefined") {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = this.context ?? new AudioContextClass();

    if (!this.masterGain) {
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.22;
      this.masterGain.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.unlocked = true;
  }

  play(kind: SoundKind, enabled: boolean) {
    if (!enabled || !this.context || !this.masterGain || !this.unlocked) {
      return;
    }

    if (kind === "bell") {
      this.playTone(1046 + Math.random() * 18, 0.1, 0.09);
      return;
    }

    const now = this.context.currentTime;
    const noiseBuffer = this.createNoiseBuffer(kind);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    source.buffer = noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = this.frequencyFor(kind);
    filter.Q.value = kind === "return" ? 0.8 : 2.6;
    gain.gain.setValueAtTime(this.volumeFor(kind), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + this.durationFor(kind));

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
    source.stop(now + this.durationFor(kind));

    if (kind === "enter") {
      window.setTimeout(() => this.play("return", true), 45);
      window.setTimeout(() => this.play("bell", true), 15);
    }
  }

  private createNoiseBuffer(kind: SoundKind) {
    const context = this.context;

    if (!context) {
      throw new Error("AudioContext has not been initialized.");
    }

    const duration = this.durationFor(kind);
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    const decay = kind === "return" ? 1.8 : 7;

    for (let index = 0; index < frameCount; index += 1) {
      const progress = index / frameCount;
      data[index] = (Math.random() * 2 - 1) * Math.exp(-progress * decay);
    }

    return buffer;
  }

  private playTone(frequency: number, duration: number, volume: number) {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private frequencyFor(kind: SoundKind) {
    const baseFrequencies: Record<SoundKind, number> = {
      key: 2900,
      space: 1600,
      backspace: 950,
      enter: 720,
      bell: 1046,
      return: 540,
    };

    return baseFrequencies[kind] + Math.random() * 280;
  }

  private durationFor(kind: SoundKind) {
    const durations: Record<SoundKind, number> = {
      key: 0.035 + Math.random() * 0.015,
      space: 0.045,
      backspace: 0.045,
      enter: 0.055,
      bell: 0.1,
      return: 0.18,
    };

    return durations[kind];
  }

  private volumeFor(kind: SoundKind) {
    const volumes: Record<SoundKind, number> = {
      key: 0.13 + Math.random() * 0.035,
      space: 0.1,
      backspace: 0.11,
      enter: 0.14,
      bell: 0.08,
      return: 0.1,
    };

    return volumes[kind];
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export const typewriterSounds = new TypewriterSoundEngine();
