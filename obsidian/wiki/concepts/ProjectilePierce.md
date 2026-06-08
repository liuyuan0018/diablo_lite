---
type: concept
title: "火球穿透机制"
created: 2026-06-07
updated: 2026-06-07
tags: [projectile, pierce, fireball, penetration, bugfix]
status: mature
related: ["[[concepts/LegendaryPowers|传奇词缀]]", "[[concepts/Skills|技能系统]]", "[[entities/Monsters|怪物系统]]"]
---

# 火球穿透机制

穿透火球（pierce）是传奇词缀之一，允许火球击中怪物后继续飞行并攻击额外目标。

## 实现原理

火球穿透由三层机制协作实现：

### 1. 穿透计数器（pierce counter）

火球创建时携带 `pierce` 值，来源为 `getLegendaryEffects().pierce`（所有已装备"穿透火球"词缀的累加值，范围 1-4）：

```
game.projectiles.push({
  ...
  pierce: fx.pierce || 0,
});
```

每次命中怪物后 `pierce--`。当 `pierce` 降到 0 后，下一次命中将销毁火球。

结果：`pierce = N` 的火球最多命中 **1 + N** 个敌人（1 次基础命中 + N 次穿透命中）。

### 2. 命中记录集（_hitMonsters Set）

每个火球维护一个 `_hitMonsters` Set，记录已命中过的怪物 ID。碰撞检测时先检查目标是否已被此火球命中过，避免同一火球对同一怪物重复造成伤害：

```
if (p._hitMonsters && p._hitMonsters.has(m.id)) continue;
```

### 3. 同帧多目标检测

穿透后不退出怪物遍历循环，允许同一帧内命中多个重叠的怪物。直到穿透次数耗尽才 `break` 并销毁火球。

## 关键约束：怪物必须有唯一 ID

`_hitMonsters` 是 `Set`，依赖 `m.id` 区分怪物。**所有怪物必须通过 `createMonster()` 创建**，该函数使用全局计数器 `nextMonsterId` 分配唯一 ID。

如果怪物通过其他途径创建且未分配 `id`，所有怪物的 `m.id === undefined`，`Set.has(undefined)` 在首次命中后永远返回 `true`，导致穿透完全失效。

## Bug 记录（2026-06-07 修复）

**症状：** 穿透火球装备后没有穿透效果。

**根因 1（主要）：** `createMonster()` 未给怪物分配 `id` 字段。所有怪物 `m.id === undefined`，`_hitMonsters` Set 无法区分怪物，首击后所有后续命中均被误判为"已命中"并跳过。

**修复：** 添加 `let nextMonsterId = 1` 全局计数器，在 `createMonster()` 中为每个怪物分配 `id: nextMonsterId++`。

**根因 2（次要）：** 碰撞循环中 `break` 在 if/else 外部无条件执行，即使有剩余穿透次数也每帧只能命中一个怪物。密集怪群中火球飞过后浪费穿透次数。

**修复：** 将 `break` 移入 `else` 分支，仅当穿透次数耗尽销毁火球时才退出循环。
