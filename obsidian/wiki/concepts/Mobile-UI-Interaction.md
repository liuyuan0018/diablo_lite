---
type: concept
title: "Mobile UI Interaction — Canvas Sizing & Touch-First Patterns"
created: 2026-06-10
updated: 2026-06-10
tags: [mobile, canvas, responsive, equipment, touch-friendly]
status: developing
related:
  - "[[concepts/Mobile-Touch-Handling]]"
  - "[[concepts/Mobile-Adaptation]]"
  - "[[concepts/Equipment]]"
---

## Canvas 分辨率策略

### 演进过程

| 阶段 | 分辨率 | CSS缩放 | 结果 |
|------|--------|---------|------|
| 1 | 1080×1920 | 0.41x（440px屏） | 文字太小 |
| 2 | 视口尺寸 | 1.0x | 文字合适，但横竖屏切换后比例错 |
| 3 | min/max 强转竖屏 | 1.0x | 竖屏正确，但文字仍小 |
| 4 | **750×1334** | 0.59x | 折中方案 ✓ |

### 最终方案

- **移动端**：固定 750×1334（9:16 竖屏），CSS 等比缩放适配视口
- **桌面端**：固定 1920×1080（16:9 横屏）
- **缩放**：`fitCanvas()` 使用 `Math.min(maxW/canvasW, maxH/canvasH)` 等比缩放居中
- **窄屏阈值**：`W < 900` 激活移动端布局（stats 面板全宽 + 装备栏下方 + 4 列关卡按钮）

### 为什么不用视口尺寸

视口尺寸会随设备旋转变化，导致画布宽高比不固定。游戏 UI 布局依赖固定的宽高比——竖屏 9:16 和横屏 16:9 需要完全不同的布局逻辑。固定分辨率确保 UI 一致性。

## 装备交互：触摸替代悬停

### 问题

桌面端通过鼠标悬停实现装备对比（`renderCompareTooltip`），移动端无法使用悬停。

### 方案

增强 `renderEquipDetail()` 弹窗：
- 点击装备槽 → 弹窗上半部显示已装备物品
- 下半部列出背包中**同槽位物品**：
  - 品质色名称
  - 数值差异（绿色 ↑(+N) / 红色 ↓(N) / ✦新）
  - 传奇标记 ★
  - 快捷"装备"按钮
- 空槽位显示可用的背包物品（✦新 标记）
- 无替换品显示"背包中没有可替换的XX装备"

### 背包已有相似模式

移动端背包使用 `bpSelectedIndex` 点击选中 + 底部对比面板。装备栏方案与此保持一致的交互模式。

## 移动端控件显示规则

| 画面 | 摇杆 | 技能按钮 | 背包按钮 | 暂停按钮 |
|------|------|---------|---------|---------|
| menu | 隐藏 | 隐藏 | 隐藏 | 隐藏 |
| prepare | 隐藏 | 隐藏 | 显示 | 隐藏 |
| playing | 显示 | 显示 | 显示 | 显示 |
| victory | 隐藏 | 隐藏 | 显示 | 隐藏 |
| death | 隐藏 | 隐藏 | 隐藏 | 隐藏 |

使用 `requestAnimationFrame` 循环每帧检测 `game.screen` 并切换 `display`。
CSS + 内联 `style="display:none"` 双重保障，防止加载时闪现。
