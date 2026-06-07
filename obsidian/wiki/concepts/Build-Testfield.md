---
type: concept
title: "Build 测试场"
created: 2026-06-07
updated: 2026-06-07
tags: [testfield, build, testing, training-dummy, dps]
status: developing
related: ["[[concepts/Build-Constraint-System]]", "[[concepts/Build]]", "[[concepts/Equipment]]", "[[meta/GameArchitecture]]"]
---

# Build 测试场

Diablo Lite 的独立 build 验证工具，提供训练木桩、配装面板和 DPS 统计，让玩家快速测试 build 效果而无需进入正式关卡。

**核心约束：所有装备变更不影响真实角色存档。** 通过沙箱隔离实现 — 进入测试场深拷贝装备，退出时丢弃沙箱、恢复原装。

---

## 入口

准备界面左下角「⚔ 测试场」按钮，进入 `screen: 'testfield'`。按 Esc 退出返回准备界面。

---

## 训练木桩

6 个无敌木桩，1200×1200 小型地图：

| 位置 | 类型 | 减伤 | 用途 |
|------|------|------|------|
| 中央左 | 单体 | 0% | 单体 DPS 基准 |
| 中央左下 | 单体 | 30% | 模拟抗性怪 |
| 中央左下 | 单体 | 60% | 模拟高抗怪 |
| 中央右 ×3 | 群体 | 0% | AOE 测试 |

木桩不受击退、吸附、减速、冻结影响。火球自动攻击会锁定最近的木桩。

---

## 配装面板

左侧面板，320px 宽，可折叠（箭头按钮）。

### 预设模板 Tab

5 个一键配装模板：

| 模板 | 核心 | 协同/套装 |
|------|------|----------|
| 火球弹幕 | 穿透火球 + 火焰风暴 | 熔火之心 |
| 冰法控制 | 暴风眼 + 急冻光环 | 深寒领域 |
| 元素使 | 元素使 4 件 + 火系传奇 | 谐律之眼 |
| 时空术士 | 时空术士 4 件 + CDR 传奇 | 力场发生器 |
| 混合火冰 | 穿透火球 + 暴风眼 | 火冰相激 |

点击模板 → 自动生成满级（ilvl 70）满值装备 → 一键装备到沙箱。

### 自由搭配 Tab

9 个槽位逐个配置，点击循环品质（空→白→蓝→黄→传奇→空），点击「应用配置」生效。

---

## 伤害统计

左下角紧凑弹窗（180×106px）：

- **DPS** — 最近 3 秒滚动窗口平均，大字橙色
- **总伤害** — 累计
- **峰值** — 单次最高
- **时长** — 自动计时
- **重置按钮** — 清零所有统计

木桩上方飘浮伤害数字（白色→金色，0.8s 淡出）。

---

## 装备查看

右侧复用准备界面的 3×3 装备网格（`renderEquipGrid`），显示当前沙箱装备。悬停物品弹出左右对比弹窗（`renderCompareTooltip`），与准备界面相同。

---

## 沙箱隔离

技术实现：

1. 进入测试场 → `enterTestfield()` 深拷贝 `game.equipment` → `game.sandboxEquipment`
2. 测试场内 `calcPlayerStats(true)` 从 `game.sandboxEquipment` 读取
3. 配装面板修改直接写入 `game.sandboxEquipment`，立即刷新属性
4. 退出测试场 → `exitTestfield()` 丢弃沙箱 → 恢复 `game.equipment`

**结果：测试场内的装备和伤害不会影响存档。**

---

## 文件

- `js/testfield.js`（249 行）— 沙箱管理、伤害统计、木桩生成、预设配装
- `js/renderer.js` — `renderTestField()`、`renderEquipGrid()`、`renderLoadoutPanel()` 等
- `js/gameplay.js` — `startTestfield()`、`exitTestfieldToPrepare()`、测试场 game loop 分支
- `js/player.js` — `calcPlayerStats(sandbox)` 沙箱模式
- `js/projectiles.js` — 木桩碰撞检测
- `js/input.js` — Esc 退出
