// ============================================================
// SECTION 5: SKILLS
// ============================================================
import { game } from './game-state.js';
import { PLAYER_RADIUS, MAP_W, MAP_H, SKILL_CONFIG } from './config.js';
import { clamp, rand, normalize, dist } from './helpers.js';
import { spawnParticles } from './particles.js';
import { calcPlayerStats, damagePlayer } from './player.js';

export function castSkill(wx,wy){
  const p=game.player;
  const idx=game.activeSkill;
  const stats=calcPlayerStats();
  const fx=stats.legendary;
  const cdr=stats.cdr;
  if(p.skillCooldowns[idx]>0)return;
  switch(idx){
    case 0:{
      const oldX=p.x,oldY=p.y;
      p.x=clamp(wx,PLAYER_RADIUS,MAP_W-PLAYER_RADIUS);
      p.y=clamp(wy,PLAYER_RADIUS,MAP_H-PLAYER_RADIUS);
      spawnParticles(p.x,p.y,15,'#8844ff',120,4);
      const tpCD=Math.max(0.5,SKILL_CONFIG[0].baseCD*(1-cdr/100)-fx.teleportCD);
      p.skillCooldowns[idx]=tpCD;
      if(fx.blackholeSize>0){
        const r=120*(1+fx.blackholeSize/100);
        game.skillEffects.push({type:'blackhole',x:oldX,y:oldY,radius:r,duration:1.5,timer:1.5,pullForce:120,damage:5});
        spawnParticles(oldX,oldY,12,'#6622aa',80,4);
      }
      p.buffs=p.buffs.filter(b=>b.type!=='ghost');
      if(game.equipment.boots&&game.equipment.boots.quality===3)p.buffs.push({type:'ghost',timer:2});
      break;
    }
    case 1:{
      const dur=2.5+fx.blackholeDur;
      game.skillEffects.push({type:'blackhole',x:wx,y:wy,radius:220,duration:dur,timer:dur,pullForce:180,damage:8*(1+fx.fireballDmg/100)});
      spawnParticles(wx,wy,20,'#6622aa',100,5);
      p.skillCooldowns[idx]=SKILL_CONFIG[1].baseCD*(1-cdr/100);
      break;
    }
    case 2:{
      const r=260*(1+fx.blizzardSize/100);
      const slow=0.5*(1+fx.blizzardSlow/100);
      game.skillEffects.push({type:'blizzard',x:wx,y:wy,radius:r,duration:3,timer:3,tickTimer:0.5,damage:22*(1+fx.fireballDmg/100),slowPct:Math.min(slow,0.9)});
      spawnParticles(wx,wy,25,'#4488ff',80,4);
      p.skillCooldowns[idx]=SKILL_CONFIG[2].baseCD*(1-cdr/100);
      break;
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
          }
        }
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
              m.hp-=e.damage;
              spawnParticles(m.x,m.y,3,'#88aaff',60,3);
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
    }
  }
  for(const m of game.monsters){
    if(m.slowTimer>0){
      m.slowTimer-=dt;
      if(m.slowTimer<=0)m.slowMult=1;
    }
  }
}
