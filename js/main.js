// ============================================================
// SECTION 18: INIT — Entry point
// ============================================================
import { game } from './game-state.js';
import { canvas } from './canvas.js';
import { loadGame } from './persistence.js';
import { registerInputHandlers } from './input.js';
import { gameLoop } from './gameplay.js';
import { startAmbient } from './audio.js';
import { initMobile } from './mobile.js';

function syncCanvasSize(){
  const vw = window.visualViewport || window;
  const w = vw.width || window.innerWidth;
  const h = vw.height || window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}

function init(){
  syncCanvasSize();
  loadGame();
  game.screen='menu';
  startAmbient('menu');
  registerInputHandlers();
  initMobile();
  requestAnimationFrame(gameLoop);
}

init();
