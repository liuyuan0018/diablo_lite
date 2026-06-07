// js/sets.js
import { game } from './game-state.js';
import { SET_DEFS } from './config.js';

export function getSetEffects() {
  const counts = {};
  for (const [slot, eq] of Object.entries(game.equipment)) {
    if (eq && eq.setName) {
      counts[eq.setName] = (counts[eq.setName] || 0) + 1;
    }
  }
  const result = {};
  for (const [setName, count] of Object.entries(counts)) {
    const def = SET_DEFS[setName];
    if (!def) continue;
    result[setName] = { count, active: { two: count >= 2, three: count >= 3, four: count >= 4 }, def };
  }
  return result;
}

export function getActiveSetNames() {
  const effects = getSetEffects();
  return Object.keys(effects).filter(k => effects[k].active.two);
}

export function updateSetEffects(dt) {
  const p = game.player;
  // Decay singularity fields
  for (let i = p.singularityFields.length - 1; i >= 0; i--) {
    const f = p.singularityFields[i];
    f.timer -= dt;
    if (f.timer <= 0) {
      p.singularityFields.splice(i, 1);
    }
  }
  // Decay elementalist aura
  if (p.elementalistAura) {
    p.elementalistAura.timer -= dt;
    if (p.elementalistAura.timer <= 0) {
      p.elementalistAura = null;
    }
  }
  // Decay temporal resonance
  if (p.temporalResonanceTimer > 0) {
    p.temporalResonanceTimer -= dt;
  }
}
