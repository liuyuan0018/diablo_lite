# Build 约束体系 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 equipment slots (bracers/belt/artifact), 2 playstyle-constraining sets (Elementalist/Chronomancer), 4 legendary synergies, and 4 artifacts to the Diablo Lite build system.

**Architecture:** Two new modules (`sets.js`, `synergies.js`) handle set effects and synergy detection. Existing modules are extended: config gets new definitions, game-state gets expanded equipment/player state, player/skills modules integrate set/synergy effects, equipment generates new item types, renderer draws new slots and VFX.

**Tech Stack:** HTML5 Canvas, Vanilla JS (ES modules), localStorage persistence.

---

## File Structure

```
js/
├── config.js          ← MODIFY: add slot defs, set defs, synergy defs, artifact defs, quality 4
├── sets.js            ← CREATE: getSetEffects(), updateSetEffects()
├── synergies.js       ← CREATE: getSynergies(), synergy definitions & runtime effects
├── game-state.js      ← MODIFY: expand equipment slots, add elementalist/chronomancer state
├── player.js          ← MODIFY: integrate sets & synergies into calcPlayerStats + updatePlayer
├── skills.js          ← MODIFY: chronomancer set effects, elementalist skill tracking
├── equipment.js       ← MODIFY: generate set/artifact items, new slot drops
├── projectiles.js     ← MODIFY: molten heart fire damage, fire-ice dual element
├── monsters.js        ← MODIFY: freeze/ignite debuffs
├── renderer.js        ← MODIFY: new slots in UI, set display (green), VFX
├── gameplay.js        ← MODIFY: wire set/synergy updates, reset state on stage start
├── persistence.js     ← MODIFY: save/load expanded equipment
```

---

### Task 1: Config — Add All Definitions

**Files:**
- Modify: `js/config.js`

- [ ] **Step 1: Add new slot definitions to SLOT_DEF**

```javascript
// Append to SLOT_DEF after boots:
bracers:{ stat:'atk', name:'护腕', base:8, desc:'攻击力' },
belt:{ stat:'maxHp', name:'腰带', base:20, desc:'最大生命' },
artifact:{ stat:'artifact', name:'法器', base:0, desc:'特殊效果', legendary:true },
```

- [ ] **Step 2: Add quality 4 (set) to quality constants**

```javascript
export const QUALITY_NAMES = ['普通','魔法','稀有','传说','套装'];
export const QUALITY_COLORS = ['#aaaaaa','#4488ff','#ffd700','#ff6600','#44ff44'];
export const QUALITY_MULT = [1, 1.4, 1.9, 2.5, 2.5]; // set = legendary mult
```

- [ ] **Step 3: Add SET_DEFS constant**

```javascript
export const SET_DEFS = {
  elementalist: {
    name: '元素使', parts: ['bracers','belt','helmet','boots'],
    two: { desc: '元素印记', detail: '交替使用不同元素技能获得谐律层数，每层+15%技能伤害，重复归零' },
    three: { desc: '谐律爆发', detail: '3层时触发三色陨石AOE' },
    four: { desc: '谐律护体', detail: '每层+10%减伤，爆发后留元素光环(200px,+25%元素易伤)' },
  },
  chronomancer: {
    name: '时空术士', parts: ['bracers','belt','armor','ring'],
    two: { desc: '力场掌控', detail: '黑洞半径+30%，结束后留奇点力场(220px,4s,减速60%,+20%易伤)' },
    three: { desc: '坍缩奇点', detail: '力场上放暴风雪触发内爆AOE' },
    four: { desc: '时空大师', detail: '站力场内2s重置传送CD，坍缩后全技能-3s CD' },
  },
};
```

- [ ] **Step 4: Add SYNERGY_DEFS constant**

```javascript
export const SYNERGY_DEFS = [
  {
    id: 'moltenCore', name: '熔火之心',
    requires: ['pierce','fireballDmg'],
    desc: '火球每穿透一个敌人伤害+10%。穿透≥3点燃目标(3s,ATK×0.5/s)',
  },
  {
    id: 'deepFrost', name: '深寒领域',
    requires: ['blizzardSize','blizzardSlow'],
    desc: '暴风雪内减速>70%的敌人冻结1.5s(每4s一次)',
  },
  {
    id: 'fireIce', name: '火冰相激',
    requires: ['pierce','blizzardSize'],
    desc: '火球穿过暴风雪区域获得冰火双属性，对冻结目标伤害×2',
  },
  {
    id: 'temporalResonance', name: '时空共鸣',
    requires: ['globalCDR','teleportCD'],
    desc: '传送后2s内下一个非传送技能CD减半',
  },
];
```

- [ ] **Step 5: Add ARTIFACT_DEFS constant**

```javascript
export const ARTIFACT_DEFS = [
  { id:'harmonyEye', name:'谐律之眼', setName:'elementalist', desc:'谐律爆发追踪单体，伤害+50%范围缩小' },
  { id:'fieldGenerator', name:'力场发生器', setName:'chronomancer', desc:'力场持续+3s，不被坍缩消耗' },
  { id:'feather', name:'缓落之羽', setName:null, desc:'HP>80%时技能伤害+25%移速+20%' },
  { id:'criticalFragment', name:'临界碎片', setName:null, desc:'任一技能CD<3s时所有技能伤害+30%' },
];
```

- [ ] **Step 6: Commit**

```bash
git add js/config.js
git commit -m "feat: add set, synergy, artifact definitions and new slot configs"
```

---

### Task 2: Game State — Expand Equipment & Player State

**Files:**
- Modify: `js/game-state.js`

- [ ] **Step 1: Expand equipment in game object**

In `game-state.js`, change the equipment initialization line:
```javascript
// OLD:
equipment:{weapon:null,helmet:null,armor:null,ring:null,amulet:null,boots:null},
// NEW:
equipment:{weapon:null,helmet:null,armor:null,ring:null,amulet:null,boots:null,bracers:null,belt:null,artifact:null},
```

- [ ] **Step 2: Add set/synergy state to player**

Add these properties inside the `player:` block in `game-state.js`:
```javascript
elementalistStacks: 0,
elementalistLastElement: null,   // 'fire' | 'ice' | 'arcane' | null
elementalistAura: null,           // { x, y, timer }
singularityFields: [],            // [{ x, y, radius, timer, imploded }]
temporalResonanceTimer: 0,        // remaining seconds of CD-halving window
```

- [ ] **Step 3: Expand createCharacter() equipment**

In `createCharacter()`, expand the equipment object:
```javascript
equipment:{weapon:null,helmet:null,armor:null,ring:null,amulet:null,boots:null,bracers:null,belt:null,artifact:null},
```

- [ ] **Step 4: Commit**

```bash
git add js/game-state.js
git commit -m "feat: expand equipment slots to 9, add set/synergy player state"
```

---

### Task 3: Sets Module — Set Detection & Effects

**Files:**
- Create: `js/sets.js`
- Modify: `js/player.js`

- [ ] **Step 1: Create sets.js — getSetEffects()**

```javascript
// js/sets.js
import { game } from './game-state.js';
import { SET_DEFS } from './config.js';

export function getSetEffects() {
  const counts = {};
  for (const [slot, eq] of Object.entries(game.equipment)) {
    if (eq && eq.setName) {
      counts[eq.setName] = (counts[eq.setName] || 0) + 1;
    }
  }
  const result = {};
  for (const [setName, count] of Object.entries(counts)) {
    const def = SET_DEFS[setName];
    if (!def) continue;
    result[setName] = { count, active: { two: count >= 2, three: count >= 3, four: count >= 4 }, def };
  }
  return result;
}

export function getActiveSetNames() {
  const effects = getSetEffects();
  return Object.keys(effects).filter(k => effects[k].active.two);
}
```

- [ ] **Step 2: Create updateSetEffects() in sets.js**

This function runs each frame during gameplay to handle Chronomancer's singularity field lifetime and Elementalist's aura timer:

```javascript
export function updateSetEffects(dt) {
  const p = game.player;
  // Decay singularity fields
  for (let i = p.singularityFields.length - 1; i >= 0; i--) {
    const f = p.singularityFields[i];
    f.timer -= dt;
    if (f.timer <= 0) {
      p.singularityFields.splice(i, 1);
    }
  }
  // Decay elementalist aura
  if (p.elementalistAura) {
    p.elementalistAura.timer -= dt;
    if (p.elementalistAura.timer <= 0) {
      p.elementalistAura = null;
    }
  }
  // Decay temporal resonance
  if (p.temporalResonanceTimer > 0) {
    p.temporalResonanceTimer -= dt;
  }
}
```

- [ ] **Step 3: Integrate set effects into calcPlayerStats()**

In `js/player.js`, modify `calcPlayerStats()` to factor in set damage/reduction bonuses. Add after the `legendary` object:

```javascript
import { getSetEffects } from './sets.js';

// Inside calcPlayerStats(), after fx = getLegendaryEffects():
const sets = getSetEffects();
let setDmgMult = 1;
let setDmgReduc = 0;

// Elementalist 2-piece: +15% per harmony stack
if (sets.elementalist && sets.elementalist.active.two) {
  setDmgMult += game.player.elementalistStacks * 0.15;
}
// Elementalist 4-piece: 10% DR per harmony stack
if (sets.elementalist && sets.elementalist.active.four) {
  setDmgReduc += game.player.elementalistStacks * 0.10;
}
// Elementalist aura: +25% elemental damage to enemies inside
// (handled in monster damage calculation, not here)

// Return set info alongside stats (add to return object):
return {
  maxHP: ..., atk: ..., ...,
  legendary: fx,
  sets,                          // NEW
  setDmgMult, setDmgReduc,       // NEW
};
```

- [ ] **Step 4: Commit**

```bash
git add js/sets.js js/player.js
git commit -m "feat: add set effects detection and stat integration"
```

---

### Task 4: Synergies Module — Synergy Detection

**Files:**
- Create: `js/synergies.js`
- Modify: `js/player.js`

- [ ] **Step 1: Create synergies.js**

```javascript
// js/synergies.js
import { game } from './game-state.js';
import { SYNERGY_DEFS } from './config.js';

export function getSynergies() {
  const present = new Set();
  for (const eq of Object.values(game.equipment)) {
    if (eq && eq.power && eq.power.stat) {
      present.add(eq.power.stat);
    }
  }
  const active = [];
  for (const def of SYNERGY_DEFS) {
    if (def.requires.every(r => present.has(r))) {
      active.push(def);
    }
  }
  return active;
}

// Called during gameplay to apply active synergy effects
export function getSynergyEffects() {
  const synergies = getSynergies();
  return {
    moltenCore: synergies.some(s => s.id === 'moltenCore'),
    deepFrost: synergies.some(s => s.id === 'deepFrost'),
    fireIce: synergies.some(s => s.id === 'fireIce'),
    temporalResonance: synergies.some(s => s.id === 'temporalResonance'),
    all: synergies,
  };
}
```

- [ ] **Step 2: Integrate synergies into calcPlayerStats()**

In `js/player.js`, add synergy info to the return object:

```javascript
import { getSynergyEffects } from './synergies.js';

// Inside calcPlayerStats(), add to return:
synergies: getSynergyEffects(),
```

- [ ] **Step 3: Commit**

```bash
git add js/synergies.js js/player.js
git commit -m "feat: add legendary synergy detection system"
```

---

### Task 5: Elementalist Set — Harmony Stack Logic

**Files:**
- Modify: `js/skills.js`
- Modify: `js/player.js`

- [ ] **Step 1: Add element tracking to castSkill()**

In `js/skills.js`, inject the `getSetEffects` import and add element tracking logic after the skill ID is identified (after the `switch(idx)` but before the specific case):

```javascript
import { getSetEffects } from './sets.js';

// At the top of castSkill(), after checking CD:
const sets = getSetEffects();
const hasElementalist = sets.elementalist && sets.elementalist.active.two;

// Determine element of this cast
let castElement = null;
switch (idx) {
  case 1: castElement = 'arcane'; break;  // Black Hole = arcane
  case 2: castElement = 'ice'; break;      // Blizzard = ice
}

// Elementalist harmony tracking
if (hasElementalist && castElement) {
  const p = game.player;
  if (castElement !== p.elementalistLastElement) {
    p.elementalistStacks = Math.min(3, p.elementalistStacks + 1);
  } else {
    p.elementalistStacks = 0; // same element = reset
  }
  p.elementalistLastElement = castElement;
}

// Fireballs (auto-attack) = fire element
// Set elementalistLastElement in updatePlayer where fireballs fire:
// In player.js updatePlayer(), after creating a projectile:
p.elementalistLastElement = 'fire';
// Track as autoAttackIsFire, handled in step 2
```

- [ ] **Step 2: Track fireball element in updatePlayer()**

In `js/player.js` `updatePlayer()`, where the fireball projectile is created (around line 83-93), add:

```javascript
// After creating a fireball projectile:
const sets = getSetEffects();
if (sets.elementalist && sets.elementalist.active.two) {
  // Auto-attack fireball = fire element
  if (p.elementalistLastElement !== 'fire') {
    p.elementalistStacks = Math.min(3, p.elementalistStacks + 1);
  } else {
    p.elementalistStacks = 0;
  }
  p.elementalistLastElement = 'fire';
}
```

- [ ] **Step 3: Trigger harmony burst at 3 stacks**

In `castSkill()`, if elementalist is active and stacks hit 3, spawn the meteor burst:

```javascript
// Inside castSkill(), after updating elementalistStacks:
if (hasElementalist && p.elementalistStacks === 3 && castElement) {
  // Harmony Burst: spawn 3 meteor projectiles
  for (let i = 0; i < 3; i++) {
    const spreadAngle = (i - 1) * 0.5; // spread
    const mx = wx + Math.cos(spreadAngle) * 60;
    const my = wy + Math.sin(spreadAngle) * 60;
    game.skillEffects.push({
      type: 'harmonyMeteor',
      x: mx, y: my,
      radius: 80,
      timer: 0.5, duration: 0.5,
      damage: stats.atk * 3,
    });
    spawnParticles(mx, my, 20, ['#ff4400','#4488ff','#aa44ff'][i], 100, 5);
  }
  p.elementalistStacks = 0;
  p.elementalistLastElement = null;

  // 4-piece: create elemental aura
  if (sets.elementalist && sets.elementalist.active.four) {
    p.elementalistAura = { x: wx, y: wy, timer: 5 };
  }
}
```

- [ ] **Step 4: Update skillEffects to handle harmonyMeteor type**

In `updateSkillEffects()`, add case for `harmonyMeteor`:

```javascript
case 'harmonyMeteor': {
  e.timer -= dt;
  if (e.timer <= 0) continue; // will be removed
  // Apply damage once at spawn or per tick
  // For simplicity: damage once on creation via a flag
  if (!e._damaged) {
    e._damaged = true;
    for (const m of game.monsters) {
      if (dist(m.x, m.y, e.x, e.y) < e.radius) {
        m.hp -= e.damage;
        spawnParticles(m.x, m.y, 5, '#ffaa00', 60, 3);
      }
    }
  }
  // Visual: expanding ring
  spawnParticles(e.x + rand(-e.radius, e.radius), e.y + rand(-e.radius, e.radius), 1, '#ffd700', 40, 2);
  break;
}
```

- [ ] **Step 5: Commit**

```bash
git add js/skills.js js/player.js
git commit -m "feat: implement Elementalist set — harmony stacks, burst, aura"
```

---

### Task 6: Chronomancer Set — Singularity Field & Implosion

**Files:**
- Modify: `js/skills.js`

- [ ] **Step 1: Create singularity field from Black Hole (2-piece)**

In `castSkill()`, case 1 (Black Hole), after the existing black hole creation, add:

```javascript
// After game.skillEffects.push for black hole...
const sets = getSetEffects();
if (sets.chronomancer && sets.chronomancer.active.two) {
  // Store that we need to create a singularity field when BH expires
  // We use a delayed skillEffect for this
  game.skillEffects.push({
    type: 'singularitySpawn',
    x: wx, y: wy,
    radius: 220,
    timer: dur, duration: dur, // triggers when BH expires
    damage: 0,
  });
}
```

- [ ] **Step 2: Handle singularitySpawn in updateSkillEffects()**

Add case for `singularitySpawn` in the switch:

```javascript
case 'singularitySpawn': {
  e.timer -= dt;
  if (e.timer <= 0) {
    // Spawn the actual singularity field
    const sets = getSetEffects();
    const fieldDur = sets.chronomancer && sets.chronomancer.active.four && game.equipment.artifact && game.equipment.artifact.artifactId === 'fieldGenerator' ? 10 : 4;
    game.player.singularityFields.push({
      x: e.x, y: e.y,
      radius: 220,
      timer: fieldDur,
      imploded: false,
    });
  }
  break;
}
```

- [ ] **Step 3: Blizzard triggers implosion (3-piece)**

In `castSkill()`, case 2 (Blizzard), check if cast point overlaps a singularity field:

```javascript
// After creating blizzard skillEffect...
const sets = getSetEffects();
if (sets.chronomancer && sets.chronomancer.active.three) {
  for (const f of game.player.singularityFields) {
    if (!f.imploded && dist(wx, wy, f.x, f.y) < f.radius) {
      // Implosion!
      f.imploded = true;
      game.skillEffects.push({
        type: 'singularityImplosion',
        x: f.x, y: f.y,
        radius: f.radius,
        timer: 1.0, duration: 1.0,
        damage: stats.atk * 5,
      });
      spawnParticles(f.x, f.y, 30, '#8844ff', 150, 6);

      // 4-piece: reduce all skill CDs by 3s
      if (sets.chronomancer.active.four) {
        for (let i = 0; i < 3; i++) {
          p.skillCooldowns[i] = Math.max(0, p.skillCooldowns[i] - 3);
        }
      }

      // If not using fieldGenerator artifact, consume the field
      const hasFieldGen = game.equipment.artifact && game.equipment.artifact.artifactId === 'fieldGenerator';
      if (!hasFieldGen) {
        f.timer = 0; // will be removed next frame
      }
      break;
    }
  }
}
```

- [ ] **Step 4: Handle singularityImplosion in updateSkillEffects()**

```javascript
case 'singularityImplosion': {
  e.timer -= dt;
  const progress = 1 - e.timer / e.duration;
  // Pull enemies inward
  for (const m of game.monsters) {
    const d = dist(m.x, m.y, e.x, e.y);
    if (d < e.radius * (1 + progress * 0.5) && d > 1) {
      const force = 400 * dt * (1 + progress);
      const n = normalize(e.x - m.x, e.y - m.y);
      m.x += n.x * force;
      m.y += n.y * force;
    }
  }
  if (e.timer <= 0) {
    // Final burst damage
    for (const m of game.monsters) {
      if (dist(m.x, m.y, e.x, e.y) < e.radius * 1.5) {
        m.hp -= e.damage;
      }
    }
    spawnParticles(e.x, e.y, 50, '#ff6600', 200, 7);
  }
  break;
}
```

- [ ] **Step 5: Teleport CD reset from standing in field (4-piece)**

In `updatePlayer()`, add after movement logic:

```javascript
const sets = getSetEffects();
if (sets.chronomancer && sets.chronomancer.active.four) {
  for (const f of p.singularityFields) {
    if (!f.imploded) {
      const d = dist(p.x, p.y, f.x, f.y);
      if (d < f.radius) {
        // Player is inside a singularity field
        if (!f._playerInsideSince) f._playerInsideSince = game.time;
        if (game.time - f._playerInsideSince >= 2) {
          p.skillCooldowns[0] = 0; // reset teleport CD
          f._playerInsideSince = game.time; // reset timer
        }
      } else {
        f._playerInsideSince = null;
      }
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add js/skills.js js/player.js
git commit -m "feat: implement Chronomancer set — singularity fields, implosion, teleport reset"
```

---

### Task 7: Synergy Effects — Ignite, Freeze, Fire-Ice, Temporal Resonance

**Files:**
- Modify: `js/projectiles.js`
- Modify: `js/monsters.js`
- Modify: `js/skills.js`

- [ ] **Step 1: Molten Core — fireball pierce damage ramp + ignite**

In `js/projectiles.js` `updateProjectiles()`, in the player-projectile-vs-monster collision, add ignite logic:

```javascript
// After dealing damage to monster m from projectile p:
import { getSynergyEffects } from './synergies.js';

const syn = getSynergyEffects();
if (syn.moltenCore && p.pierce >= 0 && p._pierceCount > 0) {
  // p._pierceCount tracks how many enemies already pierced
  dmg *= (1 + p._pierceCount * 0.10);
  if (p._pierceCount >= 3 && !p._ignited) {
    // Ignite the last enemy
    m.igniteTimer = m.igniteTimer || 0;
    m.igniteTimer = Math.max(m.igniteTimer, 3);
    m.igniteDmg = p.damage * 0.5;
    p._ignited = true;
  }
}
```

Also need to track `_pierceCount` — increment each time a monster is hit via pierce.

- [ ] **Step 2: Deep Frost — freeze from high slow%**

In `js/skills.js` `updateSkillEffects()`, in the blizzard case, after applying slow:

```javascript
const syn = getSynergyEffects();
if (syn.deepFrost && e.type === 'blizzard') {
  const cSlow = e.slowPct * 100; // as percentage
  if (cSlow > 70) {
    for (const m of game.monsters) {
      if (dist(m.x, m.y, e.x, e.y) < e.radius) {
        if (!m._lastFreezeTime || game.time - m._lastFreezeTime > 4) {
          m.frozen = true;
          m.frozenTimer = 1.5;
          m._lastFreezeTime = game.time;
          spawnParticles(m.x, m.y, 8, '#88ccff', 40, 3);
        }
      }
    }
  }
}
```

- [ ] **Step 3: Fire-Ice — fireball through blizzard gains dual element**

In `js/projectiles.js` `updateProjectiles()`, when player projectiles move, check if they pass through a blizzard skillEffect:

```javascript
if (syn.fireIce && !p.isEnemy && !p._fireIce) {
  for (const e of game.skillEffects) {
    if (e.type === 'blizzard' && dist(p.x, p.y, e.x, e.y) < e.radius) {
      p._fireIce = true;
      p.color = '#ff88ff'; // visual indicator
      break;
    }
  }
}

// Then in damage calc:
if (p._fireIce && m.frozen) {
  dmg *= 2; // double damage to frozen targets
}
```

- [ ] **Step 4: Temporal Resonance — teleport grants CD halving**

In `js/skills.js` `castSkill()`, case 0 (Teleport):

```javascript
const syn = getSynergyEffects();
if (syn.temporalResonance) {
  game.player.temporalResonanceTimer = 2; // 2-second window
}
```

Then in `castSkill()`, before applying CD to skills, check if temporal resonance is active:

```javascript
// Before setting skillCooldowns for case 1 or 2:
if (game.player.temporalResonanceTimer > 0) {
  cd = cd * 0.5; // halve CD
  game.player.temporalResonanceTimer = 0; // consumed
}
```

- [ ] **Step 5: Add ignite/frozen debuff processing in monsters.js**

In `js/monsters.js` `updateMonsters()`, add inside the per-monster loop:

```javascript
if (m.igniteTimer > 0) {
  m.igniteTimer -= dt;
  if (m.igniteTimer > 0) {
    m.hp -= m.igniteDmg * dt;
    spawnParticles(m.x + rand(-m.size, m.size), m.y + rand(-m.size, m.size), 1, '#ff4400', 20, 2);
  }
}
if (m.frozenTimer > 0) {
  m.frozenTimer -= dt;
  if (m.frozenTimer <= 0) {
    m.frozen = false;
  }
}
// If frozen, monster can't move
const spd = m.frozen ? 0 : m.speed * (m.slowMult || 1);
```

- [ ] **Step 6: Commit**

```bash
git add js/projectiles.js js/monsters.js js/skills.js
git commit -m "feat: implement 4 legendary synergies — molten core, deep frost, fire-ice, temporal resonance"
```

---

### Task 8: Artifact Effects

**Files:**
- Modify: `js/player.js`
- Modify: `js/skills.js`

- [ ] **Step 1: Add artifact effect application in calcPlayerStats()**

```javascript
// In calcPlayerStats(), after calculating stats:
const art = game.equipment.artifact;
if (art && art.artifactId === 'feather') {
  // 缓落之羽: HP > 80% → +25% skill damage, +20% movespeed
  const hpRatio = game.player.hp / Math.max(1, game.player.maxHp);
  if (hpRatio > 0.8) {
    const ratio = Math.min(1, (hpRatio - 0.8) / 0.2); // fade in
    atk = Math.round(atk * (1 + ratio * 0.25));
    // movespeed handled separately
  }
}
if (art && art.artifactId === 'criticalFragment') {
  // 临界碎片: any skill CD < 3s → +30% all skill damage
  const anyLowCD = game.player.skillCooldowns.some(cd => cd > 0 && cd < 3);
  if (anyLowCD) {
    atk = Math.round(atk * 1.30);
  }
}
```

- [ ] **Step 2: Apply artifact effects in castSkill**

For harmonyEye (elementalist artifact): modify harmony burst to track a single target:

```javascript
// In castSkill() where harmony burst fires:
const hasHarmonyEye = game.equipment.artifact && game.equipment.artifact.artifactId === 'harmonyEye';

if (hasHarmonyEye) {
  // Find nearest monster to mouse click
  let nearest = null, nearestDist = Infinity;
  for (const m of game.monsters) {
    const d = dist(wx, wy, m.x, m.y);
    if (d < nearestDist) { nearestDist = d; nearest = m; }
  }
  if (nearest) {
    // Single-target tracking meteor
    game.projectiles.push({
      x: p.x, y: p.y,
      vx: 0, vy: 0,
      damage: stats.atk * 3 * 1.5, // +50% damage
      size: 10, isEnemy: false, color: '#ffd700',
      life: 2, tracking: nearest, trackingSpeed: 300,
    });
    spawnParticles(p.x, p.y, 15, '#ffd700', 120, 5);
  }
} else {
  // Normal 3-meteor harmony burst (existing code from Task 5)
}
```

- [ ] **Step 3: Commit**

```bash
git add js/player.js js/skills.js
git commit -m "feat: implement artifact effects — harmony eye, field generator, feather, critical fragment"
```

---

### Task 9: Equipment Generation — Set Items & New Slots

**Files:**
- Modify: `js/equipment.js`
- Modify: `js/config.js` (may need set item templates)

- [ ] **Step 1: Add set quality and set item generation to rollQuality/rollBossQuality**

```javascript
// Add quality 4 to rollQuality (low chance):
export function rollQuality(){
  const r = Math.random();
  if (r < 0.40) return 0;
  if (r < 0.68) return 1;
  if (r < 0.85) return 2;
  if (r < 0.96) return 3;
  return 4; // set item (4%)
}

export function rollBossQuality(){
  const r = Math.random();
  if (r < 0.40) return 2;
  if (r < 0.82) return 3;
  return 4; // set item (18%)
}
```

- [ ] **Step 2: Add set item generation in generateEquipment()**

```javascript
// After creating the equipment object:
if (quality === 4) {
  // Pick a random set
  const setKeys = Object.keys(SET_DEFS);
  const setName = randChoice(setKeys);
  const def = SET_DEFS[setName];
  eq.setName = setName;
  eq.color = QUALITY_COLORS[4];
  eq.name = QUALITY_NAMES[4] + ' ' + def.name + ' ' + SLOT_DEF[slot].name + ' [' + ilvl + ']';
  // Set items don't have legendary powers; their power is the set bonus
  eq.power = null;
}
```

- [ ] **Step 3: Ensure set items only drop for valid set slots**

```javascript
// In generateEquipment, if quality === 4, restrict slot to valid set slots:
if (quality === 4) {
  const setKeys = Object.keys(SET_DEFS);
  const setName = randChoice(setKeys);
  const def = SET_DEFS[setName];
  // Override slot to be a valid part for this set
  slot = randChoice(def.parts); // FIX: we receive 'slot' as param, need to handle differently
}

// Actually, it's cleaner to handle this in tryDropEquipment:
```

- [ ] **Step 4: Add artifact generation**

```javascript
export function generateArtifact(boss, stageIdx) {
  const ilvl = rollIlvl(stageIdx);
  const quality = boss ? rollBossQuality() : rollQuality();
  const artDef = randChoice(ARTIFACT_DEFS);
  return {
    slot: 'artifact',
    quality: Math.min(quality, 3), // artifacts are legendary max (or set-equivalent)
    ilvl,
    statValue: 0,
    name: QUALITY_NAMES[Math.min(quality, 3)] + artDef.name + ' [' + ilvl + ']',
    color: QUALITY_COLORS[Math.min(quality, 3)],
    stat: 'artifact',
    power: null,
    artifactId: artDef.id,
    setName: artDef.setName,
  };
}
```

- [ ] **Step 5: Expand drop slots to include new slots**

```javascript
// In tryDropEquipment:
const slots = ['weapon','helmet','armor','ring','amulet','boots','bracers','belt','artifact'];
const slot = randChoice(slots);
if (slot === 'artifact') {
  // Use artifact generation
  const art = generateArtifact(boss, stageIdx);
  if (art) game.drops.push({x, y, ...art, bobPhase: Math.random()*Math.PI*2});
  return;
}
// ... existing logic for other slots
```

- [ ] **Step 6: Commit**

```bash
git add js/equipment.js
git commit -m "feat: add set item and artifact generation, expand drop slots to 9"
```

---

### Task 10: Renderer — New Slots, Set Display, VFX

**Files:**
- Modify: `js/renderer.js`

This is the largest visual task. Key changes:

- [ ] **Step 1: Expand prepare screen equipment grid to 9 slots**

In `renderPrepare()`, change the equipment grid from 6 to 9 slots. Change the grid layout:

```javascript
const slots = ['weapon','helmet','armor','ring','amulet','boots','bracers','belt','artifact'];
const slotNames = ['武器','头盔','护甲','戒指','项链','靴子','护腕','腰带','法器'];
const cols = 3, rows = 3;
const cellW = 80, cellH = 60;

// Adjust the grid box height
const eh = 280; // was 260, expanded for 3rd row
```

- [ ] **Step 2: Display set item name in green with set indicator**

In the equip slot rendering:
```javascript
if (eq) {
  ctx.fillStyle = QUALITY_COLORS[eq.quality] || '#aaa'; // 4 = green
  ctx.font = 'bold 11px sans-serif';
  const displayName = eq.quality === 4 ? '【' + eq.setName + '】' + eq.name.substring(2) : eq.name;
  ctx.fillText(displayName, cx+cellW/2, cy+35);
  if (eq.quality === 4) {
    ctx.fillStyle = '#44ff44';
    ctx.font = '9px sans-serif';
    ctx.fillText('套装', cx+cellW/2, cy+50);
  }
}
```

- [ ] **Step 3: Render singularity fields in game world**

In `renderSkillEffects()`, add rendering for singularity fields from `game.player.singularityFields`:

```javascript
// After existing skill effects loop, render singularity fields:
for (const f of game.player.singularityFields) {
  const sx = f.x - game.camera.x;
  const sy = f.y - game.camera.y;
  if (sx < -200 || sx > canvas.width+200 || sy < -200 || sy > canvas.height+200) continue;

  // Pulsing ring
  const pulse = 0.9 + Math.sin(game.time * 2) * 0.1;
  ctx.strokeStyle = `rgba(100, 180, 255, ${0.4 + Math.sin(game.time*3)*0.2})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.arc(sx, sy, f.radius * pulse, 0, Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Translucent fill
  ctx.fillStyle = 'rgba(50, 100, 200, 0.15)';
  ctx.beginPath();
  ctx.arc(sx, sy, f.radius, 0, Math.PI*2);
  ctx.fill();

  // Label
  if (!f.imploded) {
    ctx.fillStyle = 'rgba(150,200,255,0.8)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('奇点力场', sx, sy - f.radius - 8);
  }
}
```

- [ ] **Step 4: Render elementalist aura**

```javascript
if (game.player.elementalistAura) {
  const a = game.player.elementalistAura;
  const sx = a.x - game.camera.x;
  const sy = a.y - game.camera.y;
  const alpha = 0.2 + Math.sin(game.time * 4) * 0.1;
  ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
  ctx.beginPath();
  ctx.arc(sx, sy, 200, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 200, 50, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(sx, sy, 200, 0, Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);
}
```

- [ ] **Step 5: Render harmony meteor VFX**

In `renderSkillEffects()`, add case for `harmonyMeteor`:
```javascript
else if (e.type === 'harmonyMeteor') {
  const progress = 1 - e.timer / e.duration;
  const currentRadius = e.radius * progress;
  ctx.strokeStyle = `rgba(255, 200, 50, ${1-progress})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, sy, currentRadius, 0, Math.PI*2);
  ctx.stroke();
}
```

- [ ] **Step 6: Render active synergies indicator in HUD**

In `renderHUD()`, add a small synergy indicator if any are active:
```javascript
const synergies = calcPlayerStats().synergies;
if (synergies && synergies.all.length > 0) {
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#ffaa00';
  ctx.textAlign = 'right';
  ctx.fillText('★协同: ' + synergies.all.map(s => s.name).join(' '), W - 10, 86);
}
```

- [ ] **Step 7: Render artifact special display**

In the equip grid, for artifact slot, show artifact name and effect description:
```javascript
if (slots[i] === 'artifact' && eq) {
  ctx.fillStyle = '#ffd700';
  ctx.font = '9px sans-serif';
  ctx.fillText(eq.name, cx+cellW/2, cy+50);
}
```

- [ ] **Step 8: Commit**

```bash
git add js/renderer.js
git commit -m "feat: render new equipment slots, set effects VFX, synergy indicators"
```

---

### Task 11: Persistence — Save/Load Expanded State

**Files:**
- Modify: `js/persistence.js`

- [ ] **Step 1: Update save/load for 9-slot equipment**

In `loadGame()`, after syncing character equipment, ensure new slots default to null:

```javascript
// In syncCharToPlayer or loadGame, ensure all 9 slots exist:
const defaultEq = {weapon:null,helmet:null,armor:null,ring:null,amulet:null,boots:null,bracers:null,belt:null,artifact:null};
c.equipment = { ...defaultEq, ...c.equipment };
```

- [ ] **Step 2: Commit**

```bash
git add js/persistence.js
git commit -m "feat: persist expanded 9-slot equipment"
```

---

### Task 12: Gameplay Integration — Wire Everything Together

**Files:**
- Modify: `js/gameplay.js`

- [ ] **Step 1: Call updateSetEffects() each frame**

In `gameLoop()`, add after `updatePlayer(dt)`:
```javascript
import { updateSetEffects } from './sets.js';

// In gameLoop, after updatePlayer(dt):
updateSetEffects(dt);
```

- [ ] **Step 2: Reset set state on stage start**

In both `startGame()` and `startTestStage()`, add state resets:
```javascript
game.player.elementalistStacks = 0;
game.player.elementalistLastElement = null;
game.player.elementalistAura = null;
game.player.singularityFields = [];
game.player.temporalResonanceTimer = 0;
```

- [ ] **Step 3: Commit**

```bash
git add js/gameplay.js
git commit -m "feat: integrate set/synergy updates into game loop"
```

---

### Task 13: Integration Test — Verify Everything Works

**Files:**
- Manual verification in browser

- [ ] **Step 1: Start a dev server and test basic functionality**

```bash
# Start a local server
cd D:\claw\projects\diablo_lite
npx serve . --listen 3000
```

Verify:
1. Prepare screen shows 9 equipment slots (3x3 grid)
2. Set items show in green with set name prefix
3. Artifact slot shows artifact name
4. Drop tables include bracers/belt/artifact

- [ ] **Step 2: Test Elementalist set mechanics**

Verify:
1. Equipping 2+ Elementalist pieces activates harmony tracking
2. Fireball → Blizzard → Black Hole cycle builds stacks (visible in HUD or log)
3. Same skill repeated resets stacks
4. 3 stacks triggers harmony burst (3 meteors visible)
5. 4-piece shows elemental aura after burst

- [ ] **Step 3: Test Chronomancer set mechanics**

Verify:
1. Equipping 2+ Chronomancer pieces: Black Hole leaves singularity field (visible blue ring)
2. 3-piece: casting Blizzard on field triggers implosion (pull + burst)
3. 4-piece: standing in field resets teleport; implosion reduces all CDs

- [ ] **Step 4: Test synergy effects**

Verify:
1. Equip pierce + fireballDmg → Molten Core: pierce damage ramps, ignite at 3+
2. Equip blizzardSize + blizzardSlow → Deep Frost: frozen enemies in blizzard
3. Equip pierce + blizzardSize → Fire-Ice: fireballs through blizzard double-hit frozen
4. Equip globalCDR + teleportCD → Temporal Resonance: teleport → next skill CD halved

- [ ] **Step 5: Fix any issues and commit final changes**

```bash
git add -A
git commit -m "fix: integration fixes for build constraint system"
```
