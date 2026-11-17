"use client";

type AudioCtor = typeof AudioContext;

interface NoiseOpts {
  type?: BiquadFilterType;
  /** Frecuencia del filtro (Hz) y, si se indica, frecuencia final del barrido. */
  f?: number;
  fEnd?: number;
  q?: number;
  /** Segundos de retardo, de subida y de caída de la envolvente. */
  at?: number;
  attack?: number;
}

const DTMF: Record<string, [number, number]> = {
  "6": [770, 1477],
  "9": [852, 1477]
};

/**
 * Sonidos de la intro, sintetizados con Web Audio (sin archivos):
 * estática, clic de teclas, tonos DTMF, encendido de un tubo CRT con su zumbido,
 * sintonía, enganche de la imagen, golpe del título y el "whoosh" de la cámara.
 *
 * Se crea durante un gesto del usuario (el botón de aceptar términos) y pasa
 * por un compresor para que nunca sature ni tape la música.
 */
export function createIntroSfx() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noiseBuf: AudioBuffer | null = null;
  let muted = false;
  let staticNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  let humNode: { oscs: OscillatorNode[]; gain: GainNode } | null = null;

  const MASTER = 0.9;

  const ensure = () => {
    if (ctx) return ctx;
    try {
      const Ctor: AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: AudioCtor }).webkitAudioContext;
      ctx = new Ctor();
    } catch {
      return null;
    }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER;
    master.connect(comp).connect(ctx.destination);

    // Ruido blanco reutilizable.
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  };

  /** Envolvente exponencial: sube hasta `peak` y cae a silencio. */
  const envelope = (g: GainNode, t: number, peak: number, attack: number, decay: number) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };

  const tone = (
    freq: number,
    dur: number,
    vol: number,
    type: OscillatorType = "square",
    at = 0,
    endFreq?: number
  ) => {
    const c = ensure();
    if (!c || !master) return;
    const t = c.currentTime + at;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    envelope(g, t, vol, 0.006, dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };

  const noise = (dur: number, vol: number, o: NoiseOpts = {}) => {
    const c = ensure();
    if (!c || !master || !noiseBuf) return;
    const { type = "bandpass", f = 2000, fEnd, q = 1, at = 0, attack = 0.005 } = o;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(f, t);
    if (fEnd) filter.frequency.exponentialRampToValueAtTime(fEnd, t + attack + dur);
    const g = c.createGain();
    envelope(g, t, vol, attack, dur);
    src.connect(filter).connect(g).connect(master);
    src.start(t, Math.random());
    src.stop(t + attack + dur + 0.05);
  };

  const api = {
    /** Debe llamarse dentro de un gesto del usuario. */
    unlock() {
      const c = ensure();
      c?.resume().catch(() => {});
    },

    setMuted(m: boolean) {
      muted = m;
      if (ctx && master) master.gain.setTargetAtTime(m ? 0 : MASTER, ctx.currentTime, 0.02);
    },

    /** Estática de fondo mientras la TV está apagada. */
    startStatic() {
      const c = ensure();
      if (!c || !master || !noiseBuf || staticNode) return;
      const src = c.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1800;
      filter.Q.value = 0.4;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.03, c.currentTime + 0.6);
      src.connect(filter).connect(gain).connect(master);
      src.start();
      staticNode = { src, gain };
    },

    stopStatic() {
      if (!ctx || !staticNode) return;
      const { src, gain } = staticNode;
      staticNode = null;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
      src.stop(ctx.currentTime + 0.2);
    },

    /** Zumbido grave del transformador, mientras la TV está encendida. */
    startHum() {
      const c = ensure();
      if (!c || !master || humNode) return;
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 420;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.02, c.currentTime + 0.9);
      const a = c.createOscillator();
      a.type = "sawtooth";
      a.frequency.value = 60;
      const b = c.createOscillator();
      b.type = "sine";
      b.frequency.value = 120;
      a.connect(filter);
      b.connect(filter);
      filter.connect(gain).connect(master);
      a.start();
      b.start();
      humNode = { oscs: [a, b], gain };
    },

    stopHum(fade = 0.4) {
      if (!ctx || !humNode) return;
      const { oscs, gain } = humNode;
      humNode = null;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, fade / 3);
      oscs.forEach((o) => o.stop(ctx!.currentTime + fade + 0.1));
    },

    /** Clic mecánico de una tecla de goma. */
    click() {
      noise(0.03, 0.22, { type: "highpass", f: 1800 });
      tone(140, 0.06, 0.2, "sine", 0, 60);
    },

    /** Tono de marcado (DTMF) del dígito. */
    dtmf(digit: string) {
      const pair = DTMF[digit];
      if (!pair) return;
      pair.forEach((f) => tone(f, 0.12, 0.06, "sine", 0.02));
    },

    /** Encendido de un tubo CRT: golpe del relé, ráfaga de estática y chillido agudo. */
    powerOn() {
      tone(80, 0.4, 0.38, "sine", 0, 35);
      noise(0.5, 0.2, { type: "bandpass", f: 3000, q: 0.7 });
      tone(2200, 0.55, 0.025, "sine", 0.05, 4200);
      api.startHum();
    },

    /** Ráfaga de estática al cambiar de canal. */
    tuneBurst() {
      noise(0.45, 0.24, { type: "bandpass", f: 700, fEnd: 5200, q: 0.8 });
    },

    /** Campanilla ascendente: señal encontrada. */
    signalFound() {
      tone(660, 0.12, 0.08, "square", 0);
      tone(990, 0.22, 0.08, "square", 0.12);
    },

    /** La imagen "engancha" tras rodar: golpe sordo, barrido de estática y blip del OSD. */
    lock() {
      tone(70, 0.28, 0.3, "sine", 0, 40);
      noise(0.5, 0.16, { type: "bandpass", f: 400, fEnd: 2800, q: 0.9, attack: 0.25 });
      tone(1200, 0.07, 0.05, "square", 0.45);
    },

    /** Golpe del título: bajo profundo, platillo y acorde mayor. */
    titleHit() {
      tone(55, 0.9, 0.42, "sine", 0, 38);
      noise(0.7, 0.2, { type: "lowpass", f: 2600, fEnd: 280 });
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.9, 0.045, "triangle", 0.03 + i * 0.045));
    },

    /** La cámara se mete en la pantalla: ruido que sube de tono y retumbo. */
    whoosh() {
      noise(0.35, 0.38, { type: "bandpass", f: 180, fEnd: 4400, q: 1.2, attack: 1.2 });
      tone(40, 1.7, 0.28, "sine", 0, 170);
    },

    /** Chispazo al cruzar el cristal. */
    zap() {
      noise(0.28, 0.32, { type: "highpass", f: 3000 });
      tone(1300, 0.28, 0.09, "sawtooth", 0, 90);
    },

    /** Zumbido de rechazo. */
    denied() {
      tone(120, 0.28, 0.15, "square");
      tone(95, 0.32, 0.12, "square", 0.2);
    },

    dispose() {
      api.stopStatic();
      api.stopHum(0.1);
      const c = ctx;
      ctx = null;
      master = null;
      noiseBuf = null;
      if (c) setTimeout(() => c.close().catch(() => {}), 400);
    }
  };

  return api;
}
