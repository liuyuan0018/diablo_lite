// ============================================================
// ATOM EXECUTOR — walk skill atoms[] and execute each one
// ============================================================
import { game } from '../game-state.js';
import { ATOM_TYPES } from './atom-defs.js';
import { createAura } from './aura-engine.js';
import { addTimedBuff } from '../buff-engine.js';
import { getSynergyEffects } from '../synergies.js';
import { getSetEffects } from '../sets.js';
import { PLAYER_RADIUS, MAP_W, MAP_H } from '../config.js';

/** Execute a list of atoms sequentially. Called from castSkill. */
export function executeAtoms(atoms, wx, wy, skillIndex, player, stats, fx) {
  const syn = getSynergyEffects();
  const sets = getSetEffects(!!game.sandboxEquipment);
  const eq = game.equipment;

  const ctx = {
    player, stats, fx, syn, sets, equipment: eq,
    wx, wy, skillIndex,
    constants: { PLAYER_RADIUS, MAP_W, MAP_H },

    // Helper: spawn an aura from style + overrides
    spawnAura(styleId, overrides) {
      createAura(styleId, { ...overrides, wx, wy }, ctx);
    },

    // Helper: apply a timed buff to self
    applyBuffToSelf(buffId, duration) {
      addTimedBuff(buffId, { duration });
    },

    // Helper: set a skill cooldown
    setCooldown(idx, cd) {
      player.skillCooldowns[idx] = cd;
    },

    // Helper: evaluate a condition
    evalCondition(cond) {
      return _evalCondition(cond, ctx);
    },

    // Helper: execute a list of sub-atoms
    runAtoms(subAtoms, subCtx) {
      for (const atom of subAtoms) {
        const typeDef = ATOM_TYPES[atom.type];
        if (!typeDef) continue;
        typeDef.executor(atom.params || {}, subCtx || ctx);
      }
    },

    // Legacy: dispatch skill hooks for compatibility during migration
    dispatchHook(name, state) {
      // During migration, hooks are dispatched directly in skills.js
      // This field exists for future use
    },
  };

  for (const atom of atoms) {
    const typeDef = ATOM_TYPES[atom.type];
    if (!typeDef) continue;
    typeDef.executor(atom.params || {}, ctx);
  }
}

// ---- Condition evaluator ----

function _evalCondition(cond, ctx) {
  if (!cond) return true;
  switch (cond.type) {
    case 'legendaryHas':
      return (ctx.fx[cond.stat] || 0) > 0;
    case 'setActive': {
      const s = ctx.sets[cond.setName];
      if (!s) return false;
      return (cond.min >= 4) ? s.active.four : (cond.min >= 3) ? s.active.three : s.active.two;
    }
    case 'stacksAtMax':
      return ctx.player[cond.key] === cond.max;
    case 'synergyActive':
      return ctx.syn[cond.id] === true;
    case 'artifactEquipped':
      return ctx.equipment.artifact && ctx.equipment.artifact.artifactId === cond.artifactId;
    case 'equipQuality':
      return ctx.equipment[cond.slot] && ctx.equipment[cond.slot].quality >= cond.minQuality;
    case 'always':
      return true;
    default:
      return false;
  }
}
