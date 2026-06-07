// ============================================================
// SECTION 9: PARTICLES
// ============================================================
import { game } from './game-state.js';
import { MAX_PARTICLES } from './config.js';

export function spawnParticles(x,y,count,color,speed,size){
  for(let i=0;i<count;i++){
    if(game.particles.length>=MAX_PARTICLES)break;
    const a=Math.random()*Math.PI*2;
    const sp=speed*(0.3+Math.random()*0.7);
    game.particles.push({
      x,y,
      vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      life:0.3+Math.random()*0.7,
      maxLife:0.3+Math.random()*0.7,
      size:size*(0.5+Math.random()*0.5),
      color,alpha:1,
    });
  }
}

export function updateParticles(dt){
  for(let i=game.particles.length-1;i>=0;i--){
    const p=game.particles[i];
    p.x+=p.vx*dt;
    p.y+=p.vy*dt;
    p.vx*=0.95;
    p.vy*=0.95;
    p.life-=dt;
    p.alpha=p.life/p.maxLife;
    if(p.life<=0||p.alpha<=0){
      game.particles.splice(i,1);
    }
  }
}
