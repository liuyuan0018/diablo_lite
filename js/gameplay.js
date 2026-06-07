// ============================================================
// SECTION 17: GAME LOOP
// ============================================================
import { game } from './game-state.js';
import { DIFFICULTY, TEST_DIFF, TEST_STAGE, STAGES, MAP_W, MAP_H, SLOT_DEF, QUALITY_NAMES, QUALITY_COLORS, QUALITY_MULT } from './config.js';
import { clamp, rand, randChoice } from './helpers.js';
import { calcPlayerStats } from './player.js';
import { createMonster } from './monsters.js';
import { spawnParticles } from './particles.js';
import { generateEquipment, generateArtifact } from './equipment.js';
import { saveGame } from './persistence.js';
import { canvas, ctx } from './canvas.js';
import { render, renderBackpackOverlay, renderPauseMenu, menuButtons, prepButtons, equipSlots, victoryButtons, deathButtons, pauseButtons, charButtons, addFloatingNumber, testfieldButtons } from './renderer.js';
import { updatePlayer } from './player.js';
import { castSkill, updateSkillEffects } from './skills.js';
import { updateMonsters } from './monsters.js';
import { updateSpawner } from './spawner.js';
import { updateProjectiles } from './projectiles.js';
import { updateParticles } from './particles.js';
import { updateTowers } from './towers.js';
import { updatePickup } from './equipment.js';
import { updateCamera } from './camera.js';
import { enterTestfield, exitTestfield, resetStats, applyLoadout } from './testfield.js';
import { updateSetEffects } from './sets.js';

export function startTestStage(){
  game.screen='playing';
  game.isTestStage=true;
  game.stageIndex=0;
  game.time=0;
  game.kills=0;
  game.bossSpawned=false;
  game.bossDefeated=false;
  game.lootWindow=0;
  game.killsForBoss=TEST_DIFF.killsBoss;
  game.player.x=1500;game.player.y=1500;
  const stats=calcPlayerStats();
  game.player.maxHp=stats.maxHP;
  game.player.hp=stats.maxHP;
  game.player.atk=stats.atk;
  game.player.cdr=stats.cdr;
  game.player.bulletSpeed=stats.bulletSpeed;
  game.player.pickupRange=stats.pickupRange;
  game.player.fireRate=stats.fireRate;
  game.player.fireTimer=0;
  game.player.skillCooldowns=[0,0,0];
  game.player.buffs=[];
  // Reset set/synergy state
  game.player.elementalistStacks = 0;
  game.player.elementalistLastElement = null;
  game.player.elementalistAura = null;
  game.player.singularityFields = [];
  game.player.temporalResonanceTimer = 0;
  game.player.hitInvuln=0;
  game.monsters=[];
  game.projectiles=[];
  game.skillEffects=[];
  game.particles=[];
  game.towers=[];
  game.drops=[];
  game.backpack.length=0;
  game.spawnTimer=0.3;
  game.eliteWaveTimer=TEST_DIFF.eliteEvery*0.3;
  game.towerSpawnTimer=8;
  game.lastSpawnSide=-1;
  game.camera.x=game.player.x-canvas.width/2;
  game.camera.y=game.player.y-canvas.height/2;
  const stage=TEST_STAGE;
  for(let i=0;i<15;i++){
    const a=Math.random()*Math.PI*2;
    const d=rand(200,450);
    const mx=clamp(game.player.x+Math.cos(a)*d,50,MAP_W-50);
    const my=clamp(game.player.y+Math.sin(a)*d,50,MAP_H-50);
    const m=createMonster(randChoice(stage.monsterTypes),mx,my,false,false,null,0);
    if(m)game.monsters.push(m);
  }
}

export function startGame(stageIndex){
  game.screen='playing';
  game.isTestStage=false;
  game.stageIndex=stageIndex;
  game.time=0;
  game.kills=0;
  game.bossSpawned=false;
  game.bossDefeated=false;
  game.lootWindow=0;
  game.killsForBoss=DIFFICULTY[stageIndex].killsBoss;
  game.player.x=1500;game.player.y=1500;
  const stats=calcPlayerStats();
  game.player.maxHp=stats.maxHP;
  game.player.hp=stats.maxHP;
  game.player.atk=stats.atk;
  game.player.cdr=stats.cdr;
  game.player.bulletSpeed=stats.bulletSpeed;
  game.player.pickupRange=stats.pickupRange;
  game.player.fireRate=stats.fireRate;
  game.player.fireTimer=0;
  game.player.skillCooldowns=[0,0,0];
  game.player.buffs=[];
  // Reset set/synergy state
  game.player.elementalistStacks = 0;
  game.player.elementalistLastElement = null;
  game.player.elementalistAura = null;
  game.player.singularityFields = [];
  game.player.temporalResonanceTimer = 0;
  game.player.hitInvuln=0;
  game.monsters=[];
  game.projectiles=[];
  game.skillEffects=[];
  game.particles=[];
  game.towers=[];
  game.drops=[];
  game.backpack.length=0;
  game.spawnTimer=0.3;
  game.eliteWaveTimer=DIFFICULTY[stageIndex].eliteEvery*0.5;
  game.towerSpawnTimer=15;
  game.lastSpawnSide=-1;
  game.camera.x=game.player.x-canvas.width/2;
  game.camera.y=game.player.y-canvas.height/2;

  const stage=STAGES[stageIndex];
  const initialCount=10+stageIndex*2;
  for(let i=0;i<initialCount;i++){
    const a=Math.random()*Math.PI*2;
    const d=rand(250,500);
    const mx=clamp(game.player.x+Math.cos(a)*d,50,MAP_W-50);
    const my=clamp(game.player.y+Math.sin(a)*d,50,MAP_H-50);
    const m=createMonster(randChoice(stage.monsterTypes),mx,my,false,false,null,stageIndex);
    if(m)game.monsters.push(m);
  }
}

export function startTestfield() {
  game.screen = 'testfield';
  game.testfieldTime = 0;
  game.player.x = 1500;
  game.player.y = 1500 + 120;
  const stats = calcPlayerStats(false);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
  game.player.fireTimer = 0;
  game.player.skillCooldowns = [0, 0, 0];
  game.player.buffs = [];
  game.player.hitInvuln = 0;
  game.player.elementalistStacks = 0;
  game.player.elementalistLastElement = null;
  game.player.elementalistAura = null;
  game.player.singularityFields = [];
  game.player.temporalResonanceTimer = 0;
  game.monsters = [];
  game.projectiles = [];
  game.skillEffects = [];
  game.particles = [];
  game.towers = [];
  game.drops = [];
  game.showLoadoutPanel = true;
  game.loadoutTab = 'presets';
  enterTestfield();
  const stats2 = calcPlayerStats(true);
  game.player.maxHp = stats2.maxHP;
  game.player.hp = stats2.maxHP;
  game.player.atk = stats2.atk;
  game.player.cdr = stats2.cdr;
  game.player.bulletSpeed = stats2.bulletSpeed;
  game.player.pickupRange = stats2.pickupRange;
  game.player.fireRate = stats2.fireRate;
  game.camera.x = game.player.x - canvas.width / 2;
  game.camera.y = game.player.y - canvas.height / 2;
}

export function exitTestfieldToPrepare() {
  exitTestfield();
  game.screen = 'prepare';
  const stats = calcPlayerStats(false);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
}

export function processClick(){
  if(!game.mouseDown||game.clickProcessed)return;
  if(game.showBackpack)return;
  game.clickProcessed=true;
  if (game.screen === 'testfield') {
    for (const b of testfieldButtons) {
      const hit = game.mouseX >= b.x && game.mouseX <= b.x + b.w && game.mouseY >= b.y && game.mouseY <= b.y + b.h;
      if (!hit) continue;
      if (b.action === 'resetStats') { resetStats(); return; }
      if (b.action === 'togglePanel') { game.showLoadoutPanel = !game.showLoadoutPanel; return; }
      if (b.action === 'switchTab') { game.loadoutTab = b.tabId; return; }
      if (b.action === 'applyPreset') { applyLoadout(b.presetName); return; }
      if (b.action === 'cycleSlot') { cycleSlotQuality(b.slot); return; }
      if (b.action === 'applyCustom') { applyCustomLoadout(); return; }
    }
    // Cast skill on game area click (below HUD)
    if (game.mouseY > 36) {
      const wx = game.mouseX + game.camera.x;
      const wy = game.mouseY + game.camera.y;
      castSkill(clamp(wx, 0, MAP_W), clamp(wy, 0, MAP_H));
      game.damageStats.skillCounts[game.activeSkill]++;
    }
    return;
  }
  if(game.screen==='playing'){
    if(game.showPauseMenu){checkButtonClicks(pauseButtons);return;}
    if(game.showBackpack)return;
    const wx=game.mouseX+game.camera.x;
    const wy=game.mouseY+game.camera.y;
    if(game.mouseY>canvas.height-100&&game.mouseX>canvas.width/2-120&&game.mouseX<canvas.width/2+120){
      return;
    }
    if(game.mouseY<50)return;
    castSkill(clamp(wx,0,MAP_W),clamp(wy,0,MAP_H));
  }else if(game.screen==='menu'){
    checkButtonClicks(menuButtons);
  }else if(game.screen==='prepare'){
    if(game.showCharSelect){
      for(let i=charButtons.length-1;i>=0;i--){
        const b=charButtons[i];
        if(!b.action||b.text==='outside')continue;
        if(game.mouseX>=b.x&&game.mouseX<=b.x+b.w&&game.mouseY>=b.y&&game.mouseY<=b.y+b.h){b.action();return;}
      }
      game.showCharSelect=false;
      return;
    }
    if(game.selectedEquipSlot){
      for(let i=prepButtons.length-1;i>=0;i--){
        const b=prepButtons[i];
        if(!b.action||b.text==='outside')continue;
        if(game.mouseX>=b.x&&game.mouseX<=b.x+b.w&&game.mouseY>=b.y&&game.mouseY<=b.y+b.h){b.action();return;}
      }
      game.selectedEquipSlot=null;
    }else{
      for(const s of equipSlots){
        if(game.mouseX>=s.x&&game.mouseX<=s.x+s.w&&game.mouseY>=s.y&&game.mouseY<=s.y+s.h){
          game.selectedEquipSlot=s.slot;return;
        }
      }
      checkButtonClicks(prepButtons);
    }
  }else if(game.screen==='victory'){
    checkButtonClicks(victoryButtons);
  }else if(game.screen==='death'){
    checkButtonClicks(deathButtons);
  }
}

function checkButtonClicks(btns){
  for(const b of btns){
    const hit=game.mouseX>=b.x&&game.mouseX<=b.x+b.w&&game.mouseY>=b.y&&game.mouseY<=b.y+b.h;
    if(!hit)continue;
    if(b.type==='stageSelect'&&b.enabled){
      startGame(b.idx);
      return;
    }
    if(b.action){
      b.action();
      return;
    }
  }
}

let lastTime=performance.now();
export function gameLoop(timestamp){
  const dt=Math.min((timestamp-lastTime)/1000,0.05);
  lastTime=timestamp;
  processClick();
  if (game.screen === 'testfield' && !game.showBackpack) {
    game.testfieldTime += dt;
    updatePlayer(dt);
    updateSetEffects(dt);
    updateSkillEffects(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateCamera(dt);
    // Process dummy projectile hits — convert _dummyHits to floating numbers
    for (const p of game.projectiles) {
      if (p._dummyHits) {
        for (const hit of p._dummyHits) {
          addFloatingNumber(hit.x, hit.y, hit.damage);
        }
        p._dummyHits = [];
      }
    }
  }
  if(game.screen==='playing'&&!game.showBackpack&&!game.showPauseMenu){
    game.time+=dt;
    updatePlayer(dt);
    updateSetEffects(dt);
    updateSkillEffects(dt);
    updateMonsters(dt);
    updateSpawner(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateTowers(dt);
    updatePickup(dt);
    updateCamera(dt);
    if(game.bossSpawned&&!game.bossDefeated){
      const bossAlive=game.monsters.some(m=>m.isBoss);
      if(!bossAlive){
        game.bossDefeated=true;
        if(game.stageIndex<9)game.unlockedStages[game.stageIndex+1]=true;
        for(let i=0;i<4;i++){
          const slots=['weapon','helmet','armor','ring','amulet','boots','bracers','belt','artifact'];
          const slot=randChoice(slots);
          if(slot==='artifact'){
            const art=generateArtifact(true,game.stageIndex);
            if(art)game.drops.push({x:game.player.x+rand(-100,100),y:game.player.y+rand(-100,100),...art,bobPhase:Math.random()*Math.PI*2});
          }else{
            const eq=generateEquipment(slot,true,game.stageIndex);
            if(eq)game.drops.push({x:game.player.x+rand(-100,100),y:game.player.y+rand(-100,100),...eq,bobPhase:Math.random()*Math.PI*2});
          }
        }
        game.screen='victory';
        game.bpScroll=0;game.groundScroll=0;
        saveGame();
      }
    }
    if(game.player.hp<=0){
      game.player.hp=0;
      game.backpack.length=0;
      game.screen='death';
      saveGame();
    }
  }
  try{render();}catch(e){
    const el=document.getElementById('err');
    if(el){el.style.display='block';el.textContent='ERROR: '+e.message+'\n\n'+e.stack;}
    ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#f00';ctx.font='18px monospace';
    ctx.fillText('Error: '+e.message,20,40);
    ctx.font='12px monospace';
    const lines=(e.stack||'').split('\n');
    for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],20,80+i*18);
    return;
  }
  if(game.showBackpack)renderBackpackOverlay();
  if(game.screen==='playing'&&game.showPauseMenu)renderPauseMenu();
  requestAnimationFrame(gameLoop);
}

function cycleSlotQuality(slot) {
  const def = SLOT_DEF[slot];
  const eq = game.sandboxEquipment[slot];
  const currentQ = eq ? eq.quality : -1;
  const nextQ = currentQ >= 3 ? -1 : currentQ + 1;
  if (nextQ < 0) {
    game.sandboxEquipment[slot] = null;
  } else {
    const ilvl = 70;
    const ilvF = 0.35 + ilvl * 0.0236;
    const base = def.base * ilvF * QUALITY_MULT[nextQ];
    const sv = Math.round(base * 0.875);
    game.sandboxEquipment[slot] = {
      slot, quality: nextQ, ilvl, statValue: sv,
      name: QUALITY_NAMES[nextQ] + SLOT_DEF[slot].name + ' [70]',
      color: QUALITY_COLORS[nextQ],
      stat: SLOT_DEF[slot].stat,
      power: null,
    };
  }
  const stats = calcPlayerStats(true);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
}

function applyCustomLoadout() {
  const stats = calcPlayerStats(true);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
}
