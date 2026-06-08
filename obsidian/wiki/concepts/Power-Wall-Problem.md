---
type: concept
title: "Power Wall Problem (力量墙问题)"
created: 2026-06-08
tags: [research, mobile-games, game-design, monetization]
status: seed
related: ["[[entities/Survivor.io]]", "[[entities/Archero]]", "[[concepts/Habby-Template]]"]
---

## 定义

Habby 风格游戏的结构性设计缺陷：游戏早期用快速成长给玩家制造极致力量幻想 → 然后收走 → 把玩家推到付费墙前，但即使付费也无法恢复最初的爽感。

## 三大子问题

1. **"Power trip to wall"** — 曲线断崖式下跌，从爽到不爽的过渡是瞬时的
2. **付费无体感** — 花钱后数值提升被颗粒化消耗（合成/锻造多层折损），体感上几乎没有变强
3. **下一道墙** — 即使花钱过了当前关卡，下一关立即用更高数值把玩家堵回来

## 根本原因

Roguelike 的核心哲学是"通过反复练习和知识积累来征服固定难度"，而数值付费的哲学是"花钱跳过内容"。

当两个哲学同时存在于一个游戏中时：
- 如果不让玩家通过技巧克服 → 违反 Roguelike 精神
- 如果不让玩家通过付费克服 → 变现失败
- 如果两者都允许 → 花钱过关后的下一道墙让付费无意义

## 对 Diablo Lite 的启示

[[concepts/Combat-Balance]] 中通过难度指数曲线解决部分问题（高难度是"证明Build"，而非"付费门票"），但同样面临"Build 完成后的内容消耗"挑战。
