import { game } from './game-state.js';
import { canvas } from './canvas.js';
import { clamp } from './helpers.js';

let joyTouchId = null;
let joyCenter = { x: 0, y: 0 };
let canvasTouchId = null;
let touchStartX = 0, touchStartY = 0;
let hasMoved = false;

export function initMobile() {
  if (!('ontouchstart' in window)) return;

  const joystickZone = document.getElementById('joystickZone');
  const joystickThumb = document.getElementById('joystickThumb');
  const skillBtns = document.querySelectorAll('.skill-btn');
  const btnBackpack = document.getElementById('btnBackpack');
  const btnPause = document.getElementById('btnPause');

  // === Joystick ===
  function getJoyCenter() {
    const base = document.getElementById('joystickBase');
    const r = base.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  joystickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (joyTouchId !== null) return;
    const t = e.changedTouches[0];
    joyTouchId = t.identifier;
    joyCenter = getJoyCenter();
    updateJoystick(t);
  });

  function updateJoystick(touch) {
    const maxR = 34;
    const dx = touch.clientX - joyCenter.x;
    const dy = touch.clientY - joyCenter.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const cd = Math.min(d, maxR);
    const nx = d > 0 ? dx / d : 0;
    const ny = d > 0 ? dy / d : 0;
    joystickThumb.style.transform = `translate(calc(-50% + ${nx * cd}px), calc(-50% + ${ny * cd}px))`;
    const strength = clamp(d / maxR, 0, 1);
    game.moveDir = { x: nx * strength, y: ny * strength };
  }

  function resetJoystick() {
    joyTouchId = null;
    joystickThumb.style.transform = 'translate(-50%, -50%)';
    game.moveDir = { x: 0, y: 0 };
  }

  document.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) updateJoystick(t);
      if (t.identifier === canvasTouchId) handleCanvasMove(t);
    }
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) resetJoystick();
      if (t.identifier === canvasTouchId) { canvasTouchId = null; game.mouseDown = false; }
    }
  });

  document.addEventListener('touchcancel', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) resetJoystick();
      if (t.identifier === canvasTouchId) { canvasTouchId = null; game.mouseDown = false; }
    }
  });

  // === Skill buttons ===
  skillBtns.forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      game.activeSkill = parseInt(btn.dataset.skill);
      skillBtns.forEach(b => b.classList.toggle('on', b === btn));
    });
  });

  // === Menu buttons ===
  btnBackpack.addEventListener('touchstart', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (game.screen === 'playing') {
      if (game.showPauseMenu) game.showPauseMenu = false;
      game.showBackpack = !game.showBackpack;
      if (game.showBackpack) game.bpScroll = 0;
    }
  });

  btnPause.addEventListener('touchstart', (e) => {
    e.preventDefault(); e.stopPropagation();
    // The actual Escape key handler logic is in input.js, but we need it here too
    // dispatch a keydown event for Escape so the existing handler picks it up
    const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(ev);
  });

  // === Canvas touch (aim + tap to cast, scroll in menus) ===
  canvas.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      if (canvasTouchId !== null) continue;
      // Don't handle if touch started on an overlay button (they preventDefault)
      if (e.target !== canvas && e.target.tagName !== 'CANVAS') continue;
      e.preventDefault();
      canvasTouchId = t.identifier;
      const rect = canvas.getBoundingClientRect();
      game.mouseX = t.clientX - rect.left;
      game.mouseY = t.clientY - rect.top;
      game.mouseDown = true;
      game.clickProcessed = false;
      touchStartX = t.clientX; touchStartY = t.clientY;
      hasMoved = false;
    }
  }, { passive: false });

  function handleCanvasMove(touch) {
    const rect = canvas.getBoundingClientRect();
    const cx = touch.clientX - rect.left;
    const cy = touch.clientY - rect.top;
    game.mouseX = cx; game.mouseY = cy;

    const dx = Math.abs(touch.clientX - touchStartX);
    const dy = Math.abs(touch.clientY - touchStartY);
    if (dx > 8 || dy > 8) hasMoved = true;
    if (!hasMoved) return;

    // Scroll handling for menu overlays
    const deltaY = touchStartY - touch.clientY; // positive = scroll down
    touchStartX = touch.clientX; touchStartY = touch.clientY;

    const W = canvas.width, H = canvas.height;
    if (game.showCharSelect) {
      const ph = Math.min(420, H - 60);
      const listH = ph - 100;
      const itemH = 56;
      const maxScroll = Math.max(0, game.characters.length * itemH - listH);
      game.charScroll = clamp((game.charScroll || 0) + deltaY, 0, maxScroll);
    } else if (game.showBackpack) {
      const gap = 8, cellW = 90, rowH = cellW + gap + 32;
      const pw = Math.min(680, W - 20), ph = Math.min(460, H - 60);
      const py = (H - ph) / 2;
      const viewH = ph - 90;
      const rows = Math.ceil(game.backpack.length / 5);
      const maxScroll = Math.max(0, rows * rowH - viewH);
      game.bpScroll = clamp(game.bpScroll + deltaY, 0, maxScroll);
    } else if (game.screen === 'victory') {
      const cellW = 88, cellH = 80, gap = 6, rowH = cellH + gap;
      const ground = game.drops ? game.drops.filter(d => d.slot) : [];
      const groundViewH = Math.min(160, H * 0.28);
      const bpY = H - 210, bpViewH = 140;
      if (cy > bpY - 8) {
        const cols = Math.min(8, Math.floor((W - 40) / (cellW + gap)));
        const rows = Math.ceil(game.backpack.length / cols);
        const maxScroll = Math.max(0, rows * rowH - bpViewH);
        game.bpScroll = clamp(game.bpScroll + deltaY, 0, maxScroll);
      } else {
        const cols = Math.min(8, Math.floor((W - 40) / (cellW + gap)));
        const rows = Math.ceil(ground.length / cols);
        const maxScroll = Math.max(0, rows * rowH - groundViewH);
        game.groundScroll = clamp(game.groundScroll + deltaY, 0, maxScroll);
      }
    }
  }

  canvas.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === canvasTouchId) {
        canvasTouchId = null;
        game.mouseDown = false;
      }
    }
  });

  // === Update skill button CD text ===
  const origRender = () => {
    if (!('ontouchstart' in window)) return;
    requestAnimationFrame(() => {
      skillBtns.forEach(btn => {
        const idx = parseInt(btn.dataset.skill);
        const cd = game.player.skillCooldowns[idx] || 0;
        let cdEl = btn.querySelector('.cd');
        if (cd > 0) {
          if (!cdEl) { cdEl = document.createElement('span'); cdEl.className = 'cd'; btn.appendChild(cdEl); }
          cdEl.textContent = cd.toFixed(1);
        } else {
          if (cdEl) cdEl.remove();
        }
      });
      requestAnimationFrame(origRender);
    });
  };
  requestAnimationFrame(origRender);
}
