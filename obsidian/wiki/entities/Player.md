---
type: entity
title: "玩家"
created: 2026-06-07
updated: 2026-06-07
tags: [player, stub]
status: seed
related: ["[[concepts/Character-Management]]", "[[concepts/Skills]]"]
---

# 玩家

> 此页面为自动生成的占位 stub。内容待补充。

玩家是可操控角色，拥有等级(1-70)、经验、6 个装备槽位、WASD 移动 + 鼠标释放技能。

## 核心属性

- 攻击力、冷却缩减、最大生命、弹道速度、拾取范围、移动速度
- 属性由装备提供，`calcPlayerStats()` 汇总所有槽位 + 传奇词缀

## 相关页面

- [[concepts/Character-Management|角色管理系统]] — 多角色存档架构
- [[concepts/Equipment|装备系统]] — 6 槽位属性映射
- [[concepts/Skills|技能系统]] — 3 主动技能 + 自动攻击
