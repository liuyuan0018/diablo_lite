# Config-Driven Buff System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded equipment/buff/set/artifact effects with three config tables (装备表, 掉落表, Buff表) and a runtime BuffEngine that evaluates conditions and aggregates effects. Attributes (atk, maxHp, cdr, etc.) remain engine-level metadata — never configured.

**Architecture:** Three new config modules (`buff-table.js`, `equipment-table.js`, `drop-table.js`) define ALL game content as data rows. A new `buff-engine.js` manages buff lifecycle: equip adds buffs, unequip removes them, statCalc evaluates conditions and aggregates effects. `calcPlayerStats` becomes a thin caller of `buffEngine.evaluateStatCalc()`. `renderBuffBar` auto-generates from `buffEngine.getActiveBuffs()`. Existing skill-modifying effects (pierce, blizzardSize, blackhole, ringElement, implosion, etc.) remain as code for this stage — they'll get a skill-modifier hook system in a follow-up.

**Tech Stack:** Vanilla JS ESM, browser runtime (loaded via `<script type="module">`)

---

## File Structure

```
js/
  config/
    buff-table.js          NEW — all buff definitions (stat-modifying only for MVP)
    equipment-table.js     NEW — slot/item definitions, name templates, affix slot config
    drop-table.js          NEW — quality curves, affix pools, roll rules
    index.js               NEW — re-export barrel
  buff-engine.js           NEW — runtime buff manager
  config.js                MODIFIED — remove/re-export things moved to config/
  player.js                MODIFIED — calcPlayerStats delegates to buffEngine
  equipment.js             MODIFIED — uses drop-table rules and equipment-table
  renderer.js              MODIFIED — buffBar reads from buffEngine.getActiveBuffs()
  testfield.js             MODIFIED — applyLoadout uses new tables
```

---

## Stage 1: Buff Table + Buff Engine

### Task 1: Create buff-table.js with all stat-affecting buffs

**Files:**
- Create: `js/config/buff-table.js`

- [ ] **Step 1: Write the buff table schema and all stat buffs**

```js
// js/config/buff-table.js
// ============================================================
// BUFF TABLE — every stat-affecting effect in the game
// ============================================================
// Schema:
//   id           unique key
//   name         display name (shown in buff bar)
//   color        chip color
//   detail       short detail text for buff bar
//   source       { type: 'equipStat'|'legendary'|'artifact'|'set'|'synergy'|'skill' }
//   condition    { type: string, ...params } — null means always active
//   remove       { type: string, ...params } — null means removed on unequip
//   effects      [{ attr: string, op: 'add'|'mul', value: number|'${stacks}'|'${value}' }]
//   hidden       true if should NOT appear in buff bar (e.g., raw equip stats)

// === TYPE 1: Equipment stat bonuses (hidden — raw stat additions) ===

export const STAT_BUFF_MAP = {
  atk:     { id: 'stat_atk',     name: '攻击', color: '#ccc', detail: '', hidden: true },
  cdr:     { id: 'stat_cdr',     name: '冷却', color: '#ccc', detail: '', hidden: true },
  maxHp:   { id: 'stat_maxHp',   name: '生命', color: '#ccc', detail: '', hidden: true },
  bulletSpeed: { id: 'stat_bulletSpeed', name: '弹速', color: '#ccc', detail: '', hidden: true },
  pickupRange: { id: 'stat_pickupRange', name: '拾取', color: '#ccc', detail: '', hidden: true },
  movespeed:    { id: 'stat_movespeed',  name: '移速', color: '#ccc', detail: '', hidden: true },
};

// === TYPE 2: Legendary power stat effects ===

export const LEGENDARY_BUFF_DEFS = [
  {
    id: 'fireballDmg',
    name: '火焰风暴',
    color: '#ff4400',
    detail: '增伤',
    source: { type: 'legendary', stat: 'fireballDmg' },
    condition: null,
    remove: null,
    effects: [
      { attr: 'atk', op: 'mul', value: '${value}/100' },
    ],
  },
  {
    id: 'globalCDR',
    name: '冷却共鸣',
    color: '#4488ff',
    detail: 'CDR',
    source: { type: 'legendary', stat: 'globalCDR' },
    condition: null,
    remove: null,
    effects: [
      { attr: 'cdr', op: 'add', value: '${value}' },
    ],
  },
];

// === TYPE 3: Artifact conditional stat buffs ===

export const ARTIFACT_BUFF_DEFS = [
  {
    id: 'feather',
    name: '缓落',
    color: '#ffcc44',
    detail: '增伤',
    source: { type: 'artifact', artifactId: 'feather' },
    condition: { type: 'hpAbovePct', threshold: 80 },
    remove: null, // auto-removed when condition fails (re-evaluated each statCalc)
    effects: [
      { attr: 'atk', op: 'mul', value: 0.25 },
      { attr: 'moveMult', op: 'mul', value: 0.20 },
    ],
  },
  {
    id: 'criticalFragment',
    name: '临界',
    color: '#ff6644',
    detail: '增伤',
    source: { type: 'artifact', artifactId: 'criticalFragment' },
    condition: { type: 'anySkillCdBelow', threshold: 3 },
    remove: null,
    effects: [
      { attr: 'atk', op: 'mul', value: 0.30 },
    ],
  },
];

// === TYPE 4: Set stat buffs ===

export const SET_BUFF_DEFS = [
  {
    id: 'elementalist_dmg',
    name: '谐律印记',
    color: '#44ff44',
    detail: '增伤',
    source: { type: 'set', setName: 'elementalist', count: 2 },
    condition: null, // always active when set is equipped
    remove: null,
    effects: [
      { attr: 'atk', op: 'mul', value: '${stacks} * 0.15' },
    ],
  },
  {
    id: 'elementalist_dr',
    name: '谐律护体',
    color: '#44ff44',
    detail: '减伤',
    source: { type: 'set', setName: 'elementalist', count: 4 },
    condition: null,
    remove: null,
    effects: [
      { attr: 'dmgReduc', op: 'add', value: '${stacks} * 0.10' },
    ],
  },
];

// === TYPE 5: Skill-granted timed buffs ===

export const SKILL_BUFF_DEFS = [
  {
    id: 'ghost',
    name: '幽灵',
    color: '#8888ff',
    detail: '减伤',
    source: { type: 'skill', skillName: 'teleport' },
    condition: null,
    remove: { type: 'duration', seconds: 2 },
    effects: [
      { attr: 'dmgTaken', op: 'mul', value: -0.50 },
    ],
  },
];

// === TYPE 6: Synergy stat effects (none currently are pure stat — all are skill-modifying) ===
// MoltenCore, deepFrost, fireIce, temporalResonance modify skill/projectile behavior.
// They stay as code for now, registered here for documentation:

export const SYNERGY_BUFF_DEFS = [
  // All synergies are skill-modifying, not stat-modifying. Handled in skills.js/projectiles.js.
  // This table exists for future migration when skill-modifier hooks are added.
];

// === AGGREGATE EXPORT ===
export const ALL_BUFF_DEFS = [
  ...LEGENDARY_BUFF_DEFS,
  ...ARTIFACT_BUFF_DEFS,
  ...SET_BUFF_DEFS,
  ...SKILL_BUFF_DEFS,
  ...SYNERGY_BUFF_DEFS,
];
```

- [ ] **Step 2: Verify syntax**

```bash
node --check --input-type=module js/config/buff-table.js
```

Expected: syntax OK (may need `--experimental-vm-modules` flag or similar on older Node; ignore import resolution errors — we only check syntax)

---

### Task 2: Create buff-engine.js core

**Files:**
- Create: `js/buff-engine.js`

- [ ] **Step 1: Write the BuffEngine class**

```js
// js/buff-engine.js
// ============================================================
// BUFF ENGINE — runtime buff lifecycle manager
// ============================================================
import { game } from './game-state.js';
import {
  ALL_BUFF_DEFS, STAT_BUFF_MAP,
  LEGENDARY_BUFF_DEFS, ARTIFACT_BUFF_DEFS, SET_BUFF_DEFS, SKILL_BUFF_DEFS,
} from './config/buff-table.js';

// Active buff instance: { id, def, source, params, addedAt }

let _activeBuffs = []; // flat list of active buff instances
let _buffIdCounter = 0;

// ---- Public API ----

/** Rebuild all buffs from current equipment state. Called on equip/unequip/load. */
export function rebuildAllBuffs(sandbox) {
  _activeBuffs = [];
  _buffIdCounter = 0;
  const eq = sandbox ? (game.sandboxEquipment || game.equipment) : game.equipment;

  // 1. Equipment stat buffs (hidden)
  for (const [slot, item] of Object.entries(eq)) {
    if (!item || item.statValue === undefined) continue;
    const statDef = STAT_BUFF_MAP[item.stat];
    if (statDef && item.statValue !== 0) {
      _addBuffInstance({
        defId: statDef.id,
        source: { slot, type: 'equipStat' },
        params: { value: item.statValue },
      });
    }

    // 2. Legendary power buffs
    if (item.power && item.power.stat) {
      const lbDef = LEGENDARY_BUFF_DEFS.find(d => d.id === item.power.stat);
      if (lbDef) {
        _addBuffInstance({
          defId: lbDef.id,
          source: { slot, type: 'legendary' },
          params: { value: item.power.value },
        });
      }
    }

    // 3. Artifact buffs
    if (item.artifactId) {
      const artDefs = ARTIFACT_BUFF_DEFS.filter(d => d.source.artifactId === item.artifactId);
      for (const ad of artDefs) {
        _addBuffInstance({
          defId: ad.id,
          source: { slot, type: 'artifact' },
          params: {},
        });
      }
    }

    // 4. Set buffs — evaluated per-slot, but deduplicated by count check
    if (item.setName) {
      const setDefs = SET_BUFF_DEFS.filter(d => d.source.setName === item.setName);
      for (const sd of setDefs) {
        _addBuffInstance({
          defId: sd.id,
          source: { slot, type: 'set', setName: item.setName },
          params: {},
        });
      }
    }
  }
}

/** Evaluate all buffs for statCalc phase. Returns aggregate effect deltas. */
export function evaluateStatCalc() {
  const p = game.player;
  const deltas = {}; // { attr: accumulatedValue }

  for (const inst of _activeBuffs) {
    const def = _getDef(inst.defId);
    if (!def) continue;

    // Check condition
    if (def.condition && !_evalCondition(def.condition, p, inst)) continue;

    // Apply effects
    if (!def.effects) continue;
    for (const eff of def.effects) {
      const resolvedValue = _resolveValue(eff.value, inst.params, p);
      if (!deltas[eff.attr]) deltas[eff.attr] = { add: 0, mul: 1 };
      if (eff.op === 'add') {
        deltas[eff.attr].add += resolvedValue;
      } else if (eff.op === 'mul') {
        deltas[eff.attr].mul *= (1 + resolvedValue);
      }
    }
  }

  return deltas;
}

/** Get visible buffs for UI rendering. */
export function getActiveBuffs() {
  const p = game.player;
  const result = [];
  for (const inst of _activeBuffs) {
    const def = _getDef(inst.defId);
    if (!def || def.hidden) continue;
    // Evaluate condition — only show if active right now
    if (def.condition && !_evalCondition(def.condition, p, inst)) continue;
    result.push({
      id: inst.defId,
      name: def.name,
      color: def.color,
      detail: def.detail,
      instanceId: inst.instanceId,
    });
  }
  return result;
}

/** Check if a specific named buff exists (used by ghost buff check, temporal resonance, etc.). */
export function hasBuff(buffId) {
  for (const inst of _activeBuffs) {
    if (inst.defId === buffId) {
      const def = _getDef(inst.defId);
      if (!def || !def.condition) return true;
      if (_evalCondition(def.condition, game.player, inst)) return true;
    }
  }
  return false;
}

/** Add a timed buff from a skill. Returns instanceId for later removal. */
export function addTimedBuff(buffId, params = {}) {
  const def = _getDef(buffId);
  if (!def) return null;
  return _addBuffInstance({ defId: buffId, source: { type: 'skill' }, params });
}

/** Remove a specific buff by instanceId. */
export function removeBuff(instanceId) {
  const idx = _activeBuffs.findIndex(b => b.instanceId === instanceId);
  if (idx >= 0) _activeBuffs.splice(idx, 1);
}

/** Remove timed buffs that have expired. Call each frame from updatePlayer. */
export function tickTimedBuffs(dt) {
  for (let i = _activeBuffs.length - 1; i >= 0; i--) {
    const inst = _activeBuffs[i];
    const def = _getDef(inst.defId);
    if (!def || !def.remove || def.remove.type !== 'duration') continue;
    inst._elapsed = (inst._elapsed || 0) + dt;
    if (inst._elapsed >= def.remove.seconds) {
      _activeBuffs.splice(i, 1);
    }
  }
}

/** Reset all buffs (called on game start). */
export function resetBuffs() {
  _activeBuffs = [];
  _buffIdCounter = 0;
}

// ---- Internal helpers ----

const _defCache = {};
function _getDef(defId) {
  if (_defCache[defId]) return _defCache[defId];
  _defCache[defId] = ALL_BUFF_DEFS.find(d => d.id === defId) || null;
  return _defCache[defId];
}

function _addBuffInstance({ defId, source, params }) {
  const inst = {
    instanceId: ++_buffIdCounter,
    defId,
    source,
    params,
    addedAt: game.time || 0,
    _elapsed: 0,
  };
  _activeBuffs.push(inst);
  return inst.instanceId;
}

function _evalCondition(cond, player, inst) {
  switch (cond.type) {
    case 'hpAbovePct': {
      const ratio = player.hp / Math.max(1, player.maxHp) * 100;
      return ratio > cond.threshold;
    }
    case 'anySkillCdBelow': {
      return player.skillCooldowns.some(cd => cd > 0 && cd < cond.threshold);
    }
    default:
      return true;
  }
}

function _resolveValue(valueExpr, params, player) {
  if (typeof valueExpr === 'number') return valueExpr;
  if (typeof valueExpr !== 'string') return 0;
  // Replace ${value}, ${stacks}
  let result = valueExpr
    .replace(/\$\{value\}/g, params.value || 0)
    .replace(/\$\{stacks\}/g, player.elementalistStacks || 0);
  // Simple eval for expressions like "0.15 * ${stacks}" → after replace: "0.15 * 3"
  try {
    // Only eval if it looks like a math expression (contains numbers and operators)
    if (/^[\d\s+\-*/.()]+$/.test(result)) {
      // eslint-disable-next-line no-eval
      return eval(result);
    }
    return parseFloat(result) || 0;
  } catch (e) {
    return 0;
  }
}
```

- [ ] **Step 2: Verify syntax**

```bash
node --check --input-type=module js/buff-engine.js
```

---

### Task 3: Wire buff-engine into calcPlayerStats

**Files:**
- Modify: `js/player.js:22-92`

- [ ] **Step 1: Replace the hardcoded legendary/artifact/set stat logic with buffEngine calls**

```js
// In js/player.js, add import at top:
import { rebuildAllBuffs, evaluateStatCalc, tickTimedBuffs, hasBuff } from './buff-engine.js';

// Replace getLegendaryEffects (lines 22-30): keep it for skill-modifying powers,
// but note that stat portions are now handled by buff engine.
// Actually, getLegendaryEffects is still needed by skills.js for pierce, blizzardSize, etc.
// Keep it as-is for now.

// In calcPlayerStats (lines 32-92), replace the manual stat application:
export function calcPlayerStats(sandbox) {
  const lv = game.player.level;
  const baseHP = 100 + (lv - 1) * 5;
  const baseATK = 10 + (lv - 1) * 2;

  // Rebuild buffs from current equipment state
  rebuildAllBuffs(sandbox);

  // Get aggregated effect deltas from buff engine
  const deltas = evaluateStatCalc();

  // --- Stat accumulators from buff deltas ---
  // Equipment raw stats come through as stat_atk/add, stat_cdr/add, etc.
  // Legendary effects come through as fireballDmg/mul, globalCDR/add, etc.
  // Artifact effects come through as feather/mul, criticalFragment/mul
  // Set effects come through as elementalist_dmg/mul, elementalist_dr/add

  let bATK = 0, bCDR = 0, bHP = 0, bSpeed = 0, bRange = 0, bMove = 0;

  // Extract additive stats from deltas
  if (deltas.atk)      bATK   += deltas.atk.add;
  if (deltas.cdr)      bCDR   += deltas.cdr.add;
  if (deltas.maxHp)    bHP    += deltas.maxHp.add;
  if (deltas.bulletSpeed) bSpeed += deltas.bulletSpeed.add;
  if (deltas.pickupRange) bRange += deltas.pickupRange.add;
  if (deltas.movespeed) bMove   += deltas.movespeed.add;

  // Multiplicative stats
  let atkMul    = deltas.atk      ? deltas.atk.mul      : 1;
  let moveMul   = deltas.moveMult ? deltas.moveMult.mul : 1;

  // DR from buffs
  let bDR = deltas.dmgReduc ? deltas.dmgReduc.add : 0;

  // Skill-modifying legendary effects (keep existing getLegendaryEffects for skills.js)
  const fx = getLegendaryEffects(sandbox);
  // Add globalCDR from legendary (already in deltas.cdr.add, but keep in fx for skills)
  bCDR += fx.globalCDR || 0;

  // Derived stats
  const bSpeedVal = BASE_BULLET_SPEED + bSpeed;
  const fireRate = BASE_FIRE_RATE + (bSpeedVal - BASE_BULLET_SPEED) * 0.01;
  const finalAtk = Math.round((baseATK + bATK) * atkMul);

  // Elementalist stacks for set buffs (still needed by skills.js for tracking)
  // The set DR/dmgMult is now handled via buff engine deltas

  // FireballDmg legendary — already applied via atkMul from buff engine
  // But we still keep bATK * (1 + fx.fireballDmg/100) in getLegendaryEffects
  // for skills.js to use directly. The buff engine applies it to stat calc.
  // To avoid double-application: remove fireballDmg from the buff engine's atk mul
  // and keep it here... Actually, let's keep it simple:
  // buff engine handles ALL stat effects. getLegendaryEffects is ONLY for
  // skill-modifying values consumed by skills.js/projectiles.js.

  // For fireballDmg: it affects both stat calc (atk) AND skill damage (blackhole/blizzard tick).
  // Stat portion: buff engine (atkMul). Skill portion: fx.fireballDmg (read by skills.js).
  // Since the buff engine already applied fireballDmg to atkMul, don't double-apply here.

  // CDR from buff engine (includes globalCDR from legendary)
  const cdr = Math.min(bCDR, 60);

  return {
    maxHP: baseHP + bHP,
    atk: finalAtk,
    cdr,
    bulletSpeed: bSpeedVal,
    pickupRange: BASE_PICKUP_RANGE + bRange,
    movespeed: bMove,
    moveMult: moveMul,
    fireRate,
    legendary: fx, // still needed by skills.js/projectiles.js
    setDmgMult: 1,    // now handled via buff engine atkMul
    setDmgReduc: bDR, // now from buff engine
    synergies: getSynergyEffects(),
    ringElement: game.player.ringElement,
    ringTimer: game.player.ringCycleTimer,
  };
}
```

- [ ] **Step 2: Verify syntax**

```bash
node --check --input-type=module js/player.js
```

---

### Task 4: Verify existing stat calculations still produce correct values

**Files:**
- Modify: `js/buff-engine.js` (debug logging)
- Test: manual run in browser

- [ ] **Step 1: Add temporary debug to buff engine**

```js
// In buff-engine.js, after evaluateStatCalc, add:
if (window.DEBUG_BUFFS) {
  console.log('BuffEngine deltas:', JSON.stringify(deltas, null, 2));
  console.log('Active buffs:', getActiveBuffs().map(b => b.name));
}
```

- [ ] **Step 2: Start the app, open testfield, apply a preset, check console**

Expected: atk/maxHP/cdr values match the values before the refactor.

Run: `npx http-server . -p 8080 -c-1`
Then open `http://localhost:8080` in browser, open testfield, apply "时空术士" preset, press F12, type `DEBUG_BUFFS=true` in console, observe buffEngine output.

- [ ] **Step 3: Remove debug code after verification**

Remove the `if (window.DEBUG_BUFFS)` block from buff-engine.js.

---

### Task 5: Replace buff bar rendering with buffEngine.getActiveBuffs()

**Files:**
- Modify: `js/renderer.js:940-1026`

- [ ] **Step 1: Rewrite renderBuffBar to read from buff engine**

```js
// In renderer.js, add import:
import { getActiveBuffs } from './buff-engine.js';

// Replace the entire renderBuffBar function (lines 940-1026):
function renderBuffBar() {
  const W = canvas.width, H = canvas.height;
  const buffs = getActiveBuffs();
  
  // Add set indicators (these are "always active" when equipped but not conditional,
  // so getActiveBuffs already includes them via SET_BUFF_DEFS)
  // Add elementalist stacks display (stacks are player state, not a buff def)
  if (game.player.elementalistStacks > 0) {
    buffs.push({
      name: '谐律x' + game.player.elementalistStacks,
      color: game.player.elementalistStacks === 3 ? '#ffd700' : '#ff8800',
      detail: ['火','冰','奥'][game.player.elementalistLastElement] || '',
    });
  }
  
  // Ring element display (still custom — cycling logic is in player.js)
  if (game.player.ringElement !== undefined && game.player.ringCycleTimer !== undefined) {
    const elNames = ['火','冰','奥'];
    const elColors = ['#ff4400','#4488ff','#aa44ff'];
    const el = game.player.ringElement;
    const remain = Math.ceil(4 - game.player.ringCycleTimer);
    buffs.push({
      name: '戒·' + elNames[el],
      color: elColors[el],
      detail: remain + 's',
    });
  }
  
  // Temporal resonance (duration-based, tracked in player state)
  if (game.player.temporalResonanceTimer > 0) {
    buffs.push({
      name: '时空共鸣',
      color: '#8844ff',
      detail: Math.ceil(game.player.temporalResonanceTimer) + 's',
    });
  }

  if (buffs.length === 0) return;

  const chipW = 90, chipH = 20, gap = 6;
  const totalW = buffs.length * chipW + (buffs.length - 1) * gap;
  const startX = W / 2 - totalW / 2;
  const barY = H - 135;

  for (let i = 0; i < buffs.length; i++) {
    const b = buffs[i];
    const cx = startX + i * (chipW + gap);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1;
    roundRect(ctx, cx, barY, chipW, chipH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = b.color;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, cx + chipW / 2, barY + 8);
    ctx.fillStyle = '#aaa';
    ctx.font = '7px sans-serif';
    ctx.fillText(b.detail || '', cx + chipW / 2, barY + 17);
    ctx.textAlign = 'start';
  }
}
```

- [ ] **Step 2: Verify buff bar renders correctly**

Start app, apply a loadout with artifact + legendary powers + set items. Confirm all buff chips appear.

---

### Task 6: Wire ghost buff through buff engine

**Files:**
- Modify: `js/skills.js:39-40` (teleport ghost buff)
- Modify: `js/player.js:14-17` (damagePlayer ghost check)

- [ ] **Step 1: Replace hardcoded ghost buff in teleport**

```js
// In skills.js, replace:
//   p.buffs = p.buffs.filter(b => b.type !== 'ghost');
//   if (game.equipment.boots && game.equipment.boots.quality === 3) {
//     p.buffs.push({ type: 'ghost', timer: 2 });
//   }
// With:
import { addTimedBuff } from './buff-engine.js';

// In teleport cast:
const ghostBuff = game.player.buffs.find(b => b.type === 'ghost');
if (ghostBuff) {
  game.player.buffs = game.player.buffs.filter(b => b.type !== 'ghost');
}
if (game.equipment.boots && game.equipment.boots.quality === 3) {
  game.player.buffs.push({ type: 'ghost', timer: 2 });
  addTimedBuff('ghost', {});
}
```

- [ ] **Step 2: Replace ghost check in damagePlayer**

```js
// In player.js damagePlayer:
// Replace:
//   if(p.buffs.find(b=>b.type==='ghost')) dmg*=0.5;
// With:
import { hasBuff } from './buff-engine.js';
if (hasBuff('ghost')) dmg *= 0.5;
```

---

## Stage 2: Equipment Table

### Task 7: Create equipment-table.js

**Files:**
- Create: `js/config/equipment-table.js`

- [ ] **Step 1: Write equipment table**

```js
// js/config/equipment-table.js
// ============================================================
// EQUIPMENT TABLE — slot definitions, name templates, affix slots
// ============================================================

// Per-quality affix slot count
export const QUALITY_AFFIX_SLOTS = {
  0: { statSlots: 0, legendarySlots: 0 },  // 普通
  1: { statSlots: 1, legendarySlots: 0 },  // 魔法
  2: { statSlots: 1, legendarySlots: 0 },  // 稀有 (higher value range)
  3: { statSlots: 1, legendarySlots: 1 },  // 传说
  4: { statSlots: 0, legendarySlots: 0 },  // 套装 (fixed set affixes instead)
};

export const QUALITY_NAMES = ['普通', '魔法', '稀有', '传说', '套装'];
export const QUALITY_COLORS = ['#aaaaaa', '#4488ff', '#ffd700', '#ff6600', '#44ff44'];
export const QUALITY_MULT = [1, 1.4, 1.9, 2.5, 2.5];

// Slot definitions — one row per slot
export const SLOT_DEFS = [
  { slot: 'weapon',  stat: 'atk',          name: '武器', base: 10, legendaryOnly: false },
  { slot: 'helmet',  stat: 'cdr',          name: '头盔', base: 3,  legendaryOnly: false },
  { slot: 'armor',   stat: 'maxHp',        name: '护甲', base: 25, legendaryOnly: false },
  { slot: 'ring',    stat: 'bulletSpeed',  name: '戒指', base: 30, legendaryOnly: false },
  { slot: 'amulet',  stat: 'pickupRange',  name: '项链', base: 12, legendaryOnly: false },
  { slot: 'boots',   stat: 'movespeed',    name: '靴子', base: 0,  legendaryOnly: true },
  { slot: 'bracers', stat: 'atk',          name: '护腕', base: 8,  legendaryOnly: false },
  { slot: 'belt',    stat: 'maxHp',        name: '腰带', base: 20, legendaryOnly: false },
  { slot: 'artifact',stat: 'artifact',     name: '法器', base: 0,  legendaryOnly: true },
];

// Artifact definitions
export const ARTIFACT_DEFS = [
  { id: 'harmonyEye',      name: '谐律之眼', setName: 'elementalist', desc: '谐律爆发追踪单体，伤害+50%范围缩小' },
  { id: 'fieldGenerator',  name: '力场发生器', setName: 'chronomancer', desc: '力场持续+3s，不被坍缩消耗' },
  { id: 'feather',         name: '缓落之羽', setName: null,           desc: 'HP>80%时技能伤害+25%移速+20%' },
  { id: 'criticalFragment',name: '临界碎片', setName: null,           desc: '任一技能CD<3s时所有技能伤害+30%' },
];

// Name format: {quality} + {name} + [{ilvl}] — or for set: {quality} + {setName} + {slotName} + [{ilvl}]
export function formatItemName(quality, slotDef, ilvl, setName, artifactDef) {
  if (setName && quality === 4) {
    return QUALITY_NAMES[4] + ' ' + setName + ' ' + slotDef.name + ' [' + ilvl + ']';
  }
  if (artifactDef) {
    return QUALITY_NAMES[Math.min(quality, 3)] + artifactDef.name + ' [' + ilvl + ']';
  }
  return QUALITY_NAMES[quality] + slotDef.name + ' [' + ilvl + ']';
}

// Helpers:
export function getSlotDef(slot) { return SLOT_DEFS.find(s => s.slot === slot); }
export function getArtifactDef(id) { return ARTIFACT_DEFS.find(a => a.id === id); }
```

- [ ] **Step 2: Verify syntax**

```bash
node --check --input-type=module js/config/equipment-table.js
```

---

### Task 8: Create equipment-factory.js

**Files:**
- Create: `js/equipment-factory.js`

- [ ] **Step 1: Write equipment factory that reads from config tables**

```js
// js/equipment-factory.js
// ============================================================
// EQUIPMENT FACTORY — creates equipment items from config tables
// ============================================================
import { getSlotDef, getArtifactDef, QUALITY_NAMES, QUALITY_COLORS, QUALITY_MULT, QUALITY_AFFIX_SLOTS, formatItemName, ARTIFACT_DEFS } from './config/equipment-table.js';
import { LEGENDARY_POWERS, SET_DEFS } from './config.js'; // still in old config for now
import { rollIlvl } from './config.js';
import { rand, randChoice } from './helpers.js';

// Stat value calculator — moved here from config.js
export function rollStatValue(slot, quality, ilvl) {
  const def = getSlotDef(slot);
  if (!def || def.base === 0) return 0;
  const ilvF = 0.35 + ilvl * 0.0236;
  const base = def.base * ilvF * QUALITY_MULT[quality];
  const v = base * (0.75 + Math.random() * 0.5);
  return Math.round(v);
}

export function rollLegendaryPower(ilvl) {
  const p = { ...randChoice(LEGENDARY_POWERS) };
  const frac = (ilvl - 1) / 69;
  p.value = Math.round(p.min + (p.max - p.min) * frac * (0.5 + Math.random() * 0.5));
  p.value = Math.max(p.min, Math.min(p.max, p.value));
  return p;
}

export function generateEquipment(slot, boss, stageIdx) {
  // ... (move existing generateEquipment here, using getSlotDef and formatItemName)
}
```

Full implementation of `generateEquipment` and `generateArtifact` (moved from equipment.js, updated to use new tables):

```js
export function generateEquipment(slot, boss, stageIdx) {
  if (!boss && Math.random() > 0.15) return null;
  const ilvl = rollIlvl(stageIdx);
  const quality = boss ? rollBossQuality(stageIdx) : rollQuality(stageIdx);
  const slotDef = getSlotDef(slot);
  const statValue = rollStatValue(slot, quality, ilvl);
  const eq = {
    slot, quality, ilvl, statValue,
    name: formatItemName(quality, slotDef, ilvl),
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
    eq.stat = getSlotDef(validSlot).stat;
    eq.setName = setName;
    eq.color = QUALITY_COLORS[4];
    eq.name = formatItemName(4, getSlotDef(validSlot), ilvl, def.name);
    eq.power = null;
  }
  if (quality === 3) {
    eq.power = rollLegendaryPower(ilvl);
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
    name: formatItemName(q, getSlotDef('artifact'), ilvl, null, artDef),
    color: QUALITY_COLORS[q],
    stat: 'artifact',
    power: q === 3 ? rollLegendaryPower(ilvl) : null,
    artifactId: artDef.id,
    setName: artDef.setName,
    desc: artDef.desc,
  };
  return eq;
}

// Quality roll functions moved here
export function rollQuality(stageIdx) {
  const r = Math.random();
  if (r < 0.40) return 0;
  if (r < 0.68) return 1;
  if (r < 0.85) return 2;
  if (r < 0.96 || stageIdx < 3) return 3;
  return 4;
}

export function rollBossQuality(stageIdx) {
  const r = Math.random();
  if (r < 0.40) return 2;
  if (stageIdx < 3) return 3;
  if (r < 0.82) return 3;
  return 4;
}
```

- [ ] **Step 2: Verify syntax**

---

### Task 9: Update equipment.js to delegate to equipment-factory

**Files:**
- Modify: `js/equipment.js`

- [ ] **Step 1: Re-export from factory, remove old implementations**

```js
// js/equipment.js — now a thin delegation layer
import { game } from './game-state.js';
import {
  generateEquipment, generateArtifact,
  rollQuality, rollBossQuality, rollStatValue,
} from './equipment-factory.js';
import { getSlotDef } from './config/equipment-table.js';
import { BASE_PICKUP_RANGE } from './config.js';
import { randChoice, dist } from './helpers.js';
import { calcPlayerStats } from './player.js';
import { spawnParticles } from './particles.js';
import { saveGame } from './persistence.js';
import { playSFX } from './audio.js';

// Re-export for other modules
export { generateEquipment, generateArtifact, rollQuality, rollBossQuality, rollStatValue };

export function getSlotName(slot) {
  const def = getSlotDef(slot);
  return def ? def.name : slot;
}

// tryDropEquipment, updatePickup remain unchanged
export function tryDropEquipment(x, y, boss, stageIdx) {
  const slots = ['weapon', 'helmet', 'armor', 'ring', 'amulet', 'boots', 'bracers', 'belt', 'artifact'];
  const slot = randChoice(slots);
  if (slot === 'artifact') {
    const art = generateArtifact(boss, stageIdx);
    if (art) game.drops.push({ x, y, ...art, bobPhase: Math.random() * Math.PI * 2 });
    return;
  }
  const eq = generateEquipment(slot, boss, stageIdx);
  if (eq) {
    game.drops.push({ x, y, ...eq, bobPhase: Math.random() * Math.PI * 2 });
  }
}

export function updatePickup(dt) {
  // ... unchanged ...
}

export function gainExp(amount) {
  // ... unchanged ...
}
```

- [ ] **Step 2: Verify all imports still resolve**

Check each consumer of the old exports still gets what it needs.

---

### Task 10: Update testfield.js to use equipment-table

**Files:**
- Modify: `js/testfield.js:174-224` (applyLoadout)  
- Modify: `js/testfield.js:1-11` (imports)

- [ ] **Step 1: Update imports**

```js
// In testfield.js, replace config.js imports with:
import {
  SET_DEFS, LEGENDARY_POWERS,
} from './config.js';
import {
  QUALITY_NAMES, QUALITY_COLORS, QUALITY_MULT,
  SLOT_DEFS as SLOT_DEF_ARRAY, ARTIFACT_DEFS,
  getSlotDef, getArtifactDef, formatItemName,
} from './config/equipment-table.js';
import { rollStatValue } from './equipment-factory.js';
import { rollLegendaryPower } from './equipment-factory.js';
```

- [ ] **Step 2: Update applyLoadout to use new helpers**

```js
export function applyLoadout(presetName) {
  const preset = LOADOUT_PRESETS.find(p => p.name === presetName);
  if (!preset) return;

  const ilvl = 70;
  for (const [slot, cfg] of Object.entries(preset.config)) {
    const slotDef = getSlotDef(slot);
    if (cfg.quality === 4) {
      const def = SET_DEFS[cfg.setName];
      const statValue = rollStatValue(slot, 4, ilvl);
      game.sandboxEquipment[slot] = {
        slot, quality: 4, ilvl, statValue,
        name: formatItemName(4, slotDef, ilvl, def.name),
        color: QUALITY_COLORS[4],
        stat: slotDef.stat,
        power: null,
        setName: cfg.setName,
      };
    } else if (cfg.artifactId) {
      const artDef = getArtifactDef(cfg.artifactId);
      const quality = Math.min(cfg.quality, 3);
      game.sandboxEquipment[slot] = {
        slot: 'artifact', quality, ilvl, statValue: 0,
        name: formatItemName(quality, getSlotDef('artifact'), ilvl, null, artDef),
        color: QUALITY_COLORS[quality],
        stat: 'artifact',
        power: quality === 3 ? rollLegendaryPower(ilvl) : null,
        artifactId: cfg.artifactId,
        setName: artDef.setName,
        desc: artDef.desc,
      };
    } else if (cfg.power) {
      const quality = 3;
      const statValue = rollStatValue(slot, quality, ilvl);
      const powerDef = LEGENDARY_POWERS.find(p => p.stat === cfg.power);
      game.sandboxEquipment[slot] = {
        slot, quality, ilvl, statValue,
        name: formatItemName(3, slotDef, ilvl),
        color: QUALITY_COLORS[3],
        stat: slotDef.stat,
        power: { name: powerDef.name, desc: powerDef.desc, stat: powerDef.stat, value: powerDef.max },
      };
    } else {
      const statValue = rollStatValue(slot, cfg.quality, ilvl);
      game.sandboxEquipment[slot] = {
        slot, quality: cfg.quality, ilvl, statValue,
        name: formatItemName(cfg.quality, slotDef, ilvl),
        color: QUALITY_COLORS[cfg.quality],
        stat: slotDef.stat,
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
```

---

## Stage 3: Drop Table

### Task 11: Create drop-table.js

**Files:**
- Create: `js/config/drop-table.js`

- [ ] **Step 1: Write drop table with quality curves and affix pools**

```js
// js/config/drop-table.js
// ============================================================
// DROP TABLE — quality curves, affix pools, roll rules
// ============================================================

// Quality probability curves by source
export const QUALITY_CURVE = {
  normal: [
    { quality: 0, weight: 40 },
    { quality: 1, weight: 28 },
    { quality: 2, weight: 17 },
    { quality: 3, weight: 11 },  // legendary
    { quality: 4, weight: 4 },   // set (only at ilvl>=70)
  ],
  boss: [
    { quality: 2, weight: 40 },
    { quality: 3, weight: 42 },
    { quality: 4, weight: 18 },  // set (only at ilvl>=70)
  ],
};

// Stage-level restrictions
export const STAGE_RESTRICTIONS = {
  minStageForSet: 3,    // Set items only from stage 3+ (ilvl 70)
  minStageForLegendary: 0,
};

// Affix pools — what can roll on each quality tier
export const AFFIX_POOLS = {
  stat: [
    { id: 'atk', weight: 1 },
    { id: 'cdr', weight: 1 },
    { id: 'maxHp', weight: 1 },
    { id: 'bulletSpeed', weight: 1 },
    { id: 'pickupRange', weight: 1 },
    { id: 'movespeed', weight: 1 },
  ],
  legendary: [
    { id: 'blackholeSize', weight: 2 },
    { id: 'pierce', weight: 2 },
    { id: 'blizzardSize', weight: 2 },
    { id: 'blackholeDur', weight: 1 },
    { id: 'globalCDR', weight: 2 },
    { id: 'fireballDmg', weight: 2 },
    { id: 'blizzardSlow', weight: 2 },
    { id: 'teleportCD', weight: 1 },
    { id: 'ringElement', weight: 1 },
  ],
};

// Value scaling multiplier per quality (relative to base)
export const QUALITY_VALUE_MULT = {
  0: 1.0,    // 普通 — base range
  1: 1.4,    // 魔法 — +40%
  2: 1.9,    // 稀有 — +90%
  3: 2.5,    // 传说 — +150%
  4: 2.5,    // 套装 — same as legendary
};

// Weighted random selector
export function weightedChoice(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
```

---

### Task 12: Wire drop-table into equipment-factory

**Files:**
- Modify: `js/equipment-factory.js` — use drop-table for quality rolls

- [ ] **Step 1: Replace rollQuality/rollBossQuality with table-driven versions**

```js
// In equipment-factory.js, import drop table:
import {
  QUALITY_CURVE, STAGE_RESTRICTIONS, weightedChoice,
} from './config/drop-table.js';

export function rollQuality(stageIdx) {
  const curve = QUALITY_CURVE.normal.filter(c => {
    if (c.quality === 4 && stageIdx < STAGE_RESTRICTIONS.minStageForSet) return false;
    if (c.quality === 3 && stageIdx < STAGE_RESTRICTIONS.minStageForLegendary) return false;
    return true;
  });
  // Normalize weights for filtered curve
  return weightedChoice(curve).quality;
}

export function rollBossQuality(stageIdx) {
  const curve = QUALITY_CURVE.boss.filter(c => {
    if (c.quality === 4 && stageIdx < STAGE_RESTRICTIONS.minStageForSet) return false;
    return true;
  });
  return weightedChoice(curve).quality;
}
```

- [ ] **Step 2: Verify drop quality distribution**

Add a quick smoke test: roll 1000 times at stage 0 and stage 3, check that quality 4 never appears at stage 0 but does at stage 3.

---

## Stage 4: Cleanup

### Task 13: Create config/index.js barrel

**Files:**
- Create: `js/config/index.js`

```js
// js/config/index.js — re-export barrel
export * from './buff-table.js';
export * from './equipment-table.js';
export * from './drop-table.js';
```

### Task 14: Remove dead code from config.js

**Files:**
- Modify: `js/config.js`

- [ ] **Step 1: Remove definitions moved to table files**

Remove from config.js:
- `SLOT_DEF` (moved to equipment-table.js as SLOT_DEFS)
- `ARTIFACT_DEFS` (moved to equipment-table.js)
- `QUALITY_NAMES`, `QUALITY_COLORS`, `QUALITY_MULT` (moved to equipment-table.js)
- `rollIlvl`, `rollStatValue`, `rollLegendaryPower` (moved to equipment-factory.js)

Keep in config.js:
- `LEGENDARY_POWERS` (still consumed by skills.js for skill-modifying effects, and by equipment-factory)
- `SET_DEFS` (still consumed by sets.js)
- `SYNERGY_DEFS` (still consumed by synergies.js)
- `SKILL_CONFIG`, `STAGES`, `DIFFICULTY`, `MONSTER_BASE`, etc. (not equipment-related)
- `MAP_W`, `MAP_H`, `TILE_SIZE`, `PLAYER_RADIUS`, etc. (engine constants)

- [ ] **Step 2: Update all imports across the codebase**

Every file that imported from `'./config.js'` the removed symbols now imports from:
- `'./config/equipment-table.js'` for QUALITY_NAMES, QUALITY_COLORS, QUALITY_MULT, ARTIFACT_DEFS, slot defs
- `'./equipment-factory.js'` for rollStatValue, rollLegendaryPower, rollQuality, rollBossQuality

Update: `renderer.js`, `gameplay.js`, `equipment.js`, `player.js`, `skills.js`, `testfield.js`

---

## Stage 5: Validation

### Task 15: End-to-end verification

- [ ] **Step 1: Start app, play through stage 1-3, verify drops work**

Run: `npx http-server . -p 8080 -c-1`

Test checklist:
- [ ] Kill monsters → equipment drops appear with correct quality colors
- [ ] Pick up items → backpack shows correct name, quality, stat, power
- [ ] Equip items → stats update correctly (atk, maxHP, cdr visible in HUD)
- [ ] Equip legendary item → buff bar shows legendary buff chip
- [ ] Equip artifact (feather) → buff bar shows "缓落" when HP > 80%, disappears when HP drops
- [ ] Equip artifact (criticalFragment) → buff bar shows "临界" when any skill CD < 3s
- [ ] Equip 2+ set items → set buffs appear, set effects work in combat
- [ ] Sandbox testfield → apply preset, all stats match expected values
- [ ] Sandbox testfield → manual slot picker shows correct options, applies correctly
- [ ] Victory screen → ground items and backpack items show correct info
- [ ] Hover tooltip → artifact shows desc + legendary power
- [ ] Compare tooltip → correct diff display for all item types

- [ ] **Step 2: Fix any regressions found**

---

## Rollback Plan

If the refactor breaks too much: revert to the commit before Task 1. All new files are under `js/config/` and `js/buff-engine.js` / `js/equipment-factory.js` — nothing irreversibly overwrites the originals until Task 14 (cleanup). The old code in config.js and player.js is modified in-place but the logic is preserved in comments during the transition.
