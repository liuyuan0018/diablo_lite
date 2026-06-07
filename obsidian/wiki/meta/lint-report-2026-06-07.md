---
type: meta
title: "Lint Report 2026-06-07"
created: 2026-06-07
updated: 2026-06-07
tags: [meta, lint]
status: developing
---

# Lint Report: 2026-06-07 (第二次扫描)

## Summary
- 扫描页面: 45（上次 28 + 12 stub + 3 D4 + 1 lint report + 1 index 更新）
- 发现问题: 14
- 需人工审查: 6
- 上次修复后死链已清除，扫描期间 index.md 更新引入 2 个新死链

## 与上次对比

| 检查项 | 上次 | 本次 | 变化 |
|--------|------|------|------|
| 死链 | 18 | 2 | ⚠️ 14 已修复，扫描期间新增 2 |
| Frontmatter 缺失 | 13 | 3 | ✅ 13 已补，新增 3 |
| 孤立页面 | 4 | 6 | ⚠️ 新增 2（D4 调研 + Player stub） |
| 过期声明 | 0 | 0 | — |
| 空章节 | 0 | 0 | — |
| 过期索引条目 | 有 | 0 | ✅ 已修复 |

## 孤立页面

仅被 index.md 链接，无其他入站 wikilink：

- [[concepts/LootDetailView|装备悬停对比弹窗]] — 仅 index.md 入站（Equipment.md 描述了悬停对比但未 wikilink 至此）
- [[concepts/ProjectilePierce|火球穿透机制]] — 仅 index.md 入站（LegendaryPowers.md 描述了 pierce 但未 wikilink 至此）
- [[questions/Research-D3-Wizard-Builds|D3 法师 Build 发展史]] — 仅 index.md 入站
- [[questions/Research-D4-Sorcerer-Builds|D4 Sorcerer Build 发展史]] — 仅 index.md 入站（新增）
- [[entities/Player|玩家]] — 仅 index.md 入站（新增 stub，Character-Management 未反向链接）
- [[entities/EquipmentSlots|装备槽位]] — 仅 index.md 入站（新增 stub，Build-Constraint-System/Equipment 均未链接至此）

> lint-report 自身无入站属正常（meta 页面）。

## 死链

**2 个（扫描期间 index.md 更新引入）：**

| 死链 | 引用来源 |
|------|---------|
| questions/Research-D4-Sorcerer-Uniques | index.md |
| concepts/D4-Uniques-Build-Relationship | index.md |

上次 14 个缺失页面的 stub 已全部创建（修复确认），Equipment.md 中文 wikilink 已修复。

## 过期声明

无 `> [!contradiction]` callout。通过。

## 缺失页面

无。上次报告的 Player/EquipmentSlots/Elementalist-Set/Chronomancer-Set/D3 参考实体均已创建 stub。

## Frontmatter 缺失

以下 2 个页面缺少 `updated` 字段：

- [[concepts/D4-Sorcerer-Build-Evolution|D4 Sorcerer Build 发展史]] — 缺少 `updated`
- [[concepts/D4-Enchantment-System|D4 Enchantment 系统]] — 缺少 `updated`

> lint-report 已在本轮写入时修复。

## 空章节

未发现。通过。

## 过期索引条目

无。index.md 中所有链接均已解析。

## 其他发现

- **`domains/` 仍为空**：目录存在但无内容。上次已标注，仍未填充。
- **stub 页面质量**：12 个新 stub 均有基础 frontmatter + 1-2 句描述 + 交叉引用，达到 seed 状态标准。
