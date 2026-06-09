// ============================================================
// SECTION 11: EQUIPMENT
// ============================================================
import { game } from './game-state.js';
import { QUALITY_COLORS, BASE_PICKUP_RANGE, MAX_LEVEL } from './config.js';
import { SLOT_DEF } from './config/equipment-table.js';
import { randChoice, dist } from './helpers.js';
import { calcPlayerStats } from './player.js';
import { spawnParticles } from './particles.js';
import { saveGame } from './persistence.js';
import { playSFX } from './audio.js';
import {
  generateEquipment, generateArtifact,
  rollQuality, rollBossQuality,
} from './equipment-factory.js';

// Re-export factory functions for backward compat
export { generateEquipment, generateArtifact, rollQuality, rollBossQuality };

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
  const range=BASE_PICKUP_RANGE; // equipment pickup uses fixed base range
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
        game.backpack.push({slot:d.slot,quality:d.quality,ilvl:d.ilvl,statValue:d.statValue,stat:d.stat,name:d.name,color:d.color,power:d.power||null,artifactId:d.artifactId||null,setName:d.setName||null,desc:d.desc||null});
        playSFX('pickup');
        spawnParticles(d.x,d.y,10,QUALITY_COLORS[d.quality],80,3);
        game.drops.splice(i,1);
      }
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
    playSFX('levelUp');
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

