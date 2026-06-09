// ============================================================
// AURA ENGINE — tick all active auras each frame
// ============================================================
import { game } from '../game-state.js';
import { AURA_STYLES } from './aura-defs.js';
import { present } from './skill-presentation.js';
import { dist } from '../helpers.js';
import { damagePlayer, getRingMultiplier } from '../player.js';
import { recordDamage } from '../testfield.js';
import { getSynergyEffects } from '../synergies.js';
import { getSetEffects } from '../sets.js';

/** Tick all active auras. Called from updateSkillEffects each frame. */
export function tickAuras(dt) {
  for (let i = game.activeAuras.length - 1; i >= 0; i--) {
    const a = game.activeAuras[i];
    a.elapsed += dt;

    // Lifetime check
    if (a.elapsed >= a.duration) {
      _runOnEnd(a);
      game.activeAuras.splice(i, 1);
      continue;
    }

    // Tick accumulation
    a.accumulator += dt;
    const interval = a.tickInterval || dt; // 0 = every frame
    if (a.accumulator < interval) continue;
    a.accumulator -= interval;

    // Custom onTick (e.g. singularityField CD reset)
    if (a._onTick) {
      a._onTick(a, dt, game.player);
      continue; // custom handler manages its own effects
    }

    // Collect targets
    const targets = _collectTargets(a, game.player);

    // Run modifiers
    for (const mod of a._modifiers) {
      _runModifier(mod, a, targets, dt);
    }

    // Single-shot auras: mark damage as dealt, keep aura alive for visuals
    if (a._singleShot) {
      a._singleShotFired = true;
    }
  }
}

/** Create an aura instance from style + overrides. Returns the instance. */
export function createAura(styleId, overrides, ctx) {
  const style = AURA_STYLES[styleId];
  if (!style) return null;

  const def = style.defaults;
  const p = game.player;

  // Resolve param expressions
  const _res = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // Simple expression: "stats.atk * 3", "atk * 0.5"
      let result = val
        .replace(/stats\.atk/g, ctx?.stats?.atk || p.atk)
        .replace(/\batk\b/g, ctx?.stats?.atk || p.atk);
      try { return eval(result); } catch (e) { return 0; }
    }
    return val || 0;
  };

  const aura = {
    style: styleId,
    x: overrides.x ?? overrides.wx ?? p.x,
    y: overrides.y ?? overrides.wy ?? p.y,
    radius: overrides.radius ?? def.radius,
    duration: overrides.duration ?? def.duration,
    tickInterval: overrides.tickInterval ?? def.tickInterval,
    affects: overrides.affects ?? def.affects,
    elapsed: 0,
    accumulator: 0,
    _modifiers: [],
    _onTick: null,
    _singleShot: false,
    _params: { slowPct: overrides.slowPct || 0.5 },
    // Store resolved modifier params
  };

  // Build resolved modifiers from style + overrides
  const mods = [];
  for (const mod of (style.modifiers || [])) {
    switch (mod.type) {
      case 'pull':
        mods.push({ type: 'pull', force: mod.force, playerMult: mod.playerMult || 1, minDist: mod.minDist || 1, scaling: mod.scaling || 'constant' });
        break;
      case 'damageTick':
        mods.push({
          type: 'damageTick',
          damage: _res(mod.damage),
          damageAttr: mod.damageAttr || null,
          singleShot: !!mod.singleShot,
          damageToPlayer: !!mod.damageToPlayer,
          spawnParticles: mod.spawnParticles || null,
        });
        if (mod.singleShot) aura._singleShot = true;
        break;
      case 'applyBuff':
        mods.push({
          type: 'applyBuff',
          buffId: mod.buffId,
          duration: mod.duration || 3,
          refresh: !!mod.refresh,
          valueExpr: mod.valueExpr || null,
        });
        break;
      case 'onEnd':
        mods.push({
          type: 'onEnd',
          damage: _res(mod.damage),
          damageRadius: mod.damageRadius || 1,
          spawnParticles: mod.spawnParticles || null,
        });
        break;
    }
  }
  aura._modifiers = mods;

  // Custom onTick from style
  if (style.onTick === 'singularityFieldTick') {
    aura._onTick = _singularityFieldTick;
  }

  game.activeAuras.push(aura);
  return aura;
}

// ---- Modifier runners ----

function _runModifier(mod, aura, targets, dt) {
  switch (mod.type) {
    case 'pull':
      _runPull(mod, aura, targets, dt);
      break;
    case 'damageTick':
      _runDamage(mod, aura, targets, dt);
      break;
    case 'applyBuff':
      _runApplyBuff(mod, aura, targets, dt);
      break;
  }
}

function _runPull(mod, aura, targets, dt) {
  // Pull monsters
  for (const m of targets.monsters) {
    const d = dist(m.x, m.y, aura.x, aura.y);
    if (d < aura.radius && d > mod.minDist) {
      const forceScale = mod.scaling === 'escalating'
        ? (1 + aura.elapsed / aura.duration) // grows from 1x to 2x
        : 1;
      const force = mod.force * dt * forceScale;
      const n = { x: (aura.x - m.x) / d, y: (aura.y - m.y) / d };
      m.x += n.x * force;
      m.y += n.y * force;
    }
  }
  // Pull player
  if (targets.player && mod.playerMult > 0) {
    const pd = dist(game.player.x, game.player.y, aura.x, aura.y);
    if (pd < aura.radius && pd > mod.minDist) {
      const force = mod.force * dt * (mod.playerMult || 0.3);
      const n = { x: (aura.x - game.player.x) / pd, y: (aura.y - game.player.y) / pd };
      game.player.x += n.x * force;
      game.player.y += n.y * force;
    }
  }
}

function _runDamage(mod, aura, targets, dt) {
  const ringMult = mod.damageAttr ? getRingMultiplier(mod.damageAttr) : 1;
  // Continuous-tick auras scale by dt; interval-tick auras apply flat damage
  const dmgScale = aura.tickInterval === 0 ? dt : 1;

  if (mod.damageToPlayer && targets.player) {
    damagePlayer(mod.damage * dmgScale);
    return;
  }

  // Single-shot auras only fire damage once
  if (aura._singleShotFired && mod.singleShot) return;

  for (const m of targets.monsters) {
    const dmg = m.vulnerable
      ? Math.round(mod.damage * dmgScale * 1.5 * ringMult)
      : Math.round(mod.damage * dmgScale * ringMult);
    if (dmg <= 0) continue;
    m.hp -= dmg;
    present.damageNumber(m.x, m.y, dmg);
    if (mod.spawnParticles && Math.random() < mod.spawnParticles.count) {
      present.monsterHitParticle(m, mod.spawnParticles.color || '#ffffff', 1, 30, 3);
    }
  }

  // Dummies
  if (game.trainingDummies) {
    for (const d of game.trainingDummies) {
      if (dist(d.x, d.y, aura.x, aura.y) < aura.radius + d.size) {
        const dmgVal = Math.round(mod.damage * (1 - (d.damageReduction || 0)));
        if (dmgVal > 0) recordDamage(dmgVal);
      }
    }
  }
}

function _runApplyBuff(mod, aura, targets, dt) {
  for (const m of targets.monsters) {
    switch (mod.buffId) {
      case 'vulnerable':
        m.vulnerable = true;
        m.vulnerableTimer = mod.duration;
        break;
      case 'slow':
        if (!m.slowTimer || m.slowTimer <= 0) {
          m.slowMult = aura._params.slowPct || 0.5;
          m.slowTimer = mod.duration;
        }
        break;
    }
  }
  // Deep Frost: freeze when slow > 70%
  if (mod.buffId === 'slow') {
    const syn = getSynergyEffects();
    if (syn.deepFrost) {
      const slowPct = (aura._params.slowPct || 0.5) * 100;
      if (slowPct > 70) {
        for (const m of targets.monsters) {
          if (!m._lastFreezeTime || game.time - m._lastFreezeTime > 4) {
            m.frozen = true;
            m.frozenTimer = 1.5;
            m._lastFreezeTime = game.time;
            present.monsterHitParticle(m, '#88ccff', 8, 40, 3);
          }
        }
      }
    }
  }
}

function _runOnEnd(aura) {
  for (const mod of aura._modifiers) {
    if (mod.type !== 'onEnd') continue;
    // Burst damage
    const r = aura.radius * (mod.damageRadius || 1);
    for (const m of game.monsters) {
      if (dist(m.x, m.y, aura.x, aura.y) < r) {
        const dmg = m.vulnerable ? Math.round(mod.damage * 1.5) : mod.damage;
        m.hp -= dmg;
        present.damageNumber(m.x, m.y, dmg);
      }
    }
    // Dummies
    if (game.trainingDummies) {
      for (const d of game.trainingDummies) {
        if (dist(d.x, d.y, aura.x, aura.y) < r + d.size) {
          const dmgVal = Math.round(mod.damage * (1 - (d.damageReduction || 0)));
          if (dmgVal > 0) recordDamage(dmgVal);
        }
      }
    }
    // Particles
    present.auraEnd(aura);
  }
}

// ---- Custom onTick handlers ----

function _singularityFieldTick(aura, dt, player) {
  const sets = getSetEffects(!!game.sandboxEquipment);
  if (!sets.chronomancer || !sets.chronomancer.active.four) return;

  const d = dist(player.x, player.y, aura.x, aura.y);
  if (d < aura.radius) {
    if (!aura._playerInsideSince) aura._playerInsideSince = game.time;
    if (game.time - aura._playerInsideSince >= 2) {
      player.skillCooldowns[0] = 0; // reset teleport
      aura._playerInsideSince = game.time;
    }
  } else {
    aura._playerInsideSince = null;
  }
}

// ---- Internal ----

function _collectTargets(aura, player) {
  const targets = { monsters: [], player: false, dummies: [] };
  const r = aura.radius;
  if (aura.affects.monsters) {
    for (const m of game.monsters) {
      if (dist(m.x, m.y, aura.x, aura.y) < r + (m.size || 16)) {
        targets.monsters.push(m);
      }
    }
  }
  if (aura.affects.player) {
    if (dist(player.x, player.y, aura.x, aura.y) < r) {
      targets.player = true;
    }
  }
  return targets;
}
