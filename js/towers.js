// ============================================================
// SECTION 10: TOWERS
// ============================================================
import { game } from './game-state.js';
import { MAP_W, MAP_H } from './config.js';
import { clamp, rand, dist } from './helpers.js';
import { spawnParticles } from './particles.js';

export function updateTowers(dt){
  game.towerSpawnTimer-=dt;
  if(game.towerSpawnTimer<=0&&!game.bossSpawned){
    game.towerSpawnTimer=45+Math.random()*45;
    const a=Math.random()*Math.PI*2;
    const d=200+Math.random()*200;
    const tx=clamp(game.player.x+Math.cos(a)*d,30,MAP_W-30);
    const ty=clamp(game.player.y+Math.sin(a)*d,30,MAP_H-30);
    const type=Math.random()<0.5?'cdReset':'lightning';
    const lightningOffsets=[];
    for(let i=0;i<5;i++){lightningOffsets.push({x:rand(-8,8),y:rand(-8,8)});}
    game.towers.push({
      x:tx,y:ty,type,
      timer:0,lifeTimer:10,
      activated:false,
      bobPhase:Math.random()*Math.PI*2,
      lightningOffsets,
    });
  }
  for(let i=game.towers.length-1;i>=0;i--){
    const t=game.towers[i];
    t.bobPhase+=dt*2;
    t.lifeTimer-=dt;
    if(t.lifeTimer<=0){game.towers.splice(i,1);continue;}
    const pd=dist(t.x,t.y,game.player.x,game.player.y);
    if(t.type==='cdReset'&&!t.activated&&pd<80){
      t.activated=true;
      game.player.skillCooldowns=[0,0,0];
      spawnParticles(t.x,t.y,20,'#44aaff',150,4);
    }
    if(t.type==='lightning'&&pd<200){
      t.timer-=dt;
      if(t.timer<=0){
        t.timer=1;
        for(const m of game.monsters){
          if(dist(m.x,m.y,t.x,t.y)<150){
            m.hp-=20;
            spawnParticles(m.x,m.y,5,'#ffff44',80,3);
            t.lastZap={mx:m.x,my:m.y,time:0.1};
          }
        }
      }
    }
    if(t.lastZap){t.lastZap.time-=dt;if(t.lastZap.time<=0)t.lastZap=null;}
  }
}
