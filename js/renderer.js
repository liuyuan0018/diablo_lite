// ============================================================
// SECTION 14: RENDERER
// ============================================================
import { game, getActiveCharacter, syncPlayerToChar, syncCharToPlayer, createCharacter } from './game-state.js';
import { canvas, ctx } from './canvas.js';
import { QUALITY_COLORS, QUALITY_NAMES, SKILL_CONFIG, STAGES, DIFFICULTY, SLOT_DEF, MAP_W, MAP_H, TILE_SIZE, AFFIX_COLORS, PLAYER_RADIUS } from './config.js';
import { formatTime, lerp, dist } from './helpers.js';
import { calcPlayerStats } from './player.js';
import { saveGame } from './persistence.js';
import { getSlotName } from './equipment.js';

// Button arrays — populated each render frame, read by gameplay processClick
export let menuButtons=[];
export let prepButtons=[];
export let equipSlots=[];
export let victoryButtons=[];
export let deathButtons=[];
export let pauseButtons=[];
export let charButtons=[];
export let testfieldButtons=[];

let floatingNumbers = [];

export function addFloatingNumber(x, y, damage) {
  floatingNumbers.push({ x, y, damage, timer: 0.8 });
}

export function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  switch(game.screen){
    case 'menu':renderMenu();break;
    case 'prepare':renderPrepare();break;
    case 'playing':renderPlaying();break;
    case 'victory':renderVictory();break;
    case 'death':renderDeath();break;
    case 'testfield':renderTestField();break;
  }
}

// --- Menu ---
function renderMenu(){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  for(let i=0;i<30;i++){
    const x=(Math.sin(Date.now()/1000+i)*0.5+0.5)*W;
    const y=(Math.cos(Date.now()/1500+i*2.3)*0.5+0.5)*H;
    ctx.fillStyle=`rgba(255,100,0,${0.05+Math.sin(Date.now()/2000+i)*0.05})`;
    ctx.beginPath();ctx.arc(x,y,2+Math.sin(Date.now()/1000+i*3)*1,0,Math.PI*2);ctx.fill();
  }
  ctx.textAlign='center';
  ctx.font='bold 64px sans-serif';
  ctx.fillStyle='#ff6b35';
  ctx.fillText('DIABLO LITE',W/2,H*0.3);
  ctx.font='20px sans-serif';
  ctx.fillStyle='#888';
  ctx.fillText('轻量版暗黑风刷怪游戏',W/2,H*0.3+50);
  const bw=220,bh=56;
  const bx=W/2-bw/2,by=H*0.5;
  menuButtons=[{x:bx,y:by,w:bw,h:bh,text:'开始游戏',action:()=>{game.screen='prepare';}}];
  drawButton(bx,by,bw,bh,'开始游戏','#6b3a1a','#ff8c42','#ffd700');
  ctx.font='14px sans-serif';
  ctx.fillStyle='#555';
  ctx.fillText('v1.0',W/2,H*0.85);
}

// --- Prepare ---
function renderPrepare(){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#0a0a12';ctx.fillRect(0,0,W,H);
  game.hoveredItem=null;
  ctx.textAlign='center';
  ctx.font='bold 36px sans-serif';
  ctx.fillStyle='#ffd700';
  ctx.fillText('准备战斗',W/2,45);

  // Character bar
  const activeChar=getActiveCharacter();
  const charBarY=55;
  ctx.font='13px sans-serif';
  ctx.fillStyle='#888';
  ctx.textAlign='center';
  ctx.fillText('角色: ',W/2-55,charBarY+14);
  ctx.fillStyle='#ffd700';
  ctx.font='bold 14px sans-serif';
  ctx.fillText(activeChar?activeChar.name:'--',W/2+8,charBarY+14);

  const switchBW=70,switchBH=24;
  const switchBX=W/2+60,switchBY=charBarY;
  const switchHover=game.mouseX>=switchBX&&game.mouseX<=switchBX+switchBW&&game.mouseY>=switchBY&&game.mouseY<=switchBY+switchBH;
  ctx.fillStyle=switchHover?'#3a3a4a':'#1a2a3a';
  ctx.strokeStyle=switchHover?'#fff':'#4488ff';ctx.lineWidth=1;
  roundRect(ctx,switchBX,switchBY,switchBW,switchBH,4);
  ctx.fill();ctx.stroke();
  ctx.fillStyle='#8af';ctx.font='11px sans-serif';
  ctx.fillText('切换 ▶',switchBX+switchBW/2,switchBY+switchBH/2+4);

  const newBW=70;
  const newBX=switchBX+switchBW+8,newBY=charBarY;
  const newHover=game.mouseX>=newBX&&game.mouseX<=newBX+newBW&&game.mouseY>=newBY&&game.mouseY<=newBY+switchBH;
  ctx.fillStyle=newHover?'#3a3a4a':'#1a2a3a';
  ctx.strokeStyle=newHover?'#fff':'#44aa44';ctx.lineWidth=1;
  roundRect(ctx,newBX,newBY,newBW,switchBH,4);
  ctx.fill();ctx.stroke();
  ctx.fillStyle='#8f8';ctx.font='11px sans-serif';
  ctx.fillText('+新角色',newBX+newBW/2,newBY+switchBH/2+4);

  // Char bar button data (pushed after prepButtons reset below)
  const charBarBtns=[
    {x:switchBX,y:switchBY,w:switchBW,h:switchBH,action:()=>{game.showCharSelect=true;}},
    {x:newBX,y:newBY,w:newBW,h:switchBH,action:()=>{
      const name=prompt('输入角色名称:','勇者'+(game.characters.length+1));
      if(name===null)return;
      const c=createCharacter(name.trim()||('勇者'+(game.characters.length+1)));
      syncPlayerToChar();
      game.characters.push(c);
      game.activeCharacterId=c.id;
      syncCharToPlayer();
      const st=calcPlayerStats();
      game.player.maxHp=st.maxHP;game.player.hp=st.maxHP;
      game.player.atk=st.atk;game.player.cdr=st.cdr;
      game.player.bulletSpeed=st.bulletSpeed;game.player.pickupRange=st.pickupRange;game.player.fireRate=st.fireRate;
      saveGame();
    }},
  ];

  const stats=calcPlayerStats();
  const px=40,py=100,pw=280,ph=240;
  ctx.fillStyle='#111122';ctx.strokeStyle='#334';ctx.lineWidth=1;
  roundRect(ctx,px,py,pw,ph,8);
  ctx.fill();ctx.stroke();
  ctx.textAlign='left';
  ctx.font='14px sans-serif';
  ctx.fillStyle='#ccc';
  const lines=[
    `等级: ${game.player.level}`,
    `灵魂币: ${game.soulCoins}`,
    `攻击力: ${stats.atk}`,
    `生命值: ${stats.maxHP}`,
    `冷却缩减: ${stats.cdr}%`,
    `弹道速度: ${stats.bulletSpeed}`,
    `拾取范围: ${stats.pickupRange}`,
  ];
  lines.forEach((txt,i)=>{
    ctx.fillStyle=i===0?'#ffd700':'#ccc';
    ctx.fillText(txt,px+15,py+25+i*28);
  });
  const ex=W-320,ey=100,ew=280,eh=260;
  ctx.fillStyle='#111122';ctx.strokeStyle='#334';ctx.lineWidth=1;
  roundRect(ctx,ex,ey,ew,eh,8);
  ctx.fill();ctx.stroke();
  ctx.textAlign='center';
  ctx.font='bold 16px sans-serif';
  ctx.fillStyle='#aaa';
  ctx.fillText('装备',ex+ew/2,ey+25);
  const slots=['weapon','helmet','armor','ring','amulet','boots','bracers','belt','artifact'];
  const slotNames=['武器','头盔','护甲','戒指','项链','靴子','护腕','腰带','法器'];
  const cols=3,rows=3;
  const cellW=80,cellH=60;
  const gridX=ex+(ew-cols*cellW)/2;
  const gridY=ey+40;
  equipSlots=[];
  for(let i=0;i<9;i++){
    const col=i%cols,row=Math.floor(i/cols);
    const cx=gridX+col*cellW,cy=gridY+row*cellH;
    ctx.fillStyle='#1a1a2a';ctx.strokeStyle='#334';ctx.lineWidth=1;
    roundRect(ctx,cx+2,cy+2,cellW-4,cellH-4,4);
    ctx.fill();ctx.stroke();
    ctx.textAlign='center';
    ctx.font='11px sans-serif';
    ctx.fillStyle='#666';
    ctx.fillText(slotNames[i],cx+cellW/2,cy+18);
    const eq=game.equipment[slots[i]];
    if(eq){
      ctx.font='bold 11px sans-serif';
      if(eq.quality===4){
        ctx.fillStyle='#44ff44';
        ctx.fillText('【套装】'+eq.name,cx+cellW/2,cy+35);
      }else{
        ctx.fillStyle=QUALITY_COLORS[eq.quality]||'#aaa';
        ctx.fillText(eq.name,cx+cellW/2,cy+35);
      }
      ctx.fillStyle='#888';
      ctx.font='10px sans-serif';
      const slotCfg={weapon:['攻',5],helmet:['CD',2],armor:['命',15],ring:['速',20],amulet:['拾',8],boots:['闪',0],bracers:['攻',5],belt:['命',15],artifact:['器',0]};
      const[sn,base]=slotCfg[slots[i]]||['?',0];
      const val=base+base*eq.quality;
      ctx.fillText(sn+(val>0?'+'+val:''),cx+cellW/2,cy+52);
    }else{
      ctx.fillStyle='#444';
      ctx.font='11px sans-serif';
      ctx.fillText('空',cx+cellW/2,cy+40);
    }
    if(game.mouseX>=cx+2&&game.mouseX<=cx+cellW-2&&game.mouseY>=cy+2&&game.mouseY<=cy+cellH-2){
      ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
      roundRect(ctx,cx+2,cy+2,cellW-4,cellH-4,4);ctx.stroke();
      if(eq)game.hoveredItem=eq;
    }
    equipSlots.push({x:cx+2,y:cy+2,w:cellW-4,h:cellH-4,slot:slots[i]});
  }
  prepButtons=[];
  for(const b of charBarBtns)prepButtons.push(b);
  if(game.showCharSelect){
    renderCharSelect();
    return;
  }
  if(game.selectedEquipSlot){
    renderEquipDetail();
  }
  if(game.hoveredItem && !game.selectedEquipSlot){
    renderCompareTooltip(game.hoveredItem);
  }
  const stageY=H-210;
  ctx.font='bold 18px sans-serif';
  ctx.fillStyle='#ffd700';
  ctx.textAlign='center';
  ctx.fillText('选择关卡',W/2,stageY-15);
  const btnW=110,btnH=54,gap=10;
  const totalW=5*btnW+4*gap;
  const startX=(W-totalW)/2;
  for(let i=0;i<10;i++){
    const row=Math.floor(i/5);
    const col=i%5;
    const bx=startX+col*(btnW+gap);
    const by=stageY+row*(btnH+gap);
    const unlocked=game.unlockedStages[i];
    prepButtons.push({
      x:bx,y:by,w:btnW,h:btnH,
      text:STAGES[i].name,
      idx:i,
      enabled:unlocked,
      type:'stageSelect',
    });
    const bg=unlocked?'#1a2a4a':'#222';
    const bd=unlocked?(game.stageIndex===i?'#4488ff':'#335'):'#333';
    const tc=unlocked?'#8af':'#555';
    ctx.fillStyle=bg;ctx.strokeStyle=bd;ctx.lineWidth=unlocked&&game.stageIndex===i?2:1;
    roundRect(ctx,bx,by,btnW,btnH,6);
    ctx.fill();ctx.stroke();
    ctx.fillStyle=tc;
    ctx.font='bold 12px sans-serif';
    ctx.textAlign='center';
    ctx.fillText(STAGES[i].name,bx+btnW/2,by+18);
    ctx.fillStyle=unlocked?'#888':'#444';
    ctx.font='9px sans-serif';
    const diffDesc=DIFFICULTY[i].desc;
    ctx.fillText(diffDesc,bx+btnW/2,by+36);
    if(!unlocked){
      ctx.fillStyle='rgba(0,0,0,0.4)';
      roundRect(ctx,bx,by,btnW,btnH,6);ctx.fill();
    }
  }
}

function renderEquipDetail(){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='rgba(0,0,0,0.6)';
  ctx.fillRect(0,0,W,H);
  const pw=300,ph=220;
  const px=W/2-pw/2,py=H/2-ph/2;
  ctx.fillStyle='#1a1a2e';ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
  roundRect(ctx,px,py,pw,ph,10);
  ctx.fill();ctx.stroke();
  const slot=game.selectedEquipSlot;
  const eq=game.equipment[slot];
  const slotNames={weapon:'武器',helmet:'头盔',armor:'护甲',ring:'戒指',amulet:'项链',boots:'靴子',bracers:'护腕',belt:'腰带',artifact:'法器'};
  ctx.textAlign='center';
  ctx.font='bold 18px sans-serif';
  ctx.fillStyle='#ffd700';
  ctx.fillText(slotNames[slot]||slot,px+pw/2,py+30);
  if(eq){
    ctx.fillStyle=QUALITY_COLORS[eq.quality]||'#aaa';
    ctx.font='bold 14px sans-serif';
    ctx.fillText(eq.name,px+pw/2,py+55);
    ctx.font='12px sans-serif';
    ctx.fillStyle='#888';
    ctx.fillText('等级: '+eq.ilvl+'  |  品质: '+QUALITY_NAMES[eq.quality],px+pw/2,py+80);
    ctx.font='13px sans-serif';
    ctx.fillStyle='#ccc';
    const statDesc={atk:'攻击力',cdr:'冷却缩减',maxHp:'最大生命',bulletSpeed:'弹道速度',pickupRange:'拾取范围',movespeed:'移动速度'};
    ctx.fillText((statDesc[eq.stat]||'')+' +'+eq.statValue,px+pw/2,py+100);
    if(eq.power){
      ctx.fillStyle='#ff6600';ctx.font='11px sans-serif';
      const pd=eq.power.desc.replace('{v}',eq.power.value);
      ctx.fillText('传奇: '+pd,px+pw/2,py+118);
    }
    const bx=px+pw/2-60,by=py+120,bw=120,bh=36;
    ctx.fillStyle='#3a1a1a';ctx.strokeStyle='#f44';ctx.lineWidth=1;
    if(game.mouseX>=bx&&game.mouseX<=bx+bw&&game.mouseY>=by&&game.mouseY<=by+bh){
      ctx.fillStyle='#5a2a2a';ctx.strokeStyle='#fff';
    }
    roundRect(ctx,bx,by,bw,bh,6);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f88';ctx.font='13px sans-serif';
    ctx.fillText('卸下装备',bx+bw/2,by+bh/2+5);
    prepButtons.push({x:bx,y:by,w:bw,h:bh,text:'卸下',action:()=>{
      game.backpack.push({...eq});
      game.equipment[slot]=null;
      game.selectedEquipSlot=null;
      const s=calcPlayerStats();
      const p=game.player;
      const ratio=p.hp/p.maxHp;
      p.maxHp=s.maxHP;p.atk=s.atk;p.cdr=s.cdr;
      p.bulletSpeed=s.bulletSpeed;p.pickupRange=s.pickupRange;p.fireRate=s.fireRate;
      p.hp=Math.min(Math.round(p.maxHp*ratio),p.maxHp);
      saveGame();
    }});
  }else{
    ctx.fillStyle='#666';ctx.font='14px sans-serif';
    ctx.fillText('该槽位为空',px+pw/2,py+80);
  }
  const cbx=px+pw-30,cby=py+6,cbw=24,cbh=24;
  ctx.fillStyle=game.mouseX>=cbx&&game.mouseX<=cbx+cbw&&game.mouseY>=cby&&game.mouseY<=cby+cbh?'#f44':'#444';
  ctx.fillRect(cbx,cby,cbw,cbh);
  ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';
  ctx.fillText('✕',cbx+cbw/2,cby+cbh/2+5);
  prepButtons.push({x:cbx,y:cby,w:cbw,h:cbh,text:'关闭',action:()=>{game.selectedEquipSlot=null;}});
  prepButtons.push({x:0,y:0,w:W,h:H,text:'outside',action:()=>{game.selectedEquipSlot=null;}});
}

function renderCharSelect(){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,W,H);
  const pw=400,ph=Math.min(420,H-60);
  const px=(W-pw)/2,py=(H-ph)/2;
  ctx.fillStyle='#151525';ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
  roundRect(ctx,px,py,pw,ph,10);
  ctx.fill();ctx.stroke();
  ctx.textAlign='center';
  ctx.font='bold 20px sans-serif';
  ctx.fillStyle='#ffd700';
  ctx.fillText('角色管理',px+pw/2,py+32);

  charButtons=[];
  const cbx=px+pw-30,cby=py+6,cbw=24,cbh=24;
  ctx.fillStyle=game.mouseX>=cbx&&game.mouseX<=cbx+cbw&&game.mouseY>=cby&&game.mouseY<=cby+cbh?'#f44':'#444';
  ctx.fillRect(cbx,cby,cbw,cbh);
  ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';
  ctx.fillText('✕',cbx+cbw/2,cby+cbh/2+5);
  charButtons.push({x:cbx,y:cby,w:cbw,h:cbh,action:()=>{game.showCharSelect=false;}});

  const listY=py+45,listH=ph-100;
  const itemH=52,gap=4;
  const totalH=game.characters.length*(itemH+gap);
  const maxScroll=Math.max(0,totalH-listH);
  if(game.charScroll===undefined)game.charScroll=0;
  game.charScroll=Math.min(game.charScroll,maxScroll);

  ctx.save();
  ctx.beginPath();
  ctx.rect(px+8,listY,pw-16,listH);
  ctx.clip();

  for(let i=0;i<game.characters.length;i++){
    const c=game.characters[i];
    const iy=listY+i*(itemH+gap)-game.charScroll;
    if(iy+itemH<listY||iy>listY+listH)continue;
    const isActive=c.id===game.activeCharacterId;

    ctx.fillStyle=isActive?'#1a2a1a':'#1a1a2e';
    ctx.strokeStyle=isActive?'#44ff44':'#334';
    ctx.lineWidth=isActive?2:1;
    roundRect(ctx,px+12,iy,pw-24,itemH,6);
    ctx.fill();ctx.stroke();

    ctx.textAlign='left';
    ctx.fillStyle=isActive?'#ffd700':'#ccc';
    ctx.font='bold 14px sans-serif';
    ctx.fillText(c.name,px+24,iy+22);
    ctx.fillStyle='#888';
    ctx.font='11px sans-serif';
    ctx.fillText('Lv.'+c.level+' · 装备 '+Object.values(c.equipment||{}).filter(Boolean).length+'/6',px+24,iy+40);

    if(isActive){
      ctx.textAlign='right';
      ctx.fillStyle='#44ff44';
      ctx.font='bold 11px sans-serif';
      ctx.fillText('● 当前',px+pw-24,iy+30);
    }

    const btnW=50,btnH=24,btnGap=6;
    const selectBX=px+pw-24-btnW*2-btnGap,selectBY=iy+14;
    const deleteBX=selectBX+btnW+btnGap;

    if(!isActive){
      const sHover=game.mouseX>=selectBX&&game.mouseX<=selectBX+btnW&&game.mouseY>=selectBY&&game.mouseY<=selectBY+btnH;
      ctx.fillStyle=sHover?'#2a4a2a':'#1a3a1a';
      ctx.strokeStyle=sHover?'#fff':'#4a4';ctx.lineWidth=1;
      roundRect(ctx,selectBX,selectBY,btnW,btnH,4);
      ctx.fill();ctx.stroke();
      ctx.fillStyle='#8f8';ctx.font='11px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('选择',selectBX+btnW/2,selectBY+btnH/2+4);
      const ci=i;
      charButtons.push({x:selectBX,y:selectBY,w:btnW,h:btnH,action:()=>{
        syncPlayerToChar();
        game.activeCharacterId=game.characters[ci].id;
        syncCharToPlayer();
        const st=calcPlayerStats();
        game.player.maxHp=st.maxHP;game.player.hp=st.maxHP;
        game.player.atk=st.atk;game.player.cdr=st.cdr;
        game.player.bulletSpeed=st.bulletSpeed;game.player.pickupRange=st.pickupRange;game.player.fireRate=st.fireRate;
        game.showCharSelect=false;
        saveGame();
      }});
    }

    if(game.characters.length>1){
      const dHover=game.mouseX>=deleteBX&&game.mouseX<=deleteBX+btnW&&game.mouseY>=selectBY&&game.mouseY<=selectBY+btnH;
      ctx.fillStyle=dHover?'#4a1a1a':'#2a1a1a';
      ctx.strokeStyle=dHover?'#fff':'#a44';ctx.lineWidth=1;
      roundRect(ctx,deleteBX,selectBY,btnW,btnH,4);
      ctx.fill();ctx.stroke();
      ctx.fillStyle='#f88';ctx.font='11px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('删除',deleteBX+btnW/2,selectBY+btnH/2+4);
      const di=i;
      charButtons.push({x:deleteBX,y:selectBY,w:btnW,h:btnH,action:()=>{
        if(!confirm('确定删除角色 "'+game.characters[di].name+'" 吗？此操作不可撤销。'))return;
        game.characters.splice(di,1);
        if(game.characters.length===0){
          const nc=createCharacter('勇者');
          game.characters=[nc];
          game.activeCharacterId=nc.id;
        }else if(!game.characters.find(c=>c.id===game.activeCharacterId)){
          game.activeCharacterId=game.characters[0].id;
        }
        syncCharToPlayer();
        const st=calcPlayerStats();
        game.player.maxHp=st.maxHP;game.player.hp=st.maxHP;
        game.player.atk=st.atk;game.player.cdr=st.cdr;
        game.player.bulletSpeed=st.bulletSpeed;game.player.pickupRange=st.pickupRange;game.player.fireRate=st.fireRate;
        game.charScroll=0;
        saveGame();
      }});
    }
  }
  ctx.restore();

  if(maxScroll>0){
    const sbX=px+pw-12,sbY=listY,sbW=6,sbH=listH;
    ctx.fillStyle='#222';
    ctx.fillRect(sbX,sbY,sbW,sbH);
    const thumbH=Math.max(30,sbH*(listH/totalH));
    const thumbY=sbY+(sbH-thumbH)*(game.charScroll/maxScroll);
    ctx.fillStyle='#666';
    roundRect(ctx,sbX,thumbY,sbW,thumbH,3);
    ctx.fill();
  }

  const createW=140,createH=36;
  const createX=px+pw/2-createW/2,createY=py+ph-createH-12;
  const createHover=game.mouseX>=createX&&game.mouseX<=createX+createW&&game.mouseY>=createY&&game.mouseY<=createY+createH;
  ctx.fillStyle=createHover?'#2a4a2a':'#1a3a1a';
  ctx.strokeStyle=createHover?'#fff':'#4a4';ctx.lineWidth=2;
  roundRect(ctx,createX,createY,createW,createH,6);
  ctx.fill();ctx.stroke();
  ctx.fillStyle='#8f8';
  ctx.font='bold 13px sans-serif';
  ctx.fillText('+ 创建新角色',createX+createW/2,createY+createH/2+5);
  charButtons.push({x:createX,y:createY,w:createW,h:createH,action:()=>{
    const name=prompt('输入角色名称:','勇者'+(game.characters.length+1));
    if(name===null)return;
    const c=createCharacter(name.trim()||('勇者'+(game.characters.length+1)));
    syncPlayerToChar();
    game.characters.push(c);
    game.activeCharacterId=c.id;
    syncCharToPlayer();
    const st=calcPlayerStats();
    game.player.maxHp=st.maxHP;game.player.hp=st.maxHP;
    game.player.atk=st.atk;game.player.cdr=st.cdr;
    game.player.bulletSpeed=st.bulletSpeed;game.player.pickupRange=st.pickupRange;game.player.fireRate=st.fireRate;
    game.charScroll=0;
    saveGame();
  }});

  charButtons.push({x:0,y:0,w:W,h:H,text:'outside'});
}

// --- Playing ---
export function renderPlaying(){
  renderGround();
  renderMapBorder();
  renderDrops();
  renderMonsters();
  renderProjectiles();
  renderSkillEffects();
  // Render elementalist aura
  if(game.player.elementalistAura){
    const a=game.player.elementalistAura;
    const sx=a.x-game.camera.x;
    const sy=a.y-game.camera.y;
    ctx.fillStyle='rgba(255,200,50,0.15)';
    ctx.beginPath();
    ctx.arc(sx,sy,200,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='rgba(255,200,50,0.4)';
    ctx.lineWidth=2;
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    ctx.arc(sx,sy,200,0,Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  renderTowers();
  renderPlayer();
  renderParticles();
  renderSkillPreview();
  renderVignette();
  renderHUD();
}

function renderGround(){
  const cs=canvas.width,ch=canvas.height;
  const startCol=Math.floor(game.camera.x/TILE_SIZE);
  const endCol=Math.ceil((game.camera.x+cs)/TILE_SIZE);
  const startRow=Math.floor(game.camera.y/TILE_SIZE);
  const endRow=Math.ceil((game.camera.y+ch)/TILE_SIZE);
  const maxCol=Math.floor(MAP_W/TILE_SIZE);
  const maxRow=Math.floor(MAP_H/TILE_SIZE);
  for(let col=startCol;col<=endCol;col++){
    for(let row=startRow;row<=endRow;row++){
      if(col<0||col>maxCol||row<0||row>maxRow)continue;
      const x=col*TILE_SIZE-game.camera.x;
      const y=row*TILE_SIZE-game.camera.y;
      ctx.fillStyle=(col+row)%2===0?'#1a1a28':'#1e1e30';
      ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
      ctx.strokeStyle='rgba(255,255,255,0.03)';
      ctx.lineWidth=0.5;
      ctx.strokeRect(x,y,TILE_SIZE,TILE_SIZE);
    }
  }
}

function renderMapBorder(){
  ctx.strokeStyle='rgba(255,165,0,0.4)';
  ctx.lineWidth=3;
  ctx.strokeRect(-game.camera.x,-game.camera.y,MAP_W,MAP_H);
}

function renderDrops(){
  for(const d of game.drops){
    const sx=d.x-game.camera.x;
    const sy=d.y-game.camera.y;
    if(sx<-50||sx>canvas.width+50||sy<-50||sy>canvas.height+50)continue;
    const bob=Math.sin(d.bobPhase)*3;
    if(d.expireTime){
      const left=Math.max(0,d.expireTime-game.time);
      const pulse=0.5+Math.sin(game.time*8)*0.5;
      ctx.strokeStyle='rgba(255,50,50,'+(0.5+pulse*0.5)+')';
      ctx.lineWidth=2+pulse;
      ctx.beginPath();
      ctx.arc(sx,sy+bob-10,16+pulse*4,0,Math.PI*2);
      ctx.stroke();
      ctx.fillStyle='#ff4444';
      ctx.font='bold 10px sans-serif';
      ctx.textAlign='center';
      ctx.fillText(Math.ceil(left)+'s',sx,sy+bob-28);
      ctx.textAlign='start';
    }
    const grad=ctx.createRadialGradient(sx,sy+bob-30,2,sx,sy+bob-30,40);
    grad.addColorStop(0,d.color+'88');
    grad.addColorStop(1,d.color+'00');
    ctx.fillStyle=grad;
    ctx.fillRect(sx-40,sy+bob-70,80,70);
    ctx.fillStyle=d.color;
    ctx.fillRect(sx-20,sy+bob-12,40,24);
    ctx.strokeStyle='#fff';ctx.lineWidth=1;
    ctx.strokeRect(sx-20,sy+bob-12,40,24);
    ctx.fillStyle='#fff';
    ctx.font='bold 10px sans-serif';
    ctx.textAlign='center';
    ctx.fillText(getSlotName(d.slot),sx,sy+bob+5);
  }
}

function renderMonsters(){
  for(const m of game.monsters){
    const sx=m.x-game.camera.x;
    const sy=m.y-game.camera.y;
    if(sx<-m.size*2||sx>canvas.width+m.size*2||sy<-m.size*2||sy>canvas.height+m.size*2)continue;
    const alpha=m.type==='ghost'?0.5:1;
    ctx.globalAlpha=alpha;
    const color=m.isBoss?'#cc0000':m.color;
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(sx,sy,m.size,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle=m.isBoss?'#ff0':'#fff';
    ctx.beginPath();
    ctx.arc(sx-m.size*0.3,sy-m.size*0.2,m.size*0.15,0,Math.PI*2);
    ctx.arc(sx+m.size*0.3,sy-m.size*0.2,m.size*0.15,0,Math.PI*2);
    ctx.fill();
    if(m.isElite&&m.affix){
      ctx.strokeStyle=AFFIX_COLORS[m.affix]||'#fff';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(sx,sy,m.size+4,0,Math.PI*2);
      ctx.stroke();
    }
    if(m.shield>0){
      ctx.strokeStyle='#4488ff';
      ctx.lineWidth=2;
      ctx.setLineDash([4,4]);
      ctx.beginPath();
      ctx.arc(sx,sy,m.size+8,0,Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if(m.isBoss){
      ctx.fillStyle='#ffd700';
      ctx.font='bold 16px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('♛',sx,sy-m.size-10);
    }
    if(m.isElite||m.isBoss){
      const barW=m.size*2.5;
      const barH=4;
      const barX=sx-barW/2;
      const barY=sy-m.size-8;
      ctx.fillStyle='#333';
      ctx.fillRect(barX,barY,barW,barH);
      ctx.fillStyle=m.shield>0?'#4488ff':'#ff3333';
      ctx.fillRect(barX,barY,barW*(m.hp/m.maxHp),barH);
      if(m.shield>0){
        ctx.fillStyle='#88ccff';
        ctx.fillRect(barX,barY,barW*(m.shield/(m.maxHp*0.3)),barH/2);
      }
    }
    ctx.globalAlpha=1;
  }
}

function renderProjectiles(){
  for(const p of game.projectiles){
    const sx=p.x-game.camera.x;
    const sy=p.y-game.camera.y;
    if(sx<-20||sx>canvas.width+20||sy<-20||sy>canvas.height+20)continue;
    if(!p.isEnemy){
      const grad=ctx.createRadialGradient(sx,sy,1,sx,sy,p.size*3);
      grad.addColorStop(0,'#ffcc00');
      grad.addColorStop(0.3,'#ff8800');
      grad.addColorStop(1,'rgba(255,68,0,0)');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(sx,sy,p.size*3,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#ffee88';
      ctx.beginPath();
      ctx.arc(sx,sy,p.size*0.6,0,Math.PI*2);
      ctx.fill();
    }else{
      ctx.fillStyle=p.color||'#44ff44';
      ctx.beginPath();
      ctx.arc(sx,sy,p.size,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='rgba(68,255,68,0.3)';
      ctx.beginPath();
      ctx.arc(sx,sy,p.size*2,0,Math.PI*2);
      ctx.fill();
    }
  }
}

function renderSkillEffects(){
  for(const e of game.skillEffects){
    const sx=e.x-game.camera.x;
    const sy=e.y-game.camera.y;
    if(sx<-200||sx>canvas.width+200||sy<-200||sy>canvas.height+200)continue;
    const progress=1-e.timer/e.duration;
    if(e.type==='blackhole'){
      const grad=ctx.createRadialGradient(sx,sy,0,sx,sy,e.radius);
      grad.addColorStop(0,'rgba(80,20,120,0.8)');
      grad.addColorStop(0.5,'rgba(60,10,90,0.5)');
      grad.addColorStop(1,'rgba(40,5,60,0)');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='rgba(120,40,180,0.6)';
      ctx.lineWidth=3;
      const rot=progress*Math.PI*4;
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius*0.7,0,Math.PI*1.5);
      ctx.stroke();
      ctx.strokeStyle='rgba(80,20,140,0.4)';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius*0.9,rot,rot+Math.PI);
      ctx.stroke();
    }else if(e.type==='blizzard'){
      ctx.fillStyle='rgba(50,100,200,0.25)';
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='rgba(100,180,255,0.5)';
      ctx.lineWidth=2;
      ctx.setLineDash([8,8]);
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius,0,Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle='rgba(150,200,255,0.3)';
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius*0.6,0,Math.PI*2);
      ctx.stroke();
    }else if(e.type==='poisonPool'){
      ctx.fillStyle='rgba(0,180,0,0.2)';
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='rgba(0,200,0,0.4)';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius,0,Math.PI*2);
      ctx.stroke();
      ctx.fillStyle='rgba(0,255,0,0.1)';
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius*0.5,0,Math.PI*2);
      ctx.fill();
    }else if(e.type==='harmonyMeteor'){
      const progress=1-e.timer/e.duration;
      const currentRadius=e.radius*progress;
      ctx.strokeStyle=`rgba(255,200,50,${1-progress})`;
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(sx,sy,currentRadius,0,Math.PI*2);
      ctx.stroke();
    }else if(e.type==='singularityImplosion'){
      const progress=1-e.timer/e.duration;
      ctx.strokeStyle=`rgba(136,68,255,${1-progress*0.5})`;
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.arc(sx,sy,e.radius*(1-progress*0.3),0,Math.PI*2);
      ctx.stroke();
    }
  }

  // Render singularity fields (Chronomancer set)
  for(const f of game.player.singularityFields){
    const sx=f.x-game.camera.x;
    const sy=f.y-game.camera.y;
    if(sx<-200||sx>canvas.width+200||sy<-200||sy>canvas.height+200)continue;

    const pulse=0.9+Math.sin(game.time*2)*0.1;
    ctx.strokeStyle=`rgba(100,180,255,${0.4+Math.sin(game.time*3)*0.2})`;
    ctx.lineWidth=3;
    ctx.setLineDash([10,6]);
    ctx.beginPath();
    ctx.arc(sx,sy,f.radius*pulse,0,Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle='rgba(50,100,200,0.15)';
    ctx.beginPath();
    ctx.arc(sx,sy,f.radius,0,Math.PI*2);
    ctx.fill();
  }
}

function renderTowers(){
  for(const t of game.towers){
    const sx=t.x-game.camera.x;
    const sy=t.y-game.camera.y;
    if(sx<-40||sx>canvas.width+40||sy<-60||sy>canvas.height+60)continue;
    const bob=Math.sin(t.bobPhase)*3;
    const tx=sx,ty=sy+bob;
    ctx.fillStyle='#334';
    ctx.fillRect(tx-12,ty-5,24,10);
    const bodyColor=t.type==='cdReset'?'#4488ff':'#ffcc00';
    ctx.fillStyle=bodyColor;
    roundRect(ctx,tx-10,ty-25-bob,20,22,3);
    ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=1;
    roundRect(ctx,tx-10,ty-25-bob,20,22,3);
    ctx.stroke();
    ctx.fillStyle='#fff';
    ctx.font='bold 14px sans-serif';
    ctx.textAlign='center';
    ctx.fillText(t.type==='cdReset'?'⟳':'⚡',tx,ty-10-bob);
    if(t.type==='lightning'){
      const pd=dist(t.x,t.y,game.player.x,game.player.y);
      if(pd<200){
        ctx.fillStyle='rgba(255,200,0,0.08)';
        ctx.beginPath();
        ctx.arc(tx,ty,150,0,Math.PI*2);
        ctx.fill();
      }
      if(t.lastZap){
        const zx=t.lastZap.mx-game.camera.x;
        const zy=t.lastZap.my-game.camera.y;
        ctx.strokeStyle='#ffff44';
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(tx,ty);
        const steps=5;
        const offsets=t.lightningOffsets||[];
        for(let s=1;s<=steps;s++){
          const t2=s/steps;
          const off=offsets[s-1]||{x:0,y:0};
          ctx.lineTo(lerp(tx,zx,t2)+off.x, lerp(ty,zy,t2)+off.y);
        }
        ctx.stroke();
      }
    }
  }
}

function renderPlayer(){
  const p=game.player;
  const sx=p.x-game.camera.x;
  const sy=p.y-game.camera.y;
  const bob=Math.sin(Date.now()/300)*2;
  const px=sx,py=sy+bob;
  const glow=ctx.createRadialGradient(px,py,5,px,py,50);
  glow.addColorStop(0,'rgba(255,107,53,0.15)');
  glow.addColorStop(1,'rgba(255,107,53,0)');
  ctx.fillStyle=glow;
  ctx.beginPath();ctx.arc(px,py,50,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#4a3060';
  ctx.beginPath();
  ctx.arc(px,py+2,PLAYER_RADIUS-2,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle='#ff6b35';
  ctx.beginPath();
  ctx.arc(px,py-6,8,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle='#fff';
  ctx.beginPath();
  ctx.arc(px-3,py-7,2,0,Math.PI*2);
  ctx.arc(px+3,py-7,2,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle='#222';
  ctx.beginPath();
  ctx.arc(px-3,py-7,1,0,Math.PI*2);
  ctx.arc(px+3,py-7,1,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle='#8B4513';
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(px+12,py-2);
  ctx.lineTo(px+22,py-25);
  ctx.stroke();
  ctx.fillStyle='#ff2244';
  ctx.beginPath();
  ctx.arc(px+22,py-27,4,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle='rgba(255,34,68,0.3)';
  ctx.beginPath();
  ctx.arc(px+22,py-27,8,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle='#fff';
  ctx.font='10px sans-serif';
  ctx.textAlign='center';
  ctx.fillText('Lv.'+p.level,px,py-PLAYER_RADIUS-10);
}

function renderParticles(){
  for(const p of game.particles){
    const sx=p.x-game.camera.x;
    const sy=p.y-game.camera.y;
    if(sx<-20||sx>canvas.width+20||sy<-20||sy>canvas.height+20)continue;
    ctx.globalAlpha=p.alpha;
    ctx.fillStyle=p.color;
    ctx.fillRect(sx-p.size/2,sy-p.size/2,p.size,p.size);
  }
  ctx.globalAlpha=1;
}

function renderSkillPreview(){
  if(game.activeSkill===0)return;
  const wx=game.mouseX+game.camera.x;
  const wy=game.mouseY+game.camera.y;
  const sx=wx-game.camera.x;
  const sy=wy-game.camera.y;
  const radius=game.activeSkill===1?220:260;
  const color=game.activeSkill===1?'#9944cc':'#4488ff';
  ctx.strokeStyle=color+'66';
  ctx.lineWidth=2;
  ctx.setLineDash([6,4]);
  ctx.beginPath();
  ctx.arc(sx,sy,radius,0,Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle=color+'15';
  ctx.beginPath();
  ctx.arc(sx,sy,radius,0,Math.PI*2);
  ctx.fill();
}

function renderVignette(){
  const W=canvas.width,H=canvas.height;
  const grad=ctx.createRadialGradient(W/2,H/2,W*0.3,W/2,H/2,W*0.8);
  grad.addColorStop(0,'rgba(0,0,0,0)');
  grad.addColorStop(1,'rgba(0,0,0,0.4)');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);
}

// --- HUD ---
function renderHUD(){
  const W=canvas.width,H=canvas.height;
  const p=game.player;
  ctx.fillStyle='rgba(0,0,0,0.75)';
  ctx.fillRect(0,0,W,44);
  ctx.strokeStyle='rgba(255,255,255,0.1)';
  ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,44);ctx.lineTo(W,44);ctx.stroke();
  ctx.textAlign='left';
  ctx.font='bold 13px sans-serif';
  ctx.fillStyle='#ff4444';
  ctx.fillText('HP',10,18);
  ctx.font='12px sans-serif';
  ctx.fillStyle='#fff';
  ctx.fillText(Math.floor(p.hp)+'/'+p.maxHp,35,18);
  const hpBarX=100,hpBarY=10,hpBarW=200,hpBarH=12;
  ctx.fillStyle='#333';
  ctx.fillRect(hpBarX,hpBarY,hpBarW,hpBarH);
  ctx.fillStyle='#cc2222';
  ctx.fillRect(hpBarX,hpBarY,hpBarW*(p.hp/p.maxHp),hpBarH);
  ctx.strokeStyle='rgba(255,255,255,0.2)';
  ctx.strokeRect(hpBarX,hpBarY,hpBarW,hpBarH);
  const expBarY=hpBarY+hpBarH+2;
  ctx.fillStyle='#333';
  ctx.fillRect(hpBarX,expBarY,hpBarW,4);
  ctx.fillStyle='#4488ff';
  ctx.fillRect(hpBarX,expBarY,hpBarW*(p.exp/p.expToNext),4);
  ctx.textAlign='center';
  ctx.font='bold 16px sans-serif';
  ctx.fillStyle='#ffd700';
  ctx.fillText((game.isTestStage?'[测试] ':'')+'Lv.'+p.level,W/2,28);
  ctx.textAlign='right';
  ctx.font='13px sans-serif';
  const bpLimit=game.screen==='playing'?8:99;
  ctx.fillStyle=game.backpack.length>=bpLimit?'#f88':'#aaa';
  ctx.fillText('背包: '+game.backpack.length+(game.screen==='playing'?'/8':''),W-120,28);
  ctx.fillStyle='#aaa';
  ctx.fillText('灵魂币: '+game.soulCoins,W-10,28);
  ctx.textAlign='left';
  ctx.font='12px sans-serif';
  ctx.fillStyle='#888';
  ctx.fillText(formatTime(game.time),5,60);
  ctx.textAlign='right';
  ctx.fillStyle='#888';
  ctx.fillText('击杀: '+game.kills,W-10,58);
  if(!game.bossSpawned){
    ctx.fillText('Boss: '+game.kills+'/'+game.killsForBoss,W-10,72);
  }else if(!game.bossDefeated){
    ctx.fillStyle='#ff4444';
    ctx.fillText('BOSS已出现!',W-10,72);
  }

  // Synergy indicator
  try{
    const synStats=calcPlayerStats();
    if(synStats.synergies&&synStats.synergies.all&&synStats.synergies.all.length>0){
      ctx.font='10px sans-serif';
      ctx.fillStyle='#ffaa00';
      ctx.textAlign='right';
      ctx.fillText('协同: '+synStats.synergies.all.map(s=>s.name).join(' '),W-10,86);
    }
  }catch(e){/* ignore if calcPlayerStats fails here */}

  const barCenterX=W/2;
  const barY=H-90;
  const iconSize=56;
  const gap=10;
  const totalW=3*iconSize+2*gap;
  const barX=barCenterX-totalW/2-10;
  ctx.fillStyle='rgba(0,0,0,0.65)';
  roundRect(ctx,barX-5,barY-5,totalW+20,iconSize+20,12);
  ctx.fill();
  for(let i=0;i<3;i++){
    const ix=barCenterX-totalW/2+i*(iconSize+gap);
    const iy=barY;
    const isActive=i===game.activeSkill;
    ctx.fillStyle=isActive?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.4)';
    roundRect(ctx,ix,iy,iconSize,iconSize,8);
    ctx.fill();
    ctx.strokeStyle=isActive?'#fff':'rgba(255,255,255,0.15)';
    ctx.lineWidth=isActive?2:1;
    roundRect(ctx,ix,iy,iconSize,iconSize,8);
    ctx.stroke();
    ctx.textAlign='center';
    ctx.font='bold 18px sans-serif';
    ctx.fillStyle='#fff';
    ctx.fillText(SKILL_CONFIG[i].icon,ix+iconSize/2,iy+28);
    ctx.font='9px sans-serif';
    ctx.fillStyle='#aaa';
    ctx.fillText(SKILL_CONFIG[i].name,ix+iconSize/2,iy+44);
    ctx.font='bold 10px sans-serif';
    ctx.fillStyle='#888';
    ctx.fillText(String(i+1),ix+iconSize/2,iy-5);
    const cd=game.player.skillCooldowns[i];
    if(cd>0){
      ctx.fillStyle='rgba(0,0,0,0.6)';
      roundRect(ctx,ix,iy,iconSize,iconSize,8);
      ctx.fill();
      ctx.fillStyle='#fff';
      ctx.font='bold 14px sans-serif';
      ctx.textAlign='center';
      ctx.fillText(Math.ceil(cd)+'s',ix+iconSize/2,iy+iconSize/2+5);
    }
  }
}

export function renderPauseMenu(){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,W,H);
  const pw=300,ph=200;
  const px=(W-pw)/2,py=(H-ph)/2;
  ctx.fillStyle='#1a1a2e';ctx.strokeStyle='#ff6b35';ctx.lineWidth=2;
  roundRect(ctx,px,py,pw,ph,10);
  ctx.fill();ctx.stroke();
  ctx.textAlign='center';
  ctx.font='bold 20px sans-serif';
  ctx.fillStyle='#ff6b35';
  ctx.fillText('暂停',px+pw/2,py+40);
  ctx.font='13px sans-serif';
  ctx.fillStyle='#aaa';
  ctx.fillText('确定要返回准备界面吗？',px+pw/2,py+75);
  ctx.fillText('进度将会保存',px+pw/2,py+95);
  const bw=100,bh=36;
  const bx1=px+pw/2-bw-12,by=py+120;
  const bx2=px+pw/2+12;
  pauseButtons=[
    {x:bx1,y:by,w:bw,h:bh,action:()=>{
      game.showPauseMenu=false;
      saveGame();
      game.screen='prepare';
    }},
    {x:bx2,y:by,w:bw,h:bh,action:()=>{game.showPauseMenu=false;}},
  ];
  const h1=game.mouseX>=bx1&&game.mouseX<=bx1+bw&&game.mouseY>=by&&game.mouseY<=by+bh;
  ctx.fillStyle=h1?'#6a2a2a':'#4a1a1a';ctx.strokeStyle=h1?'#fff':'#f44';ctx.lineWidth=1;
  roundRect(ctx,bx1,by,bw,bh,6);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f88';ctx.font='14px sans-serif';
  ctx.fillText('确认返回',bx1+bw/2,by+bh/2+5);
  const h2=game.mouseX>=bx2&&game.mouseX<=bx2+bw&&game.mouseY>=by&&game.mouseY<=by+bh;
  ctx.fillStyle=h2?'#3a3a4a':'#2a2a3a';ctx.strokeStyle=h2?'#fff':'#888';ctx.lineWidth=1;
  roundRect(ctx,bx2,by,bw,bh,6);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ccc';ctx.font='14px sans-serif';
  ctx.fillText('取消',bx2+bw/2,by+bh/2+5);
}

export function renderBackpackOverlay(){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,W,H);
  game.hoveredItem=null;
  const pw=Math.min(680,W-20),ph=Math.min(460,H-60);
  const px=(W-pw)/2,py=(H-ph)/2;
  ctx.fillStyle='#151525';ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
  roundRect(ctx,px,py,pw,ph,10);
  ctx.fill();ctx.stroke();
  ctx.textAlign='center';
  ctx.font='bold 18px sans-serif';
  ctx.fillStyle='#ffd700';
  const bpTitle=game.screen==='playing'?'背包 ('+game.backpack.length+'/8)':'背包 ('+game.backpack.length+')';
  ctx.fillText(bpTitle,px+pw/2,py+28);
  ctx.fillStyle='#888';ctx.font='11px sans-serif';
  const canEquip=game.screen==='prepare'||game.screen==='victory';
  const isCombat=game.screen==='playing';
  ctx.fillText(canEquip?'悬停对比 · 点击装备 | ✕丢弃 | 按 B 关闭':'悬停对比 · ✕丢弃 | 按 B 关闭',px+pw/2,py+46);

  const bp=game.backpack;
  const statLabels={atk:'攻',cdr:'CD',maxHp:'命',bulletSpeed:'速',pickupRange:'拾',movespeed:'移'};
  const cols=5,gapRender=8;
  const cellW=90,rowH=cellW+gapRender+32;
  const gridW=cols*cellW+(cols-1)*gapRender;
  const gridX=(W-gridW)/2,gridY=py+58;
  const viewH=ph-90;
  const rows=Math.ceil(bp.length/cols);
  const maxScroll=Math.max(0,rows*rowH-viewH);
  game.bpScroll=Math.min(game.bpScroll,maxScroll);

  ctx.save();
  ctx.beginPath();
  ctx.rect(px+4,gridY,pw-8,viewH);
  ctx.clip();

  ctx.textAlign='center';
  if(bp.length===0){
    ctx.fillStyle='#555';ctx.font='14px sans-serif';
    ctx.fillText('背包为空',W/2,py+ph/2);
  }else{
    const scrollY=game.bpScroll;
    for(let i=0;i<bp.length;i++){
      const col=i%cols,row=Math.floor(i/cols);
      const rowY=gridY+row*rowH-scrollY;
      if(rowY+cellW+24<gridY||rowY>gridY+viewH)continue;
      const cx=gridX+col*(cellW+gapRender),cy=rowY;
      const item=bp[i];
      const hover=game.mouseX>=cx&&game.mouseX<=cx+cellW&&game.mouseY>=cy&&game.mouseY<=cy+cellW+18;
      if(hover)game.hoveredItem=item;
      ctx.fillStyle='#1a1a2e';ctx.strokeStyle=hover?'#ffd700':(QUALITY_COLORS[item.quality]||'#555');ctx.lineWidth=hover?2:1;
      roundRect(ctx,cx,cy,cellW,cellW+24,5);
      ctx.fill();ctx.stroke();
      ctx.fillStyle=QUALITY_COLORS[item.quality]||'#aaa';
      ctx.font='bold 7px sans-serif';
      ctx.fillText('Lv.'+item.ilvl,cx+cellW/2,cy+10);
      ctx.font='bold 10px sans-serif';
      ctx.fillText(item.name,cx+cellW/2,cy+cellW/2-2);
      ctx.font='9px sans-serif';
      const sn=statLabels[item.stat]||'?';
      ctx.fillText(sn+'+'+item.statValue,cx+cellW/2,cy+cellW/2+10);
      if(item.power){
        ctx.fillStyle='#ff6600';
        ctx.font='bold 7px sans-serif';
        ctx.fillText('★传奇',cx+cellW/2,cy+cellW/2+22);
      }
      const dx=cx+cellW-14,dy=cy-6,dw=16,dh=16;
      const dhover=game.mouseX>=dx&&game.mouseX<=dx+dw&&game.mouseY>=dy&&game.mouseY<=dy+dh;
      ctx.fillStyle=dhover?'#ff4444':'#662222';
      ctx.fillRect(dx,dy,dw,dh);
      ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';
      ctx.fillText('✕',dx+dw/2,dy+dh/2+4);
      if(dhover&&game.mouseDown&&!game.clickProcessed){
        game.clickProcessed=true;
        game.backpack.splice(i,1);
        ctx.restore();return;
      }
      if(canEquip&&hover&&game.mouseDown&&!game.clickProcessed){
        game.clickProcessed=true;
        equipFromBackpack(i);
      }
    }
  }
  ctx.restore();

  if(maxScroll>0){
    const sbX=px+pw-12,sbY=gridY,sbH=viewH,sbW=6;
    ctx.fillStyle='#222';
    ctx.fillRect(sbX,sbY,sbW,sbH);
    const thumbH=Math.max(30,sbH*(viewH/(rows*rowH)));
    const thumbY=sbY+(sbH-thumbH)*(game.bpScroll/maxScroll);
    ctx.fillStyle='#666';
    roundRect(ctx,sbX,thumbY,sbW,thumbH,3);
    ctx.fill();
  }
  if(game.hoveredItem){
    renderCompareTooltip(game.hoveredItem);
  }
}

export function renderCompareTooltip(hoveredItem){
  if(!hoveredItem)return;
  const W=canvas.width,H=canvas.height;
  const slot=hoveredItem.slot;
  const equipped=game.equipment[slot];
  const statDesc={atk:'攻击力',cdr:'冷却缩减',maxHp:'最大生命',bulletSpeed:'弹道速度',pickupRange:'拾取范围',movespeed:'移动速度'};
  const slotNames={weapon:'武器',helmet:'头盔',armor:'护甲',ring:'戒指',amulet:'项链',boots:'靴子',bracers:'护腕',belt:'腰带',artifact:'法器'};

  if(hoveredItem===equipped){
    const tw=280,th=equipped.power?180:150;
    const tx=W-tw-16,ty=H/2-th/2;
    ctx.fillStyle='rgba(10,10,20,0.94)';
    ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
    roundRect(ctx,tx,ty,tw,th,8);
    ctx.fill();ctx.stroke();
    ctx.textAlign='center';
    ctx.fillStyle='#ffd700';ctx.font='bold 13px sans-serif';
    ctx.fillText(slotNames[slot]||slot,tx+tw/2,ty+22);
    ctx.fillStyle=QUALITY_COLORS[equipped.quality]||'#aaa';
    ctx.font='bold 12px sans-serif';
    ctx.fillText(equipped.name,tx+tw/2,ty+45);
    ctx.fillStyle='#888';ctx.font='10px sans-serif';
    ctx.fillText('Lv.'+equipped.ilvl+' · '+QUALITY_NAMES[equipped.quality],tx+tw/2,ty+65);
    ctx.fillStyle='#ccc';ctx.font='bold 13px sans-serif';
    ctx.fillText((statDesc[equipped.stat]||'')+' +'+equipped.statValue,tx+tw/2,ty+85);
    if(equipped.power){
      ctx.fillStyle='#ff6600';ctx.font='10px sans-serif';
      ctx.fillText('★ '+equipped.power.desc.replace('{v}',equipped.power.value),tx+tw/2,ty+105);
      ctx.fillStyle='#ff6600';ctx.font='bold 8px sans-serif';
      ctx.fillText('传奇词缀',tx+tw/2,ty+120);
    }
    return;
  }

  const tw=520,th=240;
  const tx=W-tw-16,ty=H/2-th/2;

  ctx.fillStyle='rgba(10,10,20,0.94)';
  ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
  roundRect(ctx,tx,ty,tw,th,8);
  ctx.fill();ctx.stroke();

  ctx.fillStyle='#ffd700';
  ctx.font='bold 13px sans-serif';
  ctx.textAlign='center';
  ctx.fillText('◀ 当前装备',tx+tw*0.25,ty+22);
  ctx.fillText('悬停物品 ▶',tx+tw*0.75,ty+22);
  ctx.fillStyle='#444';
  ctx.fillText('|',tx+tw/2,ty+22);
  ctx.fillStyle='#888';
  ctx.font='11px sans-serif';
  ctx.fillText(slotNames[slot]||slot,tx+tw/2,ty+22);

  ctx.strokeStyle='#333';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(tx+tw/2,ty+30);ctx.lineTo(tx+tw/2,ty+th-12);ctx.stroke();

  const lx=tx+12,ly=ty+38,lw=tw/2-24;
  if(equipped){
    ctx.fillStyle=QUALITY_COLORS[equipped.quality]||'#aaa';
    ctx.font='bold 12px sans-serif';
    ctx.fillText(equipped.name,lx+lw/2,ly+16);
    ctx.fillStyle='#888';ctx.font='10px sans-serif';
    ctx.fillText('Lv.'+equipped.ilvl+' · '+QUALITY_NAMES[equipped.quality],lx+lw/2,ly+34);
    ctx.fillStyle='#ccc';ctx.font='12px sans-serif';
    ctx.fillText((statDesc[equipped.stat]||'')+' +'+equipped.statValue,lx+lw/2,ly+54);
    if(equipped.power){
      ctx.fillStyle='#ff6600';ctx.font='10px sans-serif';
      ctx.fillText('★ '+equipped.power.desc.replace('{v}',equipped.power.value),lx+lw/2,ly+72);
    }else{
      ctx.fillStyle='#444';ctx.font='10px sans-serif';
      ctx.fillText('(无传奇词缀)',lx+lw/2,ly+72);
    }
  }else{
    ctx.fillStyle='#555';ctx.font='13px sans-serif';
    ctx.fillText('（空槽位）',lx+lw/2,ly+40);
  }

  const rx=tx+tw/2+12,ry=ty+38,rw=tw/2-24;
  ctx.fillStyle=QUALITY_COLORS[hoveredItem.quality]||'#aaa';
  ctx.font='bold 12px sans-serif';
  ctx.fillText(hoveredItem.name,rx+rw/2,ry+16);
  ctx.fillStyle='#888';ctx.font='10px sans-serif';
  ctx.fillText('Lv.'+hoveredItem.ilvl+' · '+QUALITY_NAMES[hoveredItem.quality],rx+rw/2,ry+34);

  if(equipped){
    const hVal=hoveredItem.statValue;
    const eVal=equipped.statValue;
    const diff=hVal-eVal;
    if(diff>0){
      ctx.fillStyle='#44ff44';ctx.font='bold 12px sans-serif';
      ctx.fillText((statDesc[hoveredItem.stat]||'')+' +'+hVal+' ↑(+'+diff+')',rx+rw/2,ry+54);
    }else if(diff<0){
      ctx.fillStyle='#ff4444';ctx.font='bold 12px sans-serif';
      ctx.fillText((statDesc[hoveredItem.stat]||'')+' +'+hVal+' ↓('+diff+')',rx+rw/2,ry+54);
    }else{
      ctx.fillStyle='#ccc';ctx.font='12px sans-serif';
      ctx.fillText((statDesc[hoveredItem.stat]||'')+' +'+hVal,rx+rw/2,ry+54);
    }
  }else{
    ctx.fillStyle='#ffd700';ctx.font='bold 12px sans-serif';
    ctx.fillText((statDesc[hoveredItem.stat]||'')+' +'+hoveredItem.statValue+' ✦新',rx+rw/2,ry+54);
  }

  if(hoveredItem.power){
    const hp=hoveredItem.power;
    const ep=equipped&&equipped.power;
    if(ep){
      if(hp.stat===ep.stat&&hp.value!==ep.value){
        const pd=hp.value-ep.value;
        if(pd>0){
          ctx.fillStyle='#44ff44';ctx.font='bold 10px sans-serif';
          ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' ↑',rx+rw/2,ry+72);
        }else{
          ctx.fillStyle='#ff4444';ctx.font='bold 10px sans-serif';
          ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' ↓',rx+rw/2,ry+72);
        }
      }else if(hp.stat===ep.stat){
        ctx.fillStyle='#ff6600';ctx.font='10px sans-serif';
        ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' (=)',rx+rw/2,ry+72);
      }else{
        ctx.fillStyle='#ffaa00';ctx.font='10px sans-serif';
        ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' (不同词缀)',rx+rw/2,ry+72);
      }
    }else{
      ctx.fillStyle='#ffd700';ctx.font='bold 10px sans-serif';
      ctx.fillText('★ '+hp.desc.replace('{v}',hp.value)+' ✦新词缀',rx+rw/2,ry+72);
    }
  }else if(equipped&&equipped.power){
    ctx.fillStyle='#884444';ctx.font='10px sans-serif';
    ctx.fillText('(失去传奇词缀)',rx+rw/2,ry+72);
  }
}

// --- Victory ---
function renderVictory(){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  ctx.font='bold 28px sans-serif';
  ctx.fillStyle='#ffd700';
  ctx.fillText('胜利！',W/2,24);
  ctx.font='11px sans-serif';
  ctx.fillStyle='#ccc';
  const msgs=['击杀: '+game.kills+'  |  用时: '+formatTime(game.time)];
  if(game.stageIndex<9)msgs.push('解锁: '+STAGES[game.stageIndex+1].name);
  else msgs.push('通关全部章节！');
  msgs.forEach((t,i)=>ctx.fillText(t,W/2,40+i*15));

  victoryButtons=[];
  game.hoveredItem=null;
  const statLabels={atk:'攻',cdr:'CD',maxHp:'命',bulletSpeed:'速',pickupRange:'拾',movespeed:'移'};
  const slotNames={weapon:'武器',helmet:'头盔',armor:'护甲',ring:'戒指',amulet:'项链',boots:'靴子',bracers:'护腕',belt:'腰带',artifact:'法器'};
  const cellW=88,cellH=80,gapRender=6,rowH=cellH+gapRender;
  const cols=Math.min(8,Math.floor((W-40)/(cellW+gapRender)));

  const ground=game.drops.filter(d=>d.slot);
  const topY=58,groundViewH=Math.min(160,H*0.28);
  ctx.font='bold 14px sans-serif';
  ctx.fillStyle='#ff8844';
  ctx.fillText('地面战利品 ('+ground.length+'件) — 悬停对比 · 点击拾取',W/2,topY);
  if(ground.length===0){
    ctx.fillStyle='#555';ctx.font='12px sans-serif';
    ctx.fillText('无地面掉落',W/2,topY+40);
  }else{
    const gRows=Math.ceil(ground.length/cols);
    const gMaxScroll=Math.max(0,gRows*rowH-groundViewH);
    game.groundScroll=Math.min(game.groundScroll,gMaxScroll);
    const totalW=Math.min(ground.length,cols)*(cellW+gapRender)-gapRender;
    const startX=(W-totalW)/2;
    const gridStartY=topY+20;
    ctx.save();
    ctx.beginPath();ctx.rect(0,gridStartY,W,groundViewH);ctx.clip();
    for(let i=0;i<ground.length;i++){
      const col=i%cols,row=Math.floor(i/cols);
      const rowY=gridStartY+row*rowH-game.groundScroll;
      if(rowY+cellH<gridStartY||rowY>gridStartY+groundViewH)continue;
      const cx=startX+col*(cellW+gapRender),cy=rowY;
      const d=ground[i];
      const hover=game.mouseX>=cx&&game.mouseX<=cx+cellW&&game.mouseY>=cy&&game.mouseY<=cy+cellH;
      ctx.fillStyle='#1a1a2e';ctx.strokeStyle=hover?'#ffd700':QUALITY_COLORS[d.quality]||'#555';
      ctx.lineWidth=hover?2:1;
      roundRect(ctx,cx,cy,cellW,cellH,5);
      ctx.fill();ctx.stroke();
      ctx.fillStyle=QUALITY_COLORS[d.quality]||'#aaa';
      ctx.font='bold 7px sans-serif';
      ctx.fillText('Lv.'+d.ilvl,cx+cellW/2,cy+12);
      ctx.font='bold 10px sans-serif';
      ctx.fillText(d.name,cx+cellW/2,cy+28);
      ctx.fillStyle='#ccc';ctx.font='9px sans-serif';
      ctx.fillText((statLabels[d.stat]||'?')+'+'+d.statValue,cx+cellW/2,cy+42);
      ctx.fillStyle='#666';ctx.font='8px sans-serif';
      ctx.fillText(slotNames[d.slot]||'',cx+cellW/2,cy+55);
      if(d.power){ctx.fillStyle='#ff6600';ctx.font='bold 8px sans-serif';ctx.fillText('★传奇',cx+cellW/2,cy+68);}
      if(hover){
        game.hoveredItem=ground[i];
        victoryButtons.push({x:cx,y:cy,w:cellW,h:cellH,text:'pickupGround',idx:i,action:()=>{pickupGroundItem(i);}});
      }
    }
    ctx.restore();
    if(gMaxScroll>0){
      const sbX=W-16,sbH=groundViewH,sbW=6;
      ctx.fillStyle='#222';ctx.fillRect(sbX,gridStartY,sbW,sbH);
      const thumbH=Math.max(20,sbH*(groundViewH/(gRows*rowH)));
      const thumbY=gridStartY+(sbH-thumbH)*(game.groundScroll/gMaxScroll);
      ctx.fillStyle='#555';roundRect(ctx,sbX,thumbY,sbW,thumbH,3);ctx.fill();
    }
  }

  const bp=game.backpack;
  const bpY=H-210,bpViewH=140;
  ctx.fillStyle='#334';ctx.beginPath();ctx.moveTo(20,bpY-8);ctx.lineTo(W-20,bpY-8);ctx.stroke();
  ctx.font='bold 14px sans-serif';
  ctx.fillStyle='#ffd700';
  ctx.fillText('背包 ('+bp.length+'/8) — 悬停对比 · 点击放回地面',W/2,bpY+12);
  if(bp.length===0){
    ctx.fillStyle='#555';ctx.font='12px sans-serif';
    ctx.fillText('背包为空',W/2,bpY+50);
  }else{
    const bpCols=Math.min(8,Math.floor((W-40)/(cellW+gapRender)));
    const bRows=Math.ceil(bp.length/bpCols);
    const bMaxScroll=Math.max(0,bRows*rowH-bpViewH);
    game.bpScroll=Math.min(game.bpScroll,bMaxScroll);
    const totalBW=Math.min(bp.length,bpCols)*(cellW+gapRender)-gapRender;
    const startBX=(W-totalBW)/2;
    const bpGridY=bpY+24;
    ctx.save();
    ctx.beginPath();ctx.rect(0,bpGridY,W,bpViewH);ctx.clip();
    for(let i=0;i<bp.length;i++){
      const col=i%bpCols,row=Math.floor(i/bpCols);
      const rowY=bpGridY+row*rowH-game.bpScroll;
      if(rowY+cellH<bpGridY||rowY>bpGridY+bpViewH)continue;
      const cx=startBX+col*(cellW+gapRender),cy=rowY;
      const item=bp[i];
      const hover=game.mouseX>=cx&&game.mouseX<=cx+cellW&&game.mouseY>=cy&&game.mouseY<=cy+cellH;
      ctx.fillStyle='#1a1a2e';
      ctx.strokeStyle=hover?'#ffd700':QUALITY_COLORS[item.quality]||'#555';
      ctx.lineWidth=hover?2:1;
      roundRect(ctx,cx,cy,cellW,cellH,5);
      ctx.fill();ctx.stroke();
      ctx.fillStyle=QUALITY_COLORS[item.quality]||'#aaa';
      ctx.font='bold 7px sans-serif';
      ctx.fillText('Lv.'+item.ilvl,cx+cellW/2,cy+20);
      ctx.font='bold 10px sans-serif';
      ctx.fillText(item.name,cx+cellW/2,cy+36);
      ctx.fillStyle='#ccc';ctx.font='9px sans-serif';
      ctx.fillText((statLabels[item.stat]||'?')+'+'+item.statValue,cx+cellW/2,cy+50);
      ctx.fillStyle='#666';ctx.font='8px sans-serif';
      ctx.fillText(slotNames[item.slot]||'',cx+cellW/2,cy+63);
      if(item.power){ctx.fillStyle='#ff6600';ctx.font='bold 7px sans-serif';ctx.fillText('★',cx+cellW/2,cy+74);}
      if(hover){
        game.hoveredItem=item;
        victoryButtons.push({x:cx,y:cy,w:cellW,h:cellH,text:'putBack',idx:i,action:()=>{
          game.drops.push({...game.backpack[i],bobPhase:Math.random()*Math.PI*2,expireTime:null});
          game.backpack.splice(i,1);
        }});
      }
    }
    ctx.restore();
    if(bMaxScroll>0){
      const sbX=W-16,sbH=bpViewH,sbW=6;
      ctx.fillStyle='#222';ctx.fillRect(sbX,bpGridY,sbW,sbH);
      const thumbH=Math.max(20,sbH*(bpViewH/(bRows*rowH)));
      const thumbY=bpGridY+(sbH-thumbH)*(game.bpScroll/bMaxScroll);
      ctx.fillStyle='#555';roundRect(ctx,sbX,thumbY,sbW,thumbH,3);ctx.fill();
    }
  }

  if(game.hoveredItem){
    renderCompareTooltip(game.hoveredItem);
  }
  const bw=200,bh=40;
  const byBtn=H-44;
  victoryButtons.push({x:W/2-bw/2,y:byBtn,w:bw,h:bh,text:'返回准备',action:()=>{game.screen='prepare';saveGame();}});
  drawButton(W/2-bw/2,byBtn,bw,bh,'返回准备','#3a3a1a','#aaa','#ffd700');
}

function pickupGroundItem(idx){
  const ground=game.drops.filter(d=>d.slot);
  const item=ground[idx];
  if(!item)return;
  game.backpack.push({slot:item.slot,quality:item.quality,ilvl:item.ilvl,statValue:item.statValue,stat:item.stat,name:item.name,color:item.color,power:item.power||null});
  const realIdx=game.drops.indexOf(item);
  if(realIdx>=0)game.drops.splice(realIdx,1);
}

function equipFromBackpack(idx){
  const item=game.backpack[idx];
  if(!item)return;
  const old=game.equipment[item.slot];
  game.equipment[item.slot]={slot:item.slot,quality:item.quality,ilvl:item.ilvl,statValue:item.statValue,stat:item.stat,name:item.name,color:item.color,power:item.power||null};
  if(old)game.backpack[idx]=old;
  else game.backpack.splice(idx,1);
  const p=game.player;
  const ratio=p.hp/p.maxHp;
  const s=calcPlayerStats();
  p.maxHp=s.maxHP;p.atk=s.atk;p.cdr=s.cdr;
  p.bulletSpeed=s.bulletSpeed;p.pickupRange=s.pickupRange;p.fireRate=s.fireRate;
  p.hp=Math.min(Math.round(p.maxHp*ratio),p.maxHp);
}

// --- Death ---
function renderDeath(){
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  ctx.font='bold 48px sans-serif';
  ctx.fillStyle='#cc0000';
  ctx.fillText('你死了',W/2,H*0.3);
  ctx.font='18px sans-serif';
  ctx.fillStyle='#ccc';
  ctx.fillText('击杀数: '+game.kills, W/2, H*0.4);
  ctx.fillText('等级: '+game.player.level, W/2, H*0.44);
  const bw=200,bh=50;
  const bx=W/2-bw/2,by=H*0.55;
  deathButtons=[{x:bx,y:by,w:bw,h:bh,text:'返回主菜单',action:()=>{game.screen='menu';}}];
  drawButton(bx,by,bw,bh,'返回主菜单','#3a1a1a','#aaa','#ff4444');
}

// ---- Testfield ----

function renderTestField() {
  const W = canvas.width, H = canvas.height;
  testfieldButtons = [];

  game.camera.x = game.player.x - W / 2;
  game.camera.y = game.player.y - H / 2;

  // Background
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = -game.camera.x % TILE_SIZE; x < W; x += TILE_SIZE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = -game.camera.y % TILE_SIZE; y < H; y += TILE_SIZE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  renderDummies();
  renderProjectiles();
  renderSkillEffects();
  renderPlayer();
  renderParticles();
  renderFloatingNumbers();
  renderDamageHUD();
  if (game.showLoadoutPanel) renderLoadoutPanel();
  renderLoadoutToggle();
}

function renderDummies() {
  for (const d of game.trainingDummies) {
    const sx = d.x - game.camera.x;
    const sy = d.y - game.camera.y;
    if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) continue;

    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(sx, sy, d.size, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - d.size - 6, sy);
    ctx.lineTo(sx + d.size + 6, sy);
    ctx.moveTo(sx, sy - d.size - 6);
    ctx.lineTo(sx, sy + d.size + 6);
    ctx.stroke();

    // Glow ring
    ctx.strokeStyle = 'rgba(150,150,150,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, d.size + 8, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#aaa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, sx, sy - d.size - 12);
  }
}

function renderFloatingNumbers() {
  for (let i = floatingNumbers.length - 1; i >= 0; i--) {
    const fn = floatingNumbers[i];
    fn.timer -= 0.016;
    fn.y -= 0.8;
    if (fn.timer <= 0) {
      floatingNumbers.splice(i, 1);
      continue;
    }
    const alpha = Math.min(1, fn.timer / 0.4);
    const sx = fn.x - game.camera.x;
    const sy = fn.y - game.camera.y;
    ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(fn.damage), sx, sy);
  }
}

function renderDamageHUD() {
  const W = canvas.width;
  const ds = game.damageStats;

  // Import getDPS dynamically or compute inline
  let dps = 0;
  if (ds.dpsHistory.length > 0) {
    const oldest = ds.dpsHistory[0].time;
    const newest = ds.dpsHistory[ds.dpsHistory.length - 1].time;
    const span = newest - oldest;
    if (span > 0) {
      const dmg = ds.dpsHistory.reduce((s, e) => s + e.damage, 0);
      dps = Math.round(dmg / span);
    }
  }

  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, W, 36);
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px sans-serif';

  ctx.fillStyle = '#ff8800';
  ctx.fillText('DPS: ' + dps.toLocaleString() + '/s', 15, 24);

  ctx.fillStyle = '#ccc';
  ctx.font = '12px sans-serif';
  ctx.fillText('总伤害: ' + ds.totalDamage.toLocaleString(), 190, 24);
  ctx.fillText('峰值: ' + ds.peakDamage.toLocaleString(), 350, 24);

  const elapsed = game.testfieldTime || 0;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  ctx.fillText('时长: ' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0'), 470, 24);

  const btnX = W - 80, btnY = 6, btnW = 65, btnH = 24;
  const hover = game.mouseX >= btnX && game.mouseX <= btnX + btnW && game.mouseY >= btnY && game.mouseY <= btnY + btnH;
  ctx.fillStyle = hover ? '#4a2020' : '#2a1010';
  ctx.strokeStyle = hover ? '#f88' : '#844';
  ctx.lineWidth = 1;
  roundRect(ctx, btnX, btnY, btnW, btnH, 4);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f88';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('重置', btnX + btnW / 2, btnY + btnH / 2 + 4);

  testfieldButtons.push({ x: btnX, y: btnY, w: btnW, h: btnH, action: 'resetStats' });
}

function renderLoadoutPanel() {
  const W = canvas.width, H = canvas.height;
  const pw = 320, ph = H - 80, px = W - pw - 10, py = 50;

  ctx.fillStyle = 'rgba(10, 10, 25, 0.95)';
  ctx.strokeStyle = '#445';
  ctx.lineWidth = 1;
  roundRect(ctx, px, py, pw, ph, 8);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('配装面板', px + pw / 2, py + 22);

  const tabW = (pw - 20) / 2, tabH = 28, tabY = py + 32;
  const presetsTab = { x: px + 5, y: tabY, w: tabW, h: tabH, id: 'presets' };
  const customTab = { x: px + pw / 2 + 5, y: tabY, w: tabW - 10, h: tabH, id: 'custom' };

  for (const tab of [presetsTab, customTab]) {
    const active = game.loadoutTab === tab.id;
    ctx.fillStyle = active ? '#2a2a4a' : '#1a1a2a';
    ctx.strokeStyle = active ? '#ffd700' : '#334';
    ctx.lineWidth = active ? 2 : 1;
    roundRect(ctx, tab.x, tab.y, tab.w, tab.h, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = active ? '#ffd700' : '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tab.id === 'presets' ? '预设模板' : '自由搭配', tab.x + tab.w / 2, tab.y + tab.h / 2 + 4);
    testfieldButtons.push({ x: tab.x, y: tab.y, w: tab.w, h: tab.h, action: 'switchTab', tabId: tab.id });
  }

  if (game.loadoutTab === 'presets') {
    renderPresetsTab(px, py + 65, pw);
  } else {
    renderCustomTab(px, py + 65, pw);
  }
}

function renderPresetsTab(px, py, pw) {
  // Dynamic import would be circular — inline the presets
  const presets = [
    { name: '火球弹幕', description: '穿透火球 + 火焰风暴 (熔火之心)' },
    { name: '冰法控制', description: '暴风眼 + 急冻光环 (深寒领域)' },
    { name: '元素使', description: '元素使4件 + 穿透火球/火焰风暴 + 谐律之眼' },
    { name: '时空术士', description: '时空术士4件 + 冷却共鸣/虚空行者 + 力场发生器' },
    { name: '混合火冰', description: '穿透火球 + 暴风眼 (火冰相激)' },
  ];

  const itemH = 48, gap = 6;
  for (let i = 0; i < presets.length; i++) {
    const pres = presets[i];
    const iy = py + i * (itemH + gap);
    if (iy + itemH > canvas.height - 100) break;

    const hover = game.mouseX >= px + 8 && game.mouseX <= px + pw - 8 && game.mouseY >= iy && game.mouseY <= iy + itemH;
    ctx.fillStyle = hover ? '#1a1a3a' : '#151525';
    ctx.strokeStyle = hover ? '#ffd700' : '#334';
    ctx.lineWidth = hover ? 2 : 1;
    roundRect(ctx, px + 8, iy, pw - 16, itemH, 4);
    ctx.fill(); ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(pres.name, px + 18, iy + 20);
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText(pres.description, px + 18, iy + 36);

    testfieldButtons.push({ x: px + 8, y: iy, w: pw - 16, h: itemH, action: 'applyPreset', presetName: pres.name });
  }
}

function renderCustomTab(px, py, pw) {
  const slots = ['weapon', 'helmet', 'armor', 'ring', 'amulet', 'boots', 'bracers', 'belt', 'artifact'];
  const slotNames = ['武器', '头盔', '护甲', '戒指', '项链', '靴子', '护腕', '腰带', '法器'];
  const itemH = 38, gap = 3;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const iy = py + i * (itemH + gap);
    if (iy + itemH > canvas.height - 60) break;

    ctx.fillStyle = '#151525';
    roundRect(ctx, px + 8, iy, pw - 16, itemH, 3);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaa';
    ctx.font = '11px sans-serif';
    ctx.fillText(slotNames[i], px + 16, iy + 24);

    const eq = game.sandboxEquipment[slot];
    if (eq) {
      ctx.fillStyle = QUALITY_COLORS[eq.quality] || '#aaa';
      ctx.font = '10px sans-serif';
      const shortName = eq.name ? eq.name.replace(' [70]', '') : (QUALITY_NAMES[eq.quality] + '装备');
      ctx.fillText(shortName, px + 60, iy + 24);
    } else {
      ctx.fillStyle = '#444';
      ctx.font = '10px sans-serif';
      ctx.fillText('空', px + 60, iy + 24);
    }

    testfieldButtons.push({ x: px + 8, y: iy, w: pw - 16, h: itemH, action: 'cycleSlot', slot: slot });
  }

  const applyY = py + slots.length * (itemH + gap) + 10;
  const applyW = 120, applyH = 32;
  const applyX = px + (pw - applyW) / 2;
  const applyHover = game.mouseX >= applyX && game.mouseX <= applyX + applyW && game.mouseY >= applyY && game.mouseY <= applyY + applyH;
  ctx.fillStyle = applyHover ? '#2a3a2a' : '#1a2a1a';
  ctx.strokeStyle = applyHover ? '#fff' : '#4a4';
  ctx.lineWidth = 2;
  roundRect(ctx, applyX, applyY, applyW, applyH, 6);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8f8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('应用配置', applyX + applyW / 2, applyY + applyH / 2 + 5);

  testfieldButtons.push({ x: applyX, y: applyY, w: applyW, h: applyH, action: 'applyCustom' });
}

function renderLoadoutToggle() {
  const W = canvas.width;
  const btnSize = 24, btnX = W - btnSize - 10, btnY = 50;
  const hover = game.mouseX >= btnX && game.mouseX <= btnX + btnSize && game.mouseY >= btnY && game.mouseY <= btnY + btnSize;
  ctx.fillStyle = hover ? '#334' : '#223';
  ctx.strokeStyle = hover ? '#fff' : '#556';
  ctx.lineWidth = 1;
  roundRect(ctx, btnX, btnY, btnSize, btnSize, 4);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#aaa';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.showLoadoutPanel ? '◀' : '▶', btnX + btnSize / 2, btnY + btnSize / 2 + 5);
  testfieldButtons.push({ x: btnX, y: btnY, w: btnSize, h: btnSize, action: 'togglePanel' });
}

// --- Button / Shape Helpers ---
export function drawButton(x,y,w,h,text,bgColor,textColor,borderColor){
  const hover=game.mouseX>=x&&game.mouseX<=x+w&&game.mouseY>=y&&game.mouseY<=y+h;
  ctx.fillStyle=hover?'#3a3a4a':bgColor;
  ctx.strokeStyle=hover?'#fff':borderColor;
  ctx.lineWidth=hover?2:1;
  roundRect(ctx,x,y,w,h,8);
  ctx.fill();ctx.stroke();
  ctx.fillStyle=textColor;
  ctx.font='bold 18px sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(text,x+w/2,y+h/2);
  ctx.textBaseline='alphabetic';
}

export function roundRect(ctxRef,x,y,w,h,r){
  ctxRef.beginPath();
  ctxRef.moveTo(x+r,y);
  ctxRef.lineTo(x+w-r,y);
  ctxRef.quadraticCurveTo(x+w,y,x+w,y+r);
  ctxRef.lineTo(x+w,y+h-r);
  ctxRef.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctxRef.lineTo(x+r,y+h);
  ctxRef.quadraticCurveTo(x,y+h,x,y+h-r);
  ctxRef.lineTo(x,y+r);
  ctxRef.quadraticCurveTo(x,y,x+r,y);
  ctxRef.closePath();
}

