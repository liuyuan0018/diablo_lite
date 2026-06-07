// ============================================================
// SECTION 3: GAME STATE
// ============================================================
export const game = {
  screen:'menu',
  stageIndex:0,
  time:0,
  kills:0,
  bossSpawned:false,
  bossDefeated:false,
  isTestStage:false,
  lootWindow:0,
  killsForBoss:80,
  mouseX:0,mouseY:0,
  mouseDown:false,
  clickProcessed:false,
  activeSkill:0,
  selectedEquipSlot:null,
  hoveredItem:null,
  bpScroll:0, groundScroll:0,
  showBackpack:false,
  showPauseMenu:false,
  keys:{w:false,a:false,s:false,d:false},
  moveSpeed:220,
  camera:{x:0,y:0},
  player:{
    x:1500,y:1500,
    hp:100,maxHp:100,
    level:1,exp:0,expToNext:100,
    atk:10,
    cdr:0,
    bulletSpeed:200,
    pickupRange:40,
    fireRate:2,
    fireTimer:0,
    skillCooldowns:[0,0,0],
    buffs:[],
    hitInvuln:0,
    elementalistStacks: 0,
    elementalistLastElement: null,
    elementalistAura: null,
    singularityFields: [],
    temporalResonanceTimer: 0,
  },
  monsters:[],
  projectiles:[],
  skillEffects:[],
  particles:[],
  towers:[],
  drops:[],
  soulCoins:0,
  unlockedStages:[true,false,false,false,false,false,false,false,false,false],
  equipment:{weapon:null,helmet:null,armor:null,ring:null,amulet:null,boots:null,bracers:null,belt:null,artifact:null},
  backpack:[],
  spawnTimer:0,
  eliteWaveTimer:0,
  towerSpawnTimer:0,
  lastSpawnSide:-1,
  characters:[],
  activeCharacterId:null,
  showCharSelect:false,
};

// Character management helpers
export function getActiveCharacter(){
  return game.characters.find(c=>c.id===game.activeCharacterId)||null;
}

export function syncPlayerToChar(){
  const c=getActiveCharacter();
  if(!c)return;
  c.level=game.player.level;
  c.exp=game.player.exp;
  c.expToNext=game.player.expToNext;
}

export function syncCharToPlayer(){
  const c=getActiveCharacter();
  if(!c)return;
  game.player.level=c.level;
  game.player.exp=c.exp;
  game.player.expToNext=c.expToNext;
  game.equipment=c.equipment;
  game.backpack=c.backpack;
}

export function createCharacter(name){
  const n=name||('勇者'+(game.characters.length+1));
  return{
    id:'char_'+Date.now(),
    name:n,
    level:1,exp:0,expToNext:100,
    equipment:{weapon:null,helmet:null,armor:null,ring:null,amulet:null,boots:null,bracers:null,belt:null,artifact:null},
    backpack:[],
    createdAt:Date.now()
  };
}
