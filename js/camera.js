// ============================================================
// SECTION 15: CAMERA
// ============================================================
import { game } from './game-state.js';
import { MAP_W, MAP_H } from './config.js';
import { lerp, clamp } from './helpers.js';
import { canvas } from './canvas.js';

export function updateCamera(dt){
  const targetX=game.player.x-canvas.width/2;
  const targetY=game.player.y-canvas.height/2;
  game.camera.x=lerp(game.camera.x,targetX,0.1);
  game.camera.y=lerp(game.camera.y,targetY,0.1);
  game.camera.x=clamp(game.camera.x,0,Math.max(0,MAP_W-canvas.width));
  game.camera.y=clamp(game.camera.y,0,Math.max(0,MAP_H-canvas.height));
}
