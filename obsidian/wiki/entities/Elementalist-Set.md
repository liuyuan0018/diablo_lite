---
type: entity
title: "元素使套装"
aliases: ["Elementalist Set", "元素使"]
created: 2026-06-07
updated: 2026-06-08
tags: [set, elementalist, diablo-lite]
status: developing
related: ["[[concepts/Build-Constraint-System]]", "[[concepts/Elementalist-Harmony-Stacking]]", "[[entities/Chronomancer-Set]]"]
---

# 元素使套装

Diablo Lite 两套套装之一，对标 D3 Tal Rasha。约束：**交替使用不同元素技能**。

## 套装效果

| 件数 | 效果 |
|------|------|
| 2 件 | 不同元素 +1 谐律层（max 3），每层 +15% 技能伤害。自动攻击火球为"癞子牌"，每周期限一次 |
| 3 件 | 3 层触发 Harmony Burst——三色陨石 AOE（红/蓝/紫），ATK×3 伤害，0.5s 延迟 |
| 4 件 | 每层 +10% 减伤，谐律爆发后在地面生成元素光环（持续 5s） |

## 元素映射

| 技能 | 元素 |
|------|------|
| 自动攻击火球 | fire（癞子，不修改 lastElement） |
| 黑洞（技能 1） | arcane |
| 暴风雪（技能 2） | ice |

## 神器协同

- **Harmony Eye**（和谐之眼）：3 层爆发改为单目标追踪陨石，+50% 伤害
- 详见 [[concepts/Elementalist-Harmony-Stacking|谐律叠层机制]]
