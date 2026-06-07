---
type: concept
title: "Build 系统"
created: 2026-06-07
updated: 2026-06-07
tags: [build, legendary, powers, synergy, set, artifact]
status: developing
related: ["[[concepts/Equipment]]", "[[concepts/LegendaryPowers]]", "[[concepts/Skills]]", "[[concepts/Build-Constraint-System]]"]
---

# Build 系统

> **v2 (2026-06-07):** Build 已升级为三层约束体系。详见 [[concepts/Build-Constraint-System|Build 约束体系]]。

Diablo Lite 的 Build 系统通过 **传奇词缀 + 套装 + 传奇协同 + 法器** 实现流派分化。9 个装备槽支持多层组合。

## 流派方向

| 流派 | 核心词缀 | 游戏风格 |
|------|---------|----------|
| 火球弹幕 | 穿透火球 + 火焰风暴 | 自动攻击为主，火球穿透 + 伤害翻倍，弹幕清图 |
| 黑洞控场 | 黑洞吞噬 + 传送余震 | 控场聚怪，传送留黑洞形成连锁控场 |
| 暴风雪冰法 | 暴风眼 + 急冻光环 | 范围 AOE + 叠加减速近乎定身，极致冰法 |
| CDR 高速 | 冷却共鸣 + 虚空行者 | 技能高频释放，传送无限连闪 |
| 混合构筑 | 跨槽位混搭 | 如武器穿透+头盔CD+项链暴风雪范围，灵活组合 |

## 设计原则

- 传奇词缀**叠加生效**——相同 stat 的词缀数值累加
- 词缀数值随 ilvl 随机，高等级才能出满值
- 没有职业限制，Build 完全由**装备组合**决定
- 第四章起必须依靠 Build 推进，纯属性堆积无法通关

## 生效方式

在 `calcPlayerStats()` 中，`getLegendaryEffects()` 扫描所有已装备物品的 `power.stat`，将数值合并为 `legendary` 对象。技能释放时读取该对象调整参数（如暴风雪范围 × (1 + blizzardSize/100)）。

## 关键洞察

Build 深度来自**有限槽位 × 8 种词缀 × 随机数值**的组合爆炸。玩家需要在 6 个槽位中权衡取舍——全堆一种词缀可以做到极致但可能生存不足，均衡搭配则更加稳健。
