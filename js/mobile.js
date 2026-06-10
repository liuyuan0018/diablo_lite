import { game } from './game-state.js';
import { canvas } from './canvas.js';
import { clamp } from './helpers.js';
import { castSkill } from './skills.js';
import { toCanvasXY } from './input.js';

let joyTouchId = null;
let joyCenter = { x: 0, y: 0 };
let canvasTouchId = null;
let touchStartX = 0, touchStartY = 0;
let hasMoved = false;

export function initMobile() {
  if (!('ontouchstart' in window)) return;

  const joystickThumb = document.getElementById('joystickThumb');
  const skillBtns = document.querySelectorAll('.skill-btn');

  // === Canvas-level touchstart (fires before document-level) ===
  canvas.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      console.log('[canvas touch] id=' + t.identifier + ' target=' + (e.target && e.target.tagName) + ' screen=' + game.screen);
      if (canvasTouchId !== null) { console.log('[canvas touch] SKIP: canvasTouchId already set'); continue; }
      if (game.skillDrag.touchId === t.identifier) { console.log('[canvas touch] SKIP: skillDrag active'); continue; }
      const target = e.target;
      if (target && target.closest && (target.closest('#joystickZone') || target.closest('#skillBtns') || target.closest('#btnBackpack') || target.closest('#btnPause'))) {
        console.log('[canvas touch] SKIP: on control'); continue;
      }
      e.preventDefault();
      e.stopPropagation();
      canvasTouchId = t.identifier;
      console.log('[canvas touch] PROCESSED screen=' + game.screen + ' mouseDown=' + game.mouseDown);
      if (game.screen === 'playing' && !game.showBackpack && !game.showPauseMenu) {
        game.skillDrag.active = true;
        game.skillDrag.skillIdx = game.activeSkill;
        game.skillDrag.touchId = t.identifier;
        const wc = getWorldCoords(t);
        game.skillDrag.worldX = wc.x;
        game.skillDrag.worldY = wc.y;
        touchStartX = t.clientX; touchStartY = t.clientY;
        hasMoved = false;
      } else {
        startCanvasTouch(t);
      }
    }
  }, { passive: false });

  // === Joystick helpers ===
  function getJoyCenter() {
    const base = document.getElementById('joystickBase');
    const r = base.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

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

  function getWorldCoords(touch) {
    const p = toCanvasXY(touch.clientX, touch.clientY);
    return { x: clamp(p.x + game.camera.x, 0, 20000), y: clamp(p.y + game.camera.y, 0, 20000) };
  }

  function startCanvasTouch(t) {
    const p = toCanvasXY(t.clientX, t.clientY);
    game.mouseX = p.x;
    game.mouseY = p.y;
    game.mouseDown = true;
    game.clickProcessed = false;
    touchStartX = t.clientX; touchStartY = t.clientY;
    hasMoved = false;
  }

  // === Unified touchstart handler at document level ===
  document.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      const target = e.target;

      // 1) Joystick zone
      if (target.closest('#joystickZone')) {
        e.preventDefault();
        if (joyTouchId !== null) continue;
        joyTouchId = t.identifier;
        joyCenter = getJoyCenter();
        updateJoystick(t);
        continue;
      }

      // 2) Skill buttons — skip entire skillBtns zone (individual buttons use stopPropagation)
      if (target.closest('#skillBtns')) continue;
      // 3) Backpack button
      if (target.closest('#btnBackpack')) {
        e.preventDefault();
        if (game.screen === 'playing') {
          if (game.showPauseMenu) game.showPauseMenu = false;
          game.showBackpack = !game.showBackpack;
          if (game.showBackpack) game.bpScroll = 0;
        }
        continue;
      }

      // 4) Pause button
      if (target.closest('#btnPause')) {
        e.preventDefault();
        const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        document.dispatchEvent(ev);
        continue;
      }

      // 5) Canvas touch — in playing mode, start skill drag; otherwise menus
      if (canvasTouchId !== null) continue;
      e.preventDefault();
      if (game.screen === 'playing' && !game.showBackpack && !game.showPauseMenu) {
        // Direct drag-to-cast from canvas using current active skill
        game.skillDrag.active = true;
        game.skillDrag.skillIdx = game.activeSkill;
        game.skillDrag.touchId = t.identifier;
        const wc = getWorldCoords(t);
        game.skillDrag.worldX = wc.x;
        game.skillDrag.worldY = wc.y;
        canvasTouchId = t.identifier;
        touchStartX = t.clientX; touchStartY = t.clientY;
        hasMoved = false;
      } else {
        canvasTouchId = t.identifier;
        startCanvasTouch(t);
      }
    }
  }, { passive: false });

  // === Unified touchmove ===
  function handleCanvasMove(touch) {
    const p = toCanvasXY(touch.clientX, touch.clientY);
    game.mouseX = p.x; game.mouseY = p.y;

    const dx = Math.abs(touch.clientX - touchStartX);
    const dy = Math.abs(touch.clientY - touchStartY);
    if (dx > 8 || dy > 8) hasMoved = true;
    if (!hasMoved) return;

    const scaleY = canvas.height / canvas.getBoundingClientRect().height;
    const deltaY = (touchStartY - touch.clientY) * scaleY;
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
      if (game.mouseY > bpY - 8) {
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

  document.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) updateJoystick(t);
      else if (t.identifier === canvasTouchId) handleCanvasMove(t);
      else if (t.identifier === game.skillDrag.touchId) updateSkillDrag(t);
    }
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) resetJoystick();
      else if (t.identifier === game.skillDrag.touchId) endSkillDrag(t);
      else if (t.identifier === canvasTouchId) { canvasTouchId = null; /* keep mouseDown for processClick */ }
    }
  });

  document.addEventListener('touchcancel', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) resetJoystick();
      else if (t.identifier === game.skillDrag.touchId) cancelSkillDrag();
      else if (t.identifier === canvasTouchId) { canvasTouchId = null; game.mouseDown = false; }
    }
  });

  // === Skill drag-to-cast ===
  function updateSkillDrag(touch) {
    const wc = getWorldCoords(touch);
    game.skillDrag.worldX = wc.x;
    game.skillDrag.worldY = wc.y;
  }

  function endSkillDrag(touch) {
    if (!game.skillDrag.active) return;
    const idx = game.skillDrag.skillIdx;
    game.skillDrag.active = false;
    game.skillDrag.touchId = null;
    canvasTouchId = null;
    game.mouseDown = false;
    if (game.screen === 'playing' && !game.showBackpack && !game.showPauseMenu) {
      const wc = getWorldCoords(touch);
      game.activeSkill = idx;
      castSkill(wc.x, wc.y);
    }
    skillBtns.forEach(b => b.classList.toggle('on', parseInt(b.dataset.skill) === idx && game.screen === 'playing'));
  }

  function cancelSkillDrag() {
    game.skillDrag.active = false;
    game.skillDrag.touchId = null;
    canvasTouchId = null;
    game.mouseDown = false;
    skillBtns.forEach(b => b.classList.remove('on'));
  }

  skillBtns.forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      const idx = parseInt(btn.dataset.skill);
      const t = e.changedTouches[0];
      game.skillDrag.active = true;
      game.skillDrag.skillIdx = idx;
      game.skillDrag.touchId = t.identifier;
      const wc = getWorldCoords(t);
      game.skillDrag.worldX = wc.x;
      game.skillDrag.worldY = wc.y;
      game.activeSkill = idx;
      skillBtns.forEach(b => b.classList.toggle('on', b === btn));
    });
  });

  // === Update skill button CD text & control visibility ===
  const joystickZone2 = document.getElementById('joystickZone');
  const skillBtnsContainer = document.getElementById('skillBtns');
  const btnBackpack2 = document.getElementById('btnBackpack');
  const btnPause2 = document.getElementById('btnPause');
  const origRender = () => {
    if (!('ontouchstart' in window)) return;
    requestAnimationFrame(() => {
      // Show controls only during gameplay (not menu/prepare/victory/death)
      const playing = game.screen === 'playing' && !game.showPauseMenu;
      const playingOrPrep = playing || game.screen === 'prepare' || game.screen === 'victory';
      if (joystickZone2) joystickZone2.style.display = playing ? 'block' : 'none';
      if (skillBtnsContainer) skillBtnsContainer.style.display = playing ? 'flex' : 'none';
      if (btnBackpack2) btnBackpack2.style.display = playingOrPrep ? '' : 'none';
      if (btnPause2) btnPause2.style.display = playing ? '' : 'none';

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

  // === Mouse fallback for desktop mobile testing (FORCE_MOBILE) ===
  if (window.FORCE_MOBILE) {
    let mouseId = 'mouse';
    document.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const t = { identifier: mouseId, clientX: e.clientX, clientY: e.clientY, target: e.target, changedTouches: [{ identifier: mouseId, clientX: e.clientX, clientY: e.clientY }] };
      const target = e.target;

      if (target.closest('#joystickZone')) {
        e.preventDefault();
        if (joyTouchId !== null) return;
        joyTouchId = mouseId;
        joyCenter = getJoyCenter();
        updateJoystick(t);
        return;
      }
      if (target.closest('#skillBtns')) return;

      if (target.closest('#btnBackpack')) {
        e.preventDefault();
        if (game.screen === 'playing') {
          if (game.showPauseMenu) game.showPauseMenu = false;
          game.showBackpack = !game.showBackpack;
          if (game.showBackpack) game.bpScroll = 0;
        }
        return;
      }

      if (target.closest('#btnPause')) {
        e.preventDefault();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }

      // Only handle canvas for skill drag during gameplay; otherwise let input.js handle it
      if (game.screen === 'playing' && !game.showBackpack && !game.showPauseMenu) {
        if (canvasTouchId !== null) return;
        e.preventDefault();
        game.skillDrag.active = true;
        game.skillDrag.skillIdx = game.activeSkill;
        game.skillDrag.touchId = mouseId;
        const wc = getWorldCoords(t);
        game.skillDrag.worldX = wc.x;
        game.skillDrag.worldY = wc.y;
        canvasTouchId = mouseId;
        touchStartX = t.clientX; touchStartY = t.clientY;
        hasMoved = false;
      }
      // On non-playing screens, let normal mouse handling work (input.js handles canvas clicks)
    });

    document.addEventListener('mousemove', (e) => {
      const t = { identifier: mouseId, clientX: e.clientX, clientY: e.clientY };
      if (joyTouchId === mouseId) updateJoystick(t);
      else if (canvasTouchId === mouseId) handleCanvasMove(t);
      else if (game.skillDrag.touchId === mouseId) updateSkillDrag(t);
    });

    document.addEventListener('mouseup', (e) => {
      const t = { identifier: mouseId, clientX: e.clientX, clientY: e.clientY };
      if (joyTouchId === mouseId) resetJoystick();
      else if (game.skillDrag.touchId === mouseId) endSkillDrag(t);
      else if (canvasTouchId === mouseId) { canvasTouchId = null; game.mouseDown = false; }
    });
  }
}
