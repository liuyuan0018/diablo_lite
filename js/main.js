// ============================================================
// SECTION 18: INIT — Entry point
// ============================================================
import { game } from './game-state.js';
import { canvas } from './canvas.js';
import { loadGame } from './persistence.js';
import { registerInputHandlers } from './input.js';
import { gameLoop } from './gameplay.js';

function init(){
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  loadGame();
  game.screen='menu';
  registerInputHandlers();
  requestAnimationFrame(gameLoop);
}

init();
