// ============================================================
// SECTION 5: SKILLS
// ============================================================
import { game } from './game-state.js';
import { PLAYER_RADIUS, MAP_W, MAP_H, SKILL_CONFIG } from './config.js';
import { clamp, rand, normalize, dist } from './helpers.js';
import { spawnParticles } from './particles.js';
import { calcPlayerStats, damagePlayer, getRingMultiplier } from './player.js';
import { getSetEffects } from './sets.js';
import { getSynergyEffects } from './synergies.js';
import { addTimedBuff, dispatchHook } from './buff-engine.js';
import { recordDamage } from './testfield.js';
import { addFloatingNumber } from './renderer.js';
import { playSFX } from './audio.js';

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
      playSFX('teleport');
      spawnParticles(p.x,p.y,15,'#8844ff',120,4);
      const tpState = { cooldown: SKILL_CONFIG[0].baseCD * (1 - cdr / 100), spawnEffects: [] };
      dispatchHook('onTeleportCast', tpState, { fx, sets, player: p, equipment: game.equipment });
      p.skillCooldowns[idx] = Math.max(0.5, tpState.cooldown);
      for (const eff of tpState.spawnEffects) {
        if (eff.type === 'blackhole') {
          game.skillEffects.push({type:'blackhole',x:oldX,y:oldY,radius:eff.radius,duration:eff.duration,timer:eff.duration,pullForce:eff.pullForce,damage:eff.damage});
          spawnParticles(oldX,oldY,12,'#6622aa',80,4);
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
      game.skillEffects.push({type:'blackhole',x:wx,y:wy,radius:bhState.radius,duration:bhState.duration,timer:bhState.duration,pullForce:180,damage:bhState.tickDmg});
      playSFX('blackHole');
      spawnParticles(wx,wy,20,'#6622aa',100,5);
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
      game.skillEffects.push({type:'blizzard',x:wx,y:wy,radius:blState.radius,duration:3,timer:3,tickTimer:0.5,damage:blState.tickDmg,slowPct:Math.min(blState.slowPct,0.9)});
      playSFX('blizzard');
      spawnParticles(wx,wy,25,'#4488ff',80,4);
      // Chronomancer 3-piece: implosion check
      if (sets.chronomancer && sets.chronomancer.active.three) {
        for (const f of p.singularityFields) {
          if (!f.imploded && dist(wx, wy, f.x, f.y) < f.radius) {
            f.imploded = true;
            game.skillEffects.push({
              type: 'singularityImplosion',
              x: f.x, y: f.y,
              radius: f.radius,
              timer: 1.0, duration: 1.0,
              damage: stats.atk * 5,
            });
            spawnParticles(f.x, f.y, 30, '#8844ff', 150, 6);
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
    playSFX('meteor');
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
        spawnParticles(p.x, p.y, 20, '#ffd700', 150, 5);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const spreadAngle = (i - 1) * 0.5;
        const mx = wx + Math.cos(spreadAngle) * 60;
        const my = wy + Math.sin(spreadAngle) * 60;
        game.skillEffects.push({
          type: 'harmonyMeteor',
          x: mx, y: my,
          radius: 80,
          timer: 0.5, duration: 0.5,
          damage: stats.atk * 3,
        });
        spawnParticles(mx, my, 20, ['#ff4400','#4488ff','#aa44ff'][i], 100, 5);
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
        recordDamage(dmg);
        if (damage >= 1) addFloatingNumber(d.x, d.y, dmg);
      }
    }
  }
}

export function updateSkillEffects(dt){
  for(let i=game.skillEffects.length-1;i>=0;i--){
    const e=game.skillEffects[i];
    e.timer-=dt;
    if(e.timer<=0){game.skillEffects.splice(i,1);continue;}
    switch(e.type){
      case 'blackhole':{
        for(const m of game.monsters){
          const d=dist(m.x,m.y,e.x,e.y);
          if(d<e.radius&&d>1){
            const f=e.pullForce*dt;
            const n=normalize(e.x-m.x,e.y-m.y);
            m.x+=n.x*f;
            m.y+=n.y*f;
            m.hp-=e.damage*dt;
            m.vulnerable=true;
            m.vulnerableTimer=3;
          }
        }
        damageDummies(e.x,e.y,e.radius,e.damage*dt);
        const pd=dist(game.player.x,game.player.y,e.x,e.y);
        if(pd<e.radius&&pd>1){
          const f=e.pullForce*dt*0.3;
          const n=normalize(e.x-game.player.x,e.y-game.player.y);
          game.player.x+=n.x*f;
          game.player.y+=n.y*f;
        }
        if(Math.random()<0.3)spawnParticles(e.x+rand(-e.radius,e.radius),e.y+rand(-e.radius,e.radius),1,'#8844cc',30,3);
        break;
      }
      case 'blizzard':{
        e.tickTimer-=dt;
        if(e.tickTimer<=0){
          e.tickTimer=0.5;
          for(const m of game.monsters){
            if(dist(m.x,m.y,e.x,e.y)<e.radius){
              if(!m.slowTimer||m.slowTimer<=0){
                m.slowMult=e.slowPct;
                m.slowTimer=0.5;
              }
              const dmg=m.vulnerable?Math.round(e.damage*1.5*getRingMultiplier('ice')):Math.round(e.damage*getRingMultiplier('ice'));
              m.hp-=dmg;
              spawnParticles(m.x,m.y,3,'#88aaff',60,3);
              if(dmg>=1)addFloatingNumber(m.x,m.y,dmg);
            }
          }
          damageDummies(e.x,e.y,e.radius,e.damage);
        }
        // Deep Frost synergy
        const synDf = getSynergyEffects();
        if (synDf.deepFrost) {
          const slowPercent = e.slowPct * 100;
          if (slowPercent > 70) {
            for (const m of game.monsters) {
              if (dist(m.x, m.y, e.x, e.y) < e.radius) {
                if (!m._lastFreezeTime || game.time - m._lastFreezeTime > 4) {
                  m.frozen = true;
                  m.frozenTimer = 1.5;
                  m._lastFreezeTime = game.time;
                  spawnParticles(m.x, m.y, 8, '#88ccff', 40, 3);
                }
              }
            }
          }
        }
        if(Math.random()<0.5)spawnParticles(e.x+rand(-e.radius,e.radius),e.y+rand(-e.radius,e.radius),1,'#ffffff',40,2);
        break;
      }
      case 'poisonPool':{
        const pd=dist(game.player.x,game.player.y,e.x,e.y);
        if(pd<e.radius){
          damagePlayer(e.damage*dt);
        }
        break;
      }
      case 'harmonyMeteor': {
        if (e.timer <= 0) continue;
        if (!e._damaged) {
          e._damaged = true;
          for (const m of game.monsters) {
            if (dist(m.x, m.y, e.x, e.y) < e.radius) {
              const dmg=m.vulnerable?Math.round(e.damage*1.5):e.damage;
              m.hp -= dmg;
              spawnParticles(m.x, m.y, 5, '#ffaa00', 60, 3);
              addFloatingNumber(m.x,m.y,dmg);
            }
          }
          damageDummies(e.x,e.y,e.radius,e.damage);
        }
        spawnParticles(e.x + rand(-e.radius, e.radius), e.y + rand(-e.radius, e.radius), 1, '#ffd700', 40, 2);
        break;
      }
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
          spawnParticles(e.x, e.y, 15, '#6688cc', 100, 4);
        }
        break;
      }
      case 'singularityImplosion': {
        const progress = 1 - e.timer / e.duration;
        // Pull enemies inward during the charge-up
        for (const m of game.monsters) {
          const d = dist(m.x, m.y, e.x, e.y);
          if (d < e.radius * (1 + progress * 0.5) && d > 1) {
            const force = 400 * dt * (1 + progress);
            const n = normalize(e.x - m.x, e.y - m.y);
            m.x += n.x * force;
            m.y += n.y * force;
          }
        }
        if (e.timer <= 0) {
          // Final burst
          for (const m of game.monsters) {
            if (dist(m.x, m.y, e.x, e.y) < e.radius * 1.5) {
              const dmg=m.vulnerable?Math.round(e.damage*1.5):e.damage;
              m.hp -= dmg;
              addFloatingNumber(m.x,m.y,dmg);
            }
          }
          damageDummies(e.x,e.y,e.radius*1.5,e.damage);
          spawnParticles(e.x, e.y, 50, '#ff6600', 200, 7);
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
