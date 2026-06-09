// ============================================================
// AURA DEFINITIONS — style registry, modifier types, render map
// ============================================================
// An aura is a ground-placed persistent area created by spawnAura atom.
// Each aura style defines: default params + modifier list.
// Modifiers are: damageTick, pull, applyBuff, onTick (custom), onEnd.

export const AURA_STYLES = {

  blackhole: {
    defaults: {
      radius: 220, duration: 2.5, tickInterval: 0,
      affects: { monsters: true, player: true, dummies: true },
    },
    modifiers: [
      { type: 'pull', force: 180, playerMult: 0.3, minDist: 1 },
      { type: 'damageTick', damage: 8, spawnParticles: { color: '#8844cc', count: 0.3 } },
      { type: 'applyBuff', buffId: 'vulnerable', duration: 3, refresh: true },
    ],
  },

  blizzard: {
    defaults: {
      radius: 260, duration: 3, tickInterval: 0.5,
      affects: { monsters: true, player: false, dummies: true },
    },
    modifiers: [
      { type: 'damageTick', damage: 22, damageAttr: 'ice', spawnParticles: { color: '#ffffff', count: 0.5 } },
      { type: 'applyBuff', buffId: 'slow', duration: 0.5, refresh: true,
        valueExpr: 'slowPct', // resolved from aura runtime param
      },
    ],
  },

  poisonPool: {
    defaults: {
      radius: 50, duration: 4, tickInterval: 0,
      affects: { monsters: false, player: true, dummies: false },
    },
    modifiers: [
      { type: 'damageTick', damage: 'atk * 0.5', damageToPlayer: true },
    ],
  },

  harmonyMeteor: {
    defaults: {
      radius: 80, duration: 0.5, tickInterval: 0,
      affects: { monsters: true, player: false, dummies: true },
    },
    modifiers: [
      { type: 'damageTick', damage: 'stats.atk * 3', singleShot: true,
        spawnParticles: { color: '#ffd700', count: 0.3 },
      },
    ],
  },

  singularityImplosion: {
    defaults: {
      radius: 220, duration: 1.0, tickInterval: 0,
      affects: { monsters: true, player: false, dummies: true },
    },
    modifiers: [
      { type: 'pull', force: 400, scaling: 'escalating', minDist: 1 },
      { type: 'onEnd', damage: 'stats.atk * 5', damageRadius: 1.5,
        spawnParticles: { color: '#ff6600', count: 50, size: 200, life: 7 },
      },
    ],
  },

  singularityField: {
    defaults: {
      radius: 220, duration: 4, tickInterval: 0,
      affects: { monsters: false, player: true, dummies: false },
    },
    // Custom onTick handles the chronomancer-4 CD reset
    onTick: 'singularityFieldTick',
  },

  elementalistAura: {
    defaults: {
      radius: 200, duration: 5, tickInterval: 0,
      affects: { monsters: false, player: false, dummies: false },
    },
    modifiers: [], // visual only currently
  },

};

// Map aura style to render function name (consumed by renderer.js)
export const AURA_RENDER_MAP = {
  blackhole: 'renderBlackhole',
  blizzard: 'renderBlizzard',
  poisonPool: 'renderPoisonPool',
  harmonyMeteor: 'renderHarmonyMeteor',
  singularityImplosion: 'renderSingularityImplosion',
  singularityField: 'renderSingularityField',
  elementalistAura: 'renderElementalistAura',
};
