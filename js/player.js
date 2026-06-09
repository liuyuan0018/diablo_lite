// ============================================================
// SECTION 4: PLAYER
// ============================================================
import { game } from './game-state.js';
import { PLAYER_RADIUS, MAP_W, MAP_H, BASE_FIRE_RATE, BASE_BULLET_SPEED, BASE_PICKUP_RANGE, DETECTION_RANGE, SKILL_CONFIG } from './config.js';
import { normalize, clamp, dist, angle } from './helpers.js';
import { spawnParticles } from './particles.js';
import { playSFX } from './audio.js';
import { getSetEffects } from './sets.js';
import { getSynergyEffects } from './synergies.js';
import { rebuildAllBuffs, evaluateStatCalc, hasBuff, tickTimedBuffs, dispatchHook } from './buff-engine.js';

export function damagePlayer(amount){
  const p=game.player;
  const stats=calcPlayerStats();
  const dr=stats.setDmgReduc||0;
  let dmg=hasBuff('ghost')?amount*0.5:amount;
  dmg=dmg*(1-Math.min(dr,0.8)); // cap DR at 80%
  p.hp-=dmg;
}

export function getLegendaryEffects(sandbox){
  const fx={globalCDR:0,fireballDmg:0,pierce:0,blackholeSize:0,blackholeDur:0,blizzardSize:0,blizzardSlow:0,teleportCD:0};
  const eq=sandbox?(game.sandboxEquipment||game.equipment):game.equipment;
  for(const slot of Object.keys(eq)){
    const e=eq[slot];
    if(e&&e.power&&e.power.stat)fx[e.power.stat]=(fx[e.power.stat]||0)+e.power.value;
  }
  return fx;
}

export function calcPlayerStats(sandbox){
  const lv=game.player.level;
  const baseHP=100+(lv-1)*5;
  const baseATK=10+(lv-1)*2;

  // Rebuild equipment-derived buffs, then evaluate
  rebuildAllBuffs(sandbox);
  const deltas = evaluateStatCalc();

  // Extract additive stats from buff engine deltas
  const bHP    = (deltas.maxHp       ? deltas.maxHp.add       : 0);
  const bATK   = (deltas.atk         ? deltas.atk.add         : 0);
  const bCDR   = (deltas.cdr         ? deltas.cdr.add         : 0);
  const bSpeed = (deltas.bulletSpeed ? deltas.bulletSpeed.add : 0);
  const bRange = (deltas.pickupRange ? deltas.pickupRange.add : 0);
  const bMove  = (deltas.movespeed   ? deltas.movespeed.add   : 0);

  // Multiplicative effects from buff engine
  const atkMul    = deltas.atk      ? deltas.atk.mul      : 1;
  const moveMul   = deltas.moveMult ? deltas.moveMult.mul : 1;
  const bDR       = deltas.dmgReduc ? deltas.dmgReduc.add : 0;

  // Skill-modifying legendary effects (pierce, blizzardSize, etc.)
  const fx=getLegendaryEffects(sandbox);

  // fireballDmg applies only to bATK, not baseATK — handled manually
  const bSpeedVal=BASE_BULLET_SPEED+bSpeed;
  const fireRate = BASE_FIRE_RATE + (bSpeedVal - BASE_BULLET_SPEED) * 0.01;
  const finalAtk = Math.round((baseATK + bATK * (1 + fx.fireballDmg / 100)) * atkMul);

  const sets = getSetEffects(sandbox);
  const setDmgMult = atkMul; // keep for backward compat — now from buff engine

  const ringEl = game.player.ringElement;
  return {maxHP: baseHP + bHP, atk: finalAtk, cdr: Math.min(bCDR, 60), bulletSpeed: bSpeedVal, pickupRange: BASE_PICKUP_RANGE + bRange, movespeed: bMove, moveMult: moveMul, fireRate, legendary: fx, sets, setDmgMult, setDmgReduc: bDR, synergies: getSynergyEffects(), ringElement: ringEl, ringTimer: game.player.ringCycleTimer};
}

export function getRingMultiplier(element) {
  const p = game.player;
  if (!element) return 1;
  // Find best ringElement power from equipped items
  let maxPct = 0;
  const eqSource = game.sandboxEquipment || game.equipment;
  for (const eq of Object.values(eqSource)) {
    if (eq && eq.power && eq.power.stat === 'ringElement' && eq.power.value > maxPct) {
      maxPct = eq.power.value;
    }
  }
  if (maxPct === 0) return 1;
  const elMap = { fire: 0, ice: 1, arcane: 2 };
  if (elMap[element] === p.ringElement) return 1 + maxPct / 100;
  return 1;
}

export function updatePlayer(dt){
  const p=game.player;
  p.fireTimer-=dt;
  for(let i=0;i<3;i++){
    if(p.skillCooldowns[i]>0)p.skillCooldowns[i]-=dt;
    if(p.skillCooldowns[i]<0)p.skillCooldowns[i]=0;
  }
  if(p.hitInvuln>0)p.hitInvuln-=dt;
  // Elemental Ring cycle: fire(0) → ice(1) → arcane(2), 4s each
  let hasRing = false;
  const eqSrc = game.sandboxEquipment || game.equipment;
  for (const eq of Object.values(eqSrc)) {
    if (eq && eq.power && eq.power.stat === 'ringElement') { hasRing = true; break; }
  }
  if (hasRing) {
    p.ringCycleTimer += dt;
    if (p.ringCycleTimer >= 4) { p.ringCycleTimer -= 4; p.ringElement = (p.ringElement + 1) % 3; }
  }
  // Timed buffs (ghost, etc.) — managed by buff engine
  tickTimedBuffs(dt);
  // Legacy compat: also clean up old-style ghost buffs
  for(let i=p.buffs.length-1;i>=0;i--){
    const b=p.buffs[i];
    b.timer-=dt;
    if(b.timer<=0)p.buffs.splice(i,1);
  }
  let mx=0,my=0;
  if(game.keys.w)my-=1;
  if(game.keys.s)my+=1;
  if(game.keys.a)mx-=1;
  if(game.keys.d)mx+=1;
  if(mx!==0||my!==0){
    const n=normalize(mx,my);
    const statsForMove = calcPlayerStats();
    const effectiveSpeed = game.moveSpeed * (statsForMove.moveMult || 1);
    p.x=clamp(p.x+n.x*effectiveSpeed*dt,PLAYER_RADIUS,MAP_W-PLAYER_RADIUS);
    p.y=clamp(p.y+n.y*effectiveSpeed*dt,PLAYER_RADIUS,MAP_H-PLAYER_RADIUS);
  }

  // Chronomancer 4-piece: standing in singularity field resets teleport CD
  const sets2 = getSetEffects(!!game.sandboxEquipment);
  if (sets2.chronomancer && sets2.chronomancer.active.four) {
    for (const f of p.singularityFields) {
      if (!f.imploded) {
        const d = dist(p.x, p.y, f.x, f.y);
        if (d < f.radius) {
          if (!f._playerInsideSince) f._playerInsideSince = game.time;
          if (game.time - f._playerInsideSince >= 2) {
            p.skillCooldowns[0] = 0;
            f._playerInsideSince = game.time;
          }
        } else {
          f._playerInsideSince = null;
        }
      }
    }
  }

  const range=DETECTION_RANGE;
  let nearest=null, nearDist=range;
  for(const m of game.monsters){
    const d=dist(p.x,p.y,m.x,m.y);
    if(d<nearDist){nearDist=d;nearest=m;}
  }
  if(game.trainingDummies){
    for(const d of game.trainingDummies){
      const dd=dist(p.x,p.y,d.x,d.y);
      if(dd<nearDist){nearDist=dd;nearest=d;}
    }
  }
  if(nearest&&p.fireTimer<=0){
    const speed=p.bulletSpeed;
    const a=angle(p.x,p.y,nearest.x,nearest.y);
    const spread=(Math.random()-0.5)*0.1;
    const fx=getLegendaryEffects();
    const hookState = { pierce: 0 };
    dispatchHook('onProjectileSpawn', hookState, { fx, sets: {}, player: p, equipment: game.equipment });
    game.projectiles.push({
      x:p.x,y:p.y,
      vx:Math.cos(a+spread)*speed,
      vy:Math.sin(a+spread)*speed,
      damage:p.atk,size:5,isEnemy:false,color:'#ff8800',
      life:2, pierce:hookState.pierce,
    });
    playSFX('fire');
    p.fireTimer=1/p.fireRate;
    spawnParticles(p.x+Math.cos(a)*25,p.y+Math.sin(a)*25,2,'#ffaa00',30,2);
    const sets = getSetEffects(!!game.sandboxEquipment);
    if (sets.elementalist && sets.elementalist.active.two) {
      if (!p.elementalistAutoUsed && p.elementalistLastElement !== 'fire') {
        p.elementalistStacks = Math.min(3, p.elementalistStacks + 1);
        p.elementalistAutoUsed = true;
      }
    }
  }
  let closeMonster=false;
  for(const m of game.monsters){
    if(dist(p.x,p.y,m.x,m.y)<250){closeMonster=true;break;}
  }
  if(!closeMonster&&p.hp<p.maxHp){
    p.hp=Math.min(p.maxHp,p.hp+p.maxHp*0.01*dt);
  }
  p.hp=Math.max(0,Math.min(p.maxHp,p.hp));
}
