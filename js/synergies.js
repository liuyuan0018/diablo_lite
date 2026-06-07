// js/synergies.js
import { game } from './game-state.js';
import { SYNERGY_DEFS } from './config.js';

export function getSynergies() {
  const present = new Set();
  for (const eq of Object.values(game.equipment)) {
    if (eq && eq.power && eq.power.stat) {
      present.add(eq.power.stat);
    }
  }
  const active = [];
  for (const def of SYNERGY_DEFS) {
    if (def.requires.every(r => present.has(r))) {
      active.push(def);
    }
  }
  return active;
}

// Called during gameplay to apply active synergy effects
export function getSynergyEffects() {
  const synergies = getSynergies();
  return {
    moltenCore: synergies.some(s => s.id === 'moltenCore'),
    deepFrost: synergies.some(s => s.id === 'deepFrost'),
    fireIce: synergies.some(s => s.id === 'fireIce'),
    temporalResonance: synergies.some(s => s.id === 'temporalResonance'),
    all: synergies,
  };
}
