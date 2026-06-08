// ============================================================
// SECTION 7: SPAWNER
// ============================================================
import { game } from './game-state.js';
import { STAGES, DIFFICULTY, TEST_DIFF, TEST_STAGE, MAP_W, MAP_H, MAX_MONSTERS } from './config.js';
import { randChoice, randInt, rand, clamp } from './helpers.js';
import { createMonster } from './monsters.js';
import { spawnParticles } from './particles.js';
import { playSFX } from './audio.js';

export function updateSpawner(dt){
  const stage=game.isTestStage?TEST_STAGE:STAGES[game.stageIndex];
  const diff=game.isTestStage?TEST_DIFF:DIFFICULTY[game.stageIndex];
  if(!stage)return;
  if(!game.bossSpawned){
    game.spawnTimer-=dt;
    if(game.spawnTimer<=0){
      const timeFactor=Math.max(0.4,1-game.time/300);
      game.spawnTimer=Math.max(0.3,diff.spawnRate*timeFactor);
      if(game.monsters.length<MAX_MONSTERS){
        const pos=getSpawnPosition();
        if(pos){
          const mType=randChoice(stage.monsterTypes);
          const m=createMonster(mType,pos.x,pos.y,false,false,null,game.stageIndex);
          if(m)game.monsters.push(m);
        }
      }
    }
  }
  if(!game.bossSpawned){
    game.eliteWaveTimer-=dt;
    if(game.eliteWaveTimer<=0){
      game.eliteWaveTimer=diff.eliteEvery;
      const count=3+Math.floor(Math.random()*3);
      const affixes=['fast','split','explode','vampiric','shielded'];
      for(let i=0;i<count&&game.monsters.length<MAX_MONSTERS;i++){
        const pos=getSpawnPosition();
        if(pos){
          const mType=randChoice(stage.monsterTypes);
          const aff=randChoice(affixes);
          const m=createMonster(mType,pos.x,pos.y,false,true,aff,game.stageIndex);
          if(m)game.monsters.push(m);
        }
      }
    }
  }
  if(!game.bossSpawned&&game.kills>=game.killsForBoss){
    game.bossSpawned=true;
    const a=Math.random()*Math.PI*2;
    const bossDist=400;
    const bx=clamp(game.player.x+Math.cos(a)*bossDist,50,MAP_W-50);
    const by=clamp(game.player.y+Math.sin(a)*bossDist,50,MAP_H-50);
    const boss=createMonster(stage.bossType,bx,by,true,false,null,game.stageIndex);
    if(boss){
      const affixes=['fast','explode','vampiric','shielded'];
      boss.affix=randChoice(affixes);
      boss.color='#cc0000';
      game.monsters.push(boss);
      playSFX('bossSpawn');
      spawnParticles(bx,by,50,'#cc0000',250,8);
    }
  }
}

export function getSpawnPosition(){
  const side=randInt(0,3);
  let x,y;
  const margin=50;
  switch(side){
    case 0: x=rand(0,MAP_W); y=-margin; break;
    case 1: x=rand(0,MAP_W); y=MAP_H+margin; break;
    case 2: x=-margin; y=rand(0,MAP_H); break;
    case 3: x=MAP_W+margin; y=rand(0,MAP_H); break;
  }
  return{x,y};
}
