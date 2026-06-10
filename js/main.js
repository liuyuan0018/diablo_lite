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
  const isMobile = 'ontouchstart' in window || window.FORCE_MOBILE;
  if (isMobile) {
    canvas.width = 750;
    canvas.height = 1334;
  } else {
    canvas.width = 1920;
    canvas.height = 1080;
  }
  fitCanvas();
}

function fitCanvas() {
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
  canvas.style.width = (canvas.width * scale) + 'px';
  canvas.style.height = (canvas.height * scale) + 'px';
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
