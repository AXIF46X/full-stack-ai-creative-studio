"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MicIcon, PlayIcon, SlidersIcon, SparklesIcon, StopIcon, VolumeIcon } from "@/components/icons";
import { useToast } from "@/components/ui";

export type BeatOptions = {
  bpm: number;
  tone: string;
  vocalStyle: string;
  pitch: number;
  reverb: number;
  volume: number;
};

const TONE_MAP: Record<string, { root: number; cutoff: number; lead: OscillatorType; mood: "dark" | "warm" | "bright" }> = {
  midnight: { root: 55, cutoff: 780, lead: "triangle", mood: "dark" },
  "golden hour": { root: 62, cutoff: 1500, lead: "sine", mood: "warm" },
  chrome: { root: 58, cutoff: 2600, lead: "square", mood: "bright" },
  riso: { root: 65, cutoff: 1200, lead: "triangle", mood: "warm" },
  "neon arcade": { root: 61, cutoff: 2100, lead: "sawtooth", mood: "bright" },
  "tape warm": { root: 52, cutoff: 950, lead: "sine", mood: "warm" },
  glass: { root: 69, cutoff: 3000, lead: "triangle", mood: "bright" },
  vapor: { root: 57, cutoff: 1400, lead: "sine", mood: "dark" },
};

const STYLE_MAP: Record<string, { detune: number; octave: number; gain: number }> = {
  airy: { detune: 9, octave: 2, gain: 0.055 },
  whispered: { detune: 4, octave: 2, gain: 0.035 },
  chopped: { detune: 18, octave: 1, gain: 0.05 },
  belted: { detune: 6, octave: 1, gain: 0.075 },
  spoken: { detune: 2, octave: 2, gain: 0.04 },
  stacked: { detune: 14, octave: 2, gain: 0.06 },
  "pitched up": { detune: 8, octave: 3, gain: 0.045 },
  dry: { detune: 0, octave: 2, gain: 0.05 },
};

const KICKS = [0, 6, 8, 14, 16, 22, 24, 30];
const SNARES = [4, 12, 20, 28];
const BASS_PATTERN: (number | null)[] = [0, null, null, 7, null, null, 5, null, 0, null, null, 3, null, 7, null, null];
const LEAD_PATTERN: (number | null)[] = [12, null, 15, null, null, 19, null, 17, 12, null, null, 10, null, 12, null, null];

class BeatEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private analyser: AnalyserNode;
  private wet: GainNode;
  private noise: AudioBuffer;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private running = false;
  private opts: BeatOptions;

  constructor(options: BeatOptions) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio is not supported in this browser");
    this.ctx = new Ctor();
    this.opts = options;

    this.master = this.ctx.createGain();
    this.master.gain.value = options.volume * 0.55;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.master.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    const convolver = this.ctx.createConvolver();
    convolver.buffer = this.impulse();
    this.wet = this.ctx.createGain();
    this.wet.gain.value = options.reverb;
    this.wet.connect(convolver);
    convolver.connect(this.master);

    this.noise = this.noiseBuffer();
  }

  private noiseBuffer() {
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.6), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    return buffer;
  }

  private impulse() {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * 1.4);
    const buffer = this.ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, 2.8);
      }
    }
    return buffer;
  }

  update(options: BeatOptions) {
    this.opts = options;
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(options.volume * 0.55, now, 0.05);
    this.wet.gain.setTargetAtTime(options.reverb, now, 0.08);
  }

  getLevel() {
    if (!this.running) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let index = 0; index < data.length; index += 1) {
      const value = (data[index] - 128) / 128;
      sum += value * value;
    }
    return Math.min(1, Math.sqrt(sum / data.length) * 3.4);
  }

  async start() {
    await this.ctx.resume();
    this.running = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    const tick = () => {
      if (!this.running) return;
      while (this.nextTime < this.ctx.currentTime + 0.16) {
        this.playStep(this.step, this.nextTime);
        this.nextTime += 60 / this.opts.bpm / 4;
        this.step = (this.step + 1) % 32;
      }
    };
    tick();
    this.timer = window.setInterval(tick, 40);
  }

  stop() {
    this.running = false;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
  }

  async resumeAudio() {
    await this.ctx.resume();
    this.master.gain.setTargetAtTime(this.opts.volume * 0.55, this.ctx.currentTime, 0.05);
  }

  dispose() {
    this.stop();
    void this.ctx.close().catch(() => {});
  }

  private voice(
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    cutoff: number,
    send = 0.18,
  ) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const envelope = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, time);
    filter.Q.value = 0.8;
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(gain, time + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.master);
    if (send > 0) envelope.connect(this.wet);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private kick(time: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(44, time + 0.16);
    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + 0.32);
  }

  private hit(time: number, type: "snare" | "hat") {
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type === "snare" ? "bandpass" : "highpass";
    filter.frequency.value = type === "snare" ? 1900 : 7200;
    filter.Q.value = type === "snare" ? 0.9 : 0.6;
    const gain = this.ctx.createGain();
    const volume = type === "snare" ? 0.24 : 0.11;
    const duration = type === "snare" ? 0.17 : 0.05;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(time);
    source.stop(time + duration + 0.02);
  }

  private playStep(step: number, time: number) {
    const tone = TONE_MAP[this.opts.tone] ?? TONE_MAP.midnight;
    const style = STYLE_MAP[this.opts.vocalStyle] ?? STYLE_MAP.airy;
    const shift = Math.pow(2, this.opts.pitch / 12);
    const barStep = step % 16;
    const root = tone.root * shift;

    if (KICKS.includes(step)) this.kick(time);
    if (SNARES.includes(step)) this.hit(time, "snare");
    if (step % 2 === 0) this.hit(time, "hat");

    const bassSemitone = BASS_PATTERN[barStep];
    if (bassSemitone !== null) {
      this.voice(root * Math.pow(2, bassSemitone / 12), time, 0.26, tone.mood === "dark" ? "sawtooth" : "triangle", 0.16, tone.cutoff, 0.05);
    }

    if (barStep === 0) {
      const chord = [0, 3, 7, 10];
      chord.forEach((semitone) => {
        this.voice(
          root * 2 * Math.pow(2, (semitone + style.octave * 12) / 12),
          time,
          1.6,
          tone.lead === "square" ? "triangle" : tone.lead,
          0.032,
          tone.cutoff * 1.6,
          0.4,
        );
      });
    }

    const leadSemitone = LEAD_PATTERN[barStep];
    if (leadSemitone !== null) {
      const freq = root * 2 * Math.pow(2, leadSemitone / 12) * (1 + style.detune / 2400);
      this.voice(freq, time, 0.2, tone.lead, style.gain, tone.cutoff * 2.2, 0.32);
      if (style.detune > 8) {
        this.voice(freq * (1 - style.detune / 1600), time + 0.01, 0.18, tone.lead, style.gain * 0.7, tone.cutoff * 1.8, 0.3);
      }
    }
  }
}

export function BeatPlayer({
  bpm,
  tone,
  vocalStyle,
  title,
  gradient,
  emoji,
  onToneChange,
}: {
  bpm: number;
  tone: string;
  vocalStyle: string;
  title: string;
  gradient: string;
  emoji: string;
  onToneChange?: (tone: string) => void;
}) {
  const { push } = useToast();
  const engine = useRef<BeatEngine | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [reverb, setReverb] = useState(0.28);
  const [volume, setVolume] = useState(0.7);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    engine.current?.update({ bpm, tone, vocalStyle, pitch, reverb, volume });
  }, [bpm, tone, vocalStyle, pitch, reverb, volume]);

  useEffect(() => {
    if (!playing) {
      setLevel(0);
      return;
    }
    const id = window.setInterval(() => {
      setLevel(engine.current?.getLevel() ?? 0);
    }, 90);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    return () => {
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (!engine.current) {
        engine.current = new BeatEngine({ bpm, tone, vocalStyle, pitch, reverb, volume });
      }
      if (playing) {
        engine.current.stop();
        setPlaying(false);
        return;
      }
      await engine.current.resumeAudio();
      await engine.current.start();
      setPlaying(true);
    } catch {
      push("Your browser blocked audio — tap play again", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, bpm, tone, vocalStyle, pitch, reverb, volume, push]);

  const bars = Array.from({ length: 26 }, (_, index) => {
    const base = 18 + Math.abs(Math.sin((index + 1) * 0.7 + bpm / 40)) * 58;
    return playing ? Math.max(8, base * (0.35 + level * 1.9)) : base * 0.7;
  });

  return (
    <div className="surface-2 rounded-xl p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="btn btn-primary h-12 w-12 shrink-0 rounded-full p-0"
          aria-label={playing ? "Stop preview" : "Play preview"}
        >
          {playing ? <StopIcon size={17} /> : <PlayIcon size={17} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold">{title || "untitled sketch"}</p>
            <span className="tag">{playing ? "live" : "preview"}</span>
            <span className="tag">{bpm} BPM</span>
            <span className="tag capitalize">{tone}</span>
          </div>
          <div className="mt-1.5 flex h-11 items-end gap-[2px]">
            {bars.map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-full transition-[height] duration-100"
                style={{
                  height: `${Math.min(44, height)}px`,
                  backgroundImage: playing ? gradient : undefined,
                  background: playing ? undefined : "color-mix(in srgb, var(--accent) 30%, transparent)",
                  opacity: playing ? 0.95 : 0.55,
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <VolumeIcon size={14} style={{ color: "var(--muted)" }} />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(event) => setVolume(Number(event.target.value) / 100)}
            className="w-20"
            aria-label="Master volume"
          />
        </div>
      </div>

      <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-3" style={{ borderColor: "var(--border)" }}>
        <label className="block">
          <span className="muted mb-1 flex items-center justify-between text-[11px] font-semibold">
            <span className="flex items-center gap-1"><MicIcon size={11} /> Vocal pitch</span>
            <span style={{ color: "var(--accent)" }}>{pitch > 0 ? `+${pitch}` : pitch} st</span>
          </span>
          <input type="range" min={-12} max={12} value={pitch} onChange={(event) => setPitch(Number(event.target.value))} className="w-full" />
        </label>
        <label className="block">
          <span className="muted mb-1 flex items-center justify-between text-[11px] font-semibold">
            <span className="flex items-center gap-1"><SlidersIcon size={11} /> Space / reverb</span>
            <span style={{ color: "var(--accent)" }}>{Math.round(reverb * 100)}%</span>
          </span>
          <input type="range" min={0} max={100} value={Math.round(reverb * 100)} onChange={(event) => setReverb(Number(event.target.value) / 100)} className="w-full" />
        </label>
        <div>
          <span className="muted mb-1 flex items-center gap-1 text-[11px] font-semibold"><SparklesIcon size={11} /> Tone engine</span>
          <div className="flex flex-wrap gap-1">
            {["midnight", "golden hour", "chrome", "glass", "neon arcade", "tape warm"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onToneChange?.(option)}
                className={`chip capitalize ${tone === option ? "chip-active" : ""}`}
                style={{ padding: "0.14rem 0.44rem", fontSize: "0.66rem" }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="muted mt-2 flex items-center gap-1 text-[10px]">
        <span className="flex h-3 w-3 items-center justify-center rounded-full text-[8px]" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{emoji}</span>
        Synthesized live in your browser — {vocalStyle} vocal layers, {tone} tone. No samples, no download.
      </p>
    </div>
  );
}
