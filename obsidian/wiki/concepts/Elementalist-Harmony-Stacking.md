---
type: concept
title: "元素使谐律叠层机制"
aliases: ["Harmony Stacking", "谐律层数", "elementalistStacks"]
created: 2026-06-08
updated: 2026-06-08
tags: [elementalist, mechanic, stacking, elemental-rotation, bug-fix]
status: developing
related: ["[[entities/Elementalist-Set]]", "[[concepts/Build-Constraint-System]]", "[[Skills]]"]
---

# 元素使谐律叠层机制

元素使套装的谐律（Harmony）叠层系统，要求玩家**交替使用不同元素技能**来构建层数，3层时触发谐律爆发（Harmony Burst）。

## 核心规则

| 规则 | 说明 |
|------|------|
| 不同元素递增 | `castElement !== elementalistLastElement` → stacks +1 |
| 同元素重置 | `castElement === elementalistLastElement` → stacks = 1（该技能成为新周期第一层） |
| 上限 3 层 | `Math.min(3, stacks + 1)`，3 层后不再递增 |
| 3 层爆发 | 下一个技能施放时触发 Harmony Burst，层数归零 |

## 元素来源

| 来源 | 元素 | 类型 |
|------|------|------|
| 黑洞（技能 1） | arcane | 主动技能 |
| 暴风雪（技能 2） | ice | 主动技能 |
| 自动攻击火球 | fire | 被动（癞子牌） |

## 自动攻击的特殊处理（癞子牌）

自动攻击火球遵循特殊规则——它是"癞子牌"（wildcard），每个技能周期只能贡献**一次**：

- `elementalistAutoUsed = false` 且 `lastElement !== 'fire'` → 叠层 +1，设置 `autoUsed = true`
- `elementalistAutoUsed = true` → 跳过，不叠层
- **不修改** `elementalistLastElement`——火球不改变元素追踪链，`lastElement` 保持为上一个主动技能的元素

每次手动施放技能时 `autoUsed` 重置为 `false`，火球可以在新周期中再次桥接。

此设计防止了"黑洞→火球→火球→暴风雪"的连续火球刷层，但允许"黑洞→火球→暴风雪"的正确三元素循环。

## 交互场景

| 序列 | 结果 | 说明 |
|------|------|------|
| 黑洞→火球→暴风雪 | stacks=3 ✓ | 三元素各贡献一层，触发爆发 |
| 黑洞→火球→黑洞 | stacks=1 | arcane 重复，重置为 1 |
| 黑洞→火球→火球→暴风雪 | stacks=3 ✓ | 第二个火球被 autoUsed 拦截 |
| 连续火球 | stacks=1 | 仅第一发生效，后续跳过 |
| 黑洞→黑洞 | stacks=1 | 同元素重置，非 0 |

## 实现位置

- `game-state.js:40-42` — `elementalistStacks`, `elementalistLastElement`, `elementalistAutoUsed` 初始化
- `player.js:191-197` — 自动攻击火球的癞子牌逻辑
- `skills.js:61-70,115-124` — 黑洞/暴风雪的元素追踪与 autoUsed 重置
- `skills.js:135-179` — Harmony Burst 触发与重置
- `gameplay.js:49-51,104-106,155-157` — 关卡切换时重置所有元素状态
