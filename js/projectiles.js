// ============================================================
// SECTION 8: PROJECTILES
// ============================================================
import { game } from './game-state.js';
import { PLAYER_RADIUS, MAP_W, MAP_H } from './config.js';
import { dist, clamp } from './helpers.js';
import { damagePlayer, getRingMultiplier } from './player.js';
import { spawnParticles } from './particles.js';
import { hitDummy } from './testfield.js';
import { getSynergyEffects } from './synergies.js';
import { addFloatingNumber } from './renderer.js';
import { playSFX } from './audio.js';

export function updateProjectiles(dt){
  for(let i=game.projectiles.length-1;i>=0;i--){
    const p=game.projectiles[i];
    p.x+=p.vx*dt;
    p.y+=p.vy*dt;
    // Tracking projectile (harmonyEye artifact)
    if (p.tracking) {
      const target = p.tracking;
      if (target.hp > 0) {
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const d = Math.sqrt(dx*dx + dy*dy) || 1;
        const speed = p.trackingSpeed || 200;
        p.vx = (dx / d) * speed;
        p.vy = (dy / d) * speed;
      } else {
        p.tracking = null; // target dead, fly straight
      }
    }
    p.life=(p.life||2)-dt;
    if(p.x<0||p.x>MAP_W||p.y<0||p.y>MAP_H||p.life<=0){
      game.projectiles.splice(i,1);continue;
    }
    const syn = getSynergyEffects();
    // Fire-Ice: mark projectile if inside blizzard
    if (syn.fireIce && !p.isEnemy && !p._fireIce) {
      for (const e of game.skillEffects) {
        if (e.type === 'blizzard' && dist(p.x, p.y, e.x, e.y) < e.radius) {
          p._fireIce = true;
          p.color = '#ff88ff';
          break;
        }
      }
    }
    let hit=false;
    if(p.isEnemy){
      if(dist(p.x,p.y,game.player.x,game.player.y)<p.size+PLAYER_RADIUS){
        if(game.player.hitInvuln<=0){
          damagePlayer(p.damage);
          playSFX('playerHit');
          game.player.hitInvuln=0.2;
          spawnParticles(game.player.x,game.player.y,4,'#ff4444',60,3);
        }
        hit=true;
      }
    }else{
      // Check dummy hits (testfield mode)
      if (game.trainingDummies && game.trainingDummies.length > 0 && !p.isEnemy) {
        const dummyResult = hitDummy(p, p.x, p.y);
        if (dummyResult.hit) {
          if (!p._hitDummies) p._hitDummies = new Set();
          if (!p._hitDummies.has(dummyResult.dummy.id)) {
            p._hitDummies.add(dummyResult.dummy.id);
            if (!p._dummyHits) p._dummyHits = [];
            p._dummyHits.push(dummyResult);
            spawnParticles(dummyResult.x, dummyResult.y, 4, '#ffaa00', 50, 2);
          }
        }
      }
      for(let j=game.monsters.length-1;j>=0;j--){
        const m=game.monsters[j];
        if(dist(p.x,p.y,m.x,m.y)<p.size+m.size){
          if(p._hitMonsters&&p._hitMonsters.has(m.id))continue;
          let dmg=p.damage;
          // Track pierce count for synergies
          if (!p._pierceCount) p._pierceCount = 0;

          // Molten Core: pierce ramp
          let pierceDmgMult = 1;
          if (syn.moltenCore) {
            pierceDmgMult = 1 + p._pierceCount * 0.10;
          }

          // Apply synergies to damage
          dmg *= pierceDmgMult;

          // Molten Core: ignite at 3+ pierces
          if (syn.moltenCore && p._pierceCount >= 3) {
            m.igniteTimer = 3;
            m.igniteDmg = p.damage * 0.5;
          }

          // Fire-Ice: double damage vs frozen
          if (syn.fireIce && p._fireIce && m.frozen) {
            dmg *= 2;
          }
          if (m.vulnerable) dmg = Math.round(dmg * 1.5);
          dmg = Math.round(dmg * getRingMultiplier('fire'));
          if(m.shield>0){
            const absorb=Math.min(m.shield,dmg);
            m.shield-=absorb;
            dmg-=absorb;
          }
          m.hp-=dmg;
          if(dmg>=1)addFloatingNumber(m.x,m.y,dmg);
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
            p._pierceCount++;
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
