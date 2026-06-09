---
type: concept
title: "技能原子/光环/Buff 三层架构"
created: 2026-06-09
updated: 2026-06-09
tags: [architecture, skill, aura, buff, atom, presentation]
status: developing
related: ["[[Config-Driven-Buff-System]]", "[[Build-Constraint-System]]"]
---

# 技能原子/光环/Buff 三层架构

## 核心关系

```
技能 (玩家动作)
  ├── spawnAura ──→ 光环 (地面区域,每tick驱动)
  │                   └── modifier → 施加 Buff 到范围内实体
  ├── applyBuff ──→ Buff (附着实体,有时长)
  ├── movement      (自身位移)
  ├── stateTrack    (追踪叠层/计时器)
  └── cooldownMod   (设置冷却)

因果链: 技能 → 光环 → Buff
       技能 → Buff (直接)
```

三者不是并列概念——是"动作→区域→状态"的因果链。

## 技能原子（6 种）

技能不再是 switch-case 大块，而是原子列表。`castSkill` 变为统一执行器遍历 `atoms[]`。

| 原子 | 作用 | 消除的 copy-paste |
|------|------|-------------------|
| `movement` | 瞬间位移 | 传送专属 |
| `spawnAura` | 创建地面光环（调用 createAura） | 6 个 skillEffects.push |
| `applyBuff` | 直接向实体施加 Buff | ghost |
| `stateTrack` | 读写 player 状态（元素叠层/计时器） | **3 处元素追踪 → 1 处** |
| `cooldownMod` | 设技能 CD + 条件缩减 | **2 处时空共鸣 → 1 处** |
| `conditional` | 条件满足时执行子原子 | 谐律爆发/内爆/套装门槛 |

## 光环 = 地面区域 + modifier 列表

光环是 `spawnAura` 创建的运行时对象。`js/atoms/aura-engine.js` 的 `tickAuras(dt)` 替代了 `updateSkillEffects` 的 140 行 switch。

每个光环有: `{ style, x, y, radius, duration, tickInterval, affects, modifiers[] }`

### 7 种光环

| style | 半径 | 时长 | tick | modifiers |
|-------|------|------|------|-----------|
| `blackhole` | 220 | 2.5s | 每帧 | `pull(180,player*0.3)` `damageTick(8)` `applyBuff(vulnerable)` |
| `blizzard` | 260 | 3s | 0.5s | `damageTick(22)` `applyBuff(slow)` → conditional(deepFrost→freeze) |
| `poisonPool` | 50 | 4s | 每帧 | `damageTick`(仅玩家) |
| `harmonyMeteor` | 80 | 0.5s | 单次 | `damageTick(singleShot)` |
| `singularityImplosion` | 220 | 1s | 每帧+终结 | `pull(escalating)` `damageTick(atk*5,onEnd)` |
| `singularityField` | 220 | 4s | 每帧 | `onTick: 玩家在内2s→resetCD(传送)` |
| `elementalistAura` | 200 | 5s | — | 当前仅视觉 |

### modifier 类型

| modifier | 作用 | dt 缩放 |
|----------|------|---------|
| `damageTick` | 造成伤害（连续/间隔/单发/终结） | tickInterval=0 时乘 dt |
| `pull` | 拉向中心（恒定/递增） | 乘 dt |
| `applyBuff` | 向实体施加 Buff（刷新/不刷新） | — |
| `onEnd` | 光环到期时触发（burst 伤害+粒子） | — |

## Buff = 实体上的状态修改器

已由 `buff-engine.js` + `buff-table.js` 管理。光环的 `applyBuff` modifier 本质是"每 tick/进入时，向实体施加指定 Buff"。

| Buff | 目标 | 时长 | 效果 | 施加方式 |
|------|------|------|------|---------|
| ghost | 玩家 | 2s | 减伤50% | 技能直接(传送→applyBuff) |
| vulnerable | 怪物 | 3s | 受伤×1.5 | 黑洞光环→applyBuff |
| slow | 怪物 | 0.5s | 速度×slowMult | 暴雪光环→applyBuff |
| frozen | 怪物 | 1.5s | 速度=0 | 暴雪光环→conditional(deepFrost) |
| ignite | 怪物 | 3s | DoT | 弹道(熔火协同) |

## 表现层分离

`js/atoms/skill-presentation.js` 是唯一引用 `particles.js`/`audio.js`/`renderer.js` 的文件。

引擎层（aura-engine、atom-executor、skills.js）只调用 `present.xxx()`：

```js
present.skillCast('blackhole', wx, wy);     // SFX + 粒子
present.auraSpawn({style, x, y});           // 光环诞生粒子
present.auraTick(aura);                      // per-tick 粒子
present.auraEnd(aura);                       // 终结 burst 粒子
present.damageNumber(x, y, dmg);            // 浮动伤害数字
present.monsterHitParticle(m, color, ...);   // 命中粒子
present.harmonyMeteorSpawn(x, y, i);        // 谐律流星粒子
```

换 VFX 只需改这一个文件，引擎不动。

## 文件结构

```
js/atoms/
  atom-defs.js           — 6 种原子类型注册 + executor
  atom-executor.js       — 统一执行器: 遍历 atoms[] → 调 executor
  aura-defs.js           — 7 种光环 style + modifier 列表 (纯数据)
  aura-engine.js         — tickAuras() + modifier 执行器
  skill-presentation.js  — 所有视觉/音频反馈 (唯一引 particles/audio)
```

## 代码消除

| 位置 | 移除 | 替换 |
|------|------|------|
| skills.js castSkill switch | ~170行 | createAura + present |
| skills.js updateSkillEffects switch | ~140行 | tickAuras() |
| skills.js 元素追踪 ×2 | ~15行 | stateTrack 原子(待 Phase 4) |
| skills.js 时空共鸣 ×2 | ~10行 | cooldownMod 原子(待 Phase 4) |
| renderer.js renderSkillEffects | ~73行 | activeAuras 遍历(style 分发) |
