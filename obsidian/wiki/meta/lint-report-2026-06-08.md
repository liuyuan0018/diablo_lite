---
type: meta
title: "Lint Report 2026-06-08"
created: 2026-06-08
updated: 2026-06-08
tags: [meta, lint]
status: developing
---

# Lint Report: 2026-06-08

## Summary
- 扫描页面: 48
- 发现问题: 10
- 已自动修复: 10（4 frontmatter + 6 死链）
- 需人工审查: 1（domains/ 空目录）

## 与上次对比

| 检查项 | 上次(06-07) | 本次 | 变化 |
|--------|------------|------|------|
| 死链 | 2 | 6 | ⚠️ 新增 4（中文短名 related 字段） |
| Frontmatter 缺失 | 2 | 4 | ⚠️ 新增 2（上次遗漏 2 个） |
| 孤立页面 | 6 | 0/6 | ✅ 严格定义下为 0；弱连接仍有 6 |
| 过期声明 | 0 | 0 | — |
| 空章节 | 0 | 0 | — |
| 过期索引条目 | 0 | 0 | — |

## 死链

**6 个中文短名 wikilink，全部位于 frontmatter `related` 字段，无对应 .md 文件：**

| 死链 | 应指向 | 引用来源 |
|------|--------|---------|
| `[[装备系统]]` | `concepts/Equipment` | meta/GameArchitecture, concepts/LegendaryPowers, concepts/LootDetailView |
| `[[技能系统]]` | `concepts/Skills` | meta/GameArchitecture, concepts/LegendaryPowers, concepts/ProjectilePierce |
| `[[难度曲线]]` | `concepts/Difficulty` | concepts/Equipment, entities/Monsters |
| `[[怪物系统]]` | `entities/Monsters` | concepts/Difficulty, concepts/ProjectilePierce, concepts/Skills |
| `[[Build 系统]]` | `concepts/Build` | concepts/Difficulty, concepts/Equipment, concepts/LegendaryPowers, concepts/Skills |
| `[[传奇词缀]]` | `concepts/LegendaryPowers` | concepts/Equipment, concepts/LegendaryPowers, concepts/ProjectilePierce, concepts/Skills |

## 弱连接页面

仅被 index.md / log.md / lint-report 链接，无其他内容页入站 wikilink：

- [[concepts/LootDetailView|装备悬停对比弹窗]] — Equipment.md 描述了悬停对比但未 wikilink
- [[concepts/ProjectilePierce|火球穿透机制]] — LegendaryPowers.md 描述了 pierce 但未 wikilink
- [[questions/Research-D4-Sorcerer-Builds|D4 Sorcerer Build 发展史]] — 仅 log/index
- [[questions/Research-D4-Sorcerer-Uniques|D4 暗金 Build 关系]] — 仅 log/index
- [[entities/Player|玩家]] — Character-Management 未反向链接至此
- [[entities/EquipmentSlots|装备槽位]] — Build-Constraint-System/Equipment 均未链接至此

> 上次的 Research-D3-Wizard-Builds 已修复 — Build-Constraint-System 添加了入站链接。

## Frontmatter 缺失

以下 4 个页面缺少 `updated` 字段：

- [[concepts/D4-Sorcerer-Build-Evolution|D4 Sorcerer Build 发展史]]
- [[concepts/D4-Enchantment-System|D4 Enchantment 系统]]
- [[concepts/D4-Uniques-Build-Relationship|D4 暗金-Build 关系]]
- [[concepts/Wizard-Build-History|法师 Build 历史演变]]

## 过期声明

无 `> [!contradiction]` callout。通过。

## 空章节

未发现。通过。

## 过期索引条目

index.md 中所有链接均解析到现有页面。通过。

## 其他发现

- **`domains/` 仍为空**：目录存在但无内容（连续 2 次 lint 标注）
- **新增页面**：concepts/Combat-Balance（战斗平衡 v3 调整，2026-06-08）
- **修复确认**：上次 2 个死链（Research-D4-Sorcerer-Uniques、D4-Uniques-Build-Relationship）的对应页面已创建
