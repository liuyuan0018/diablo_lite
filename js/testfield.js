// ============================================================
// SECTION 9: TESTFIELD — Sandbox, Stats, Dummies, Loadouts
// ============================================================
import { game } from './game-state.js';
import { calcPlayerStats } from './player.js';
import {
  SET_DEFS, LEGENDARY_POWERS,
  QUALITY_NAMES, QUALITY_COLORS, QUALITY_MULT,
  SLOT_DEF, ARTIFACT_DEFS,
} from './config.js';
import { randChoice } from './helpers.js';

// ---- Sandbox ----

export function enterTestfield() {
  game.sandboxEquipment = {};
  for (const slot of Object.keys(game.equipment)) {
    const eq = game.equipment[slot];
    game.sandboxEquipment[slot] = eq ? { ...eq } : null;
  }
  game.damageStats = {
    totalDamage: 0,
    peakDamage: 0,
    dpsHistory: [],
    startTime: 0,
    skillCounts: [0, 0, 0],
  };
  game.trainingDummies = createDummies();
}

export function exitTestfield() {
  game.sandboxEquipment = null;
  game.trainingDummies = [];
  game.damageStats = { totalDamage: 0, peakDamage: 0, dpsHistory: [], startTime: 0, skillCounts: [0, 0, 0] };
}

export function resetStats() {
  game.damageStats.totalDamage = 0;
  game.damageStats.peakDamage = 0;
  game.damageStats.dpsHistory = [];
  game.damageStats.startTime = game.testfieldTime || 0;
  game.damageStats.skillCounts = [0, 0, 0];
}

export function recordDamage(amount) {
  const ds = game.damageStats;
  ds.totalDamage += amount;
  if (amount > ds.peakDamage) ds.peakDamage = amount;
  ds.dpsHistory.push({ time: game.testfieldTime || 0, damage: amount });
  const cutoff = (game.testfieldTime || 0) - 3;
  while (ds.dpsHistory.length > 0 && ds.dpsHistory[0].time < cutoff) {
    ds.dpsHistory.shift();
  }
}

export function getDPS() {
  const ds = game.damageStats;
  if (ds.dpsHistory.length === 0) return 0;
  const oldest = ds.dpsHistory[0].time;
  const newest = ds.dpsHistory[ds.dpsHistory.length - 1].time;
  const span = newest - oldest;
  if (span <= 0) return 0;
  const dmg = ds.dpsHistory.reduce((s, e) => s + e.damage, 0);
  return Math.round(dmg / span);
}

// ---- Dummies ----

function createDummies() {
  const cx = 1500, cy = 1500;
  return [
    { id: 'dummy_single', x: cx - 60, y: cy - 60, size: 24, color: '#555', label: '单体', damageReduction: 0, hp: 999999, maxHp: 999999 },
    { id: 'dummy_dr30', x: cx - 60, y: cy + 80, size: 24, color: '#665544', label: '减伤30%', damageReduction: 0.3, hp: 999999, maxHp: 999999 },
    { id: 'dummy_dr60', x: cx - 60, y: cy + 180, size: 24, color: '#554433', label: '减伤60%', damageReduction: 0.6, hp: 999999, maxHp: 999999 },
    { id: 'dummy_group1', x: cx + 100, y: cy, size: 16, color: '#666', label: '群体', damageReduction: 0, hp: 999999, maxHp: 999999 },
    { id: 'dummy_group2', x: cx + 140, y: cy, size: 16, color: '#666', label: '群体', damageReduction: 0, hp: 999999, maxHp: 999999 },
    { id: 'dummy_group3', x: cx + 60, y: cy + 60, size: 16, color: '#666', label: '群体', damageReduction: 0, hp: 999999, maxHp: 999999 },
  ];
}

// ---- Loadout Presets ----

const LOADOUT_PRESETS = [
  {
    name: '火球弹幕',
    description: '穿透火球 + 火焰风暴 (熔火之心)',
    config: {
      weapon: { quality: 3, power: 'pierce' },
      ring: { quality: 3, power: 'fireballDmg' },
      armor: { quality: 3, power: 'fireballDmg' },
      amulet: { quality: 3, power: 'pierce' },
      helmet: { quality: 2, power: null },
      boots: { quality: 2, power: null },
      bracers: { quality: 2, power: null },
      belt: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'feather' },
    },
  },
  {
    name: '冰法控制',
    description: '暴风眼 + 急冻光环 (深寒领域)',
    config: {
      helmet: { quality: 3, power: 'blizzardSize' },
      boots: { quality: 3, power: 'blizzardSlow' },
      armor: { quality: 3, power: 'blizzardSlow' },
      bracers: { quality: 3, power: 'blizzardSize' },
      weapon: { quality: 2, power: null },
      ring: { quality: 2, power: null },
      amulet: { quality: 2, power: null },
      belt: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'criticalFragment' },
    },
  },
  {
    name: '元素使',
    description: '元素使4件 + 穿透火球/火焰风暴 + 谐律之眼',
    config: {
      bracers: { quality: 4, setName: 'elementalist' },
      belt: { quality: 4, setName: 'elementalist' },
      helmet: { quality: 4, setName: 'elementalist' },
      boots: { quality: 4, setName: 'elementalist' },
      weapon: { quality: 3, power: 'pierce' },
      ring: { quality: 3, power: 'fireballDmg' },
      armor: { quality: 2, power: null },
      amulet: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'harmonyEye' },
    },
  },
  {
    name: '时空术士',
    description: '时空术士4件 + 冷却共鸣/虚空行者 + 力场发生器',
    config: {
      bracers: { quality: 4, setName: 'chronomancer' },
      belt: { quality: 4, setName: 'chronomancer' },
      armor: { quality: 4, setName: 'chronomancer' },
      ring: { quality: 4, setName: 'chronomancer' },
      helmet: { quality: 3, power: 'globalCDR' },
      amulet: { quality: 3, power: 'teleportCD' },
      weapon: { quality: 2, power: null },
      boots: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'fieldGenerator' },
    },
  },
  {
    name: '混合火冰',
    description: '穿透火球 + 暴风眼 (火冰相激)',
    config: {
      weapon: { quality: 3, power: 'pierce' },
      ring: { quality: 3, power: 'pierce' },
      helmet: { quality: 3, power: 'blizzardSize' },
      boots: { quality: 3, power: 'blizzardSize' },
      armor: { quality: 2, power: null },
      amulet: { quality: 2, power: null },
      bracers: { quality: 2, power: null },
      belt: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'feather' },
    },
  },
];

export function getLoadoutPresets() {
  return LOADOUT_PRESETS;
}

function rollMaxStatValue(slot, quality, ilvl) {
  const def = SLOT_DEF[slot];
  if (!def || def.base === 0) return 0;
  const ilv = ilvl || 70;
  const ilvF = 0.35 + ilv * 0.0236;
  const base = def.base * ilvF * QUALITY_MULT[quality];
  return Math.round(base * 0.875);
}

export function applyLoadout(presetName) {
  const preset = LOADOUT_PRESETS.find(p => p.name === presetName);
  if (!preset) return;

  const ilvl = 70;
  for (const [slot, cfg] of Object.entries(preset.config)) {
    if (cfg.quality === 4) {
      const def = SET_DEFS[cfg.setName];
      const statValue = rollMaxStatValue(slot, 4, ilvl);
      game.sandboxEquipment[slot] = {
        slot, quality: 4, ilvl, statValue,
        name: QUALITY_NAMES[4] + ' ' + def.name + ' ' + SLOT_DEF[slot].name + ' [70]',
        color: QUALITY_COLORS[4],
        stat: SLOT_DEF[slot].stat,
        power: null,
        setName: cfg.setName,
      };
    } else if (cfg.artifactId) {
      const artDef = ARTIFACT_DEFS.find(a => a.id === cfg.artifactId);
      const quality = Math.min(cfg.quality, 3);
      game.sandboxEquipment[slot] = {
        slot: 'artifact', quality, ilvl, statValue: 0,
        name: QUALITY_NAMES[quality] + artDef.name + ' [70]',
        color: QUALITY_COLORS[quality],
        stat: 'artifact',
        power: null,
        artifactId: cfg.artifactId,
        setName: artDef.setName,
      };
    } else if (cfg.power) {
      const quality = 3;
      const statValue = rollMaxStatValue(slot, quality, ilvl);
      const powerDef = LEGENDARY_POWERS.find(p => p.stat === cfg.power);
      game.sandboxEquipment[slot] = {
        slot, quality, ilvl, statValue,
        name: QUALITY_NAMES[3] + SLOT_DEF[slot].name + ' [70]',
        color: QUALITY_COLORS[3],
        stat: SLOT_DEF[slot].stat,
        power: { name: powerDef.name, desc: powerDef.desc, stat: powerDef.stat, value: powerDef.max },
      };
    } else {
      const statValue = rollMaxStatValue(slot, cfg.quality, ilvl);
      game.sandboxEquipment[slot] = {
        slot, quality: cfg.quality, ilvl, statValue,
        name: QUALITY_NAMES[cfg.quality] + SLOT_DEF[slot].name + ' [70]',
        color: QUALITY_COLORS[cfg.quality],
        stat: SLOT_DEF[slot].stat,
        power: null,
      };
    }
  }
  const stats = calcPlayerStats(true);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
}

// ---- Dummy collision helper ----

export function hitDummy(projectile, px, py) {
  for (const d of game.trainingDummies) {
    const dx = px - d.x;
    const dy = py - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < projectile.size + d.size) {
      const dmg = Math.round(projectile.damage * (1 - d.damageReduction));
      recordDamage(dmg);
      return { hit: true, dummy: d, damage: dmg, x: px, y: py };
    }
  }
  return { hit: false };
}
