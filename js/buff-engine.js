// ============================================================
// BUFF ENGINE — runtime buff lifecycle manager
// ============================================================
import { game } from './game-state.js';
import {
  ALL_BUFF_DEFS, STAT_BUFF_MAP,
  LEGENDARY_BUFF_DEFS, ARTIFACT_BUFF_DEFS, SET_BUFF_DEFS, SKILL_BUFF_DEFS,
} from './config/buff-table.js';
import { SKILL_HOOKS } from './config/skill-hooks.js';

// Active buff instances: { instanceId, defId, source, params, addedAt, _elapsed }
let _activeBuffs = [];
let _buffIdCounter = 0;

// Cache def lookups
const _defCache = {};
function _getDef(defId) {
  if (_defCache[defId] !== undefined) return _defCache[defId];
  _defCache[defId] = ALL_BUFF_DEFS.find(d => d.id === defId) || null;
  return _defCache[defId];
}

// ---- Public API ----

/** Rebuild all equipment-derived buffs. Called at start of calcPlayerStats. */
export function rebuildAllBuffs(sandbox) {
  // Preserve timed (skill) buffs — only rebuild equipment-derived ones
  const timedBuffs = _activeBuffs.filter(b => {
    const def = _getDef(b.defId);
    return def && def.remove && def.remove.type === 'duration';
  });

  _activeBuffs = [...timedBuffs];
  // Don't reset counter — timed buffs keep their IDs

  const eq = sandbox ? (game.sandboxEquipment || game.equipment) : game.equipment;
  const addedSetBuffs = new Set();

  // Pre-compute set counts for setCount conditions
  const setCounts = {};
  for (const item of Object.values(eq)) {
    if (item && item.setName) {
      setCounts[item.setName] = (setCounts[item.setName] || 0) + 1;
    }
  }

  for (const [slot, item] of Object.entries(eq)) {
    if (!item || item.statValue === undefined) continue;

    // 1. Equipment stat buffs (hidden)
    const statDef = STAT_BUFF_MAP[item.stat];
    if (statDef && item.statValue !== 0) {
      _addInstance({
        defId: statDef.id,
        source: { slot, type: 'equipStat' },
        params: { value: item.statValue },
      });
    }

    // 2. Legendary power buffs
    if (item.power && item.power.stat) {
      const lbDef = LEGENDARY_BUFF_DEFS.find(d => d.id === item.power.stat);
      if (lbDef) {
        _addInstance({
          defId: lbDef.id,
          source: { slot, type: 'legendary' },
          params: { value: item.power.value },
        });
      }
    }

    // 3. Artifact buffs
    if (item.artifactId) {
      const artDefs = ARTIFACT_BUFF_DEFS.filter(d => d.id === item.artifactId);
      for (const ad of artDefs) {
        if (!addedSetBuffs.has(ad.id)) {
          addedSetBuffs.add(ad.id);
          _addInstance({
            defId: ad.id,
            source: { slot, type: 'artifact' },
            params: {},
          });
        }
      }
    }

    // 4. Set buffs (deduplicated — one instance per set buff, not per item)
    if (item.setName) {
      const setDefs = SET_BUFF_DEFS.filter(d =>
        d.condition && d.condition.type === 'setCount' && d.condition.setName === item.setName
      );
      for (const sd of setDefs) {
        if (!addedSetBuffs.has(sd.id)) {
          addedSetBuffs.add(sd.id);
          _addInstance({
            defId: sd.id,
            source: { slot, type: 'set', setName: item.setName },
            params: { setCounts },
          });
        }
      }
    }
  }
}

/** Evaluate all active buffs for statCalc. Returns { attr: { add: N, mul: N } }. */
export function evaluateStatCalc() {
  const p = game.player;
  const deltas = {};

  for (const inst of _activeBuffs) {
    const def = _getDef(inst.defId);
    if (!def || !def.effects || def.effects.length === 0) continue;

    // Check condition
    if (def.condition && !_evalCondition(def.condition, p, inst)) continue;

    // Apply effects
    for (const eff of def.effects) {
      const resolved = _resolveValue(eff.value, inst.params, p);
      if (!deltas[eff.attr]) deltas[eff.attr] = { add: 0, mul: 1 };
      if (eff.op === 'add') {
        deltas[eff.attr].add += resolved;
      } else if (eff.op === 'mul') {
        deltas[eff.attr].mul *= (1 + resolved);
      }
    }
  }

  return deltas;
}

/** Get visible buffs for buff bar UI. */
export function getActiveBuffs() {
  const p = game.player;
  const result = [];
  const seen = new Set();
  for (const inst of _activeBuffs) {
    const def = _getDef(inst.defId);
    if (!def || def.hidden) continue;
    if (def.condition && !_evalCondition(def.condition, p, inst)) continue;
    if (seen.has(inst.defId)) continue; // deduplicate display
    seen.add(inst.defId);
    result.push({
      id: inst.defId,
      name: def.name,
      color: def.color,
      detail: def.detail,
    });
  }
  return result;
}

/** Check if a named buff is currently active and its condition passes. */
export function hasBuff(buffId) {
  const p = game.player;
  for (const inst of _activeBuffs) {
    if (inst.defId !== buffId) continue;
    const def = _getDef(inst.defId);
    if (!def) continue;
    if (def.condition && !_evalCondition(def.condition, p, inst)) continue;
    return true;
  }
  return false;
}

/** Add a timed buff from a skill. Returns instanceId. */
export function addTimedBuff(buffId, params = {}) {
  const def = _getDef(buffId);
  if (!def || !def.remove || def.remove.type !== 'duration') return null;
  return _addInstance({ defId: buffId, source: { type: 'skill' }, params });
}

/** Remove a buff by instanceId. */
export function removeBuff(instanceId) {
  const idx = _activeBuffs.findIndex(b => b.instanceId === instanceId);
  if (idx >= 0) _activeBuffs.splice(idx, 1);
}

/** Tick timed buffs. Call each frame. Removes expired ones. */
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

/** Clear all buffs (game start/reset). */
export function resetBuffs() {
  _activeBuffs = [];
  _buffIdCounter = 0;
}

/** Dispatch a skill hook. Calls all matching callbacks to modify state in-place. */
export function dispatchHook(hookName, state, ctx) {
  const hooks = SKILL_HOOKS[hookName];
  if (!hooks) return;

  for (const hook of hooks) {
    try {
      if (hook.condition && !hook.condition(ctx)) continue;
      hook.apply(state, ctx);
    } catch (e) {
      // Hook failures are non-fatal
    }
  }
}

// ---- Internal helpers ----

function _addInstance({ defId, source, params }) {
  const inst = {
    instanceId: ++_buffIdCounter,
    defId,
    source,
    params: { ...params },
    addedAt: game.time || 0,
    _elapsed: 0,
  };
  _activeBuffs.push(inst);
  return inst.instanceId;
}

function _evalCondition(cond, player, inst) {
  switch (cond.type) {
    case 'hpAbovePct': {
      const ratio = (player.hp / Math.max(1, player.maxHp)) * 100;
      return ratio > cond.threshold;
    }
    case 'anySkillCdBelow': {
      return player.skillCooldowns.some(cd => cd > 0 && cd < cond.threshold);
    }
    case 'setCount': {
      const counts = inst.params.setCounts || {};
      return (counts[cond.setName] || 0) >= cond.minCount;
    }
    default:
      return true;
  }
}

function _resolveValue(valueExpr, params, player) {
  if (typeof valueExpr === 'number') return valueExpr;
  if (typeof valueExpr !== 'string') return 0;

  let result = valueExpr
    .replace(/\$\{value\}/g, String(params.value || 0))
    .replace(/\$\{stacks\}/g, String(player.elementalistStacks || 0));

  // Only eval pure math expressions (no letters)
  if (/^[\d\s+\-*/.()]+$/.test(result)) {
    try {
      // eslint-disable-next-line no-eval
      return eval(result);
    } catch (e) {
      return 0;
    }
  }
  result = parseFloat(result);
  return isNaN(result) ? 0 : result;
}
