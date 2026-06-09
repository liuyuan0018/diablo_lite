// ============================================================
// ATOM DEFINITIONS — 6 atom types, each with an executor function
// ============================================================
// Executor signature: (params, ctx) => void
// ctx provides: player, stats, fx, sets, equipment, wx, wy, skillIndex, syn
//   + helpers: spawnAura(style, overrides), applyBuff(id, target, params),
//              setCooldown(idx, cd), getState(key), setState(key, val)

export const ATOM_TYPES = {

  movement: {
    id: 'movement',
    label: 'Instant teleport',
    executor(params, ctx) {
      const { player, wx, wy } = ctx;
      const { PLAYER_RADIUS, MAP_W, MAP_H } = ctx.constants;
      player.x = Math.max(PLAYER_RADIUS, Math.min(MAP_W - PLAYER_RADIUS, wx));
      player.y = Math.max(PLAYER_RADIUS, Math.min(MAP_H - PLAYER_RADIUS, wy));
    },
  },

  spawnAura: {
    id: 'spawnAura',
    label: 'Spawn a ground aura',
    executor(params, ctx) {
      const { spawnAura } = ctx;
      spawnAura(params.style, params);
    },
  },

  applyBuff: {
    id: 'applyBuff',
    label: 'Apply a buff directly to an entity',
    executor(params, ctx) {
      const { applyBuffToSelf } = ctx;
      if (params.target === 'self') {
        applyBuffToSelf(params.buffId, params.duration || 2);
      }
    },
  },

  stateTrack: {
    id: 'stateTrack',
    label: 'Track player state (element, stacks, timers)',
    executor(params, ctx) {
      const { player } = ctx;
      const key = params.key;
      const val = params.value;
      const action = params.action || 'track'; // 'track' | 'set' | 'reset'

      switch (key) {
        case 'elementalistElement': {
          // Track element usage for harmony stacking
          if (player.elementalistLastElement !== val) {
            player.elementalistStacks = Math.min(3, player.elementalistStacks + 1);
          } else {
            player.elementalistStacks = 1;
          }
          player.elementalistLastElement = val;
          player.elementalistAutoUsed = false;
          break;
        }
        case 'elementalistStacks': {
          if (action === 'set') player.elementalistStacks = val;
          break;
        }
        case 'elementalistLastElement': {
          if (action === 'set') player.elementalistLastElement = val;
          break;
        }
        case 'elementalistAutoUsed': {
          if (action === 'set') player.elementalistAutoUsed = val;
          break;
        }
        case 'temporalResonanceTimer': {
          player.temporalResonanceTimer = val;
          break;
        }
        default:
          break;
      }
    },
  },

  cooldownMod: {
    id: 'cooldownMod',
    label: 'Set skill cooldown with conditional reductions',
    executor(params, ctx) {
      const { player, setCooldown, skillIndex } = ctx;
      const baseCD = params.baseCD;
      const cdr = params.cdrApplies !== false ? (ctx.stats.cdr || 0) : 0;
      let cd = baseCD * (1 - cdr / 100);

      // Apply reduction conditions (e.g., temporal resonance, teleportCD)
      if (params.reductions) {
        for (const red of params.reductions) {
          if (red.type === 'subtract' && ctx.fx[red.stat]) {
            cd -= ctx.fx[red.stat];
          }
          if (red.type === 'halve' && ctx.evalCondition(red.condition)) {
            cd *= 0.5;
            // Side effect: consume the condition (e.g. reset temporalResonanceTimer)
            if (red.onConsume) red.onConsume(player);
          }
        }
      }

      setCooldown(skillIndex, Math.max(0.5, cd));
    },
  },

  conditional: {
    id: 'conditional',
    label: 'Execute sub-atoms if condition is met',
    executor(params, ctx) {
      const { runAtoms, evalCondition } = ctx;
      if (evalCondition(params.condition)) {
        if (params.subAtoms) runAtoms(params.subAtoms, ctx);
      } else {
        if (params.elseAtoms) runAtoms(params.elseAtoms, ctx);
      }
    },
  },

};
