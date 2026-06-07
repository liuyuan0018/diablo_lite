---
type: concept
title: "D4 Sorcerer Enchantment 系统"
domain: d4-sorcerer-builds
aliases: ["附魔系统", "D4 Enchantment Slots"]
created: 2026-06-07
tags: [research, d4-sorcerer-builds, class-mechanics]
status: seed
related: ["[[D4-Sorcerer-Build-Evolution]]", "[[D3-Build-Design-Lessons]]"]
---

# D4 Sorcerer Enchantment 系统

Diablo 4 Sorcerer 的独有职业机制——将技能放入 Enchantment 槽位获得被动效果，而不是放入动作栏主动施放。

## 怎么运作

- 升级到 Lv15（解锁第 1 槽）+ Lv30（解锁第 2 槽）
- 将任意非终极技能放入 Enchantment 槽 → 获得该技能的**被动版效果**
- 装备上 +skill rank 也适用——不需要手动点技能就可附魔
- 技能升级/强化选择**继承**到附魔效果中

## 设计意义

Enchantment 将 Sorcerer 的有效技能数从 6 个（动作栏）扩展到 8 个（6+2 附魔），**超过任何其他职业**。

### 三个级别的附魔设计

**L1 — 条件触发（教科书级附魔）：**
- **Fire Bolt:** 任何直接伤害附加 23% Burning → 让冰/电 build 也能受益于燃烧相关被动
- **Frost Bolt:** 任何直接伤害附加 18% Chill → 让火/电 build 也能减速/冻结
- **Ice Shards:** 对冻结目标自动发射 → 与 Frost Nova 完美配对

**L2 — 资源联动：**
- **Chain Lightning:** 消耗 100 法力后自动施放 → 让蓝耗变成伤害，而非惩罚
- **Arc Lash:** 使用冷却技能时眩晕附近敌人 → 冷却技能变成控场技

**L3 — 技能替代：**
- **Teleport:** 将 Evade（翻滚）替换为短距离传送 → 最常被选择的附魔，所有 build 都要

### 设计优势

1. **跨元素赋能：** Fire Bolt Enchantment 是 D4 最重要的设计决定之一——它让任何 Sorcerer build 都能获得"燃烧"机制，不再被元素类型锁死
2. **自动化 = 降低"按键税"：** Ice Shards 自动发射、Chain Lightning 自动施放——将 APM 密集的操作转为被动输出
3. **选择不是加法而是置换：** 你只有 2 个槽——选择 Fire Bolt 意味着放弃 Frost Bolt 附魔。这种"选 A 就不能选 B"创造了真实的 build 分叉

## 与 D3 的区别

| | D3 Wizard | D4 Sorcerer |
|------|----------|-----------|
| 被动技能 | 4 个固定槽 | 2 个附魔槽（从 20+ 技能中选） |
| 获取方式 | 升级解锁（固定） | 升级 + 任务解锁 |
| 定制性 | 低——从 10+ 被选中选 4 | 高——从 20+ 技能中选 2，互相联动 |
| 跨元素支持 | 无（被动不关心元素） | 有（Fire Bolt 附魔让冰 build 也能燃烧） |
| 技能联动 | 被动是独立的 | 附魔效果受技能强化等级和装备 +skill 影响 |

Enchantment 本质上是 D3 Passives 的进化版——从"选被动的被动效果"升级为"选主动技能的被动版本"。
