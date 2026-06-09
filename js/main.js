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

function init(){
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  loadGame();
  game.screen='menu';
  startAmbient('menu');
  registerInputHandlers();
  initMobile();
  requestAnimationFrame(gameLoop);
}

init();
