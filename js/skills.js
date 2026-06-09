// ============================================================
// SECTION 5: SKILLS
// ============================================================
import { game } from './game-state.js';
import { PLAYER_RADIUS, MAP_W, MAP_H, SKILL_CONFIG } from './config.js';
import { clamp, dist } from './helpers.js';
import { calcPlayerStats } from './player.js';
import { getSetEffects } from './sets.js';
import { getSynergyEffects } from './synergies.js';
import { addTimedBuff, dispatchHook } from './buff-engine.js';
import { tickAuras, createAura } from './atoms/aura-engine.js';
import { present } from './atoms/skill-presentation.js';

export function castSkill(wx,wy){
  const p=game.player;
  const idx=game.activeSkill;
  const stats=calcPlayerStats();
  const fx=stats.legendary;
  const cdr=stats.cdr;
  if(p.skillCooldowns[idx]>0)return;
  const sets = getSetEffects(!!game.sandboxEquipment);
  const hasElementalist = sets.elementalist && sets.elementalist.active.two;
  let castElement = null;
  switch(idx){
    case 0:{
      const oldX=p.x,oldY=p.y;
      p.x=clamp(wx,PLAYER_RADIUS,MAP_W-PLAYER_RADIUS);
      p.y=clamp(wy,PLAYER_RADIUS,MAP_H-PLAYER_RADIUS);
      present.skillCast('teleport', p.x, p.y);
      const tpState = { cooldown: SKILL_CONFIG[0].baseCD * (1 - cdr / 100), spawnEffects: [] };
      dispatchHook('onTeleportCast', tpState, { fx, sets, player: p, equipment: game.equipment });
      p.skillCooldowns[idx] = Math.max(0.5, tpState.cooldown);
      for (const eff of tpState.spawnEffects) {
        if (eff.type === 'blackhole') {
          createAura('blackhole', { x: oldX, y: oldY, radius: eff.radius, duration: eff.duration, damage: eff.damage });
          present.auraSpawn({style:'blackhole', x:oldX, y:oldY, _teleportOrigin:true});
        }
      }
      p.buffs=p.buffs.filter(b=>b.type!=='ghost'); // compat: clear old-style ghost
      if(game.equipment.boots&&game.equipment.boots.quality===3)addTimedBuff('ghost');
      // Temporal Resonance synergy
      const synTp = getSynergyEffects();
      if (synTp.temporalResonance) {
        game.player.temporalResonanceTimer = 2;
      }
      break;
    }
    case 1:{
      const bhState = { radius: 220, duration: 2.5, tickDmg: 8, spawnEffects: [] };
      dispatchHook('onBlackholeCast', bhState, { fx, sets, player: p, equipment: game.equipment });
      createAura('blackhole', { x: wx, y: wy, radius: bhState.radius, duration: bhState.duration, damage: bhState.tickDmg });
      present.skillCast('blackhole', wx, wy);
      for (const eff of bhState.spawnEffects) {
        if (eff.type === 'singularitySpawn') {
          game.skillEffects.push({type:'singularitySpawn',x:wx,y:wy,radius:eff.radius,timer:bhState.duration,duration:bhState.duration,damage:0});
        }
      }
      // Arcane element tracking for Elementalist set
      castElement = 'arcane';
      if (hasElementalist) {
        p.elementalistAutoUsed = false;
        if (castElement !== p.elementalistLastElement) {
          p.elementalistStacks = Math.min(3, p.elementalistStacks + 1);
        } else {
          p.elementalistStacks = 1;
        }
        p.elementalistLastElement = castElement;
      }
      let cd = SKILL_CONFIG[1].baseCD * (1 - cdr / 100);
      const syn = getSynergyEffects();
      if (syn.temporalResonance && game.player.temporalResonanceTimer > 0) {
        cd *= 0.5;
        game.player.temporalResonanceTimer = 0;
      }
      p.skillCooldowns[idx] = cd;
      break;
    }
    case 2:{
      const blState = { radius: 260, slowPct: 0.5, tickDmg: 22 };
      dispatchHook('onBlizzardCast', blState, { fx, sets, player: p, equipment: game.equipment });
      createAura('blizzard', { x: wx, y: wy, radius: blState.radius, duration: 3, tickInterval: 0.5, damage: blState.tickDmg, slowPct: Math.min(blState.slowPct, 0.9) });
      present.skillCast('blizzard', wx, wy);
      // Chronomancer 3-piece: implosion check
      if (sets.chronomancer && sets.chronomancer.active.three) {
        for (const f of p.singularityFields) {
          if (!f.imploded && dist(wx, wy, f.x, f.y) < f.radius) {
            f.imploded = true;
            createAura('singularityImplosion', { x: f.x, y: f.y, radius: f.radius, damage: stats.atk * 5 });
            present.auraSpawn({style:'singularityImplosion', x:f.x, y:f.y});
            // 4-piece: reduce all CDs by 3s
            if (sets.chronomancer.active.four) {
              for (let i = 0; i < 3; i++) {
                p.skillCooldowns[i] = Math.max(0, p.skillCooldowns[i] - 3);
              }
            }
            // Consume field unless fieldGenerator artifact
            const hasFieldGen = game.equipment.artifact && game.equipment.artifact.artifactId === 'fieldGenerator';
            if (!hasFieldGen) {
              f.timer = 0;
            }
            break; // only one field per cast
          }
        }
      }
      // Ice element tracking for Elementalist set
      castElement = 'ice';
      if (hasElementalist) {
        p.elementalistAutoUsed = false;
        if (castElement !== p.elementalistLastElement) {
          p.elementalistStacks = Math.min(3, p.elementalistStacks + 1);
        } else {
          p.elementalistStacks = 1;
        }
        p.elementalistLastElement = castElement;
      }
      let cd = SKILL_CONFIG[2].baseCD * (1 - cdr / 100);
      const syn = getSynergyEffects();
      if (syn.temporalResonance && game.player.temporalResonanceTimer > 0) {
        cd *= 0.5;
        game.player.temporalResonanceTimer = 0;
      }
      p.skillCooldowns[idx] = cd;
      break;
    }
  }

  // Harmony Burst trigger — at 3 stacks, spawn meteors
  if (hasElementalist && castElement && p.elementalistStacks === 3) {
    present.skillCast('harmonyBurst', wx, wy);
    const stats = calcPlayerStats();
    const hasHarmonyEye = game.equipment.artifact && game.equipment.artifact.artifactId === 'harmonyEye';

    if (hasHarmonyEye) {
      // Single-target tracking meteor instead of 3 AoE meteors
      let nearest = null, nearDist = 500;
      for (const m of game.monsters) {
        const d = dist(wx, wy, m.x, m.y);
        if (d < nearDist) { nearDist = d; nearest = m; }
      }
      if (nearest) {
        game.projectiles.push({
          x: p.x, y: p.y,
          vx: 0, vy: 0,
          damage: stats.atk * 3 * 1.5, // +50% damage
          size: 10, isEnemy: false, color: '#ffd700',
          life: 3, tracking: nearest, trackingSpeed: 300,
        });
        present.harmonyMeteorSpawn(p.x, p.y, 0);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const spreadAngle = (i - 1) * 0.5;
        const mx = wx + Math.cos(spreadAngle) * 60;
        const my = wy + Math.sin(spreadAngle) * 60;
        createAura('harmonyMeteor', { x: mx, y: my, damage: stats.atk * 3 });
        present.harmonyMeteorSpawn(mx, my, i);
      }
    }

    p.elementalistStacks = 0;
    p.elementalistLastElement = null;
    p.elementalistAutoUsed = false;

    // 4-piece: create elemental aura
    if (sets.elementalist && sets.elementalist.active.four) {
      p.elementalistAura = { x: wx, y: wy, timer: 5 };
    }
  }
}

function damageDummies(x, y, radius, damage) {
  if (!game.trainingDummies || game.trainingDummies.length === 0) return;
  for (const d of game.trainingDummies) {
    if (dist(d.x, d.y, x, y) < radius + d.size) {
      const dmg = Math.round(damage * (1 - (d.damageReduction || 0)));
      if (dmg > 0) {
        if (window._testfieldRecord) window._testfieldRecord(dmg);
        if (dmg >= 1) present.damageNumber(d.x, d.y, dmg);
      }
    }
  }
}

export function updateSkillEffects(dt){
  // Aura engine handles all active auras (poisonPool, blackhole, blizzard, etc.)
  tickAuras(dt);

  // Legacy: non-aura effects still processed here during migration
  for(let i=game.skillEffects.length-1;i>=0;i--){
    const e=game.skillEffects[i];
    e.timer-=dt;
    if(e.timer<=0){game.skillEffects.splice(i,1);continue;}
    // Only non-aura deferred effects remain in skillEffects (e.g. singularitySpawn)
    switch(e.type){
      case 'singularitySpawn': {
        if (e.timer <= 0) {
          const fgState = { duration: 4 };
          dispatchHook('onSingularitySpawn', fgState, { fx: {}, sets: {}, player: game.player, equipment: game.equipment });
          const fieldDuration = fgState.duration;
          game.player.singularityFields.push({
            x: e.x, y: e.y,
            radius: 220,
            timer: fieldDuration,
            imploded: false,
          });
          present.auraSpawn({style:'singularitySpawn', x:e.x, y:e.y});
        }
        break;
      }
    }
  }
  for(const m of game.monsters){
    if(m.slowTimer>0){
      m.slowTimer-=dt;
      if(m.slowTimer<=0)m.slowMult=1;
    }
  }
}
