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
  const isMobile = 'ontouchstart' in window;
  if (isMobile && window.visualViewport) {
    const vw = window.visualViewport;
    canvas.width = vw.width;
    canvas.height = vw.height;
    canvas.style.width = vw.width + 'px';
    canvas.style.height = vw.height + 'px';
  } else {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
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
