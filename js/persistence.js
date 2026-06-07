// ============================================================
// SECTION 16: PERSISTENCE
// ============================================================
import { game, getActiveCharacter, syncPlayerToChar, syncCharToPlayer, createCharacter } from './game-state.js';
import { calcPlayerStats } from './player.js';

const defaultEquipment = {
  weapon:null, helmet:null, armor:null, ring:null, amulet:null, boots:null,
  bracers:null, belt:null, artifact:null
};

function defaultStages(){
  return [true,false,false,false,false,false,false,false,false,false];
}

export function saveGame(){
  try{
    syncPlayerToChar();
    const data={
      version:2,
      characters:game.characters,
      soulCoins:game.soulCoins,
      unlockedStages:game.unlockedStages,
      activeCharacterId:game.activeCharacterId,
    };
    localStorage.setItem('diabloLiteSave',JSON.stringify(data));
  }catch(e){/* ignore */}
}

export function loadGame(){
  try{
    const raw=localStorage.getItem('diabloLiteSave');
    if(!raw){
      const c=createCharacter('勇者');
      game.characters=[c];
      game.activeCharacterId=c.id;
      game.soulCoins=0;
      game.unlockedStages=defaultStages();
    }else{
      const data=JSON.parse(raw);
      if(!data.version){
        // Migrate old single-character save
        const c=createCharacter('勇者');
        c.level=data.level||1;
        c.exp=data.exp||0;
        c.expToNext=data.expToNext||100;
        c.equipment={...defaultEquipment,...(data.equipment||{})};
        c.backpack=[];
        game.characters=[c];
        game.soulCoins=data.soulCoins||0;
        game.unlockedStages=data.unlockedStages||defaultStages();
        game.activeCharacterId=c.id;
      }else{
        game.characters=data.characters||[];
        for(const c of game.characters){
          c.equipment={...defaultEquipment,...(c.equipment||{})};
        }
        game.soulCoins=data.soulCoins||0;
        game.unlockedStages=data.unlockedStages||defaultStages();
        game.activeCharacterId=data.activeCharacterId||(game.characters[0]&&game.characters[0].id)||null;
      }
    }
    if(!game.activeCharacterId||game.characters.length===0){
      const c=createCharacter('勇者');
      game.characters=[c];
      game.activeCharacterId=c.id;
    }
    syncCharToPlayer();
    const stats=calcPlayerStats();
    game.player.maxHp=stats.maxHP;
    game.player.hp=stats.maxHP;
    game.player.atk=stats.atk;
    game.player.cdr=stats.cdr;
    game.player.bulletSpeed=stats.bulletSpeed;
    game.player.pickupRange=stats.pickupRange;
    game.player.fireRate=stats.fireRate;
  }catch(e){/* ignore */}
}
