---
type: concept
title: "传奇词缀"
created: 2026-06-07
updated: 2026-06-07
tags: [legendary, powers, affixes, build]
status: mature
related: ["[[concepts/Build|Build 系统]]", "[[concepts/Equipment|装备系统]]", "[[concepts/Skills|技能系统]]"]
---

# 传奇词缀

传说品质装备额外附带的特殊效果，是实现 Build 分化的核心机制。

## 8 种传奇词缀

| 词缀名 | stat 键 | 效果 | 数值范围 |
|--------|---------|------|----------|
| 传送余震 | blackholeSize | 传送后在原地留下黑洞，范围 +{v}% | 30-80% |
| 穿透火球 | pierce | 火球穿透 +{v} 个敌人 | 1-4 |
| 暴风眼 | blizzardSize | 暴风雪范围 +{v}% | 20-60% |
| 黑洞吞噬 | blackholeDur | 黑洞持续时间 +{v} 秒 | 0.5-2s |
| 冷却共鸣 | globalCDR | 所有技能冷却 -{v}% | 5-20% |
| 火焰风暴 | fireballDmg | 火球伤害 +{v}% | 15-50% |
| 急冻光环 | blizzardSlow | 暴风雪减速效果 +{v}% | 10-30% |
| 虚空行者 | teleportCD | 传送冷却 -{v} 秒 | 1-4s |

## 数值随机

`value = min + (max - min) × (ilvl-1)/69 × random(0.5, 1)`

ilvl 越高，词缀值越接近上限。满级 70 级才能出理论最大值。

## 生效机制

`getLegendaryEffects()` 扫描全部已装备物品的 `power.stat`，相同 stat 的值累加。返回的 `legendary` 对象在技能释放时被读取：

- `fireballDmg` → 计算在 `calcPlayerStats().atk` 中
- `pierce` → 设置火球弹幕的穿透次数
- `blackholeDur` / `blizzardSize` / `blizzardSlow` → 修改技能参数
- `globalCDR` → 叠加到头盔的 CDR 上（总上限 60%）
- `teleportCD` → 直接减少传送冷却秒数

## 关键洞察

同一词缀可跨槽位叠加（如武器和戒指各带火焰风暴 = 15%+30%=45% 火球伤害）。这意味着极致单一流派是把 6 个槽位全堆同一种词缀——但会牺牲其他维度的 Build 多样性。
