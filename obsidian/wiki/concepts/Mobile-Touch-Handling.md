---
type: concept
title: "Mobile Touch Handling — Event Architecture"
created: 2026-06-10
updated: 2026-06-10
tags: [mobile, touch-events, input, architecture]
status: developing
related:
  - "[[concepts/Mobile-Adaptation]]"
  - "[[concepts/Mobile-UI-Interaction]]"
---

## 问题

移动端触摸事件的处理在不同 iOS 版本上行为不一致。核心挑战：
- `#mobileControls` 覆盖层（`pointer-events:none`）不一定可靠穿透触摸到 canvas
- 快速点击（<16ms）时 `touchend` 在 `processClick()` 之前重置 `mouseDown`，导致点击丢失
- 多个控件（摇杆、技能按钮、背包、暂停）需要独立处理，但共享同一触摸表面

## 架构

三层事件处理，从底层到顶层：

### 1. Skill Button Touchstart（元素级）
- 监听在 `.skill-btn` 元素上
- `e.stopPropagation()` 阻止冒泡到 document
- 启动拖拽释放流程（`game.skillDrag.active = true`）
- 只负责技能选择 + 拖拽追踪

### 2. Canvas Touchstart（元素级）
- 监听在 `canvas` 元素上，比 document 更早触发
- 过滤：跳过控件区域（`closest('#joystickZone')` 等）
- `e.stopPropagation()` 阻止冒泡到 document
- 处理两类触摸：
  - **playing 画面**：启动技能拖拽（直接拖拽释放）
  - **其他画面**：通用 canvas 点击（菜单按钮、关卡选择等）

### 3. Document Touchstart（文档级）
- 作为最后的兜底处理
- 路由控件触摸：摇杆、背包按钮、暂停按钮
- Canvas 触摸已被上层 stopPropagation 拦截，此处只处理控件

## 关键修复：快速点击丢失

**根因**：`touchend` → `mouseDown = false` 先于下一帧 `processClick()` 执行。

手机点击通常 < 16ms（一帧），`touchend` 在游戏循环的 `requestAnimationFrame` 回调之前就重置了 `mouseDown`，导致 `processClick` 看到 `mouseDown = false` 直接返回。

**修复**：`touchend` 只清除 `canvasTouchId`，不重置 `mouseDown`。`mouseDown` 由 `processClick` 消费后自动重置。确保无论点击多快，`mouseDown` 保持 true 直到被消费。

## /m 桌面测试

通过 `window.FORCE_MOBILE = true` 标志模拟移动端环境：
- CSS 强制显示 `#mobileControls`
- JS 绕过 `'ontouchstart' in window` 检查
- 注册 mousedown/mousemove/mouseup 监听器，调用与 touch 相同的处理函数
- 非 playing 画面不拦截鼠标事件，交由 `input.js` 正常处理
