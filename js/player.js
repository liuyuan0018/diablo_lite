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
  const ghostBuff=p.buffs.find(b=>b.type==='ghost');
  const dmg=ghostBuff?amount*0.5:amount;
  p.hp-=dmg;
}

export function getLegendaryEffects(){
  const fx={globalCDR:0,fireballDmg:0,pierce:0,blackholeSize:0,blackholeDur:0,blizzardSize:0,blizzardSlow:0,teleportCD:0};
  for(const slot of Object.keys(game.equipment)){
    const e=game.equipment[slot];
    if(e&&e.power&&e.power.stat)fx[e.power.stat]=(fx[e.power.stat]||0)+e.power.value;
  }
  return fx;
}

export function calcPlayerStats(){
  const lv=game.player.level;
  const baseHP=100+(lv-1)*5;
  const baseATK=10+(lv-1)*2;
  let bHP=0,bATK=0,bCDR=0,bSpeed=0,bRange=0,bMove=0;
  const eq=game.equipment;
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
  const fx=getLegendaryEffects();

  const sets = getSetEffects();
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
  return {maxHP: baseHP + bHP, atk: scaledAtk, cdr: Math.min(bCDR + fx.globalCDR, 60), bulletSpeed: bSpeedVal, pickupRange: BASE_PICKUP_RANGE + bRange, movespeed: bMove, fireRate, legendary: fx, sets, setDmgMult, setDmgReduc, synergies: getSynergyEffects()};
}

export function updatePlayer(dt){
  const p=game.player;
  p.fireTimer-=dt;
  for(let i=0;i<3;i++){
    if(p.skillCooldowns[i]>0)p.skillCooldowns[i]-=dt;
    if(p.skillCooldowns[i]<0)p.skillCooldowns[i]=0;
  }
  if(p.hitInvuln>0)p.hitInvuln-=dt;
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
    p.x=clamp(p.x+n.x*game.moveSpeed*dt,PLAYER_RADIUS,MAP_W-PLAYER_RADIUS);
    p.y=clamp(p.y+n.y*game.moveSpeed*dt,PLAYER_RADIUS,MAP_H-PLAYER_RADIUS);
  }

  const range=DETECTION_RANGE;
  let nearest=null, nearDist=range;
  for(const m of game.monsters){
    const d=dist(p.x,p.y,m.x,m.y);
    if(d<nearDist){nearDist=d;nearest=m;}
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
    const sets = getSetEffects();
    if (sets.elementalist && sets.elementalist.active.two) {
      if (p.elementalistLastElement !== 'fire') {
        p.elementalistStacks = Math.min(3, p.elementalistStacks + 1);
      } else {
        p.elementalistStacks = 0;
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
