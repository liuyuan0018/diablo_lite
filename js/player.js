// ============================================================
// SECTION 4: PLAYER
// ============================================================
import { game } from './game-state.js';
import { PLAYER_RADIUS, MAP_W, MAP_H, BASE_FIRE_RATE, BASE_BULLET_SPEED, BASE_PICKUP_RANGE, DETECTION_RANGE, SKILL_CONFIG } from './config.js';
import { normalize, clamp, dist, angle } from './helpers.js';
import { spawnParticles } from './particles.js';
import { getSetEffects } from './sets.js';
import { getSynergyEffects } from './synergies.js';

export function damagePlayer(amount){
  const p=game.player;
  const stats=calcPlayerStats();
  const dr=stats.setDmgReduc||0;
  const ghostBuff=p.buffs.find(b=>b.type==='ghost');
  let dmg=ghostBuff?amount*0.5:amount;
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
  let bHP=0,bATK=0,bCDR=0,bSpeed=0,bRange=0,bMove=0;
  const eq=sandbox?(game.sandboxEquipment||game.equipment):game.equipment;
  for(const slot of Object.keys(eq)){
    const e=eq[slot];
    if(!e||e.statValue===undefined)continue;
    switch(e.stat){
      case 'atk':bATK+=e.statValue;break;
      case 'cdr':bCDR+=e.statValue;break;
      case 'maxHp':bHP+=e.statValue;break;
      case 'bulletSpeed':bSpeed+=e.statValue;break;
      case 'pickupRange':bRange+=e.statValue;break;
      case 'movespeed':bMove+=e.statValue;break;
    }
  }
  const bSpeedVal=BASE_BULLET_SPEED+bSpeed;
  const fx=getLegendaryEffects(sandbox);

  const sets = getSetEffects(sandbox);
  let setDmgMult = 1;
  let setDmgReduc = 0;

  // Elementalist 2-piece: +15% per harmony stack
  if (sets.elementalist && sets.elementalist.active.two) {
    setDmgMult += game.player.elementalistStacks * 0.15;
  }
  // Elementalist 4-piece: 10% DR per harmony stack
  if (sets.elementalist && sets.elementalist.active.four) {
    setDmgReduc += game.player.elementalistStacks * 0.10;
  }

  const fireRate = BASE_FIRE_RATE + (bSpeedVal - BASE_BULLET_SPEED) * 0.01;
  const finalAtk = Math.round(baseATK + bATK * (1 + fx.fireballDmg / 100));
  const scaledAtk = Math.round(finalAtk * setDmgMult);

  // Artifact effects
  let artifactAtk = scaledAtk;
  let moveMult = 1;
  const art = game.equipment.artifact;
  if (art && art.artifactId === 'feather') {
    const hpRatio = game.player.hp / Math.max(1, game.player.maxHp);
    if (hpRatio > 0.8) {
      const ratio = Math.min(1, (hpRatio - 0.8) / 0.2);
      artifactAtk = Math.round(scaledAtk * (1 + ratio * 0.25));
      moveMult = 1 + ratio * 0.20;
    }
  }
  if (art && art.artifactId === 'criticalFragment') {
    const anyLowCD = game.player.skillCooldowns.some(cd => cd > 0 && cd < 3);
    if (anyLowCD) {
      artifactAtk = Math.round(scaledAtk * 1.30);
    }
  }

  const ringEl = game.player.ringElement;
  const ringMult = game.player.ringCycleTimer; // for display
  return {maxHP: baseHP + bHP, atk: artifactAtk, cdr: Math.min(bCDR + fx.globalCDR, 60), bulletSpeed: bSpeedVal, pickupRange: BASE_PICKUP_RANGE + bRange, movespeed: bMove, moveMult, fireRate, legendary: fx, sets, setDmgMult, setDmgReduc, synergies: getSynergyEffects(), ringElement: ringEl, ringTimer: ringMult};
}

export function getRingMultiplier(element) {
  const p = game.player;
  const hasRing = (game.equipment.artifact && game.equipment.artifact.artifactId === 'elementalRing') ||
                  (game.sandboxEquipment && game.sandboxEquipment.artifact && game.sandboxEquipment.artifact.artifactId === 'elementalRing');
  if (!hasRing || !element) return 1;
  const elMap = { fire: 0, ice: 1, arcane: 2 };
  if (elMap[element] === p.ringElement) {
    const progress = p.ringCycleTimer / 4; // 0→1 within window
    return 1 + progress * 1.5; // ramp from 1x to 2.5x
  }
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
  const hasRing = game.equipment.artifact && game.equipment.artifact.artifactId === 'elementalRing';
  if (hasRing || (game.sandboxEquipment && game.sandboxEquipment.artifact && game.sandboxEquipment.artifact.artifactId === 'elementalRing')) {
    p.ringCycleTimer += dt;
    if (p.ringCycleTimer >= 4) { p.ringCycleTimer -= 4; p.ringElement = (p.ringElement + 1) % 3; }
  }
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
    game.projectiles.push({
      x:p.x,y:p.y,
      vx:Math.cos(a+spread)*speed,
      vy:Math.sin(a+spread)*speed,
      damage:p.atk,size:5,isEnemy:false,color:'#ff8800',
      life:2, pierce:fx.pierce||0,
    });
    p.fireTimer=1/p.fireRate;
    spawnParticles(p.x+Math.cos(a)*25,p.y+Math.sin(a)*25,2,'#ffaa00',30,2);
    // Auto-attack fireball = fire element
    const sets = getSetEffects(!!game.sandboxEquipment);
    if (sets.elementalist && sets.elementalist.active.two) {
      if (p.elementalistLastElement !== 'fire') {
        p.elementalistStacks = Math.min(3, p.elementalistStacks + 1);
      }
      p.elementalistLastElement = 'fire';
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
