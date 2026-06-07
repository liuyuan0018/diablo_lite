// ============================================================
// SECTION 11: EQUIPMENT
// ============================================================
import { game } from './game-state.js';
import { SLOT_DEF, QUALITY_NAMES, QUALITY_COLORS, rollIlvl, rollStatValue, rollLegendaryPower, MAX_LEVEL } from './config.js';
import { rand, randChoice, dist } from './helpers.js';
import { calcPlayerStats } from './player.js';
import { spawnParticles } from './particles.js';
import { saveGame } from './persistence.js';

export function generateEquipment(slot,boss,stageIdx){
  if(!boss&&Math.random()>0.15)return null;
  const ilvl=rollIlvl(stageIdx);
  const quality=boss?rollBossQuality():rollQuality();
  const statValue=rollStatValue(slot,quality,ilvl);
  const eq={
    slot, quality, ilvl, statValue,
    name:QUALITY_NAMES[quality]+SLOT_DEF[slot].name,
    color:QUALITY_COLORS[quality],
    stat:SLOT_DEF[slot].stat,
  };
  if(quality===3){
    eq.power=rollLegendaryPower(ilvl);
    eq.name+=' ['+ilvl+']';
  }else{
    eq.name+=' ['+ilvl+']';
  }
  return eq;
}

export function rollQuality(){
  const r=Math.random();
  if(r<0.45)return 0;
  if(r<0.75)return 1;
  if(r<0.93)return 2;
  return 3;
}

export function rollBossQuality(){
  const r=Math.random();
  if(r<0.5)return 2;
  return 3;
}

export function getSlotName(slot){ return SLOT_DEF[slot]?SLOT_DEF[slot].name:slot; }

export function tryDropEquipment(x,y,boss,stageIdx){
  const slots=['weapon','helmet','armor','ring','amulet','boots'];
  const slot=randChoice(slots);
  const eq=generateEquipment(slot,boss,stageIdx);
  if(eq){
    game.drops.push({x,y,...eq, bobPhase:Math.random()*Math.PI*2});
  }
}

export function updatePickup(dt){
  const p=game.player;
  const range=calcPlayerStats().pickupRange;
  for(let i=game.drops.length-1;i>=0;i--){
    const d=game.drops[i];
    if(d.expireTime&&game.time>d.expireTime){
      spawnParticles(d.x,d.y,6,'#ff4444',40,3);
      game.drops.splice(i,1);
      continue;
    }
    d.bobPhase+=dt*3;
    if(dist(d.x,d.y,p.x,p.y)<range){
      if(game.backpack.length<8){
        game.backpack.push({slot:d.slot,quality:d.quality,ilvl:d.ilvl,statValue:d.statValue,stat:d.stat,name:d.name,color:d.color,power:d.power||null});
        spawnParticles(d.x,d.y,10,QUALITY_COLORS[d.quality],80,3);
      }
      game.drops.splice(i,1);
    }
  }
}

// ============================================================
// SECTION 12: LEVELING
// ============================================================
export function gainExp(amount){
  const p=game.player;
  p.exp+=amount;
  while(p.exp>=p.expToNext&&p.level<MAX_LEVEL){
    p.exp-=p.expToNext;
    p.level++;
    p.expToNext=Math.floor(100+p.level*40);
    const stats=calcPlayerStats();
    p.maxHp=stats.maxHP;
    p.hp=Math.min(p.hp+5,p.maxHp);
    p.atk=stats.atk;
    p.cdr=stats.cdr;
    p.bulletSpeed=stats.bulletSpeed;
    p.pickupRange=stats.pickupRange;
    p.fireRate=stats.fireRate;
    spawnParticles(p.x,p.y,30,'#ffd700',150,5);
    saveGame();
  }
  const stats=calcPlayerStats();
  p.maxHp=stats.maxHP;
  p.atk=stats.atk;
  p.cdr=stats.cdr;
  p.bulletSpeed=stats.bulletSpeed;
  p.pickupRange=stats.pickupRange;
  p.fireRate=stats.fireRate;
}

