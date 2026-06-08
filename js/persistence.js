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
    const json=JSON.stringify(data);
    localStorage.setItem('diabloLiteSave',json);
    // backup to sessionStorage as safety net
    try{ sessionStorage.setItem('diabloLiteSave',json); }catch(e){}
  }catch(e){ console.error('Save failed:',e); }
}

export function exportSave(){
  try{
    syncPlayerToChar();
    const data={
      version:2,
      characters:game.characters,
      soulCoins:game.soulCoins,
      unlockedStages:game.unlockedStages,
      activeCharacterId:game.activeCharacterId,
      exportedAt: new Date().toISOString(),
    };
    const json=JSON.stringify(data,null,2);
    const blob=new Blob([json],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='diablo-lite-save-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }catch(e){ console.error('Export failed:',e); return false; }
}

export function importSave(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const data=JSON.parse(reader.result);
        if(!data.version||!data.characters){
          reject(new Error('无效的存档文件格式'));
          return;
        }
        // Basic validation
        if(!Array.isArray(data.characters)||data.characters.length===0){
          reject(new Error('存档文件中无角色数据'));
          return;
        }
        localStorage.setItem('diabloLiteSave',JSON.stringify(data));
        resolve(data);
      }catch(e){ reject(e); }
    };
    reader.onerror=()=>reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

export function loadGame(){
  try{
    let raw=localStorage.getItem('diabloLiteSave');
    // fallback to sessionStorage if localStorage is empty
    if(!raw){
      try{ raw=sessionStorage.getItem('diabloLiteSave'); }catch(e){}
    }
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
  }catch(e){
    console.error('Load failed:',e);
    const c=createCharacter('勇者');
    game.characters=[c];
    game.activeCharacterId=c.id;
    game.soulCoins=0;
    game.unlockedStages=defaultStages();
  }
}
