---
type: concept
title: "Attack Speed Breakpoints (Hydra)"
domain: d3-wizard-builds
aliases: ["攻速断点", "FPA breakpoints"]
created: 2026-06-07
updated: 2026-06-07
tags: [research, d3-wizard-builds, game-mechanics]
status: seed
related: ["[[Typhon-Veil-Set]]", "[[Maxroll-Typhon-Hydra-Guide]]", "[[Arcane-Dynamo-Snapshotting]]"]
---

# Attack Speed Breakpoints (Hydra)

Diablo 3 中 Hydra 的攻击速率不是连续线性增长，而是按**帧数阈值（FPA, Frames Per Attack）**跳跃，只有达到特定断点才提升攻击速度。

## 关键断点（Typhon Frost Hydra）

| FPA | 面板 APS | 条件 |
|-----|---------|------|
| 36 FPA | ~1.72 | 基础 + 少量 AS |
| 30 FPA | 1.86 | 1.4 基础 + 10% 巅峰 + 7% 武器 + 2×7% 装备 + 50% Tasker |
| 24 FPA | ~2.29 | S38 Ethereal Wizardspike + 50% Tasker |

- 30 FPA → 36 FPA：~20% 伤害差距
- 24 FPA → 30 FPA：~25% 伤害差距

## 关键机制

1. **Tasker and Theo:** 40-50% 宠物攻速独立乘区，品质差异可意味着 2 条主属的差距
2. **面板攻速:** 来自装备/%攻速词缀
3. **必须达到阈值，多出的攻速无收益**

## 其他 Hydra build 的差异

- **LoD Mammoth Hydra:** 同样需要 30 FPA，但 Mammoth 只有 1 个头，不依赖多头
- 火池展开速度固定（10 码/0.3 秒），不受攻速影响；攻速只影响攻击频率
