// ============================================================
// SECTION 8: PROJECTILES
// ============================================================
import { game } from './game-state.js';
import { PLAYER_RADIUS, MAP_W, MAP_H } from './config.js';
import { dist, clamp } from './helpers.js';
import { damagePlayer } from './player.js';
import { spawnParticles } from './particles.js';

export function updateProjectiles(dt){
  for(let i=game.projectiles.length-1;i>=0;i--){
    const p=game.projectiles[i];
    p.x+=p.vx*dt;
    p.y+=p.vy*dt;
    p.life=(p.life||2)-dt;
    if(p.x<0||p.x>MAP_W||p.y<0||p.y>MAP_H||p.life<=0){
      game.projectiles.splice(i,1);continue;
    }
    let hit=false;
    if(p.isEnemy){
      if(dist(p.x,p.y,game.player.x,game.player.y)<p.size+PLAYER_RADIUS){
        if(game.player.hitInvuln<=0){
          damagePlayer(p.damage);
          game.player.hitInvuln=0.2;
          spawnParticles(game.player.x,game.player.y,4,'#ff4444',60,3);
        }
        hit=true;
      }
    }else{
      for(let j=game.monsters.length-1;j>=0;j--){
        const m=game.monsters[j];
        if(dist(p.x,p.y,m.x,m.y)<p.size+m.size){
          if(p._hitMonsters&&p._hitMonsters.has(m.id))continue;
          let dmg=p.damage;
          if(m.shield>0){
            const absorb=Math.min(m.shield,dmg);
            m.shield-=absorb;
            dmg-=absorb;
          }
          m.hp-=dmg;
          if(m.type==='shadowMage'&&Math.random()<0.1){
            const ta=Math.random()*Math.PI*2;
            m.x+=Math.cos(ta)*100;
            m.y+=Math.sin(ta)*100;
            m.x=clamp(m.x,m.size,MAP_W-m.size);
            m.y=clamp(m.y,m.size,MAP_H-m.size);
            spawnParticles(m.x,m.y,8,'#8844ff',80,3);
          }
          spawnParticles(p.x,p.y,4,'#ffaa00',50,2);
          if(p.pierce>0){
            p.pierce--;
            if(!p._hitMonsters)p._hitMonsters=new Set();
            p._hitMonsters.add(m.id);
          }else{
            hit=true;
            break;
          }
        }
      }
    }
    if(hit){game.projectiles.splice(i,1);}
  }
}
