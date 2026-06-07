# Build 测试场 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated build testing area with training dummies, one-click loadout panel (5 presets + per-slot config), DPS tracking, and sandbox isolation from real character data.

**Architecture:** New `js/testfield.js` module handles all test-field logic (dummy management, damage stats, sandbox isolation, loadout generation). Existing modules extended minimally: `game-state.js` adds sandbox state, `renderer.js` adds testfield screen rendering, `gameplay.js` adds testfield loop branch, `player.js` supports sandbox stats mode, `projectiles.js` handles dummy hits, `input.js` handles panel clicks.

**Tech Stack:** HTML5 Canvas, Vanilla JS (ES modules), same as existing project.

---

## File Structure

```
js/
├── testfield.js      ← CREATE: sandbox isolation, damage stats, loadout generation, dummy management
├── game-state.js     ← MODIFY: add sandboxEquipment, damageStats, trainingDummies, screen 'testfield'
├── renderer.js       ← MODIFY: renderTestField(), loadout panel, dummies, floating damage numbers
├── gameplay.js       ← MODIFY: testfield game loop branch, enter/exit testfield
├── player.js         ← MODIFY: calcPlayerStats() sandbox mode
├── projectiles.js    ← MODIFY: dummy collision (damage-only, no kill)
├── input.js          ← MODIFY: testfield panel click handling
```

---

### Task 1: Game State — Add Testfield State

**Files:**
- Modify: `js/game-state.js`

- [ ] **Step 1: Add testfield state to game object**

In `js/game-state.js`, add these properties to the `game` object (after existing fields):

```javascript
sandboxEquipment: null,       // shallow copy of equipment for testfield sandbox
damageStats: {                 // damage tracking for testfield
  totalDamage: 0,
  peakDamage: 0,
  dpsHistory: [],              // [{ time, damage }]
  startTime: 0,
  skillCounts: [0, 0, 0],
},
trainingDummies: [],           // dummy monsters for testfield
showLoadoutPanel: true,        // loadout panel visible toggle
loadoutTab: 'presets',         // 'presets' | 'custom'
```

- [ ] **Step 2: Commit**

```bash
git add js/game-state.js
git commit -m "feat: add testfield state to game object"
```

---

### Task 2: Testfield Module — Core Logic

**Files:**
- Create: `js/testfield.js`

- [ ] **Step 1: Create js/testfield.js with sandbox, stats, and dummy functions**

```javascript
// js/testfield.js
import { game } from './game-state.js';
import { calcPlayerStats } from './player.js';
import { SET_DEFS, LEGENDARY_POWERS, QUALITY_NAMES, QUALITY_COLORS, QUALITY_MULT, SLOT_DEF, ARTIFACT_DEFS } from './config.js';
import { randChoice } from './helpers.js';

// ---- Sandbox ----

export function enterTestfield() {
  // Deep copy current equipment to sandbox
  game.sandboxEquipment = {};
  for (const slot of Object.keys(game.equipment)) {
    const eq = game.equipment[slot];
    game.sandboxEquipment[slot] = eq ? { ...eq } : null;
  }
  // Reset damage stats
  game.damageStats = {
    totalDamage: 0,
    peakDamage: 0,
    dpsHistory: [],
    startTime: 0,
    skillCounts: [0, 0, 0],
  };
  // Spawn dummies
  game.trainingDummies = createDummies();
}

export function exitTestfield() {
  // Discard sandbox, restore real equipment untouched
  game.sandboxEquipment = null;
  game.trainingDummies = [];
  game.damageStats = { totalDamage: 0, peakDamage: 0, dpsHistory: [], startTime: 0, skillCounts: [0, 0, 0] };
}

export function resetStats() {
  game.damageStats.totalDamage = 0;
  game.damageStats.peakDamage = 0;
  game.damageStats.dpsHistory = [];
  game.damageStats.startTime = game.testfieldTime || 0;
  game.damageStats.skillCounts = [0, 0, 0];
}

export function recordDamage(amount) {
  const ds = game.damageStats;
  ds.totalDamage += amount;
  if (amount > ds.peakDamage) ds.peakDamage = amount;
  ds.dpsHistory.push({ time: game.testfieldTime || 0, damage: amount });
  // Trim history to 3-second window
  const cutoff = (game.testfieldTime || 0) - 3;
  while (ds.dpsHistory.length > 0 && ds.dpsHistory[0].time < cutoff) {
    ds.dpsHistory.shift();
  }
}

export function getDPS() {
  const ds = game.damageStats;
  if (ds.dpsHistory.length === 0) return 0;
  const oldest = ds.dpsHistory[0].time;
  const newest = ds.dpsHistory[ds.dpsHistory.length - 1].time;
  const span = newest - oldest;
  if (span <= 0) return 0;
  const dmg = ds.dpsHistory.reduce((s, e) => s + e.damage, 0);
  return Math.round(dmg / span);
}

// ---- Dummies ----

function createDummies() {
  const cx = 1500, cy = 1500; // map center
  return [
    { id: 'dummy_single', x: cx - 60, y: cy - 60, size: 24, color: '#555', label: '单体', damageReduction: 0, hp: 999999, maxHp: 999999 },
    { id: 'dummy_dr30', x: cx - 60, y: cy + 80, size: 24, color: '#665544', label: '减伤30%', damageReduction: 0.3, hp: 999999, maxHp: 999999 },
    { id: 'dummy_dr60', x: cx - 60, y: cy + 180, size: 24, color: '#554433', label: '减伤60%', damageReduction: 0.6, hp: 999999, maxHp: 999999 },
    { id: 'dummy_group1', x: cx + 100, y: cy, size: 16, color: '#666', label: '群体', damageReduction: 0, hp: 999999, maxHp: 999999 },
    { id: 'dummy_group2', x: cx + 140, y: cy, size: 16, color: '#666', label: '群体', damageReduction: 0, hp: 999999, maxHp: 999999 },
    { id: 'dummy_group3', x: cx + 60, y: cy + 60, size: 16, color: '#666', label: '群体', damageReduction: 0, hp: 999999, maxHp: 999999 },
  ];
}

// ---- Loadout Presets ----

const LOADOUT_PRESETS = [
  {
    name: '火球弹幕',
    description: '穿透火球 + 火焰风暴 (熔火之心)',
    config: {
      weapon: { quality: 3, power: 'pierce' },
      ring: { quality: 3, power: 'fireballDmg' },
      armor: { quality: 3, power: 'fireballDmg' },
      amulet: { quality: 3, power: 'pierce' },
      helmet: { quality: 2, power: null },
      boots: { quality: 2, power: null },
      bracers: { quality: 2, power: null },
      belt: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'feather' },
    },
  },
  {
    name: '冰法控制',
    description: '暴风眼 + 急冻光环 (深寒领域)',
    config: {
      helmet: { quality: 3, power: 'blizzardSize' },
      boots: { quality: 3, power: 'blizzardSlow' },
      armor: { quality: 3, power: 'blizzardSlow' },
      bracers: { quality: 3, power: 'blizzardSize' },
      weapon: { quality: 2, power: null },
      ring: { quality: 2, power: null },
      amulet: { quality: 2, power: null },
      belt: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'criticalFragment' },
    },
  },
  {
    name: '元素使',
    description: '元素使4件 + 穿透火球/火焰风暴 + 谐律之眼',
    config: {
      bracers: { quality: 4, setName: 'elementalist' },
      belt: { quality: 4, setName: 'elementalist' },
      helmet: { quality: 4, setName: 'elementalist' },
      boots: { quality: 4, setName: 'elementalist' },
      weapon: { quality: 3, power: 'pierce' },
      ring: { quality: 3, power: 'fireballDmg' },
      armor: { quality: 2, power: null },
      amulet: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'harmonyEye' },
    },
  },
  {
    name: '时空术士',
    description: '时空术士4件 + 冷却共鸣/虚空行者 + 力场发生器',
    config: {
      bracers: { quality: 4, setName: 'chronomancer' },
      belt: { quality: 4, setName: 'chronomancer' },
      armor: { quality: 4, setName: 'chronomancer' },
      ring: { quality: 4, setName: 'chronomancer' },
      helmet: { quality: 3, power: 'globalCDR' },
      amulet: { quality: 3, power: 'teleportCD' },
      weapon: { quality: 2, power: null },
      boots: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'fieldGenerator' },
    },
  },
  {
    name: '混合火冰',
    description: '穿透火球 + 暴风眼 (火冰相激)',
    config: {
      weapon: { quality: 3, power: 'pierce' },
      ring: { quality: 3, power: 'pierce' },
      helmet: { quality: 3, power: 'blizzardSize' },
      boots: { quality: 3, power: 'blizzardSize' },
      armor: { quality: 2, power: null },
      amulet: { quality: 2, power: null },
      bracers: { quality: 2, power: null },
      belt: { quality: 2, power: null },
      artifact: { quality: 3, artifactId: 'feather' },
    },
  },
];

export function getLoadoutPresets() {
  return LOADOUT_PRESETS;
}

export function applyLoadout(presetName) {
  const preset = LOADOUT_PRESETS.find(p => p.name === presetName);
  if (!preset) return;

  // Generate items for each slot
  const ilvl = 70; // max level for testing
  for (const [slot, cfg] of Object.entries(preset.config)) {
    if (cfg.quality === 4) {
      // Set item
      const def = SET_DEFS[cfg.setName];
      const quality = 4;
      const statValue = rollMaxStatValue(slot, quality, ilvl);
      game.sandboxEquipment[slot] = {
        slot, quality, ilvl, statValue,
        name: QUALITY_NAMES[4] + ' ' + def.name + ' ' + SLOT_DEF[slot].name + ' [70]',
        color: QUALITY_COLORS[4],
        stat: SLOT_DEF[slot].stat,
        power: null,
        setName: cfg.setName,
      };
    } else if (cfg.artifactId) {
      // Artifact
      const artDef = ARTIFACT_DEFS.find(a => a.id === cfg.artifactId);
      const quality = Math.min(cfg.quality, 3);
      game.sandboxEquipment[slot] = {
        slot: 'artifact', quality, ilvl, statValue: 0,
        name: QUALITY_NAMES[quality] + artDef.name + ' [70]',
        color: QUALITY_COLORS[quality],
        stat: 'artifact',
        power: null,
        artifactId: cfg.artifactId,
        setName: artDef.setName,
      };
    } else if (cfg.power) {
      // Legendary with specific power
      const quality = 3;
      const statValue = rollMaxStatValue(slot, quality, ilvl);
      const powerDef = LEGENDARY_POWERS.find(p => p.stat === cfg.power);
      game.sandboxEquipment[slot] = {
        slot, quality, ilvl, statValue,
        name: QUALITY_NAMES[3] + SLOT_DEF[slot].name + ' [70]',
        color: QUALITY_COLORS[3],
        stat: SLOT_DEF[slot].stat,
        power: { name: powerDef.name, desc: powerDef.desc, stat: powerDef.stat, value: powerDef.max },
      };
    } else {
      // Normal item
      const statValue = rollMaxStatValue(slot, cfg.quality, ilvl);
      game.sandboxEquipment[slot] = {
        slot, quality: cfg.quality, ilvl, statValue,
        name: QUALITY_NAMES[cfg.quality] + SLOT_DEF[slot].name + ' [70]',
        color: QUALITY_COLORS[cfg.quality],
        stat: SLOT_DEF[slot].stat,
        power: null,
      };
    }
  }
  // Recalc stats immediately
  const stats = calcPlayerStats(true);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
}

function rollMaxStatValue(slot, quality, ilvl) {
  const def = SLOT_DEF[slot];
  if (!def || def.base === 0) return 0;
  const ilv = ilvl || 70;
  const ilvF = 0.35 + ilv * 0.0236;
  const base = def.base * ilvF * QUALITY_MULT[quality];
  return Math.round(base * 0.875); // ~mid-upper range for testing
}

// ---- Dummy collision helper ----

export function hitDummy(projectile, px, py) {
  for (const d of game.trainingDummies) {
    const dx = px - d.x;
    const dy = py - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < projectile.size + d.size) {
      const dmg = Math.round(projectile.damage * (1 - d.damageReduction));
      recordDamage(dmg);
      return { hit: true, dummy: d, damage: dmg, x: px, y: py };
    }
  }
  return { hit: false };
}
```

- [ ] **Step 2: Verify syntax and commit**

```bash
node -c js/testfield.js
git add js/testfield.js
git commit -m "feat: add testfield module — sandbox, stats, dummies, loadouts"
```

---

### Task 3: Player — Sandbox Mode for calcPlayerStats

**Files:**
- Modify: `js/player.js`

- [ ] **Step 1: Add sandbox parameter to calcPlayerStats()**

In `js/player.js`, modify `calcPlayerStats()` to accept an optional `sandbox` parameter (default false). When true, read from `game.sandboxEquipment` instead of `game.equipment`.

Change the function signature and the equipment reference:

```javascript
export function calcPlayerStats(sandbox){
  const lv = game.player.level;
  const baseHP = 100 + (lv - 1) * 5;
  const baseATK = 10 + (lv - 1) * 2;
  let bHP = 0, bATK = 0, bCDR = 0, bSpeed = 0, bRange = 0, bMove = 0;
  const eq = sandbox ? game.sandboxEquipment : game.equipment;
  // ... rest of function unchanged, uses eq instead of game.equipment
```

Note: The existing function uses `game.equipment` directly in `for (const slot of Object.keys(eq))`. The change is just `eq` which was already defined — just change the source:

```javascript
// OLD:
const eq = game.equipment;
// NEW:
const eq = sandbox ? (game.sandboxEquipment || game.equipment) : game.equipment;
```

Also update `getLegendaryEffects()` to support sandbox mode:

```javascript
export function getLegendaryEffects(sandbox){
  const fx = {globalCDR:0,fireballDmg:0,pierce:0,blackholeSize:0,blackholeDur:0,blizzardSize:0,blizzardSlow:0,teleportCD:0};
  const eq = sandbox ? (game.sandboxEquipment || game.equipment) : game.equipment;
  for (const slot of Object.keys(eq)) {
    const e = eq[slot];
    if (e && e.power && e.power.stat) fx[e.power.stat] = (fx[e.power.stat] || 0) + e.power.value;
  }
  return fx;
}
```

Update the call inside `calcPlayerStats` to pass `sandbox`:
```javascript
const fx = getLegendaryEffects(sandbox);
```

- [ ] **Step 2: Commit**

```bash
git add js/player.js
git commit -m "feat: add sandbox mode to calcPlayerStats and getLegendaryEffects"
```

---

### Task 4: Projectiles — Dummy Collision

**Files:**
- Modify: `js/projectiles.js`

- [ ] **Step 1: Add dummy collision check in updateProjectiles()**

In `js/projectiles.js`, import `hitDummy` and add dummy collision before the monster collision loop:

```javascript
import { hitDummy } from './testfield.js';

// In updateProjectiles(), after position update, before monster loop:
if (game.trainingDummies && game.trainingDummies.length > 0 && !p.isEnemy) {
  const dummyResult = hitDummy(p, p.x, p.y);
  if (dummyResult.hit) {
    // Don't destroy projectile for dummies — let it pass through
    // But register the hit
    if (!p._hitDummies) p._hitDummies = new Set();
    if (!p._hitDummies.has(dummyResult.dummy.id)) {
      p._hitDummies.add(dummyResult.dummy.id);
      // Floating damage number will be handled by renderer
      if (!p._dummyHits) p._dummyHits = [];
      p._dummyHits.push(dummyResult);
      // Record damage for stats
      // (already called by hitDummy)
      spawnParticles(dummyResult.x, dummyResult.y, 4, '#ffaa00', 50, 2);
    }
  }
}
```

`spawnParticles` should already be imported. Check and add if needed.

- [ ] **Step 2: Commit**

```bash
git add js/projectiles.js
git commit -m "feat: add training dummy collision detection in projectiles"
```

---

### Task 5: Renderer — Testfield Screen

**Files:**
- Modify: `js/renderer.js`

This is the largest task. The renderer needs:
1. Testfield screen rendering (map, dummies, player, projectiles, effects)
2. Loadout panel (presets tab + custom tab)
3. Floating damage numbers
4. Damage stats HUD

- [ ] **Step 1: Add testfield to render() switch**

In `render()`, add `case 'testfield': renderTestField(); break;` to the switch.

- [ ] **Step 2: Implement renderTestField()**

```javascript
// ---- Testfield ----
function renderTestField() {
  const W = canvas.width, H = canvas.height;

  // Small map area (1200x1200 centered)
  game.camera.x = game.player.x - W / 2;
  game.camera.y = game.player.y - H / 2;

  // Background
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = -game.camera.x % TILE_SIZE; x < W; x += TILE_SIZE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = -game.camera.y % TILE_SIZE; y < H; y += TILE_SIZE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Render dummies
  renderDummies();
  // Render projectiles
  renderProjectiles();
  // Render skill effects
  renderSkillEffects();
  // Render player
  renderPlayer();
  // Render particles
  renderParticles();
  // Render floating damage numbers
  renderFloatingNumbers();
  // Render damage stats HUD
  renderDamageHUD();
  // Render loadout panel
  if (game.showLoadoutPanel) renderLoadoutPanel();
  // Toggle button
  renderLoadoutToggle();
}
```

Note: `renderProjectiles`, `renderSkillEffects`, `renderPlayer`, `renderParticles` are already exported functions used in `renderPlaying()`. They should work as-is since they read from `game.projectiles`, `game.skillEffects`, `game.player`, `game.particles` which are shared state.

- [ ] **Step 3: Implement renderDummies()**

```javascript
function renderDummies() {
  for (const d of game.trainingDummies) {
    const sx = d.x - game.camera.x;
    const sy = d.y - game.camera.y;
    if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) continue;

    // Body
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(sx, sy, d.size, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - d.size - 6, sy);
    ctx.lineTo(sx + d.size + 6, sy);
    ctx.moveTo(sx, sy - d.size - 6);
    ctx.lineTo(sx, sy + d.size + 6);
    ctx.stroke();

    // Glow ring
    ctx.strokeStyle = 'rgba(150,150,150,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, d.size + 8, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#aaa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, sx, sy - d.size - 12);
  }
}
```

- [ ] **Step 4: Implement renderFloatingNumbers()**

Floating numbers are stored in a global array populated by dummy hits. Add a `floatingNumbers` array to game state (or use a module-level variable in renderer.js):

```javascript
// At top of renderer.js, add:
let floatingNumbers = []; // [{ x, y, damage, timer }]

// Export a function for projectiles.js to call:
export function addFloatingNumber(x, y, damage) {
  floatingNumbers.push({ x, y, damage, timer: 0.8 });
}

function renderFloatingNumbers() {
  for (let i = floatingNumbers.length - 1; i >= 0; i--) {
    const fn = floatingNumbers[i];
    fn.timer -= 0.016; // ~60fps dt
    fn.y -= 0.8; // float upward
    if (fn.timer <= 0) {
      floatingNumbers.splice(i, 1);
      continue;
    }
    const alpha = Math.min(1, fn.timer / 0.4);
    const sx = fn.x - game.camera.x;
    const sy = fn.y - game.camera.y;
    ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(fn.damage), sx, sy);
  }
}
```

Add the export to the renderer.js exports at the bottom or inline.

- [ ] **Step 5: Implement renderDamageHUD()**

```javascript
function renderDamageHUD() {
  const W = canvas.width;
  const ds = game.damageStats;
  const dps = getDPS(); // from testfield.js

  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, W, 36);
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px sans-serif';

  ctx.fillStyle = '#ff8800';
  ctx.fillText(`DPS: ${dps.toLocaleString()}/s`, 15, 24);

  ctx.fillStyle = '#ccc';
  ctx.font = '12px sans-serif';
  ctx.fillText(`总伤害: ${ds.totalDamage.toLocaleString()}`, 190, 24);
  ctx.fillText(`峰值: ${ds.peakDamage.toLocaleString()}`, 350, 24);

  const elapsed = game.testfieldTime || 0;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  ctx.fillText(`时长: ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`, 470, 24);

  // Reset button
  const btnX = W - 80, btnY = 6, btnW = 65, btnH = 24;
  const hover = game.mouseX >= btnX && game.mouseX <= btnX + btnW && game.mouseY >= btnY && game.mouseY <= btnY + btnH;
  ctx.fillStyle = hover ? '#4a2020' : '#2a1010';
  ctx.strokeStyle = hover ? '#f88' : '#844';
  ctx.lineWidth = 1;
  roundRect(ctx, btnX, btnY, btnW, btnH, 4);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f88';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('重置', btnX + btnW / 2, btnY + btnH / 2 + 4);

  // Add to clickable buttons
  testfieldButtons.push({ x: btnX, y: btnY, w: btnW, h: btnH, action: 'resetStats' });
}
```

Note: `testfieldButtons` needs to be declared and exported like `menuButtons`/`prepButtons`. Add at the top:
```javascript
export let testfieldButtons = [];
```

And import `getDPS` from testfield module.

- [ ] **Step 6: Implement renderLoadoutPanel()**

```javascript
function renderLoadoutPanel() {
  const W = canvas.width, H = canvas.height;
  const pw = 320, ph = H - 80, px = W - pw - 10, py = 50;

  // Panel background
  ctx.fillStyle = 'rgba(10, 10, 25, 0.95)';
  ctx.strokeStyle = '#445';
  ctx.lineWidth = 1;
  roundRect(ctx, px, py, pw, ph, 8);
  ctx.fill(); ctx.stroke();

  // Title
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('配装面板', px + pw / 2, py + 22);

  // Tab bar
  const tabW = (pw - 20) / 2, tabH = 28, tabY = py + 32;
  const presetsTab = { x: px + 5, y: tabY, w: tabW, h: tabH, id: 'presets' };
  const customTab = { x: px + pw / 2 + 5, y: tabY, w: tabW, h: tabH, id: 'custom' };

  for (const tab of [presetsTab, customTab]) {
    const active = game.loadoutTab === tab.id;
    ctx.fillStyle = active ? '#2a2a4a' : '#1a1a2a';
    ctx.strokeStyle = active ? '#ffd700' : '#334';
    ctx.lineWidth = active ? 2 : 1;
    roundRect(ctx, tab.x, tab.y, tab.w, tab.h, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = active ? '#ffd700' : '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tab.id === 'presets' ? '预设模板' : '自由搭配', tab.x + tab.w / 2, tab.y + tab.h / 2 + 4);
    testfieldButtons.push({ x: tab.x, y: tab.y, w: tab.w, h: tab.h, action: 'switchTab', tabId: tab.id });
  }

  if (game.loadoutTab === 'presets') {
    renderPresetsTab(px, py + 65, pw);
  } else {
    renderCustomTab(px, py + 65, pw);
  }
}

function renderPresetsTab(px, py, pw) {
  const presets = getLoadoutPresets();
  const itemH = 48, gap = 6;

  for (let i = 0; i < presets.length; i++) {
    const pres = presets[i];
    const iy = py + i * (itemH + gap);
    if (iy + itemH > canvas.height - 100) break;

    const hover = game.mouseX >= px + 8 && game.mouseX <= px + pw - 8 && game.mouseY >= iy && game.mouseY <= iy + itemH;
    ctx.fillStyle = hover ? '#1a1a3a' : '#151525';
    ctx.strokeStyle = hover ? '#ffd700' : '#334';
    ctx.lineWidth = hover ? 2 : 1;
    roundRect(ctx, px + 8, iy, pw - 16, itemH, 4);
    ctx.fill(); ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(pres.name, px + 18, iy + 20);
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText(pres.description, px + 18, iy + 36);

    testfieldButtons.push({ x: px + 8, y: iy, w: pw - 16, h: itemH, action: 'applyPreset', presetName: pres.name });
  }
}

function renderCustomTab(px, py, pw) {
  const slots = ['weapon', 'helmet', 'armor', 'ring', 'amulet', 'boots', 'bracers', 'belt', 'artifact'];
  const slotNames = ['武器', '头盔', '护甲', '戒指', '项链', '靴子', '护腕', '腰带', '法器'];
  const itemH = 38, gap = 3;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const iy = py + i * (itemH + gap);
    if (iy + itemH > canvas.height - 60) break;

    ctx.fillStyle = '#151525';
    roundRect(ctx, px + 8, iy, pw - 16, itemH, 3);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaa';
    ctx.font = '11px sans-serif';
    ctx.fillText(slotNames[i], px + 16, iy + 24);

    // Show current equipment in this slot
    const eq = game.sandboxEquipment[slot];
    if (eq) {
      ctx.fillStyle = QUALITY_COLORS[eq.quality] || '#aaa';
      ctx.font = '10px sans-serif';
      ctx.fillText(eq.name || (QUALITY_NAMES[eq.quality] + '装备'), px + 60, iy + 24);
    } else {
      ctx.fillStyle = '#444';
      ctx.font = '10px sans-serif';
      ctx.fillText('空', px + 60, iy + 24);
    }

    // Click to cycle quality (simplified: 0→1→2→3→null)
    testfieldButtons.push({ x: px + 8, y: iy, w: pw - 16, h: itemH, action: 'cycleSlot', slot });
  }

  // Apply button at bottom
  const applyY = py + slots.length * (itemH + gap) + 10;
  const applyW = 120, applyH = 32;
  const applyX = px + (pw - applyW) / 2;
  const applyHover = game.mouseX >= applyX && game.mouseX <= applyX + applyW && game.mouseY >= applyY && game.mouseY <= applyY + applyH;
  ctx.fillStyle = applyHover ? '#2a3a2a' : '#1a2a1a';
  ctx.strokeStyle = applyHover ? '#fff' : '#4a4';
  ctx.lineWidth = 2;
  roundRect(ctx, applyX, applyY, applyW, applyH, 6);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8f8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('应用配置', applyX + applyW / 2, applyY + applyH / 2 + 5);

  testfieldButtons.push({ x: applyX, y: applyY, w: applyW, h: applyH, action: 'applyCustom' });
}

function renderLoadoutToggle() {
  const W = canvas.width;
  const btnSize = 24, btnX = W - btnSize - 10, btnY = 50;
  const hover = game.mouseX >= btnX && game.mouseX <= btnX + btnSize && game.mouseY >= btnY && game.mouseY <= btnY + btnSize;
  ctx.fillStyle = hover ? '#334' : '#223';
  ctx.strokeStyle = hover ? '#fff' : '#556';
  ctx.lineWidth = 1;
  roundRect(ctx, btnX, btnY, btnSize, btnSize, 4);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#aaa';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.showLoadoutPanel ? '◀' : '▶', btnX + btnSize / 2, btnY + btnSize / 2 + 5);
  testfieldButtons.push({ x: btnX, y: btnY, w: btnSize, h: btnSize, action: 'togglePanel' });
}
```

Need to import `getLoadoutPresets` from testfield.js.

- [ ] **Step 7: Commit**

```bash
git add js/renderer.js
git commit -m "feat: add testfield screen rendering — dummies, floating numbers, stats HUD, loadout panel"
```

---

### Task 6: Gameplay — Testfield Loop & Entry/Exit

**Files:**
- Modify: `js/gameplay.js`

- [ ] **Step 1: Add enter/exit testfield functions and game loop branch**

In `js/gameplay.js`, add imports:
```javascript
import { enterTestfield, exitTestfield, resetStats, applyLoadout, getLoadoutPresets } from './testfield.js';
import { addFloatingNumber, testfieldButtons } from './renderer.js';
import { getSetEffects, updateSetEffects } from './sets.js';
```

Add two new exported functions:

```javascript
export function startTestfield() {
  game.screen = 'testfield';
  game.testfieldTime = 0;
  game.player.x = 1500;
  game.player.y = 1500 + 120; // Below center
  game.player.hp = game.player.maxHp;
  game.player.fireTimer = 0;
  game.player.skillCooldowns = [0, 0, 0];
  game.player.buffs = [];
  game.player.hitInvuln = 0;
  game.player.elementalistStacks = 0;
  game.player.elementalistLastElement = null;
  game.player.elementalistAura = null;
  game.player.singularityFields = [];
  game.player.temporalResonanceTimer = 0;
  game.monsters = [];
  game.projectiles = [];
  game.skillEffects = [];
  game.particles = [];
  game.towers = [];
  game.drops = [];
  game.showLoadoutPanel = true;
  game.loadoutTab = 'presets';
  enterTestfield();
  const stats = calcPlayerStats(true);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
  game.camera.x = game.player.x - canvas.width / 2;
  game.camera.y = game.player.y - canvas.height / 2;
}

export function exitTestfieldToPrepare() {
  exitTestfield();
  game.screen = 'prepare';
  const stats = calcPlayerStats(false);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
}
```

- [ ] **Step 2: Add testfield branch to gameLoop()**

In `gameLoop()`, add before the existing `if (game.screen === 'playing')` check:

```javascript
if (game.screen === 'testfield' && !game.showBackpack && !game.showPauseMenu) {
  game.testfieldTime += dt;
  updatePlayer(dt);
  updateSetEffects(dt);
  updateSkillEffects(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateCamera(dt);
  // Handle floating number lifetime (already done in renderer)
  // Process dummy projectile hits — clear per-frame
  for (const p of game.projectiles) {
    if (p._dummyHits) {
      for (const hit of p._dummyHits) {
        addFloatingNumber(hit.x, hit.y, hit.damage);
      }
      p._dummyHits = [];
    }
  }
}
```

- [ ] **Step 3: Handle testfield button clicks in processClick()**

In `processClick()`, add a branch for testfield screen:

```javascript
if (game.screen === 'testfield') {
  for (const b of testfieldButtons) {
    const hit = game.mouseX >= b.x && game.mouseX <= b.x + b.w && game.mouseY >= b.y && game.mouseY <= b.y + b.h;
    if (!hit) continue;
    if (b.action === 'resetStats') { resetStats(); return; }
    if (b.action === 'togglePanel') { game.showLoadoutPanel = !game.showLoadoutPanel; testfieldButtons.length = 0; return; }
    if (b.action === 'switchTab') { game.loadoutTab = b.tabId; testfieldButtons.length = 0; return; }
    if (b.action === 'applyPreset') { applyLoadout(b.presetName); testfieldButtons.length = 0; return; }
    if (b.action === 'cycleSlot') { cycleSlotQuality(b.slot); testfieldButtons.length = 0; return; }
    if (b.action === 'applyCustom') { applyCustomLoadout(); testfieldButtons.length = 0; return; }
  }
  // Click on game area — cast skill
  if (game.mouseY < 36) return; // HUD area
  const wx = game.mouseX + game.camera.x;
  const wy = game.mouseY + game.camera.y;
  castSkill(clamp(wx, 0, MAP_W), clamp(wy, 0, MAP_H));
  game.damageStats.skillCounts[game.activeSkill]++;
  return;
}
```

Testfield buttons are cleared each frame by the renderer. We need to reset `testfieldButtons = []` at the start of each render cycle. Add this in `renderTestField()`:

```javascript
testfieldButtons = [];
```

- [ ] **Step 4: Add cycleSlotQuality helper**

```javascript
function cycleSlotQuality(slot) {
  const eq = game.sandboxEquipment[slot];
  const currentQ = eq ? eq.quality : -1;
  const nextQ = currentQ >= 3 ? -1 : currentQ + 1; // cycle: empty→0→1→2→3→empty
  if (nextQ < 0) {
    game.sandboxEquipment[slot] = null;
  } else {
    const ilvl = 70;
    const statValue = rollMaxStatValue(slot, nextQ, ilvl);
    // rollMaxStatValue is in testfield.js — need to import or inline
    const def = SLOT_DEF[slot];
    const ilvF = 0.35 + ilvl * 0.0236;
    const base = def.base * ilvF * QUALITY_MULT[nextQ];
    const sv = Math.round(base * 0.875);
    game.sandboxEquipment[slot] = {
      slot, quality: nextQ, ilvl, statValue: sv,
      name: QUALITY_NAMES[nextQ] + SLOT_DEF[slot].name + ' [70]',
      color: QUALITY_COLORS[nextQ],
      stat: SLOT_DEF[slot].stat,
      power: null,
    };
  }
  const stats = calcPlayerStats(true);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
}
```

Need to import SLOT_DEF, QUALITY_NAMES, QUALITY_COLORS, QUALITY_MULT from config.js (check existing imports).

- [ ] **Step 5: Add applyCustomLoadout helper**

```javascript
function applyCustomLoadout() {
  // Apply the current sandboxEquipment as-is
  // (changes are already live since we write directly to sandboxEquipment)
  const stats = calcPlayerStats(true);
  game.player.maxHp = stats.maxHP;
  game.player.hp = stats.maxHP;
  game.player.atk = stats.atk;
  game.player.cdr = stats.cdr;
  game.player.bulletSpeed = stats.bulletSpeed;
  game.player.pickupRange = stats.pickupRange;
  game.player.fireRate = stats.fireRate;
}
```

- [ ] **Step 6: Commit**

```bash
git add js/gameplay.js
git commit -m "feat: add testfield game loop, entry/exit, and panel interaction handlers"
```

---

### Task 7: Prepare Screen — Add Testfield Button

**Files:**
- Modify: `js/renderer.js`

- [ ] **Step 1: Add「测试场」button to prepare screen**

In `renderPrepare()`, add a testfield button. Find where the stage select buttons are rendered, add above or beside them:

```javascript
// Testfield button — top of stage select area
const tfBtnW = 160, tfBtnH = 40;
const tfBtnX = W / 2 - tfBtnW / 2;
const tfBtnY = H - 230;
const tfHover = game.mouseX >= tfBtnX && game.mouseX <= tfBtnX + tfBtnW && game.mouseY >= tfBtnY && game.mouseY <= tfBtnY + tfBtnH;
ctx.fillStyle = tfHover ? '#2a2a1a' : '#1a1a0a';
ctx.strokeStyle = tfHover ? '#ffd700' : '#886600';
ctx.lineWidth = tfHover ? 2 : 1;
roundRect(ctx, tfBtnX, tfBtnY, tfBtnW, tfBtnH, 6);
ctx.fill(); ctx.stroke();
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 14px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('⚔ 测试场', tfBtnX + tfBtnW / 2, tfBtnY + tfBtnH / 2 + 5);

prepButtons.push({
  x: tfBtnX, y: tfBtnY, w: tfBtnW, h: tfBtnH,
  text: '测试场',
  action: () => { startTestfield(); },
});
```

Need to import `startTestfield` from gameplay.js (or export it from gameplay). Check if `startTestfield` is exported.

- [ ] **Step 2: Commit**

```bash
git add js/renderer.js
git commit -m "feat: add testfield entry button to prepare screen"
```

---

### Task 8: Input — Keyboard handling for testfield

**Files:**
- Modify: `js/input.js`

- [ ] **Step 1: Add Escape to return from testfield**

In the keydown handler, find where Escape is handled for the pause menu. Add:

```javascript
if (e.key === 'Escape') {
  if (game.screen === 'testfield') {
    exitTestfieldToPrepare();
    return;
  }
  // ... existing escape handling
}
```

Import `exitTestfieldToPrepare` from gameplay.js.

- [ ] **Step 2: Commit**

```bash
git add js/input.js
git commit -m "feat: add Escape to exit testfield back to prepare screen"
```

---

### Task 9: Integration Test — Verify Testfield

**Files:**
- Manual verification in browser

- [ ] **Step 1: Start dev server**

```bash
cd D:\claw\projects\diablo_lite
npx serve . --listen 3000
```

- [ ] **Step 2: Verify test field entry and exit**

1. Start game → prepare screen → click「测试场」
2. Verify: testfield map loads, dummies visible (single + DR + group)
3. Press Escape → returns to prepare screen
4. Verify: character equipment unchanged

- [ ] **Step 3: Verify loadout presets**

1. Enter testfield → click each preset (火球弹幕, 冰法控制, 元素使, 时空术士, 混合火冰)
2. Verify: equipment changes in panel, stats update
3. Verify: set items show green, artifacts show correctly

- [ ] **Step 4: Verify damage on dummies**

1. Equip 火球弹幕 preset → auto-attack fires at nearest dummy
2. Verify: floating damage numbers appear above dummy
3. Verify: DPS counter updates in HUD
4. Verify: total damage accumulates, peak tracks highest hit
5. Click「重置」→ all stats zero

- [ ] **Step 5: Verify skill testing**

1. Cast Black Hole near group dummies → all 3 pulled
2. Cast Blizzard on group → freeze triggers (冰法 preset)
3. Verify: skillCounts increment
4. Equip 元素使 preset → verify harmony stacks build

- [ ] **Step 6: Verify sandbox isolation**

1. Enter testfield with equipped items
2. Change to a preset loadout
3. Exit testfield
4. Verify: prepare screen shows ORIGINAL equipment (unchanged)

- [ ] **Step 7: Fix issues and commit**

```bash
git add -A
git commit -m "fix: integration fixes for testfield"
```
