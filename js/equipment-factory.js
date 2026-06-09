// ============================================================
// EQUIPMENT FACTORY — creates equipment items from tables
// ============================================================
import { SLOT_DEF, QUALITY_COLORS, QUALITY_MULT, ARTIFACT_DEFS, formatItemName } from './config/equipment-table.js';
import { LEGENDARY_POWERS, SET_DEFS } from './config.js';
import { QUALITY_CURVE, weightedChoice } from './config/drop-table.js';
import { clamp, rand, randChoice } from './helpers.js';

// ---- Item level ----

export function ilvlFactor(ilv) { return 0.35 + ilv * 0.0236; }

export function rollIlvl(stageIdx) {
  if (stageIdx >= 3) return 70;
  const ranges = [[1, 15], [8, 22], [15, 30]];
  const r = ranges[stageIdx] || ranges[0];
  return Math.floor(rand(r[0], r[1] + 1));
}

// ---- Stat value rolling ----

export function rollStatValue(slot, quality, ilvl) {
  const def = SLOT_DEF[slot];
  if (!def || def.base === 0) return 0;
  const base = def.base * ilvlFactor(ilvl) * QUALITY_MULT[quality];
  const v = base * (0.75 + Math.random() * 0.5);
  return Math.round(v);
}

// ---- Legendary power rolling ----

export function rollLegendaryPower(ilvl) {
  const p = { ...randChoice(LEGENDARY_POWERS) };
  const frac = (ilvl - 1) / 69;
  p.value = Math.round(p.min + (p.max - p.min) * frac * (0.5 + Math.random() * 0.5));
  p.value = clamp(p.value, p.min, p.max);
  return p;
}

// ---- Quality rolling ----

export function rollQuality(stageIdx) {
  return weightedChoice(QUALITY_CURVE.normal, { stageIdx }).quality;
}

export function rollBossQuality(stageIdx) {
  return weightedChoice(QUALITY_CURVE.boss, { stageIdx }).quality;
}

// ---- Equipment generation ----

export function generateEquipment(slot, boss, stageIdx) {
  if (!boss && Math.random() > 0.15) return null;
  const ilvl = rollIlvl(stageIdx);
  const quality = boss ? rollBossQuality(stageIdx) : rollQuality(stageIdx);
  const slotDef = SLOT_DEF[slot];
  const statValue = rollStatValue(slot, quality, ilvl);
  const eq = {
    slot, quality, ilvl, statValue,
    name: formatItemName(quality, slotDef.name),
    color: QUALITY_COLORS[quality],
    stat: slotDef.stat,
  };
  if (quality === 4) {
    const setKeys = Object.keys(SET_DEFS);
    const setName = randChoice(setKeys);
    const def = SET_DEFS[setName];
    const validSlot = randChoice(def.parts);
    const newStatValue = rollStatValue(validSlot, quality, ilvl);
    eq.slot = validSlot;
    eq.statValue = newStatValue;
    eq.stat = SLOT_DEF[validSlot].stat;
    eq.setName = setName;
    eq.color = QUALITY_COLORS[4];
    eq.name = formatItemName(4, SLOT_DEF[validSlot].name, def.name, ilvl);
    eq.power = null;
  }
  if (quality === 3) {
    eq.power = rollLegendaryPower(ilvl);
    eq.name = formatItemName(quality, slotDef.name, null, ilvl);
  }
  return eq;
}

export function generateArtifact(boss, stageIdx) {
  const ilvl = rollIlvl(stageIdx);
  const quality = boss ? rollBossQuality(stageIdx) : rollQuality(stageIdx);
  const q = Math.min(quality, 3);
  const artDef = randChoice(ARTIFACT_DEFS);
  const eq = {
    slot: 'artifact',
    quality: q,
    ilvl,
    statValue: 0,
    name: formatItemName(q, '', artDef.name, ilvl),
    color: QUALITY_COLORS[q],
    stat: 'artifact',
    power: q === 3 ? rollLegendaryPower(ilvl) : null,
    artifactId: artDef.id,
    setName: artDef.setName,
    desc: artDef.desc,
  };
  return eq;
}
