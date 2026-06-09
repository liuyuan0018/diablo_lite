// ============================================================
// SKILL PRESENTATION — visual/audio feedback for skills & auras
// ============================================================
// The engine calls present.xxx(). This file owns all the "how it looks/sounds".
// Swap this file to change VFX without touching engine logic.

import { spawnParticles } from '../particles.js';
import { playSFX } from '../audio.js';
import { addFloatingNumber } from '../renderer.js';
import { rand } from '../helpers.js';

export const present = {

  /** Called when a skill is cast. */
  skillCast(skillId, x, y) {
    switch (skillId) {
      case 'teleport':
        playSFX('teleport');
        spawnParticles(x, y, 15, '#8844ff', 120, 4);
        break;
      case 'blackhole':
        playSFX('blackHole');
        spawnParticles(x, y, 20, '#6622aa', 100, 5);
        break;
      case 'blizzard':
        playSFX('blizzard');
        spawnParticles(x, y, 25, '#4488ff', 80, 4);
        break;
      case 'harmonyBurst':
        playSFX('meteor');
        break;
    }
  },

  /** Called when an aura is first spawned. */
  auraSpawn(aura) {
    switch (aura.style) {
      case 'blackhole':
        if (aura._teleportOrigin) {
          spawnParticles(aura.x, aura.y, 12, '#6622aa', 80, 4);
        }
        break;
      case 'singularitySpawn':
        spawnParticles(aura.x, aura.y, 15, '#6688cc', 100, 4);
        break;
      case 'singularityImplosion':
        spawnParticles(aura.x, aura.y, 30, '#8844ff', 150, 6);
        break;
      case 'harmonyMeteor':
        // Per-meteor particles handled at cast site
        break;
    }
  },

  /** Called each tick an aura is active. */
  auraTick(aura) {
    if (!aura._modifiers) return;
    for (const mod of aura._modifiers) {
      if (mod.type === 'damageTick' && mod.spawnParticles) {
        if (Math.random() < (mod.spawnParticles.count || 0.3)) {
          spawnParticles(
            aura.x + rand(-aura.radius, aura.radius),
            aura.y + rand(-aura.radius, aura.radius),
            1, mod.spawnParticles.color || '#ffffff',
            mod.spawnParticles.size || 30, mod.spawnParticles.life || 3
          );
        }
      }
    }
  },

  /** Called when an aura expires. */
  auraEnd(aura) {
    for (const mod of aura._modifiers) {
      if (mod.type === 'onEnd' && mod.spawnParticles) {
        spawnParticles(aura.x, aura.y,
          mod.spawnParticles.count, mod.spawnParticles.color,
          mod.spawnParticles.size, mod.spawnParticles.life);
      }
    }
  },

  /** Floating damage number on a monster. */
  damageNumber(x, y, dmg) {
    if (dmg >= 1) addFloatingNumber(x, y, dmg);
  },

  /** Per-monster hit particle. */
  monsterHitParticle(m, color, count, size, life) {
    spawnParticles(m.x, m.y, count || 1, color || '#ffffff', size || 30, life || 3);
  },

  /** Harmony meteor spawn particles. */
  harmonyMeteorSpawn(x, y, colorIndex) {
    const colors = ['#ff4400', '#4488ff', '#aa44ff'];
    spawnParticles(x, y, 20, colors[colorIndex] || '#ffd700', 100, 5);
  },
};
