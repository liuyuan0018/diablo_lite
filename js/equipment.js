// ============================================================
// SECTION 11: EQUIPMENT
// ============================================================
import { game } from './game-state.js';
import { SLOT_DEF, QUALITY_NAMES, QUALITY_COLORS, rollIlvl, rollStatValue, rollLegendaryPower, MAX_LEVEL, SET_DEFS, ARTIFACT_DEFS } from './config.js';
import { rand, randChoice, dist } from './helpers.js';
import { calcPlayerStats } from './player.js';
import { spawnParticles } from './particles.js';
import { saveGame } from './persistence.js';

export function generateEquipment(slot,boss,stageIdx){
  if(!boss&&Math.random()>0.15)return null;
  const ilvl=rollIlvl(stageIdx);
  const quality=boss?rollBossQuality(stageIdx):rollQuality(stageIdx);
  const statValue=rollStatValue(slot,quality,ilvl);
  const eq={
    slot, quality, ilvl, statValue,
    name:QUALITY_NAMES[quality]+SLOT_DEF[slot].name,
    color:QUALITY_COLORS[quality],
    stat:SLOT_DEF[slot].stat,
  };
  if(quality===4){
    const setKeys=Object.keys(SET_DEFS);
    const setName=randChoice(setKeys);
    const def=SET_DEFS[setName];
    const validSlot=randChoice(def.parts);
    const newStatValue=rollStatValue(validSlot,quality,ilvl);
    eq.slot=validSlot;
    eq.statValue=newStatValue;
    eq.stat=SLOT_DEF[validSlot].stat;
    eq.setName=setName;
    eq.color=QUALITY_COLORS[4];
    eq.name=QUALITY_NAMES[4]+' '+def.name+' '+SLOT_DEF[validSlot].name+' ['+ilvl+']';
    eq.power=null;
  }
  if(quality===3){
    eq.power=rollLegendaryPower(ilvl);
    eq.name+=' ['+ilvl+']';
  }else{
    eq.name+=' ['+ilvl+']';
  }
  return eq;
}

export function generateArtifact(boss,stageIdx){
  const ilvl=rollIlvl(stageIdx);
  const quality=boss?rollBossQuality(stageIdx):rollQuality(stageIdx);
  const artDef=randChoice(ARTIFACT_DEFS);
  return {
    slot:'artifact',
    quality:Math.min(quality,3),
    ilvl,
    statValue:0,
    name:QUALITY_NAMES[Math.min(quality,3)]+artDef.name+' ['+ilvl+']',
    color:QUALITY_COLORS[Math.min(quality,3)],
    stat:'artifact',
    power:null,
    artifactId:artDef.id,
    setName:artDef.setName,
  };
}

export function rollQuality(stageIdx){
  const r=Math.random();
  if(r<0.40)return 0;
  if(r<0.68)return 1;
  if(r<0.85)return 2;
  if(r<0.96||stageIdx<3)return 3; // set only at ilvl 70 (stage 3+), else legendary
  return 4;
}

export function rollBossQuality(stageIdx){
  const r=Math.random();
  if(r<0.40)return 2;
  if(stageIdx<3)return 3; // set only at ilvl 70 (stage 3+), else legendary
  if(r<0.82)return 3;
  return 4;
}

export function getSlotName(slot){ return SLOT_DEF[slot]?SLOT_DEF[slot].name:slot; }

export function tryDropEquipment(x,y,boss,stageIdx){
  const slots=['weapon','helmet','armor','ring','amulet','boots','bracers','belt','artifact'];
  const slot=randChoice(slots);
  if(slot==='artifact'){
    const art=generateArtifact(boss,stageIdx);
    if(art)game.drops.push({x,y,...art,bobPhase:Math.random()*Math.PI*2});
    return;
  }
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

