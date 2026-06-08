---
type: meta
title: "游戏架构"
created: 2026-06-07
updated: 2026-06-07
tags: [architecture, canvas, gameloop, rendering, modules, es-modules]
status: developing
related: ["[[concepts/Equipment|装备系统]]", "[[concepts/Skills|技能系统]]"]
---

# 游戏架构

HTML5 Canvas 游戏，零依赖，ES 模块架构。

## 技术栈

- HTML5 Canvas 2D 渲染
- Vanilla JavaScript，ES 模块（`type="module"`），无需打包器
- localStorage 存档
- Python HTTP 服务器（无缓存）+ NW.js 打包

## 文件结构

```
index.html          — HTML 外壳（21 行）
js/
├── main.js         — 入口：canvas 初始化、读档、启动游戏循环
├── config.js       — 常量、配置表、ilvl 工具函数
├── game-state.js   — game 全局状态对象（单一可变引用）
├── canvas.js       — canvas/ctx 单例
├── helpers.js      — 纯数学工具（dist, angle, clamp 等）
├── player.js       — 玩家属性计算、自动攻击、伤害
├── skills.js       — 技能释放（传送/黑洞/暴雪）+ 效果更新
├── monsters.js     — 怪物创建、10 种 AI 行为、死亡处理
├── spawner.js      — 刷怪逻辑、精英波次、Boss 触发
├── projectiles.js  — 弹幕池（玩家火球 + 敌人投射物）
├── particles.js    — 粒子系统（生成/更新）
├── towers.js       — 局内强化塔（CD 塔/电击塔）
├── equipment.js    — 装备生成、品质、掉落、拾取、升级
├── renderer.js     — 全部渲染（世界层 → 实体层 → 粒子层 → UI）
├── input.js        — 键盘/鼠标事件注册
├── camera.js       — 相机平滑跟随
├── persistence.js  — localStorage 存档/读档
└── gameplay.js     — 游戏主循环、关卡初始化、点击处理
```

## 模块设计原则

### game 对象共享

`game` 对象从 `game-state.js` 导出，所有模块通过 `import { game }` 获取**同一个引用**。修改 `game.player.x` 等属性会立即在所有模块中可见。

### 无循环依赖

依赖方向: `gameplay.js` → 各系统模块 → `game-state.js` → 无依赖。

唯一接近循环的点: `gameplay.js` → `renderer.js` → `equipment.js` → `player.js`，但 `renderer.js` 不 import `gameplay.js`。

### 避免可变原语导出

ES 模块 import 的原始值是 read-only 的。`nextMonsterId++` 无法工作。改用 **getter 函数**:

```javascript
// config.js
let _nextMonsterId = 1;
export function getNextMonsterId() { return _nextMonsterId++; }
```

### 按钮动作解析（防循环依赖）

关卡选择按钮需要调用 `startGame()`，但 `startGame` 在 `gameplay.js` 中，而 `renderer.js` 由 `gameplay.js` import。方案: 按钮存储 `{type:'stageSelect', idx}` 标记，`processClick()` 在 gameplay 中根据标记调用 `startGame(idx)`，避免 renderer 直接引用 gameplay。

## 游戏循环

```
60fps requestAnimationFrame:
1. processClick()     — 鼠标点击处理 + 按钮动作解析
2. updatePlayer()     — 自动攻击、CD、BUFF
3. updateSkillEffects — 黑洞吸引、暴风雪计时
4. updateMonsters()   — AI、碰撞、死亡
5. updateSpawner()    — 刷怪、精英波、Boss
6. updateProjectiles()— 弹幕飞行、碰撞
7. updateParticles()  — 粒子衰减
8. updateTowers()     — 强化塔
9. updatePickup()     — 掉落拾取
10. updateCamera()    — 平滑跟随
11. render()          — 全量渲染
```

## 渲染管线

```
1. renderGround()     — 棋盘格地板
2. renderMapBorder()  — 地图边界
3. renderDrops()      — 地面掉落
4. renderMonsters()   — 怪物
5. renderProjectiles()— 弹幕
6. renderSkillEffects — 技能范围
7. renderTowers()     — 强化塔
8. renderPlayer()     — 玩家
9. renderParticles()  — 粒子
10. renderSkillPreview— 技能预选范围
11. renderVignette()  — 暗角后处理
12. renderHUD()       — UI
```

## 键位

| 键 | 功能 |
|----|------|
| 1/2/3 | 切换技能 |
| WASD | 移动 |
| 鼠标左键 | 释放技能/点击按钮 |
| B | 打开背包 |
| ESC | 暂停菜单（二次确认） |
| ` | 测试关卡 |

## 关键设计决策

- **ES 模块零打包器**: `<script type="module">` 原生浏览器支持，无需 webpack/vite
- **单例 game 对象**: 共享可变引用，避免消息总线复杂性
- **dt 上限 50ms**: 防止切标签导致物理爆炸
- **粒子上限 500**、**怪物上限 200**: 性能保护
- **Canvas 每帧全量重绘**: 没有脏矩形优化，2D 开销不大
- **Camera lerp 0.1**: 平滑摄像机跟随
- **渲染函数常驻 button 数组**: `menuButtons/prepButtons/victoryButtons` 等在每个 render 帧重建，`processClick` 消费上一帧的数组
