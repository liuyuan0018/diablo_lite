---
type: concept
title: "Arcane Dynamo Snapshotting"
domain: d3-wizard-builds
aliases: ["奥能迸发快照", "Dynamo snapshot", "5层快照"]
created: 2026-06-07
updated: 2026-06-07
tags: [research, d3-wizard-builds, game-mechanics]
status: seed
related: ["[[Attack-Speed-Breakpoints]]", "[[Typhon-Veil-Set]]"]
---

# Arcane Dynamo Snapshotting

Diablo 3 法师关键伤害机制：**Arcane Dynamo** 被动（5 次招牌技能后下一个非招牌技能获得 60% 独立增伤）可以被 **Hydra** 快照（snapshot）。

## 快照机制

释放 Hydra 时如果带有 5 层 Arcane Dynamo：
- Hydra 的**整个持续期间**享受 60% 独立增伤
- 即使 Arcane Dynamo 层之后消失，已释放的 Hydra 仍享受增益
- 新释放的 Hydra 需要重新叠 5 层

## 应用场景

- **Typhon Frost Hydra:** 用 Spectral Blade (Barrier Blades) 叠 5 层 → 释放两条 Frost Hydra
- **LoD Mammoth Hydra:** 同样机制，释放 Mammoth Hydra
- **注意:** Blizzard 和 Black Hole 会消耗 Arcane Dynamo 层，必须先放蛇再用这些技能

## 与其他快照的互动

- **Black Hole Absolute Zero:** 冰伤加成叠层也在放蛇时快照
- **Elemental Exposure:** DEBUFF 在怪身上即时更新，蛇的伤害实时受益
- **CoE 元素戒:** 蛇释放时的元素类型决定 CoE 计算，但 CoE 不是快照，实时生效
