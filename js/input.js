// ============================================================
// SECTION 13: INPUT
// ============================================================
import { game } from './game-state.js';
import { canvas } from './canvas.js';
import { startTestStage, exitTestfieldToPrepare } from './gameplay.js';
import { clamp } from './helpers.js';

export function registerInputHandlers(){
  document.addEventListener('keydown',e=>{
    if(e.key==='1'){e.preventDefault();game.activeSkill=0;}
    if(e.key==='2'){e.preventDefault();game.activeSkill=1;}
    if(e.key==='3'){e.preventDefault();game.activeSkill=2;}
    if(e.key==='w'||e.key==='W'){e.preventDefault();game.keys.w=true;}
    if(e.key==='a'||e.key==='A'){e.preventDefault();game.keys.a=true;}
    if(e.key==='s'||e.key==='S'){e.preventDefault();game.keys.s=true;}
    if(e.key==='d'||e.key==='D'){e.preventDefault();game.keys.d=true;}
    if(e.key==='Escape'){
      if(game.screen==='testfield'){
        exitTestfieldToPrepare();
        return;
      }
      e.preventDefault();
      if(game.screen==='playing'){
        if(game.showBackpack){game.showBackpack=false;}
        else{game.showPauseMenu=!game.showPauseMenu;}
      }
    }
    if(e.key==='b'||e.key==='B'){
      e.preventDefault();
      if(game.showPauseMenu)game.showPauseMenu=false;
      game.showBackpack=!game.showBackpack;
      if(game.showBackpack)game.bpScroll=0;
    }
    if(e.key==='`'||e.key==='~'){
      e.preventDefault();
      startTestStage();
    }
  });

  document.addEventListener('keyup',e=>{
    if(e.key==='w'||e.key==='W'){game.keys.w=false;}
    if(e.key==='a'||e.key==='A'){game.keys.a=false;}
    if(e.key==='s'||e.key==='S'){game.keys.s=false;}
    if(e.key==='d'||e.key==='D'){game.keys.d=false;}
  });

  canvas.addEventListener('mousemove',e=>{
    const rect=canvas.getBoundingClientRect();
    game.mouseX=e.clientX-rect.left;
    game.mouseY=e.clientY-rect.top;
  });

  canvas.addEventListener('mousedown',e=>{
    if(e.button===2)e.preventDefault();
    game.mouseDown=true;
    game.clickProcessed=false;
    if(game.screen==='playing'){
      if(e.button===2){e.preventDefault();game.mouseDown=true;game.clickProcessed=false;}
    }
  });

  canvas.addEventListener('mouseup',()=>{game.mouseDown=false;});

  canvas.addEventListener('contextmenu',e=>e.preventDefault());

  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const W=canvas.width;
    const H=canvas.height;
    if(game.showCharSelect){
      const pw=400,ph=Math.min(420,H-60);
      const listH=ph-100;
      const itemH=56;
      const maxScroll=Math.max(0,game.characters.length*itemH-listH);
      if(game.charScroll===undefined)game.charScroll=0;
      game.charScroll=clamp(game.charScroll-e.deltaY*0.5,0,maxScroll);
    }else if(game.showBackpack){
      const cols=5,gap=8,cellW=90,rowH=cellW+gap+32;
      const pw=Math.min(680,W-20),ph=Math.min(460,canvas.height-60);
      const px=(W-pw)/2,py=(canvas.height-ph)/2;
      const gridY=py+58, viewH=ph-90;
      const rows=Math.ceil(game.backpack.length/cols);
      const maxScroll=Math.max(0,rows*rowH-viewH);
      game.bpScroll=clamp(game.bpScroll-e.deltaY*0.5,0,maxScroll);
    }else if(game.screen==='victory'){
      const cellW=88,cellH=80,gap=6,rowH=cellH+gap;
      const ground=game.drops.filter(d=>d.slot);
      const topY=58, groundViewH=Math.min(160,canvas.height*0.28);
      const bpY=canvas.height-210, bpViewH=140;
      if(game.mouseY>bpY-8){
        const cols=Math.min(8,Math.floor((W-40)/(cellW+gap)));
        const rows=Math.ceil(game.backpack.length/cols);
        const maxScroll=Math.max(0,rows*rowH-bpViewH);
        game.bpScroll=clamp(game.bpScroll-e.deltaY*0.5,0,maxScroll);
      }else{
        const cols=Math.min(8,Math.floor((W-40)/(cellW+gap)));
        const rows=Math.ceil(ground.length/cols);
        const maxScroll=Math.max(0,rows*rowH-groundViewH);
        game.groundScroll=clamp(game.groundScroll-e.deltaY*0.5,0,maxScroll);
      }
    }
  },{passive:false});

  window.addEventListener('resize',()=>{
    const vw = window.visualViewport || window;
    const w = vw.width || window.innerWidth;
    const h = vw.height || window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const w = window.visualViewport.width;
      const h = window.visualViewport.height;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    });
  }
}
