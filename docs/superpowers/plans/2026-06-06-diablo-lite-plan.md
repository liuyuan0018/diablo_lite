# Diablo Lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable 2D top-down monster-slaying game in a single `index.html` with Canvas rendering, auto-attack, 3 skills, equipment system, and 10 stages.

**Architecture:** Single-file HTML with embedded `<style>` and `<script>`. Game loop runs at 60fps via `requestAnimationFrame`. All game state in a single `game` object. Modular JS functions organized by concern (player, monsters, skills, spawner, renderer, ui). Data persisted via `localStorage`.

**Tech Stack:** HTML5 Canvas, Vanilla JavaScript, no dependencies.

---

## File Structure

```
index.html          — The entire game (HTML + CSS + JS)
```

All code in one file. JS organized in sections:
1. Constants & Config
2. Game State
3. Helper Functions (math, collision, random)
4. Player Logic
5. Monster Logic
6. Projectile Logic
7. Skill Logic
8. Spawner Logic
9. Equipment & Level Logic
10. Renderer
11. Input Handling
12. UI / HUD
13. Game Loop
14. Persistence (localStorage)

---

### Task 1: HTML Skeleton, Canvas, and Game Loop

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create HTML skeleton with full-screen Canvas**

Write the minimal `<html>` structure with a full-viewport `<canvas>`, dark background, and a basic game loop that clears and draws a frame counter.

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diablo Lite</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; cursor: crosshair; }
  canvas { display: block; }
</style>
</head>
<body>
<canvas id="game"></canvas>
<script>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const game = {
  running: false,
  time: 0,
  dt: 0,
  lastTime: 0,
  camera: { x: 0, y: 0 },
};

function loop(timestamp) {
  requestAnimationFrame(loop);
  if (!game.running) return;
  game.dt = Math.min((timestamp - game.lastTime) / 1000, 0.05);
  game.lastTime = timestamp;
  game.time += game.dt;

  update(game.dt);
  render();
}

function update(dt) {
  // placeholder
}

function render() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText('Diablo Lite — Ready', 20, 30);
}

game.running = true;
game.lastTime = performance.now();
requestAnimationFrame(loop);
</script>
</body>
</html>
```

- [ ] **Step 2: Verify**

Open `index.html` in browser. Confirm dark background with "Diablo Lite — Ready" text. Resize window to confirm canvas fills viewport.

---

### Task 2: Constants, Config, and Helper Functions

**Files:**
- Modify: `index.html` (add after Canvas setup, before game loop)

- [ ] **Step 1: Add game constants and configuration**

```javascript
// ===== CONSTANTS & CONFIG =====
const MAP_W = 3000;
const MAP_H = 3000;

const CONFIG = {
  player: {
    size: 14,
    hp: 100,
    atk: 10,
    cdr: 0,       // 0-40%
    bulletSpeed: 200,
    pickupRange: 40,
    fireRate: 2,  // per second
    detectionRange: 400,
  },
  skills: {
    teleport: { cd: 6 },
    blackhole: { cd: 12, radius: 120, duration: 2, damage: 5, pullForce: 150 },
    blizzard: { cd: 15, radius: 150, duration: 3, damage: 15, slow: 0.5 },
  },
  monsters: {
    zombie:      { hp: 40, speed: 40,  damage: 5,  exp: 10, size: 12 },
    skeleton:    { hp: 30, speed: 60,  damage: 8,  exp: 12, size: 10 },
    ghost:       { hp: 20, speed: 100, damage: 6,  exp: 15, size: 10 },
    exploder:    { hp: 15, speed: 90,  damage: 25, exp: 14, size: 10, explodeRadius: 60 },
    spearman:    { hp: 35, speed: 50,  damage: 12, exp: 13, size: 12, projectileSpeed: 150 },
    spider:      { hp: 25, speed: 65,  damage: 7,  exp: 11, size: 10, spawnCount: 3 },
    shadowMage:  { hp: 30, speed: 55,  damage: 10, exp: 16, size: 12, teleportRange: 100 },
    devourer:    { hp: 50, speed: 45,  damage: 9,  exp: 18, size: 14, poolRadius: 50, poolDuration: 4 },
    gargoyle:    { hp: 35, speed: 80,  damage: 8,  exp: 14, size: 12 },
    deathKnight: { hp: 60, speed: 70,  damage: 15, exp: 20, size: 16, chargeSpeed: 200 },
  },
  eliteAffixes: {
    fast:    { speedMult: 1.4, color: '#ff4444' },
    split:   { minions: 2,     color: '#44ff44' },
    explode: { radius: 80, dmg: 20, color: '#ff8844' },
    vampiric:{ healPct: 0.3,   color: '#ff44ff' },
    shielded:{ shieldPct: 0.3, color: '#4488ff' },
  },
  stages: [
    { name: '第一章', monsterTypes: ['zombie'], bossType: 'zombie', bossMult: 3, spawnRate: 2.0, eliteWaveInterval: 30, killsForBoss: 80 },
    { name: '第二章', monsterTypes: ['zombie','skeleton'], bossType: 'skeleton', bossMult: 3.5, spawnRate: 1.8, eliteWaveInterval: 28, killsForBoss: 100 },
    { name: '第三章', monsterTypes: ['zombie','skeleton','ghost'], bossType: 'ghost', bossMult: 3.5, spawnRate: 1.6, eliteWaveInterval: 26, killsForBoss: 120 },
    { name: '第四章', monsterTypes: ['skeleton','ghost','exploder'], bossType: 'deathKnight', bossMult: 4, spawnRate: 1.4, eliteWaveInterval: 24, killsForBoss: 140 },
    { name: '第五章', monsterTypes: ['skeleton','ghost','exploder','spearman'], bossType: 'deathKnight', bossMult: 5, spawnRate: 1.2, eliteWaveInterval: 22, killsForBoss: 160 },
    { name: '第六章', monsterTypes: ['ghost','exploder','spearman','spider'], bossType: 'spider', bossMult: 5.5, spawnRate: 1.1, eliteWaveInterval: 20, killsForBoss: 180 },
    { name: '第七章', monsterTypes: ['exploder','spearman','spider','shadowMage'], bossType: 'shadowMage', bossMult: 6, spawnRate: 1.0, eliteWaveInterval: 18, killsForBoss: 200 },
    { name: '第八章', monsterTypes: ['spearman','spider','shadowMage','devourer'], bossType: 'devourer', bossMult: 6.5, spawnRate: 0.9, eliteWaveInterval: 16, killsForBoss: 220 },
    { name: '第九章', monsterTypes: ['spider','shadowMage','devourer','gargoyle'], bossType: 'gargoyle', bossMult: 7, spawnRate: 0.8, eliteWaveInterval: 14, killsForBoss: 250 },
    { name: '第十章', monsterTypes: ['shadowMage','devourer','gargoyle','deathKnight'], bossType: 'deathKnight', bossMult: 8, spawnRate: 0.7, eliteWaveInterval: 12, killsForBoss: 300 },
  ],
};

const EQUIPMENT_NAMES = {
  weapon:  ['学徒法杖','火焰魔杖','暗影之杖','雷霆权杖','末日之杖'],
  helmet:  ['布质头巾','学者兜帽','暗影头冠','智慧王冠','虚空之冠'],
  armor:   ['麻布长袍','丝绸斗篷','暗影长袍','龙鳞法衣','永恒之袍'],
  ring:    ['铜戒','银戒','黄金戒','红宝石戒','暗影之戒'],
  amulet:  ['木质护符','月石护符','龙牙护符','凤凰护符','虚空护符'],
  boots:   ['布鞋','皮靴','旅者之靴','暗影步履','虚空行者'],
};

const EQUIPMENT_STATS = {
  weapon:  { attr: 'atk', base: 5, perQuality: 5 },
  helmet:  { attr: 'cdr', base: 2, perQuality: 2 },
  armor:   { attr: 'maxHp', base: 15, perQuality: 15 },
  ring:    { attr: 'bulletSpeed', base: 20, perQuality: 15 },
  amulet:  { attr: 'pickupRange', base: 8, perQuality: 6 },
  boots:   { attr: 'movespeed', base: 0, perQuality: 0, legendaryEffect: 'teleportTrail' },
};
```

- [ ] **Step 2: Add math and helper utilities**

```javascript
// ===== HELPERS =====
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function angle(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}
function normalize(v) {
  const m = Math.sqrt(v.x * v.x + v.y * v.y);
  return m ? { x: v.x / m, y: v.y / m } : { x: 0, y: 0 };
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return min + Math.random() * (max - min); }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function lerp(a, b, t) { return a + (b - a) * t; }
```

- [ ] **Step 3: Verify**

Reload browser. No visible change but check console for no errors. The `CONFIG` and helper functions should be defined globally.

---

### Task 3: Game State and Camera System

**Files:**
- Modify: `index.html` (replace game state and update/render)

- [ ] **Step 1: Initialize full game state**

```javascript
// ===== GAME STATE =====
const defaultPlayer = () => ({
  x: MAP_W / 2, y: MAP_H / 2,
  hp: CONFIG.player.hp, maxHp: CONFIG.player.hp,
  atk: CONFIG.player.atk,
  cdr: CONFIG.player.cdr,
  bulletSpeed: CONFIG.player.bulletSpeed,
  pickupRange: CONFIG.player.pickupRange,
  fireRate: CONFIG.player.fireRate,
  level: 1, exp: 0, expToNext: 100,
  soulCoins: 0,
  equipment: { weapon: null, helmet: null, armor: null, ring: null, amulet: null, boots: null },
  skills: [
    { name: 'teleport', cd: 0, cdMax: CONFIG.skills.teleport.cd, ready: true },
    { name: 'blackhole', cd: 0, cdMax: CONFIG.skills.blackhole.cd, ready: true },
    { name: 'blizzard', cd: 0, cdMax: CONFIG.skills.blizzard.cd, ready: true },
  ],
  activeSkillIndex: 0,
  buffs: [],
  fireTimer: 0,
});

const game = {
  running: false,
  screen: 'menu', // 'menu' | 'prepare' | 'playing' | 'victory' | 'death'
  time: 0, dt: 0, lastTime: 0,
  camera: { x: 0, y: 0 },
  player: defaultPlayer(),
  projectiles: [],
  monsters: [],
  skillEffects: [],
  particles: [],
  towers: [],
  stageIndex: 0,
  stage: null,
  enemiesKilled: 0,
  boss: null,
  bossSpawned: false,
  bossKilled: false,
  eliteWaveTimer: 0,
  spawnTimer: 0,
  stageTimer: 0,
  drops: [], // equipment drops on ground
  unlockedStages: 1,
};

function getEffectiveCDR() {
  let cdr = game.player.cdr;
  const helmet = game.player.equipment.helmet;
  if (helmet) cdr += helmet.statValue;
  return clamp(cdr, 0, 40) / 100;
}

function getEffectiveStat(stat) {
  let val = game.player[stat];
  for (const slot of Object.values(game.player.equipment)) {
    if (slot && slot.stat === stat) val += slot.statValue;
  }
  return val;
}
```

- [ ] **Step 2: Implement camera follow logic**

```javascript
function updateCamera() {
  const tx = game.player.x - W / 2;
  const ty = game.player.y - H / 2;
  game.camera.x = lerp(game.camera.x, tx, 0.1);
  game.camera.y = lerp(game.camera.y, ty, 0.1);
  game.camera.x = clamp(game.camera.x, 0, MAP_W - W);
  game.camera.y = clamp(game.camera.y, 0, MAP_H - H);
}

function worldToScreen(wx, wy) {
  return { x: wx - game.camera.x, y: wy - game.camera.y };
}

function screenToWorld(sx, sy) {
  return { x: sx + game.camera.x, y: sy + game.camera.y };
}
```

- [ ] **Step 3: Update game loop to use camera**

Replace `update()` and `render()` with:

```javascript
function update(dt) {
  if (game.screen !== 'playing') return;
  updatePlayer(dt);
  updateProjectiles(dt);
  updateMonsters(dt);
  updateSkillEffects(dt);
  updateTowers(dt);
  updateDrops(dt);
  updateSpawner(dt);
  updateParticles(dt);
  updateCamera();
}

function render() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);
  if (game.screen === 'playing') {
    renderGround();
    renderDrops();
    renderMonsters();
    renderProjectiles();
    renderSkillEffects();
    renderTowers();
    renderPlayer();
    renderParticles();
    renderHUD();
  } else {
    renderScreen();
  }
}
```

- [ ] **Step 4: Verify**

Reload. No errors in console. Canvas renders dark background.

---

### Task 4: Player Rendering and Teleport Skill

**Files:**
- Modify: `index.html` (add player logic and rendering sections)

- [ ] **Step 1: Render player as a pixel-art style character**

```javascript
// ===== RENDERER: PLAYER =====
function renderPlayer() {
  const s = worldToScreen(game.player.x, game.player.y);
  const r = CONFIG.player.size;

  // Glow aura
  const glow = ctx.createRadialGradient(s.x, s.y, r * 0.5, s.x, s.y, r * 2);
  glow.addColorStop(0, 'rgba(255,107,53,0.3)');
  glow.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r * 2, 0, Math.PI * 2);
  ctx.fill();

  // Body (robe)
  ctx.fillStyle = '#4a3060';
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.fill();

  // Inner robe
  ctx.fillStyle = '#6b4c90';
  ctx.beginPath();
  ctx.arc(s.x, s.y, r * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Head/shoulder glow (fire mage)
  ctx.fillStyle = '#ff6b35';
  ctx.beginPath();
  ctx.arc(s.x, s.y - r * 0.3, r * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(s.x - 3, s.y - r * 0.5, 2, 3);
  ctx.fillRect(s.x + 1, s.y - r * 0.5, 2, 3);

  // Staff
  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x + r * 0.5, s.y + r * 0.3);
  ctx.lineTo(s.x + r * 1.5, s.y - r * 0.8);
  ctx.stroke();

  // Staff gem
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(s.x + r * 1.5, s.y - r * 0.8, 3, 0, Math.PI * 2);
  ctx.fill();
}
```

- [ ] **Step 2: Implement input handling**

```javascript
// ===== INPUT =====
const input = { mouseX: 0, mouseY: 0, mouseDown: false };

canvas.addEventListener('mousemove', e => {
  input.mouseX = e.clientX;
  input.mouseY = e.clientY;
});
canvas.addEventListener('mousedown', e => {
  input.mouseDown = true;
});
canvas.addEventListener('mouseup', e => {
  input.mouseDown = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', e => {
  if (e.key === '1') { game.player.activeSkillIndex = 0; e.preventDefault(); }
  if (e.key === '2') { game.player.activeSkillIndex = 1; e.preventDefault(); }
  if (e.key === '3') { game.player.activeSkillIndex = 2; e.preventDefault(); }
});
```

- [ ] **Step 3: Implement teleport skill logic**

```javascript
// ===== SKILLS =====
function castSkill(skillIndex) {
  const skill = game.player.skills[skillIndex];
  if (!skill.ready) return;

  const worldPos = screenToWorld(input.mouseX, input.mouseY);
  // Clamp to map bounds
  worldPos.x = clamp(worldPos.x, 20, MAP_W - 20);
  worldPos.y = clamp(worldPos.y, 20, MAP_H - 20);

  switch (skill.name) {
    case 'teleport':
      castTeleport(worldPos);
      break;
    case 'blackhole':
      castBlackHole(worldPos);
      break;
    case 'blizzard':
      castBlizzard(worldPos);
      break;
  }
}

function castTeleport(pos) {
  const skill = game.player.skills[0];
  // Trail particle at old position
  spawnParticles(game.player.x, game.player.y, '#ff6b35', 8);
  game.player.x = pos.x;
  game.player.y = pos.y;
  // Arrival particle
  spawnParticles(pos.x, pos.y, '#ff6b35', 12);
  skill.ready = false;
  skill.cd = skill.cdMax * (1 - getEffectiveCDR());
}

function updatePlayer(dt) {
  // Update skill cooldowns
  for (const skill of game.player.skills) {
    if (!skill.ready) {
      skill.cd -= dt;
      if (skill.cd <= 0) {
        skill.cd = 0;
        skill.ready = true;
      }
    }
  }

  // Fireball auto-attack (placeholder)
  game.player.fireTimer -= dt;
  if (game.player.fireTimer <= 0) {
    game.player.fireTimer = 1 / getEffectiveStat('fireRate');
    // autoFire will be added in Task 5
  }

  // Check tower pickup
  for (let i = game.towers.length - 1; i >= 0; i--) {
    const t = game.towers[i];
    if (dist(game.player, t) < game.player.pickupRange + t.radius) {
      activateTower(t);
      game.towers.splice(i, 1);
    }
  }
}

// Click handling in game loop
function handleClick() {
  if (!input.mouseDown) return;
  input.mouseDown = false;
  if (game.screen === 'playing') {
    castSkill(game.player.activeSkillIndex);
  }
}
```

- [ ] **Step 4: Wire click into game loop**

In `update()`, add `handleClick();` as first line. Add placeholder functions for `updateProjectiles`, `updateMonsters`, `updateSkillEffects`, etc. (all empty or minimal).

- [ ] **Step 5: Verify**

Open browser, press 1/2/3 to switch skills (no visual feedback yet), click to teleport — player should jump to click position. Camera follow should be visible.

---

### Task 5: Auto-Attack (Fireball) System

**Files:**
- Modify: `index.html` (projectile system and auto-fire logic)

- [ ] **Step 1: Implement auto-targeting and fireball shooting**

```javascript
function findNearestEnemy() {
  let nearest = null;
  let minDist = CONFIG.player.detectionRange;
  for (const m of game.monsters) {
    const d = dist(game.player, m);
    if (d < minDist) {
      minDist = d;
      nearest = m;
    }
  }
  return nearest;
}

function autoFire() {
  const target = findNearestEnemy();
  if (!target) return;

  const a = angle(game.player, target);
  const speed = getEffectiveStat('bulletSpeed');
  game.projectiles.push({
    x: game.player.x, y: game.player.y,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
    damage: getEffectiveStat('atk'),
    owner: 'player',
    lifetime: 2,
    radius: 4,
    color: '#ff6600',
  });
}
```

- [ ] **Step 2: Add auto-fire call in updatePlayer**

Replace the placeholder comment in `updatePlayer` with:
```javascript
if (game.monsters.length > 0) autoFire();
```

- [ ] **Step 3: Implement projectile update**

```javascript
function updateProjectiles(dt) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const p = game.projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.lifetime -= dt;

    // Remove if out of bounds or expired
    if (p.lifetime <= 0 || p.x < 0 || p.x > MAP_W || p.y < 0 || p.y > MAP_H) {
      game.projectiles.splice(i, 1);
    }
  }
}
```

- [ ] **Step 4: Implement projectile rendering**

```javascript
function renderProjectiles() {
  for (const p of game.projectiles) {
    const s = worldToScreen(p.x, p.y);
    if (s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20) continue;

    // Fireball glow
    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, p.radius * 3);
    glow.addColorStop(0, 'rgba(255,150,30,0.8)');
    glow.addColorStop(0.5, 'rgba(255,100,20,0.4)');
    glow.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, p.radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Trail particle (spawned in update)
    spawnParticles(p.x, p.y, p.color, 1, 0.3);
  }
}
```

- [ ] **Step 5: Verify**

Place some dummy monsters in game.monsters array for testing. Fireballs should auto-target and fly toward nearest monster. Remove dummy data before proceeding.

---

### Task 6: Basic Monster, Spawner, and Combat

**Files:**
- Modify: `index.html` (monster system, spawner, collision)

- [ ] **Step 1: Monster spawning from screen edges**

```javascript
function spawnMonster(type) {
  const cfg = CONFIG.monsters[type];
  const side = randInt(0, 3);
  let x, y;
  const margin = 50;
  switch (side) {
    case 0: x = rand(-margin, MAP_W + margin); y = -margin; break;
    case 1: x = MAP_W + margin; y = rand(-margin, MAP_H + margin); break;
    case 2: x = rand(-margin, MAP_W + margin); y = MAP_H + margin; break;
    case 3: x = -margin; y = rand(-margin, MAP_H + margin); break;
  }

  game.monsters.push({
    id: Date.now() + Math.random(),
    type,
    x, y,
    hp: cfg.hp,
    maxHp: cfg.hp,
    speed: cfg.speed,
    damage: cfg.damage,
    size: cfg.size,
    exp: cfg.exp,
    affixes: [],
    debuffs: [],
    state: 'chase', // 'chase' | 'attack' | 'dead'
    stateTimer: 0,
    flashTimer: 0,
  });
}

function updateSpawner(dt) {
  if (!game.stage) return;

  game.stageTimer += dt;
  game.spawnTimer -= dt;
  game.eliteWaveTimer -= dt;

  if (game.spawnTimer <= 0) {
    const rate = game.stage.spawnRate * (1 + game.stageTimer / 120); // increase over time
    game.spawnTimer = Math.max(0.3, rate);
    const type = randChoice(game.stage.monsterTypes);
    spawnMonster(type);
  }

  // Elite wave
  if (game.eliteWaveTimer <= 0) {
    game.eliteWaveTimer = game.stage.eliteWaveInterval;
    for (let i = 0; i < randInt(3, 5); i++) {
      const m = spawnMonster(randChoice(game.stage.monsterTypes));
      // Add elite affix to last spawned
      const last = game.monsters[game.monsters.length - 1];
      last.affixes.push(randChoice(Object.keys(CONFIG.eliteAffixes)));
      last.hp *= 2;
      last.maxHp = last.hp;
      last.size += 4;
    }
  }

  // Boss trigger
  if (!game.bossSpawned && game.enemiesKilled >= game.stage.killsForBoss) {
    spawnBoss();
  }
}

function spawnBoss() {
  game.bossSpawned = true;
  const cfg = CONFIG.monsters[game.stage.bossType];
  game.boss = {
    id: 'boss',
    type: game.stage.bossType,
    x: game.player.x + rand(-200, 200),
    y: game.player.y + rand(-200, 200),
    hp: cfg.hp * game.stage.bossMult * 10,
    maxHp: cfg.hp * game.stage.bossMult * 10,
    speed: cfg.speed * 0.7,
    damage: cfg.damage * 2,
    size: cfg.size * 3,
    exp: cfg.exp * 50,
    affixes: [],
    debuffs: [],
    state: 'chase',
    stateTimer: 0,
    phase: 1,
    phaseThreshold: 0.5,
    flashTimer: 0,
  };
  game.monsters.push(game.boss);
}
```

- [ ] **Step 2: Monster AI — chase and attack**

```javascript
function updateMonsters(dt) {
  for (let i = game.monsters.length - 1; i >= 0; i--) {
    const m = game.monsters[i];
    if (m.hp <= 0) {
      killMonster(m, i);
      continue;
    }

    // Debuff processing
    let speedMult = 1;
    for (let j = m.debuffs.length - 1; j >= 0; j--) {
      m.debuffs[j].duration -= dt;
      if (m.debuffs[j].type === 'slow') speedMult = Math.min(speedMult, m.debuffs[j].value);
      if (m.debuffs[j].duration <= 0) m.debuffs.splice(j, 1);
    }

    // Flash timer for damage feedback
    if (m.flashTimer > 0) m.flashTimer -= dt;

    // AI: chase player
    const d = dist(m, game.player);
    if (d < m.size + CONFIG.player.size + 5) {
      // Melee contact damage
      game.player.hp -= m.damage * dt;
      spawnParticles(game.player.x, game.player.y, '#ff0000', 3, 0.2);
    }

    // Move toward player
    const a = angle(m, game.player);
    let spd = m.speed * speedMult;
    if (m.affixes.includes('fast')) spd *= CONFIG.eliteAffixes.fast.speedMult;
    m.x += Math.cos(a) * spd * dt;
    m.y += Math.sin(a) * spd * dt;

    // Specific monster behaviors
    updateMonsterBehavior(m, dt);
  }
}

function updateMonsterBehavior(m, dt) {
  switch (m.type) {
    case 'exploder':
      if (dist(m, game.player) < m.size * 4) {
        explodeMonster(m);
      }
      break;
    case 'spearman':
      m.stateTimer -= dt;
      if (m.stateTimer <= 0) {
        m.stateTimer = rand(1.5, 3);
        // Shoot projectile at player
        const a = angle(m, game.player);
        game.projectiles.push({
          x: m.x, y: m.y,
          vx: Math.cos(a) * 150,
          vy: Math.sin(a) * 150,
          damage: m.damage,
          owner: 'monster',
          lifetime: 3,
          radius: 3,
          color: '#88ff88',
        });
      }
      break;
    case 'gargoyle':
      // Orbit at distance then dive
      if (m.state === 'orbit') {
        m.orbitAngle += dt * 2;
        m.x = game.player.x + Math.cos(m.orbitAngle) * 200;
        m.y = game.player.y + Math.sin(m.orbitAngle) * 200;
        m.stateTimer -= dt;
        if (m.stateTimer <= 0) { m.state = 'chase'; m.speed *= 1.5; }
      } else if (dist(m, game.player) < 150 && m.state === 'chase') {
        m.state = 'orbit';
        m.orbitAngle = angle(game.player, m);
        m.stateTimer = 3;
      }
      break;
    case 'deathKnight':
      m.stateTimer -= dt;
      if (m.stateTimer <= 0) {
        m.stateTimer = rand(3, 5);
        m.state = 'charging';
        m.chargeAngle = angle(m, game.player);
        m.chargeTimer = 1.5;
      }
      if (m.state === 'charging') {
        m.x += Math.cos(m.chargeAngle) * m.speed * 3 * dt;
        m.y += Math.sin(m.chargeAngle) * m.speed * 3 * dt;
        m.chargeTimer -= dt;
        if (m.chargeTimer <= 0) m.state = 'chase';
      }
      break;
    case 'spider':
      if (m.hp <= 0 && !m.spawnedChildren) {
        m.spawnedChildren = true;
        for (let s = 0; s < 3; s++) {
          game.monsters.push({
            id: Date.now() + Math.random(),
            type: 'spider', x: m.x + rand(-20, 20), y: m.y + rand(-20, 20),
            hp: 8, maxHp: 8, speed: 80, damage: 3, size: 6, exp: 3,
            affixes: [], debuffs: [], state: 'chase', stateTimer: 0, flashTimer: 0,
            isMini: true,
          });
        }
      }
      break;
  }
}

function explodeMonster(m) {
  // AOE damage around monster
  if (dist(game.player, m) < m.size * 5) {
    game.player.hp -= 25;
  }
  spawnParticles(m.x, m.y, '#ff4444', 20, 0.5);
  m.hp = 0; // mark for removal
}

function killMonster(m, index) {
  game.enemiesKilled++;
  game.player.exp += m.exp;
  spawnParticles(m.x, m.y, '#ffffff', 8, 0.3);

  // Drop check
  const dropChance = m.isBoss ? 1 : 0.15;
  if (Math.random() < dropChance) {
    spawnDrop(m.x, m.y, m.isBoss);
  }

  // Check level up
  checkLevelUp();

  game.monsters.splice(index, 1);
  if (m === game.boss) {
    game.boss = null;
    game.bossKilled = true;
    game.screen = 'victory';
    generateVictoryDrops();
  }
}
```

- [ ] **Step 3: Collision detection between projectiles and monsters**

Add inside `updateProjectiles()`, after position update:

```javascript
if (p.owner === 'player') {
  for (const m of game.monsters) {
    if (dist(p, m) < p.radius + m.size) {
      m.hp -= p.damage;
      m.flashTimer = 0.1;
      spawnParticles(p.x, p.y, '#ffaa00', 4, 0.2);
      game.projectiles.splice(i, 1);
      break;
    }
  }
}
```

- [ ] **Step 4: Monster rendering**

```javascript
function renderMonsters() {
  for (const m of game.monsters) {
    const s = worldToScreen(m.x, m.y);
    if (s.x < -50 || s.x > W + 50 || s.y < -50 || s.y > H + 50) continue;

    // Flash on damage
    const baseColor = m.isBoss ? '#cc0000' : getMonsterColor(m);
    const color = m.flashTimer > 0 ? '#ffffff' : baseColor;

    // Elite glow
    if (m.affixes.length > 0) {
      const affix = CONFIG.eliteAffixes[m.affixes[0]];
      ctx.strokeStyle = affix ? affix.color : '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, m.size + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    // Different shapes per type
    switch (m.type) {
      case 'ghost':
        ctx.arc(s.x, s.y, m.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.arc(s.x, s.y, m.size * 0.6, 0, Math.PI * 2);
        break;
      case 'exploder':
        ctx.arc(s.x, s.y, m.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.arc(s.x, s.y, m.size * 0.5, 0, Math.PI * 2);
        break;
      default:
        ctx.arc(s.x, s.y, m.size, 0, Math.PI * 2);
    }
    ctx.fill();

    // HP bar for elites and bosses
    if (m.isBoss || m.affixes.length > 0) {
      renderMonsterHPBar(s.x, s.y - m.size - 8, m.hp / m.maxHp, m.size * 2);
    }
  }
}

function getMonsterColor(m) {
  const colors = {
    zombie: '#556b2f', skeleton: '#d4c5a9', ghost: '#aaccff',
    exploder: '#ff6633', spearman: '#8b7355', spider: '#4a6741',
    shadowMage: '#6a3d8a', devourer: '#3d1c02', gargoyle: '#708090',
    deathKnight: '#2d2d2d',
  };
  return colors[m.type] || '#888888';
}
```

- [ ] **Step 5: Verify**

Start a game, monsters spawn from edges. Fireballs auto-target and kill. Player takes damage on contact. Elite waves trigger periodically.

---

### Task 7: Complete Skill System (Black Hole + Blizzard + Input Polish)

**Files:**
- Modify: `index.html` (skill casting, effects, rendering)

- [ ] **Step 1: Black Hole skill**

```javascript
function castBlackHole(pos) {
  const skill = game.player.skills[1];
  const cfg = CONFIG.skills.blackhole;
  game.skillEffects.push({
    x: pos.x, y: pos.y,
    radius: cfg.radius,
    duration: cfg.duration,
    maxDuration: cfg.duration,
    damage: cfg.damage * (1 + getEffectiveStat('atk') / 20),
    pullForce: cfg.pullForce,
    type: 'blackhole',
  });
  skill.ready = false;
  skill.cd = skill.cdMax * (1 - getEffectiveCDR());
  spawnParticles(pos.x, pos.y, '#9b59b6', 15, 0.5);
}

function castBlizzard(pos) {
  const skill = game.player.skills[2];
  const cfg = CONFIG.skills.blizzard;
  game.skillEffects.push({
    x: pos.x, y: pos.y,
    radius: cfg.radius,
    duration: cfg.duration,
    maxDuration: cfg.duration,
    damage: cfg.damage * (1 + getEffectiveStat('atk') / 15),
    slow: cfg.slow,
    type: 'blizzard',
    tickTimer: 0,
    tickInterval: 0.5,
  });
  skill.ready = false;
  skill.cd = skill.cdMax * (1 - getEffectiveCDR());
}
```

- [ ] **Step 2: Skill effect updates**

```javascript
function updateSkillEffects(dt) {
  for (let i = game.skillEffects.length - 1; i >= 0; i--) {
    const e = game.skillEffects[i];
    e.duration -= dt;

    if (e.type === 'blackhole') {
      // Pull monsters toward center
      for (const m of game.monsters) {
        if (dist(e, m) < e.radius) {
          const a = angle(m, e);
          const force = e.pullForce * (1 - dist(e, m) / e.radius);
          m.x += Math.cos(a) * force * dt;
          m.y += Math.sin(a) * force * dt;
          // Damage
          m.hp -= e.damage * dt;
          m.flashTimer = 0.05;
        }
      }
      // Pull particles visual
      spawnParticles(e.x + rand(-20, 20), e.y + rand(-20, 20), '#9b59b6', 2, 0.4);
    }

    if (e.type === 'blizzard') {
      e.tickTimer -= dt;
      if (e.tickTimer <= 0) {
        e.tickTimer = e.tickInterval;
        for (const m of game.monsters) {
          if (dist(e, m) < e.radius) {
            m.hp -= e.damage;
            m.flashTimer = 0.1;
            // Apply slow debuff
            const existing = m.debuffs.find(d => d.type === 'slow');
            if (existing) {
              existing.duration = Math.max(existing.duration, 1);
              existing.value = Math.min(existing.value, e.slow);
            } else {
              m.debuffs.push({ type: 'slow', value: e.slow, duration: 1 });
            }
          }
        }
      }
      // Blizzard particles
      for (let p = 0; p < 3; p++) {
        const px = e.x + rand(-e.radius, e.radius);
        const py = e.y + rand(-e.radius, e.radius);
        spawnParticles(px, py, '#aaddff', 1, 0.8);
      }
    }

    if (e.duration <= 0) {
      game.skillEffects.splice(i, 1);
    }
  }
}
```

- [ ] **Step 3: Skill effect rendering**

```javascript
function renderSkillEffects() {
  for (const e of game.skillEffects) {
    const s = worldToScreen(e.x, e.y);
    const progress = 1 - e.duration / e.maxDuration;

    if (e.type === 'blackhole') {
      // Outer ring
      const ringRadius = e.radius * (0.8 + Math.sin(game.time * 8) * 0.1);
      ctx.strokeStyle = 'rgba(155, 89, 182, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner dark core
      const core = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, e.radius);
      core.addColorStop(0, 'rgba(30, 0, 50, 0.8)');
      core.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(s.x, s.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (e.type === 'blizzard') {
      // Frosty area
      ctx.fillStyle = 'rgba(100, 180, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(150, 210, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(s.x, s.y, e.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
```

- [ ] **Step 4: Verify**

Switch skills with 1/2/3, click to cast. Black hole pulls monsters. Blizzard slows and damages in area. Teleport works as before.

---

### Task 8: Particle System

**Files:**
- Modify: `index.html` (particle logic and rendering)

- [ ] **Step 1: Particle spawn and update**

```javascript
function spawnParticles(x, y, color, count, lifetime = 0.5) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 150);
    game.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: lifetime,
      maxLife: lifetime,
      color,
      size: rand(1, 4),
    });
  }
}

function updateParticles(dt) {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
}

function renderParticles() {
  for (const p of game.particles) {
    const s = worldToScreen(p.x, p.y);
    if (s.x < -10 || s.x > W + 10 || s.y < -10 || s.y > H + 10) continue;

    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(s.x - p.size / 2, s.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}
```

- [ ] **Step 2: Verify**

All actions (teleport, fireball hits, monster kills, skill effects) produce particles.

---

### Task 9: HUD Rendering

**Files:**
- Modify: `index.html` (HUD rendering section)

- [ ] **Step 1: Render complete HUD**

```javascript
function renderHUD() {
  const p = game.player;
  const cdr = getEffectiveCDR();

  // ===== TOP BAR =====
  const barHeight = 44;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, W, barHeight);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, barHeight);
  ctx.lineTo(W, barHeight);
  ctx.stroke();

  // HP
  const hpX = 16, hpY = 10, hpW = 200, hpH = 10;
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`HP`, hpX, hpY + 20);
  ctx.fillText(`${Math.ceil(p.hp)}/${p.maxHp}`, hpX + 25, hpY + 20);
  ctx.fillStyle = '#333';
  ctx.fillRect(hpX, hpY + 26, hpW, hpH);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(hpX, hpY + 26, hpW * (p.hp / p.maxHp), hpH);

  // Level + Soul Coins
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`Lv.${p.level}`, W / 2 - 30, hpY + 22);
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.fillText(`灵魂币: ${p.soulCoins.toLocaleString()}`, W - 170, hpY + 22);

  // Timer top-left
  const mins = Math.floor(game.stageTimer / 60);
  const secs = Math.floor(game.stageTimer % 60);
  ctx.fillStyle = '#aaa';
  ctx.font = '12px monospace';
  ctx.fillText(`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`, 16, 12);

  // Kill count top-right
  ctx.fillText(`击杀: ${game.enemiesKilled}`, W - 80, 12);
  if (game.stage) {
    ctx.fillText(`Boss: ${game.enemiesKilled}/${game.stage.killsForBoss}`, W - 100, 28);
  }

  // ===== BOTTOM SKILL BAR =====
  const iconSize = 56;
  const gap = 12;
  const totalW = iconSize * 3 + gap * 2;
  const barY = H - iconSize - 20;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.roundRect(W / 2 - totalW / 2 - 12, barY - 8, totalW + 24, iconSize + 16, 12);
  ctx.fill();

  const skillNames = ['传送', '黑洞', '暴风雪'];
  const skillIcons = ['⚡', '◉', '❄'];
  const skillColors = ['#ff6b35', '#9b59b6', '#88ccff'];

  for (let i = 0; i < 3; i++) {
    const sx = W / 2 - totalW / 2 + i * (iconSize + gap);
    const skill = p.skills[i];
    const isActive = i === p.activeSkillIndex;

    // BG
    ctx.fillStyle = isActive ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.5)';
    ctx.strokeStyle = isActive ? '#ffffff' : '#555';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(sx, barY, iconSize, iconSize, 8);
    ctx.fill();
    ctx.stroke();

    // Icon
    ctx.font = '22px monospace';
    ctx.fillStyle = skill.ready ? skillColors[i] : '#888';
    ctx.textAlign = 'center';
    ctx.fillText(skillIcons[i], sx + iconSize / 2, barY + 26);

    // Name
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ccc';
    ctx.fillText(skillNames[i], sx + iconSize / 2, barY + 40);

    // CD overlay
    if (!skill.ready) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(sx, barY, iconSize, iconSize, 8);
      ctx.fill();
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(Math.ceil(skill.cd) + 's', sx + iconSize / 2, barY + iconSize / 2 + 6);
    }

    // Key bind
    ctx.font = '11px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText(i + 1, sx + iconSize / 2, barY - 4);
    ctx.textAlign = 'start';
  }
}
```

- [ ] **Step 2: Verify**

HUD shows top HP bar, level, soul coins, timer, kill count, and bottom skill bar with active skill highlight and CD overlays.

---

### Task 10: Equipment and Level System

**Files:**
- Modify: `index.html` (equipment generation, level-up, drops)

- [ ] **Step 1: Equipment generation**

```javascript
const QUALITIES = ['common','magic','rare','legendary'];
const QUALITY_COLORS = { common: '#aaa', magic: '#4488ff', rare: '#ffd700', legendary: '#ff6600' };
const QUALITY_LABELS = { common: '普通', magic: '魔法', rare: '稀有', legendary: '传奇' };

function generateEquipment(slot, minQuality) {
  const qualityIdx = Math.max(
    QUALITIES.indexOf(minQuality || 'common'),
    randInt(0, QUALITIES.length - 1)
  );
  const quality = QUALITIES[qualityIdx];
  const cfg = EQUIPMENT_STATS[slot];
  const nameList = EQUIPMENT_NAMES[slot];
  const statValue = cfg.base + cfg.perQuality * qualityIdx;

  const item = {
    slot,
    name: nameList[Math.min(qualityIdx, nameList.length - 1)],
    quality,
    qualityIdx,
    stat: cfg.attr,
    statValue,
  };

  // Legendary special effect
  if (quality === 'legendary' && cfg.legendaryEffect) {
    item.effect = cfg.legendaryEffect;
  }

  return item;
}

function applyEquipment() {
  // Recalculate player stats from base + equipment
  game.player.maxHp = CONFIG.player.hp + game.player.level * 5;
  // Equipment stats are computed via getEffectiveStat() at use time
}

function checkLevelUp() {
  const p = game.player;
  while (p.exp >= p.expToNext && p.level < 70) {
    p.exp -= p.expToNext;
    p.level++;
    p.expToNext = Math.floor(p.expToNext * 1.3);
    p.atk = CONFIG.player.atk + p.level * 2;
    p.maxHp = CONFIG.player.hp + p.level * 5;
    spawnParticles(p.x, p.y, '#ffd700', 20, 0.8);
  }
}
```

- [ ] **Step 2: Drop system**

```javascript
function spawnDrop(x, y, isBoss) {
  const minQ = isBoss ? 'rare' : undefined;
  const slot = randChoice(['weapon','helmet','armor','ring','amulet','boots']);
  const item = generateEquipment(slot, minQ);
  game.drops.push({ x, y, item, bobOffset: 0 });
}

function generateVictoryDrops() {
  for (let i = 0; i < 3; i++) {
    const slot = randChoice(['weapon','helmet','armor','ring','amulet','boots']);
    game.drops.push({
      x: game.boss?.x || game.player.x + rand(-100, 100),
      y: game.boss?.y || game.player.y + rand(-100, 100),
      item: generateEquipment(slot, 'rare'),
      bobOffset: 0,
    });
  }
}

function updateDrops(dt) {
  for (const d of game.drops) {
    d.bobOffset = Math.sin(game.time * 3) * 3;
    // Auto-pickup if player nearby
    if (dist(game.player, d) < game.player.pickupRange + 30) {
      pickUpItem(d);
      d.pickedUp = true;
    }
  }
  game.drops = game.drops.filter(d => !d.pickedUp);
}

function pickUpItem(drop) {
  const item = drop.item;
  const existing = game.player.equipment[item.slot];
  // Simple comparison: always replace if higher quality or same quality but better stats
  if (!existing || item.qualityIdx > existing.qualityIdx ||
      (item.qualityIdx === existing.qualityIdx && item.statValue > existing.statValue)) {
    game.player.equipment[item.slot] = item;
  }
}

function renderDrops() {
  for (const d of game.drops) {
    const s = worldToScreen(d.x, d.y + d.bobOffset);
    if (s.x < 0 || s.x > W || s.y < 0 || s.y > H) continue;

    const color = QUALITY_COLORS[d.item.quality];
    // Glow pillar
    const alpha = 0.3 + Math.sin(game.time * 3) * 0.1;
    ctx.fillStyle = color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
    if (color.startsWith('#')) {
      ctx.fillStyle = color + '40';
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Item icon (small rectangle)
    ctx.fillStyle = color;
    ctx.fillRect(s.x - 6, s.y - 6, 12, 12);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x - 6, s.y - 6, 12, 12);

    // Name
    ctx.font = '9px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(d.item.name, s.x, s.y - 14);
    ctx.textAlign = 'start';
  }
}
```

- [ ] **Step 3: Verify**

Kill monsters, see colored loot drops on ground. Walk near to auto-pickup. Equipment shows in prepare screen (built later). Level-up on enough EXP.

---

### Task 11: Tower System (In-Run Buffs)

**Files:**
- Modify: `index.html` (tower spawning, activation, rendering)

- [ ] **Step 1: Tower spawning and activation**

```javascript
function spawnTower() {
  const type = randChoice(['cdReset', 'lightning']);
  const x = game.player.x + rand(-400, 400);
  const y = game.player.y + rand(-400, 400);
  game.towers.push({
    x: clamp(x, 50, MAP_W - 50),
    y: clamp(y, 50, MAP_H - 50),
    type,
    radius: 20,
    duration: type === 'lightning' ? 10 : 0,
    timer: 0,
    tickTimer: 0,
  });
}

function activateTower(tower) {
  switch (tower.type) {
    case 'cdReset':
      for (const skill of game.player.skills) {
        skill.cd = 0;
        skill.ready = true;
      }
      spawnParticles(tower.x, tower.y, '#00ff88', 20, 0.6);
      break;
    case 'lightning':
      game.player.buffs.push({ type: 'lightning', duration: 10, damage: 30, tickTimer: 0.3, tickInterval: 0.3 });
      spawnParticles(tower.x, tower.y, '#ffff00', 20, 0.6);
      break;
  }
}

function updateTowers(dt) {
  // Random tower spawn every 45-90 seconds
  if (game.screen === 'playing' && !game._nextTowerTime) {
    game._nextTowerTime = game.time + rand(45, 90);
  }
  if (game.screen === 'playing' && game.time >= game._nextTowerTime) {
    spawnTower();
    game._nextTowerTime = game.time + rand(45, 90);
  }

  // Update player buffs
  for (let i = game.player.buffs.length - 1; i >= 0; i--) {
    const b = game.player.buffs[i];
    b.duration -= dt;
    if (b.type === 'lightning') {
      b.tickTimer -= dt;
      if (b.tickTimer <= 0) {
        b.tickTimer = b.tickInterval;
        // Damage nearest enemy
        for (const m of game.monsters) {
          if (dist(game.player, m) < 150) {
            m.hp -= b.damage;
            m.flashTimer = 0.1;
            spawnParticles(m.x, m.y, '#ffff00', 5, 0.3);
          }
        }
      }
    }
    if (b.duration <= 0) game.player.buffs.splice(i, 1);
  }
}

function renderTowers() {
  for (const t of game.towers) {
    const s = worldToScreen(t.x, t.y);
    if (s.x < 0 || s.x > W || s.y < 0 || s.y > H) continue;

    const bob = Math.sin(game.time * 4) * 4;
    // Glow
    const color = t.type === 'cdReset' ? '#00ff88' : '#ffff00';
    ctx.fillStyle = color + '30';
    ctx.beginPath();
    ctx.arc(s.x, s.y + bob, t.radius + 8, 0, Math.PI * 2);
    ctx.fill();

    // Tower body
    ctx.fillStyle = color;
    ctx.fillRect(s.x - 8, s.y + bob - 12, 16, 20);
    ctx.fillStyle = '#fff';
    ctx.fillRect(s.x - 4, s.y + bob - 8, 8, 12);

    // Icon
    ctx.fillStyle = '#000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t.type === 'cdReset' ? 'CD' : '⚡', s.x, s.y + bob + 4);
    ctx.textAlign = 'start';
  }
}
```

- [ ] **Step 2: Verify**

Towers spawn every ~60 seconds. Walk over CD reset tower to instantly refresh skills. Lightning tower zaps nearby enemies.

---

### Task 12: Game Flow — Menu, Prepare, Play, Victory, Death

**Files:**
- Modify: `index.html` (screen management, menu/prepare UI)

- [ ] **Step 1: Screen state management and menu rendering**

```javascript
function startStage(index) {
  game.stageIndex = index;
  game.stage = CONFIG.stages[index];
  game.player.x = MAP_W / 2;
  game.player.y = MAP_H / 2;
  game.player.hp = game.player.maxHp;
  game.projectiles = [];
  game.monsters = [];
  game.skillEffects = [];
  game.particles = [];
  game.towers = [];
  game.drops = [];
  game.enemiesKilled = 0;
  game.boss = null;
  game.bossSpawned = false;
  game.bossKilled = false;
  game.eliteWaveTimer = game.stage.eliteWaveInterval;
  game.spawnTimer = 0;
  game.stageTimer = 0;
  game._nextTowerTime = game.time + rand(45, 90);
  game.screen = 'playing';
}

function die() {
  game.screen = 'death';
}

function renderScreen() {
  const cx = W / 2, cy = H / 2;

  ctx.fillStyle = '#0a0a15';
  ctx.fillRect(0, 0, W, H);

  // Decorative particles
  ctx.fillStyle = 'rgba(255,100,50,0.02)';
  for (let i = 0; i < 20; i++) {
    const x = (Math.sin(game.time + i) * 0.5 + 0.5) * W;
    const y = (Math.cos(game.time * 0.7 + i) * 0.5 + 0.5) * H;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';

  if (game.screen === 'menu') {
    ctx.fillStyle = '#ff6b35';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('DIABLO LITE', cx, cy - 120);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText('轻量版暗黑风刷怪游戏', cx, cy - 80);

    // Start button
    drawButton(cx - 100, cy, 200, 50, '开始游戏', '#ff6b35', () => {
      game.screen = 'prepare';
    });

    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.fillText('v1.0 — Click to play', cx, cy + 80);
  }

  if (game.screen === 'prepare') {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('准备战斗', cx, cy - 180);

    // Stats panel
    const p = game.player;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - 200, cy - 140, 400, 280);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(cx - 200, cy - 140, 400, 280);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    const stats = [
      `等级: ${p.level}  |  灵魂币: ${p.soulCoins}`,
      `攻击力: ${getEffectiveStat('atk')}  |  HP: ${p.maxHp}`,
      `冷却缩减: ${Math.round(getEffectiveCDR() * 100)}%  |  火球速度: ${getEffectiveStat('bulletSpeed')}`,
      `拾取范围: ${getEffectiveStat('pickupRange')}`,
    ];
    stats.forEach((s, i) => ctx.fillText(s, cx - 180, cy - 120 + i * 24));

    // Equipment display
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('装备', cx - 180, cy - 20);
    const slots = ['weapon','helmet','armor','ring','amulet','boots'];
    const slotNames = ['武器','头盔','护甲','戒指','项链','鞋子'];
    slots.forEach((s, i) => {
      const eq = p.equipment[s];
      const row = Math.floor(i / 3);
      const col = i % 3;
      const ex = cx - 170 + col * 140;
      const ey = cy + row * 36;
      ctx.fillStyle = eq ? QUALITY_COLORS[eq.quality] : '#555';
      ctx.font = '11px monospace';
      ctx.fillText(`${slotNames[i]}: ${eq ? eq.name : '空'}`, ex, ey);
    });
    ctx.textAlign = 'center';

    // Stage select
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('选择关卡', cx, cy + 110);
    for (let i = 0; i < 10; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const sx = cx - 250 + col * 100;
      const sy = cy + 130 + row * 36;
      const unlocked = i < game.unlockedStages;
      const stageName = CONFIG.stages[i].name;
      drawButton(sx, sy, 90, 30, stageName, unlocked ? '#4488ff' : '#333', () => {
        if (unlocked) startStage(i);
      });
    }
  }

  if (game.screen === 'victory') {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('胜利！', cx, cy - 60);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText(`击杀: ${game.enemiesKilled}  |  用时: ${Math.floor(game.stageTimer)}s`, cx, cy - 20);

    if (game.stageIndex + 1 > game.unlockedStages - 1) {
      game.unlockedStages = Math.min(game.stageIndex + 2, 10);
      ctx.fillStyle = '#ff6b35';
      ctx.fillText(`解锁新关卡: ${CONFIG.stages[game.stageIndex + 1]?.name || '最终'}`, cx, cy + 10);
      saveGame();
    }

    drawButton(cx - 100, cy + 40, 200, 50, '返回准备', '#ff6b35', () => {
      game.screen = 'prepare';
      saveGame();
    });
  }

  if (game.screen === 'death') {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('你死了', cx, cy - 40);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText(`击杀: ${game.enemiesKilled}  |  等级: ${game.player.level}`, cx, cy);

    drawButton(cx - 100, cy + 40, 200, 50, '返回准备', '#e74c3c', () => {
      game.screen = 'prepare';
      saveGame();
    });
  }

  ctx.textAlign = 'start';
}

function drawButton(x, y, w, h, text, color, onClick) {
  const hover = input.mouseX >= x && input.mouseX <= x + w && input.mouseY >= y && input.mouseY <= y + h;
  ctx.fillStyle = hover ? color : '#222';
  ctx.strokeStyle = hover ? '#fff' : color;
  ctx.lineWidth = hover ? 2 : 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hover ? '#000' : color;
  ctx.font = '14px monospace';
  ctx.fillText(text, x + w / 2 - ctx.measureText(text).width / 2, y + h / 2 + 5);

  // Store button bounds for click detection
  if (!game._buttons) game._buttons = [];
  game._buttons.push({ x, y, w, h, onClick });
}
```

- [ ] **Step 2: Button click handling**

In `update()`, add screen click handling:

```javascript
function handleScreenClick() {
  if (!input.mouseDown) return;
  input.mouseDown = false;

  if (game.screen !== 'playing') {
    // Check buttons
    for (const btn of (game._buttons || [])) {
      if (input.mouseX >= btn.x && input.mouseX <= btn.x + btn.w &&
          input.mouseY >= btn.y && input.mouseY <= btn.y + btn.h) {
        btn.onClick();
        break;
      }
    }
    game._buttons = [];
  } else {
    castSkill(game.player.activeSkillIndex);
  }
}
```

Replace `handleClick()` with `handleScreenClick()` call at start of `update()`. Clear `game._buttons = []` before calling `renderScreen()`.

Add death check in `update()`:
```javascript
if (game.screen === 'playing' && game.player.hp <= 0) {
  die();
}
```

- [ ] **Step 3: Update game loop to handle all screens**

In `update()`, remove the `if (game.screen !== 'playing') return;` guard and instead handle each screen:

```javascript
function update(dt) {
  handleScreenClick();
  if (game.screen === 'playing') {
    updatePlayer(dt);
    updateProjectiles(dt);
    updateMonsters(dt);
    updateSkillEffects(dt);
    updateTowers(dt);
    updateDrops(dt);
    updateSpawner(dt);
    updateParticles(dt);
    updateCamera();
    if (game.player.hp <= 0) die();
  } else {
    updateParticles(dt);
  }
}
```

- [ ] **Step 4: Verify**

Full game flow: Menu → Prepare (see stats/equipment, pick stage) → Play → Victory/Death → back to Prepare.

---

### Task 13: localStorage Persistence

**Files:**
- Modify: `index.html` (save/load functions)

- [ ] **Step 1: Save and load game**

```javascript
const SAVE_KEY = 'diablo_lite_save';

function saveGame() {
  const data = {
    level: game.player.level,
    exp: game.player.exp,
    expToNext: game.player.expToNext,
    soulCoins: game.player.soulCoins,
    equipment: game.player.equipment,
    unlockedStages: game.unlockedStages,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    game.player.level = data.level || 1;
    game.player.exp = data.exp || 0;
    game.player.expToNext = data.expToNext || 100;
    game.player.soulCoins = data.soulCoins || 0;
    game.player.equipment = data.equipment || { weapon: null, helmet: null, armor: null, ring: null, amulet: null, boots: null };
    game.unlockedStages = data.unlockedStages || 1;
    // Recalculate stats
    checkLevelUp();
    applyEquipment();
  } catch (e) {
    console.warn('Save load failed:', e);
  }
}

// Call loadGame() after game object initialization
loadGame();
```

- [ ] **Step 2: Auto-save after key events**

Add `saveGame();` calls after: level up, boss kill, equipment pickup, game over.

- [ ] **Step 3: Verify**

Play a stage, level up, get equipment. Refresh browser. Stats and equipment persist.

---

### Task 14: Ground Rendering and Visual Polish

**Files:**
- Modify: `index.html` (ground tiles, atmospheric effects)

- [ ] **Step 1: Render ground with tile pattern**

```javascript
function renderGround() {
  const tileSize = 64;
  const startX = Math.floor(game.camera.x / tileSize) * tileSize;
  const startY = Math.floor(game.camera.y / tileSize) * tileSize;

  for (let x = startX; x < game.camera.x + W + tileSize; x += tileSize) {
    for (let y = startY; y < game.camera.y + H + tileSize; y += tileSize) {
      const sx = x - game.camera.x;
      const sy = y - game.camera.y;
      const pattern = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2;
      ctx.fillStyle = pattern ? '#1a1a28' : '#1e1e30';
      ctx.fillRect(sx, sy, tileSize, tileSize);

      // Grid lines (subtle)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeRect(sx, sy, tileSize, tileSize);
    }
  }

  // Map border
  const b = worldToScreen(0, 0);
  const bw = MAP_W, bh = MAP_H;
  ctx.strokeStyle = 'rgba(255,100,50,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, bw, bh);
}
```

- [ ] **Step 2: Add vignette and ambient effects**

```javascript
function renderPostFX() {
  // Vignette
  const gradient = ctx.createRadialGradient(W / 2, H / 2, W * 0.4, W / 2, H / 2, W * 0.8);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}
```

Call `renderPostFX()` at the end of `render()`, after HUD.

- [ ] **Step 3: Verify**

Ground tiles visible, dark vignette at screen edges. Map boundary visible.

---

### Task 15: Final Polish — Player HP Regen, Balance Tuning, Exp Bar

**Files:**
- Modify: `index.html` (balance tweaks, QOL features)

- [ ] **Step 1: Add HP regen and exp bar**

In `updatePlayer()`:
```javascript
// HP regen: 1% maxHp per second when no monsters nearby
const nearby = game.monsters.some(m => dist(game.player, m) < 250);
if (!nearby) {
  game.player.hp += game.player.maxHp * 0.01 * dt;
  game.player.hp = Math.min(game.player.hp, game.player.maxHp);
}
```

In `renderHUD()`, add exp bar below HP:
```javascript
// EXP bar
ctx.fillStyle = '#333';
ctx.fillRect(hpX, hpY + 40, hpW, 6);
ctx.fillStyle = '#9933ff';
ctx.fillRect(hpX, hpY + 40, hpW * (game.player.exp / game.player.expToNext), 6);
ctx.fillStyle = '#aaa';
ctx.font = '10px monospace';
ctx.fillText(`EXP ${game.player.exp}/${game.player.expToNext}`, hpX + hpW + 8, hpY + 46);
```

- [ ] **Step 2: Verify**

Full game working: menu → prepare → play stages → kill monsters → use skills → pick up loot → level up → kill boss → save progress.

---

## Post-Implementation Checklist

- [ ] All 3 skills function: Teleport, Black Hole, Blizzard
- [ ] Auto-attack targets nearest enemy
- [ ] 10 monster types with distinct behaviors
- [ ] Elite affixes visible and functional
- [ ] Boss multi-phase fight
- [ ] 10 stages with progressive difficulty
- [ ] Equipment drops: 4 qualities, 6 slots
- [ ] Level 1-70 progression
- [ ] Tower buffs (CD reset, lightning)
- [ ] HUD: HP, EXP, skills, timer, kills
- [ ] localStorage save/load
- [ ] Menu, Prepare, Victory, Death screens
- [ ] Particles and visual effects
- [ ] Game runs at stable 60fps
