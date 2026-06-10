# 当前热点

> 2026-06-11 | 准备界面背包修复 + 交互流程文档化

## 刚发生

修复了 prepare 界面背包打不开的问题，涉及两个独立 root cause。

### 核心洞察

游戏循环渲染顺序是理解交互 bug 的关键：`processClick()` → `render()` → `renderBackpackOverlay()`。`renderBackpackOverlay()` 在所有 screen 上都可调用，且 overlay 内部直接处理点击，不经过 `checkButtonClicks`。

`processClick` 顶部的 `if (showBackpack) return` 守卫是全局的 — 背包打开时所有 screen 点击处理被跳过。

**Bug 1 (desktop):** `renderPrepare()` 无条件每帧重置 `showBackpack = false`（d31312b），B 键 toggle 后下一帧就被覆盖。

**Bug 2 (mobile):** `mobile.js` 的 `#btnBackpack` touch handler 限定 `screen === 'playing'`，但按钮在 prepare 也可见。

### 移动端触摸架构（2026-06-10）

三层触摸事件处理：Skill Button（拖拽释放）→ Canvas（点击，stopPropagation 拦截）→ Document（控件路由 + 兜底）。Canvas 固定 750×1334 分辨率，装备栏触摸替换悬停对比。

## 活跃领域

- 移动端触摸 ([[concepts/Mobile-Touch-Handling|事件架构]])
- 移动端 UI ([[concepts/Mobile-UI-Interaction|Canvas 策略 + 装备交互]])
- 准备界面交互 ([[concepts/Prepare-Screen-Interaction-Flow|交互流程]])
- 装备数据流 ([[concepts/Equipment-Data-Flow-Pitfalls|陷阱]])

## 最近归档

- [[concepts/Prepare-Screen-Interaction-Flow|准备界面交互流程]] — 渲染顺序、overlay 管理、双重 bug 分析
- [[concepts/Mobile-Touch-Handling|移动端触摸事件架构]] — 三层处理、快速点击修复、/m 测试
- [[concepts/Mobile-UI-Interaction|移动端 UI 交互]] — Canvas 750×1334、装备栏触摸对比、控件显示规则
- [[concepts/Skill-Atom-Aura-Architecture|技能原子/光环/Buff 架构]]
