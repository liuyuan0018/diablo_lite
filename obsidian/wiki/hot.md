# 当前热点

> 2026-06-10 | 移动端触摸架构 + UI 交互模式

## 刚发生

移动端适配重点从理论进入实现。建立了三层触摸事件架构，解决了快速点击丢失的系统性 bug，确定了 Canvas 固定分辨率策略，实现了无悬停的装备对比交互。

### 触摸事件架构

三层处理：Skill Button（拖拽释放）→ Canvas（canvas 点击，stopPropagation 拦截）→ Document（控件路由 + 兜底）。

**快速点击修复**：手机点击 < 16ms（一帧），touchend 在 processClick 之前重置 mouseDown 导致点击丢失。修复：touchend 只清 canvasTouchId，mouseDown 由 processClick 消费后自重置。

### Canvas 分辨率

移动端 750×1334（~0.59x 缩放于 440px 屏），桌面端 1920×1080。视口尺寸方案已被放弃——会随旋转改变宽高比，破坏 UI 布局。

### 装备对比（无悬停）

`renderEquipDetail` 移动端显示同槽位背包物品列表，带绿色↑/红色↓数值差异和快捷装备按钮。与背包的 tap-to-select + 底部对比面板模式一致。

### 拖拽释放技能

按住技能按钮或直接拖拽 Canvas → 瞄准预览 → 松手释放。预选框（AOE 圈/十字准星）只在拖拽中显示。

## 活跃领域

- 移动端触摸 ([[concepts/Mobile-Touch-Handling|事件架构]])
- 移动端 UI ([[concepts/Mobile-UI-Interaction|Canvas 策略 + 装备交互]])
- 移动端适配 ([[concepts/Mobile-Adaptation|PC→手游转型]])

## 最近归档

- [[concepts/Mobile-Touch-Handling|移动端触摸事件架构]] — 三层处理、快速点击修复、/m 测试
- [[concepts/Mobile-UI-Interaction|移动端 UI 交互]] — Canvas 750×1334、装备栏触摸对比、控件显示规则
- [[concepts/Skill-Atom-Aura-Architecture|技能原子/光环/Buff 架构]]
