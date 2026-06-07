// ============================================================
// SECTION 6: MONSTERS
// ============================================================
import { game } from './game-state.js';
import { PLAYER_RADIUS, MAP_W, MAP_H, DIFFICULTY, TEST_DIFF, MONSTER_BASE, MAX_MONSTERS } from './config.js';
import { dist, clamp, rand, randChoice, angle } from './helpers.js';
import { damagePlayer } from './player.js';
import { spawnParticles } from './particles.js';
import { getNextMonsterId } from './config.js';
import { generateEquipment, tryDropEquipment, gainExp, generateArtifact } from './equipment.js';

export function createMonster(type,x,y,boss,elite,affix,stageIdx){
  const base=MONSTER_BASE[type];
  if(!base)return null;
  const diff=game.isTestStage?TEST_DIFF:(DIFFICULTY[stageIdx]||DIFFICULTY[0]);
  const pow=diff.power;
  let size=base.size;
  let hp=base.hp*pow;
  let atk=base.atk*(1+pow*0.5);
  let spd=base.speed;
  if(boss){
    size=base.size*4;
    hp=base.hp*pow*diff.bossMult;
    atk=base.atk*pow*2;
    spd*=0.7;
  }
  const m={
    id:getNextMonsterId(), type, x, y, size, color:base.color,
    hp, maxHp:hp, atk, speed:spd, exp:Math.round(base.exp*diff.expMult),
    isBoss:!!boss, isElite:!!elite, affix:affix||null,
    revived:false, isMinion:false,
    hitTimer:0, slowMult:1, slowTimer:0,
    shootTimer:1+Math.random()*2,
    behaviorState:'chase',
    behaviorTimer:2+Math.random()*2,
    chargeX:0,chargeY:0,
    shield:0,
    exploded:false,
    phase:1, phaseThreshold:0.5,
  };
  if(elite){
    m.maxHp*=2.5;m.hp=m.maxHp;
    m.size*=1.3;
    m.atk*=1.5;
    if(affix==='fast')m.speed*=1.4;
    if(affix==='shielded')m.shield=m.maxHp*0.3;
    m.exp*=3;
  }
  if(boss){
    m.exp*=10;
  }
  return m;
}

function monsterContactDamage(m,dt){
  if(m.hitTimer>0)return;
  const d=dist(m.x,m.y,game.player.x,game.player.y);
  if(d<m.size+PLAYER_RADIUS){
    m.hitTimer=0.5;
    const dmg=m.atk;
    damagePlayer(dmg);
    if(m.affix==='vampiric'){
      m.hp=Math.min(m.maxHp,m.hp+dmg*0.2);
    }
    spawnParticles(game.player.x,game.player.y,5,'#ff4444',80,3);
  }
}

export function updateMonsters(dt){
  for(let i=game.monsters.length-1;i>=0;i--){
    const m=game.monsters[i];
    m.hitTimer=Math.max(0,m.hitTimer-dt);
    // Ignite DoT
    if (m.igniteTimer > 0) {
      m.igniteTimer -= dt;
      m.hp -= (m.igniteDmg || 5) * dt;
      if (Math.random() < 0.3) {
        spawnParticles(m.x + rand(-m.size, m.size), m.y + rand(-m.size, m.size), 1, '#ff4400', 20, 2);
      }
    }
    // Frozen debuff
    if (m.frozenTimer > 0) {
      m.frozenTimer -= dt;
      if (m.frozenTimer <= 0) {
        m.frozen = false;
      }
    }
    const spd=m.frozen?0:m.speed*(m.slowMult||1);
    monsterContactDamage(m,dt);
    const dx=game.player.x-m.x;
    const dy=game.player.y-m.y;
    const d=Math.sqrt(dx*dx+dy*dy)||1;
    const nx=dx/d, ny=dy/d;
    switch(m.type){
      case 'zombie':
        m.x+=nx*spd*dt; m.y+=ny*spd*dt;
        break;
      case 'skeleton':
        m.x+=nx*spd*dt; m.y+=ny*spd*dt;
        break;
      case 'ghost':
        m.x+=nx*spd*dt; m.y+=ny*spd*dt;
        break;
      case 'exploder':{
        m.x+=nx*spd*dt; m.y+=ny*spd*dt;
        if(!m.exploded&&d<m.size*4+PLAYER_RADIUS){
          m.exploded=true;
          damagePlayer(25);
          spawnParticles(m.x,m.y,25,'#ff4400',200,5);
          m.hp=0;
        }
        break;
      }
      case 'spearman':{
        m.shootTimer-=dt;
        if(m.shootTimer<=0){
          m.shootTimer=3;
          const a=angle(m.x,m.y,game.player.x,game.player.y);
          game.projectiles.push({
            x:m.x,y:m.y,
            vx:Math.cos(a)*150,vy:Math.sin(a)*150,
            damage:m.atk,size:4,isEnemy:true,color:'#44ff44',
            life:3,
          });
        }
        m.x+=nx*spd*dt; m.y+=ny*spd*dt;
        break;
      }
      case 'spider':
        m.x+=nx*spd*dt; m.y+=ny*spd*dt;
        break;
      case 'shadowMage':
        m.x+=nx*spd*dt; m.y+=ny*spd*dt;
        break;
      case 'devourer':
        m.x+=nx*spd*dt; m.y+=ny*spd*dt;
        break;
      case 'gargoyle':{
        m.behaviorTimer-=dt;
        if(m.behaviorTimer<=0){
          m.behaviorState=m.behaviorState==='orbit'?'dive':'orbit';
          m.behaviorTimer=3;
        }
        if(m.behaviorState==='orbit'){
          const tanX=-ny, tanY=nx;
          m.x+=tanX*spd*dt; m.y+=tanY*spd*dt;
          if(Math.abs(d-200)>5){
            const pull=(d-200)*0.05;
            m.x-=nx*pull; m.y-=ny*pull;
          }
        }else{
          m.x+=nx*spd*1.5*dt; m.y+=ny*spd*1.5*dt;
        }
        break;
      }
      case 'deathKnight':{
        m.behaviorTimer-=dt;
        if(m.behaviorState!=='charging'&&m.behaviorTimer<=0){
          m.behaviorState='charging';
          m.chargeX=nx; m.chargeY=ny;
          m.behaviorTimer=1.5;
        }
        if(m.behaviorState==='charging'){
          m.x+=m.chargeX*spd*3*dt;
          m.y+=m.chargeY*spd*3*dt;
          if(m.behaviorTimer<=0){
            m.behaviorState='chase';
            m.behaviorTimer=2+Math.random();
          }
        }else{
          m.x+=nx*spd*dt; m.y+=ny*spd*dt;
        }
        break;
      }
    }
    // Boss threshold drops
    if(m.isBoss){
      const thresholds=[0.75,0.5,0.25];
      const hpRatio=m.hp/m.maxHp;
      if(!m._lastDropThreshold)m._lastDropThreshold=1;
      for(const t of thresholds){
        if(m._lastDropThreshold>t&&hpRatio<=t){
          m._lastDropThreshold=t;
          const slots=['weapon','helmet','armor','ring','amulet','boots','bracers','belt','artifact'];
          const slot=randChoice(slots);
          if(slot==='artifact'){
            const art=generateArtifact(true,game.stageIndex);
            if(art)game.drops.push({x:m.x+rand(-40,40),y:m.y+rand(-40,40),...art,bobPhase:Math.random()*Math.PI*2,expireTime:game.time+3});
          }else{
            const eq=generateEquipment(slot,true,game.stageIndex);
            if(eq)game.drops.push({x:m.x+rand(-40,40),y:m.y+rand(-40,40),...eq,bobPhase:Math.random()*Math.PI*2,expireTime:game.time+3});
          }
          spawnParticles(m.x,m.y,15,'#ffd700',120,4);
        }
      }
    }
    // Boss phase transition
    if(m.isBoss&&m.phase===1&&m.hp<m.maxHp*m.phaseThreshold){
      m.phase=2;
      m.speed*=1.3;
      m.color='#ff2222';
      spawnParticles(m.x,m.y,30,'#ff0000',200,6);
      if(m.type==='deathKnight'){
        m.behaviorState='charging';
        const dx=game.player.x-m.x, dy=game.player.y-m.y;
        const d=Math.sqrt(dx*dx+dy*dy)||1;
        m.chargeX=dx/d; m.chargeY=dy/d;
        m.behaviorTimer=1.5;
      }
    }
    m.x=clamp(m.x,m.size,MAP_W-m.size);
    m.y=clamp(m.y,m.size,MAP_H-m.size);
    if(m.shield>0&&m.affix==='shielded'){
      m.shield=Math.min(m.maxHp*0.3,m.shield+m.maxHp*0.01*dt);
    }
  }
  processMonsterDeaths();
}

function processMonsterDeaths(){
  for(let i=game.monsters.length-1;i>=0;i--){
    const m=game.monsters[i];
    if(m.hp>0)continue;
    if(m.type==='skeleton'&&!m.revived&&!m.isMinion){
      m.hp=m.maxHp*0.5;
      m.revived=true;
      spawnParticles(m.x,m.y,10,'#ffffff',100,3);
      continue;
    }
    if(m.type==='spider'&&!m.isMinion){
      for(let j=0;j<3;j++){
        const a=Math.random()*Math.PI*2;
        const mini=createMonster('spider',m.x+Math.cos(a)*15,m.y+Math.sin(a)*15,false,false,null,game.stageIndex);
        if(mini){
          mini.isMinion=true;
          mini.maxHp*=0.3;mini.hp=mini.maxHp;
          mini.size*=0.5;mini.atk*=0.5;mini.exp=Math.floor(mini.exp*0.3);
          game.monsters.push(mini);
        }
      }
    }
    if(m.type==='devourer'){
      game.skillEffects.push({
        type:'poisonPool',x:m.x,y:m.y,radius:50,
        duration:4,timer:4,damage:m.atk*0.5,
      });
    }
    if(m.isElite&&m.affix==='split'){
      for(let j=0;j<2+Math.floor(Math.random()*2);j++){
        const a=Math.random()*Math.PI*2;
        const mini=createMonster(m.type,m.x+Math.cos(a)*20,m.y+Math.sin(a)*20,false,false,null,game.stageIndex);
        if(mini){
          mini.isMinion=true;
          mini.size*=0.5;mini.maxHp*=0.3;mini.hp=mini.maxHp;
          mini.atk*=0.5;mini.exp=Math.floor(mini.exp*0.3);
          game.monsters.push(mini);
        }
      }
    }
    if(m.isElite&&m.affix==='explode'){
      const pd=dist(m.x,m.y,game.player.x,game.player.y);
      if(pd<80)damagePlayer(30);
      spawnParticles(m.x,m.y,30,'#ff4400',250,5);
    }
    tryDropEquipment(m.x,m.y,m.isBoss,game.stageIndex);
    gainExp(m.exp);
    game.kills++;
    game.soulCoins+=m.isBoss?10:1;
    // Health globe drop
    const globeChance = m.isBoss ? 1 : (m.isElite ? 0.6 : 0.2);
    if (Math.random() < globeChance) {
      game.healthGlobes.push({
        x: m.x + (Math.random() - 0.5) * 30,
        y: m.y + (Math.random() - 0.5) * 30,
        healPct: m.isBoss ? 0.5 : (m.isElite ? 0.25 : 0.15),
        bobPhase: Math.random() * Math.PI * 2,
      });
    }
    const burstColor=m.isBoss?'#ff0000':(m.isElite?'#ffaa00':'#ff6600');
    spawnParticles(m.x,m.y,m.isBoss?40:(m.isElite?25:12),burstColor,m.isBoss?200:120,m.isBoss?6:4);
    game.monsters.splice(i,1);
  }
}
