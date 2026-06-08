---
type: concept
title: "游戏存档与持久化"
created: 2026-06-09
updated: 2026-06-09
tags: [persistence, save, localStorage, architecture]
status: developing
related: ["[[concepts/Character-Management|角色管理系统]]", "[[meta/GameArchitecture|游戏架构]]"]
---

# 游戏存档与持久化

`js/persistence.js` 管理游戏存档，使用浏览器 `localStorage` 作为主存储，`sessionStorage` 作为后备。

## 存储机制

- **主存储**: `localStorage` key `diabloLiteSave`，存 JSON 序列化的完整游戏状态
- **后备存储**: 每次保存同时写入 `sessionStorage`，加载时若 localStorage 为空则回退读取
- **导出/导入**: 主菜单提供 JSON 文件导出/导入按钮，用于代码更新前手动备份

## 存档数据结构 (v2)

```json
{
  "version": 2,
  "characters": [{ id, name, level, exp, expToNext, equipment, backpack }],
  "soulCoins": 0,
  "unlockedStages": [true, false, ...],
  "activeCharacterId": "..."
}
```

## 版本迁移

| 版本 | 变更 |
|------|------|
| v1 (无 version 字段) | 单角色存档，自动迁移为多角色格式 |
| v2 | 多角色支持，每个角色独立装备/背包/等级 |

迁移逻辑在 `loadGame()` 中：`data.version` 为空时视为 v1，创建单个角色并填充旧数据。

## 自动存档触发点

| 触发操作 | 位置 |
|----------|------|
| 升级 | `equipment.js:gainExp()` |
| Boss 击败 | `gameplay.js:bossDefeated` |
| 角色死亡 | `gameplay.js:death` |
| 卸下装备到背包 | `renderer.js:renderEquipDetail` 卸下按钮 |
| 从背包装备到身上 | `renderer.js:equipFromBackpack()` |
| 胜利界面拾取地面装备 | `renderer.js:pickupGroundItem()` |
| 背包删除装备 | `renderer.js:renderBackpackOverlay` ✕按钮 |
| 角色管理操作 | 创建/删除/切换角色 |
| 测试场返回 | 胜利按钮返回准备界面 |

## 错误处理

- 保存失败: `console.error('Save failed:', e)` 打印到控制台
- 加载失败: `console.error('Load failed:', e)` + 创建默认角色兜底
- 导出失败: `console.error` + 返回 false
- 导入失败: alert 弹窗提示 + 文件格式/角色数据校验

## 设计要点

- `syncPlayerToChar()` 在保存前将 player 对象的 level/exp 同步回当前角色
- `syncCharToPlayer()` 在加载后将角色数据还原到 player 对象并重新计算属性
- 装备槽位默认值在加载时用 spread 合并，确保新版本新增槽位（如 bracers/belt/artifact）不丢失
