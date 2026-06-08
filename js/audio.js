// ============================================================
// AUDIO ENGINE — Procedural SFX via Web Audio API
// All sounds synthesized, zero external files.
// Tune everything in AUDIO_CFG below.
// ============================================================

// ============================================================
// AUDIO CONFIG — Centralized tuning table
// ============================================================
// master:  global volume 0-1
// muted:   master mute
// music:   ambient drone on/off + volume
// categories[cat].vol:  per-category volume multiplier
// categories[cat].on:   enable/disable entire category
//
// Sound params:
//   cat:   category (ui|combat|skill|event)
//   type:  osc | noise | both | arp
//   wave:  sine|square|sawtooth|triangle  (oscillator type)
//   freq:  oscillator start Hz / noise filter start Hz
//   fEnd:  oscillator end Hz / noise filter end Hz (sweep target)
//   dur:   total duration in seconds
//   v:     oscillator volume
//   nv:    noise volume
//   q:     filter resonance (0.3=gentle, 5=sharp, default 0.6)
//   ftype: noise filter type (lowpass|highpass|bandpass, default lowpass)
//
// arp type uses: notes (array of [freq, dur] pairs), wave, v
// ============================================================
export const AUDIO_CFG = {
  master: 0.55,
  muted: false,
  music: { on: true, vol: 0.06 },

  ambient: {
    menu:   { osc:'triangle', freq:55, detune:2.5, lfoHz:0.5, lfoDepth:8,  filterFreq:100, filterQ:0.7 },
    battle: { osc:'triangle', freq:60, detune:3.5, lfoHz:0.7, lfoDepth:12, filterFreq:120, filterQ:0.8 },
    boss:   { osc:'triangle', freq:65, detune:4.5, lfoHz:1.1, lfoDepth:16, filterFreq:140, filterQ:0.9 },
  },

  categories: {
    ui:     { vol: 0.40, on: true },
    combat: { vol: 0.60, on: true },
    skill:  { vol: 0.55, on: true },
    event:  { vol: 0.50, on: true },
  },

  sounds: {
    // --- UI: short, clean pings ---
    click:   { cat:'ui', type:'osc', wave:'sine', freq:2000, fEnd:2400, dur:0.04, v:0.30 },
    equip:   { cat:'ui', type:'osc', wave:'sine', freq:700,  fEnd:1200, dur:0.12, v:0.34 },
    unequip: { cat:'ui', type:'osc', wave:'sine', freq:1200, fEnd:700,  dur:0.10, v:0.34 },

    // --- Combat ---
    // Quick percussive "pew" — square wave with fast pitch drop
    fire:      { cat:'combat', type:'both', wave:'square', freq:700, fEnd:180, dur:0.06, v:0.16, nv:0.18, nf:1800, nfEnd:500, ftype:'lowpass', vary:0.20 },
    // Short impact "tch" — tiny noise burst
    hit:       { cat:'combat', type:'noise', dur:0.03, nv:0.30, nf:1200, q:0.3 },
    // Death "kshh" — sawtooth drop + noise pop
    kill:      { cat:'combat', type:'both', wave:'sawtooth', freq:500, fEnd:80, dur:0.15, v:0.18, nv:0.25, nf:2000, nfEnd:300, ftype:'lowpass' },
    // Elite death — bigger
    eliteKill: { cat:'combat', type:'both', wave:'sawtooth', freq:600, fEnd:50, dur:0.25, v:0.16, nv:0.28, nf:2500, nfEnd:200, ftype:'lowpass' },
    // Boss death — huge rumble + explosion
    bossKill:  { cat:'combat', type:'both', wave:'sawtooth', freq:200, fEnd:12, dur:0.70, v:0.22, nv:0.40, nf:3500, nfEnd:60, ftype:'lowpass' },
    // Player takes damage — distinct impact
    playerHit: { cat:'combat', type:'both', wave:'square', freq:250, fEnd:80, dur:0.15, v:0.30, nv:0.35, nf:800, nfEnd:120, ftype:'lowpass' },
    // Explosion — big noise with filter sweep
    explode:   { cat:'combat', type:'both', wave:'sawtooth', freq:400, fEnd:25, dur:0.35, v:0.14, nv:0.40, nf:4000, nfEnd:100, ftype:'lowpass' },

    // --- Skills ---
    // Teleport whoosh — sine sweep UP + noise whoosh
    teleport:  { cat:'skill', type:'both', wave:'sine', freq:200, fEnd:3000, dur:2.00, v:0.20, nv:0.22, nf:400, nfEnd:2500, ftype:'highpass' },
    // Black hole — deep descending rumble
    blackHole: { cat:'skill', type:'both', wave:'sine', freq:55, fEnd:10, dur:2.00, v:0.30, nv:0.18, nf:500, nfEnd:40, ftype:'lowpass' },
    // Blizzard wind — filtered noise hiss
    blizzard:  { cat:'skill', type:'both', wave:'sine', freq:120, fEnd:60, dur:2.00, v:0.08, nv:0.28, nf:3000, nfEnd:300, ftype:'bandpass', q:0.25 },
    // Meteor fall — descending scream + impact
    meteor:    { cat:'skill', type:'both', wave:'sawtooth', freq:1200, fEnd:20, dur:2.00, v:0.20, nv:0.30, nf:6000, nfEnd:40, ftype:'lowpass' },

    // --- Events ---
    // Level up — ascending 3-note arpeggio
    levelUp:   { cat:'event', type:'arp', wave:'sine', dur:0.45, v:0.32,
                 notes:[[523,0.10],[659,0.10],[784,0.20]] },
    // Boss appears — deep ominous rumble
    bossSpawn: { cat:'event', type:'both', wave:'sine', freq:40, fEnd:14, dur:0.60, v:0.45, nv:0.25, nf:300, nfEnd:50, ftype:'lowpass' },
    // Item pickup — bright quick ping
    pickup:    { cat:'event', type:'osc', wave:'sine', freq:880, fEnd:1320, dur:0.08, v:0.30 },
    // Health globe — gentle descending ping
    healthGlb: { cat:'event', type:'osc', wave:'sine', freq:990, fEnd:700, dur:0.10, v:0.25 },
    // Game over — long sad descending tone
    gameOver:  { cat:'event', type:'osc', wave:'triangle', freq:220, fEnd:35, dur:0.90, v:0.28 },
    // Victory — ascending C-E-G-C arpeggio
    victory:   { cat:'event', type:'arp', wave:'sine', dur:0.70, v:0.28,
                 notes:[[523,0.12],[659,0.12],[784,0.15],[1047,0.25]] },
  },
};

// ============================================================
// Engine
// ============================================================
let ctx = null;
let masterNode = null;
let ambientNodes = null;

function ensureCtx() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterNode = ctx.createGain();
    masterNode.gain.value = AUDIO_CFG.muted ? 0 : AUDIO_CFG.master;
    masterNode.connect(ctx.destination);
    return true;
  } catch (e) { return false; }
}

// ---- Oscillator with pitch sweep ----
function oscSweep(now, s, out, catVol) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = s.wave || 'sine';
  const jitter = s.vary ? 1 + (Math.random() - 0.5) * s.vary * 2 : 1;
  const f0 = s.freq * jitter, f1 = (s.fEnd || 0) * jitter;
  osc.frequency.setValueAtTime(f0, now);
  if (f1 && f1 !== f0) {
    // Use linear ramp for percussive sounds, exponential for sweeps
    const ratio = Math.max(f0, f1) / Math.max(1, Math.min(f0, f1));
    if (ratio > 4 || s.dur > 0.3) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), now + s.dur);
    } else {
      osc.frequency.linearRampToValueAtTime(Math.max(f1, 1), now + s.dur);
    }
  }
  const peak = s.v * catVol;
  const attack = Math.min(0.003, s.dur * 0.05);     // ~5% attack
  const decay = s.dur * 0.3;                         // ~30% decay (no cap)
  const sustain = peak * 0.6;                        // sustain at 60%
  const t1 = now + attack;
  const t2 = Math.max(t1, now + s.dur - decay);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, t1);
  g.gain.setValueAtTime(peak, t1);
  g.gain.linearRampToValueAtTime(sustain, t2);
  g.gain.exponentialRampToValueAtTime(0.0001, now + s.dur);
  g.gain.setValueAtTime(0, now + s.dur + 0.002);
  osc.connect(g);
  g.connect(out);
  osc.start(now);
  osc.stop(now + s.dur + 0.01);
  osc.onended = () => { g.disconnect(); };
}

// ---- Noise with filter sweep ----
function noiseSweep(now, s, out, catVol) {
  const dur = s.dur;
  const jitter = s.vary ? 1 + (Math.random() - 0.5) * s.vary * 2 : 1;
  const sr = ctx.sampleRate;
  const len = Math.ceil(sr * dur);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = s.ftype || 'lowpass';
  filter.frequency.value = (s.nf || 800) * jitter;
  filter.Q.value = s.q || 0.6;
  if (s.nfEnd && s.nfEnd !== s.nf) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(s.nfEnd * jitter, 20), now + dur);
  }

  const g = ctx.createGain();
  const peak = s.nv * catVol;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + 0.004);
  g.gain.linearRampToValueAtTime(peak * 0.15, now + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  g.gain.setValueAtTime(0, now + dur + 0.002);

  src.connect(filter);
  filter.connect(g);
  g.connect(out);
  src.start(now);
  src.stop(now + dur + 0.01);
  src.onended = () => { g.disconnect(); filter.disconnect(); };
}

// ---- Arpeggio (sequence of tones) ----
function playArp(now, s, out, catVol) {
  const notes = s.notes || [];
  let t = 0;
  for (const [freq, noteLen] of notes) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = s.wave || 'sine';
    osc.frequency.value = freq;
    const peak = s.v * catVol;
    const startT = now + t;
    const endT = startT + noteLen;
    g.gain.setValueAtTime(0, startT);
    g.gain.linearRampToValueAtTime(peak, startT + 0.01);
    g.gain.linearRampToValueAtTime(peak * 0.4, endT - 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, endT);
    g.gain.setValueAtTime(0, endT + 0.002);
    osc.connect(g);
    g.connect(out);
    osc.start(startT);
    osc.stop(endT + 0.01);
    osc.onended = () => { g.disconnect(); };
    t += noteLen;
  }
}

// ============================================================
// Public API
// ============================================================

export function playSFX(name) {
  if (!ensureCtx()) return;
  if (AUDIO_CFG.muted) return;
  const s = AUDIO_CFG.sounds[name];
  if (!s) return;
  const cat = AUDIO_CFG.categories[s.cat];
  if (!cat || !cat.on) return;

  const now = ctx.currentTime;
  const cv = cat.vol;

  switch (s.type) {
    case 'osc':
      oscSweep(now, s, masterNode, cv);
      break;
    case 'noise':
      noiseSweep(now, s, masterNode, cv);
      break;
    case 'both':
      oscSweep(now, s, masterNode, cv);
      noiseSweep(now, s, masterNode, cv);
      break;
    case 'arp':
      playArp(now, s, masterNode, cv);
      break;
  }
}

export function startAmbient(type) {
  if (!ensureCtx()) return;
  stopAmbient();
  if (AUDIO_CFG.muted || !AUDIO_CFG.music.on) return;

  const cfg = AUDIO_CFG.ambient[type] || AUDIO_CFG.ambient.battle;
  const vol = AUDIO_CFG.music.vol;
  const stopped = {};

  // Shared filter + gain for all layers
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cfg.filterFreq;
  filter.Q.value = cfg.filterQ;

  const gain = ctx.createGain();
  gain.gain.value = vol * 0.6;
  filter.connect(gain);
  gain.connect(masterNode);

  // Layer 1: base oscillator
  const osc1 = ctx.createOscillator();
  osc1.type = cfg.osc;
  osc1.frequency.value = cfg.freq;
  osc1.connect(filter);
  osc1.start();
  stopped.osc1 = osc1;

  // Layer 2: detuned oscillator for chorus/beating
  const osc2 = ctx.createOscillator();
  osc2.type = cfg.osc;
  osc2.frequency.value = cfg.freq + cfg.detune;
  osc2.connect(filter);
  osc2.start();
  stopped.osc2 = osc2;

  // LFO on filter cutoff
  const lfo = ctx.createOscillator();
  lfo.frequency.value = cfg.lfoHz;
  const lfoG = ctx.createGain();
  lfoG.gain.value = cfg.lfoDepth;
  lfo.connect(lfoG);
  lfoG.connect(filter.frequency);
  lfo.start();
  stopped.lfo = lfo;

  // Subtle volume LFO
  const volLFO = ctx.createOscillator();
  volLFO.frequency.value = cfg.lfoHz * 0.4;
  const volLG = ctx.createGain();
  volLG.gain.value = vol * 0.15;
  volLFO.connect(volLG);
  volLG.connect(gain.gain);
  volLFO.start();
  stopped.volLFO = volLFO;

  ambientNodes = { filter, gain, lfo, lfoG, volLFO, volLG, stopped };
}

export function stopAmbient() {
  if (!ambientNodes) return;
  const stopped = ambientNodes.stopped;
  if (stopped) {
    for (const k of Object.keys(stopped)) {
      try { stopped[k].stop(); } catch (e) { /* ok */ }
    }
  }
  ambientNodes = null;
}

export function setMasterVolume(v) {
  AUDIO_CFG.master = Math.max(0, Math.min(1, v));
  if (masterNode) masterNode.gain.value = AUDIO_CFG.muted ? 0 : AUDIO_CFG.master;
}

export function toggleMute() {
  AUDIO_CFG.muted = !AUDIO_CFG.muted;
  if (masterNode) masterNode.gain.value = AUDIO_CFG.muted ? 0 : AUDIO_CFG.master;
  return AUDIO_CFG.muted;
}

export function setCategory(cat, on) {
  if (AUDIO_CFG.categories[cat]) AUDIO_CFG.categories[cat].on = on;
}

export function setMusic(on) {
  AUDIO_CFG.music.on = on;
  if (!on) stopAmbient();
}

export function isReady() {
  return ctx && ctx.state === 'running';
}
