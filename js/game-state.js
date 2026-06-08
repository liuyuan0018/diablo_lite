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
  bossDefeatTimer:0,
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
    elementalistAutoUsed: false,
    elementalistAura: null,
    singularityFields: [],
    temporalResonanceTimer: 0,
    ringElement: 0, ringCycleTimer: 0,
  },
  monsters:[],
  projectiles:[],
  skillEffects:[],
  particles:[],
  towers:[],
  drops:[],
  healthGlobes:[],
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
  sandboxEquipment: null,       // shallow copy of equipment for testfield sandbox
  damageStats: {                 // damage tracking for testfield
    totalDamage: 0,
    peakDamage: 0,
    dpsHistory: [],              // [{ time, damage }]
    startTime: 0,
    skillCounts: [0, 0, 0],
  },
  trainingDummies: [],           // dummy monsters for testfield
  testfieldTime: 0,              // elapsed time in testfield
  showLoadoutPanel: true,        // loadout panel visible toggle
  loadoutTab: 'presets',         // 'presets' | 'custom'
  slotPicker: null,               // which slot's picker popup is open
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

const _defaultEquipment = {
  weapon:null, helmet:null, armor:null, ring:null, amulet:null, boots:null,
  bracers:null, belt:null, artifact:null
};

export function syncCharToPlayer(){
  const c=getActiveCharacter();
  if(!c)return;
  game.player.level=c.level;
  game.player.exp=c.exp;
  game.player.expToNext=c.expToNext;
  c.equipment={..._defaultEquipment,...(c.equipment||{})};
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
