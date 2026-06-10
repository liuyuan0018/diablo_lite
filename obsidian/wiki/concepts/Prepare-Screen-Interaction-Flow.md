---
type: concept
title: "准备界面交互流程"
created: 2026-06-11
updated: 2026-06-11
tags: [prepare, backpack, rendering, click-handling, mobile, bug]
status: seed
related: ["[[concepts/Equipment-Data-Flow-Pitfalls|装备数据流转陷阱]]", "[[concepts/Mobile-Adaptation|移动端适配]]"]
---

# 准备界面交互流程

准备界面（prepare screen）的渲染与点击处理涉及多层交互：Canvas 渲染、overlay 管理、触摸事件分流。

## 游戏循环的渲染顺序

```
gameLoop(timestamp):
  processClick()                          // 有 showBackpack → early return
  updatePlayer/Monsters/etc (if playing)
  render()                                // → renderPrepare / renderMenu / etc.
  if (showBackpack) renderBackpackOverlay()  // ← 在所有 screen 上都调用
  if (screen=='playing' && showPauseMenu) renderPauseMenu()
  requestAnimationFrame(gameLoop)
```

关键：`renderBackpackOverlay()` 在 `render()` **之后**调用，且不受 screen 限制。背包 overlay 内部直接检查 `game.mouseDown` 处理点击，不通过 `checkButtonClicks`。

## processClick 的 overlay 守卫

`processClick` 最顶部（line 219）有全局守卫：

```javascript
if (game.showBackpack) return;  // 所有 screen 统一 early return
```

当背包打开时，screen 专属的点击处理完全跳过 — 背包 overlay 自行处理所有交互。

## 桌面端背包切换

B 键 handler（`input.js:40-45`）**无 screen 限制**，任何界面都能 toggle：

```javascript
game.showBackpack = !game.showBackpack;
if (game.showBackpack) game.bpScroll = 0;
```

## 移动端背包按钮

### 可见性控制（mobile.js:270-273）

```javascript
const playingOrPrep = playing || game.screen === 'prepare' || game.screen === 'victory';
btnBackpack.style.display = playingOrPrep ? '' : 'none';
```

背包按钮在 playing / prepare / victory 三个界面都可见。

### 触摸处理（已修复）

修复前 touchstart handler 有 `if (game.screen === 'playing')` 守卫，导致 prepare/victory 界面点按钮无响应。修复后去掉 screen 限制，与桌面端 B 键行为一致。

## 曾出现的 Bug

### Bug 1: prepare 界面 per-frame reset（commit d31312b）

`renderPrepare()` 顶部无条件执行 `game.showBackpack = false`，覆盖了 B 键刚设置的 `true`。背包 flag 在 `render()` 内部被杀死，后续的 `renderBackpackOverlay()` 永远不会触发。

**修复**：删除 per-frame reset。所有 `screen='prepare'` 的跳转按钮（开始游戏、返回准备、返回主菜单）已在 action 中显式重置 `showBackpack=false`，不需要 render 内兜底。

### Bug 2: 移动端背包按钮 screen guard

`mobile.js` touchstart 和 FORCE_MOBILE fallback 的 `#btnBackpack` handler 限制 `game.screen === 'playing'`，但按钮在 prepare 界面已可见，形成"看得见点不动"的状态。

**修复**：移除 screen 守卫，与桌面端 B 键保持一致。
