---
type: concept
title: "装备数据流转陷阱"
created: 2026-06-09
updated: 2026-06-09
tags: [equipment, bug, data-flow, anti-pattern]
status: seed
related: ["[[concepts/Equipment|装备系统]]", "[[concepts/Build-Constraint-System|Build 约束体系]]"]
---

# 装备数据流转陷阱

装备对象在多个系统间流转时，存在**手工重建对象**的反模式，导致新增字段被静默丢失。

## 反模式

装备在各流转点不是用 spread (`{...item}`) 或统一序列化函数，而是在每个转移点手工列举字段：

```js
// 反模式：手工重建（丢字段）
game.backpack.push({
  slot: d.slot, quality: d.quality, ilvl: d.ilvl,
  statValue: d.statValue, stat: d.stat, name: d.name,
  color: d.color, power: d.power || null
  // 遗漏: artifactId, setName, desc
});
```

## 装备流转链路

```
generateEquipment / generateArtifact
  → game.drops (地面掉落)
    → updatePickup (自动拾取)
      → game.backpack (背包)
        → equipFromBackpack (装备)
          → game.equipment[slot]
            → unequip (卸下) → game.backpack
        → ✕ 丢弃 → game.drops
```

## 受影响字段

后加入装备对象的字段最容易被遗漏：

| 字段 | 用途 | 加入时间 |
|------|------|---------|
| `artifactId` | 法器 ID，驱动法器特效 | Build 约束体系 |
| `setName` | 套装名，用于套装检测 | Build 约束体系 |
| `desc` | 法器描述文字，UI 显示 | Build 约束体系 |

## 2026-06-09 修复的三处流转 Bug

### Bug 1: 法器词条不显示（字段丢失）

**现象**: 传说力场发生器在背包里显示 `?+0`，没有描述文字。

**根因**: 4 个流转点的物品重建代码遗漏了 `artifactId`、`setName`、`desc`：
- `equipment.js:updatePickup()` — 自动拾取
- `renderer.js:pickupGroundItem()` — 胜利界面拾取
- `renderer.js:equipFromBackpack()` — 装备到槽位
- `equipment.js:generateArtifact()` — 生成时未写入 `desc`

**修复**: 补全字段 + `generateArtifact()` 写入 `desc:artDef.desc` + 渲染层对法器显示描述而非 `?+0`。

### Bug 2: 背包满时物品消失

**现象**: 背包 8/8 时走过装备，物品从地面消失但不进背包。

**根因**: `equipment.js:updatePickup()` 中 `game.drops.splice(i,1)` 在 `if(backpack.length<8)` 块**外面**。

**修复**: 将 splice 移入 if 块内 — 背包满时物品留在地上。

### Bug 3: 丢弃装备不回地面

**现象**: 在背包里点 ✕ 丢弃装备，装备消失而不是掉回地上。

**根因**: 两重问题 —
1. 丢弃代码只有 `game.backpack.splice(i,1)`，未创建掉落物
2. 初始修复创建掉落物在玩家脚底 (`player.x, player.y`)，关闭背包后 `updatePickup()` 恢复运行，距离为 0 < 40px 拾取范围，瞬间被捡回

**修复**: 丢弃时创建掉落物，位置偏移 ±80px（`(Math.random()-0.5)*160`），超出 40px 自动拾取范围。

## 教训

1. **新增装备字段时需排查所有流转点** — 至少有 7 处手工重建物品对象
2. **优先用 spread 模式** — `{...item}` 自动携带所有字段，不易遗漏
3. **背包满时不应移除掉落物** — splice 必须在有条件判断的块内
4. **丢弃位置需偏移** — 原点落在拾取范围内会被瞬间回收
