# Diablo Lite — Obsidian Vault

> 自动生成于 2026-06-07。由 obsidian-wiki 技能维护。

## 使用原则

**Obsidian 是索引入口，不是唯一事实来源。**

- wiki 笔记记录的是**某个时间点的设计理解**，可能滞后于代码的实际状态
- 代码是**唯一权威的事实来源**——以具体系统实现为准，而非 wiki 描述
- 当 wiki 与代码冲突时，以代码为准。发现冲突应更新 wiki 或标记为过时
- wiki 的价值在于**快速导航**和**设计决策的 WHY**，而不是替代代码阅读

## 目录结构

```
wiki/
├── index.md          ← 完整索引
├── log.md            ← 变更日志
├── hot.md            ← 当前热点上下文
├── overview.md       ← 项目概览
├── concepts/         ← 核心概念、游戏机制、设计模式
├── entities/         ← 关键实体（装备/技能/怪物/Boss）
├── sources/          ← 文件阅读记录
├── comparisons/      ← 对比分析
├── questions/        ← 深度问答
├── domains/          ← 领域知识（ARPG、刷怪游戏）
└── meta/             ← 架构决策、Vault 设计
```

## 笔记状态

| 状态 | 含义 |
|------|------|
| seed | 刚创建，内容少 |
| developing | 持续补充中 |
| mature | 内容完善 |
| stale | 可能过时，需对照代码验证 |
