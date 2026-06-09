---
type: concept
title: "配置驱动的 Buff/装备系统"
created: 2026-06-09
updated: 2026-06-09
tags: [architecture, buff, equipment, config, refactor]
status: developing
related: ["[[Equipment-Data-Flow-Pitfalls]]", "[[Build-Constraint-System]]", "[[LegendaryPowers]]", "[[Equipment]]"]
---

# 配置驱动的 Buff/装备系统

将 Diablo Lite 的装备效果系统从硬编码 if-else 重构为三张配置表 + 两个运行时引擎。

## 架构

```
config/
  buff-table.js         ← 所有 stat Buff 的数据行
  equipment-table.js    ← SLOT_DEF / ARTIFACT_DEFS / 品质常量 / 名字格式
  drop-table.js         ← 品质掉落曲线 / 词条池 / 加权随机
  skill-hooks.js        ← 5 个技能钩子，每条 {id, condition, apply}
buff-engine.js          ← 运行时：rebuildAllBuffs → evaluateStatCalc → getActiveBuffs
                        ← 同时承担 dispatchHook（技能修改器 dispatch）
equipment-factory.js    ← 所有生成函数：generateEquipment / generateArtifact / rollQuality 等
```

## 三张表

### Buff 表 (`buff-table.js`)

每一行 Buff 描述一个 stat 效果：

```js
{ id, name, color, detail, hidden?, condition?, effects: [{ attr, op: 'add'|'mul', value }] }
```

- **STAT_BUFF_MAP**: 装备属性隐式 buff（atk→stat_atk 等），hided=true
- **LEGENDARY_BUFF_DEFS**: 传说威能的 stat 效果。fireballDmg 效果为空（只影响 bATK，手工处理）。globalCDR 通过 `{ attr: 'cdr', op: 'add', value: '${value}' }` 生效
- **ARTIFACT_BUFF_DEFS**: feather（HP>80%，atk+25%+移速+20%）、criticalFragment（CD<3s，atk+30%）
- **SET_BUFF_DEFS**: elementalist dmg/dr，condition 为 `setCount` 类型
- **SKILL_BUFF_DEFS**: ghost（2s 减伤50%），effect 为空（在 damagePlayer 手工处理）

### 装备表 (`equipment-table.js`)

单文件包含：SLOT_DEF（对象格式保留向后兼容）、QUALITY_NAMES/COLORS/MULT、ARTIFACT_DEFS、formatItemName。

config.js 改为 import + re-export，消除重复定义。

### 掉落表 (`drop-table.js`)

品质权重曲线，每行自带 `condition` 控制可用性：

```js
QUALITY_CURVE = {
  normal: [
    { quality: 0, weight: 40, condition: null },
    { quality: 1, weight: 28, condition: null },
    { quality: 2, weight: 17, condition: null },
    { quality: 3, weight: 11, condition: null },
    { quality: 4, weight: 4,  condition: { type: 'minStage', value: 3 } },
  ],
  boss: [
    { quality: 2, weight: 40, condition: null },
    { quality: 3, weight: 42, condition: null },
    { quality: 4, weight: 18, condition: { type: 'minStage', value: 3 } },
  ],
}
```

`weightedChoice(items, ctx)` 先按 condition 过滤行，再在剩余行上加权随机。ctx 传入 `{ stageIdx }`。condition 不匹配的行被排除，权重自动重新归一化。不再需要 `Math.min(q, cap)` 之类的外置限制逻辑。

`condition` 字段在 `evalCondition` 中求值，支持扩展类型（当前 `minStage`）。

## 两个引擎

### Buff Engine

- `rebuildAllBuffs(sandbox)`: 遍历所有装备槽位，重建 buff 实例列表。保留计时 buff，重新添加装备 buff。每个 calcPlayerStats 调用都会触发
- `evaluateStatCalc()`: 遍历所有活跃实例，检查 condition，聚合 effects 为 `{attr: {add, mul}}`
- `getActiveBuffs()`: 返回非 hidden 且 condition 通过的 buff，供 buff bar 渲染
- `addTimedBuff`/`tickTimedBuffs`: 计时 buff 的添加和过期清理
- `dispatchHook(hookName, state, ctx)`: 技能钩子 dispatch

### Skill Hook System

5 个钩子，每个是 `[{id, condition, apply}]` 数组：

| 钩子 | 修改的参数 | 对应效果 |
|------|-----------|---------|
| onTeleportCast | cooldown, spawnEffects[] | teleportCD, blackholeSize |
| onBlackholeCast | radius, duration, tickDmg, spawnEffects[] | blackholeDur, chronomancer2, fireballDmg, singularity spawn |
| onBlizzardCast | radius, slowPct, tickDmg | blizzardSize, blizzardSlow, fireballDmg |
| onProjectileSpawn | pierce | pierce count |
| onSingularitySpawn | duration | fieldGenerator (+3s) |

ctx 包含 `{fx, sets, player, equipment}` 供 condition 判断。

**未配置化的**：chronomancer 3/4 内爆逻辑、elementalist 谐律叠层/爆发、harmonyEye 追踪弹、ringElement 轮转、synergies（点燃/冻结/双倍伤害/CD减半）——这些是复杂多步骤条件逻辑，不适合钩子范式。

## 设计原则

1. **属性是元数据，不可配置**：atk、maxHp、cdr 等是引擎概念，Buff 通过 `{attr: 'atk', op: 'mul', value: 0.25}` 引用
2. **fireballDmg 不进 Buff Engine**：它只乘 bATK 不乘 baseATK（`baseATK + bATK * (1+fireballDmg/100)`），表达式语义和通用 mul 不一致，留在 calcPlayerStats 手工处理
3. **config.js 向后兼容**：所有旧 import 路径仍工作（config.js re-export 自 equipment-table.js）
4. **无循环导入**：equipment-table.js → leaf、drop-table.js → leaf、skill-hooks.js → leaf、buff-engine → game-state（单向）

## 当前可配置范围

| 需求 | 改动位置 | 无需改代码 |
|------|---------|-----------|
| 加法器 stat 效果 | buff-table.js 加一行 | ✓ |
| 加传奇威能 stat 效果 | buff-table.js + LEGENDARY_POWERS | ✓ |
| 加技能参数修改 | skill-hooks.js 对应钩子加一条 | ✓ |
| 调品质掉落概率 | drop-table.js QUALITY_CURVE 改 weight | ✓ |
| 改槽位基础属性 | equipment-table.js SLOT_DEF 改 base | ✓ |
| 新增条件类型 | buff-engine.js _evalCondition 加 case | 需 ~5 行 |
| 新增钩子点 | skill-hooks.js + 代码中加 dispatchHook 调用 | 需 ~10 行 |
