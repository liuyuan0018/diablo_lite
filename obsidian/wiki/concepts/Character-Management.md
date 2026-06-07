---
type: concept
title: "角色管理系统"
created: 2026-06-07
updated: 2026-06-07
tags: [character, save, migration, ui]
status: developing
related:
  - "[[concepts/Equipment|装备系统]]"
  - "[[meta/GameArchitecture|游戏架构]]"
---

# 角色管理系统

多角色存档架构，允许玩家创建、切换、删除角色。每个角色独立拥有装备、等级、背包，灵魂币和关卡解锁进度全角色共享。

## 数据模型

### 角色对象 (Character)

```javascript
{
  id: 'char_<timestamp>',    // 唯一标识
  name: '勇者',               // 角色名称
  level: 1,                  // 等级 (1-70)
  exp: 0,                    // 当前经验
  expToNext: 100,            // 升级所需经验
  equipment: {               // 6个装备槽位
    weapon: null,
    helmet: null,
    armor: null,
    ring: null,
    amulet: null,
    boots: null
  },
  backpack: [],              // 背包物品
  createdAt: <timestamp>     // 创建时间
}
```

### 游戏状态扩展

`game` 单例新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `characters` | `Array<Character>` | 所有角色 |
| `activeCharacterId` | `string|null` | 当前活跃角色 ID |
| `showCharSelect` | `boolean` | 角色选择面板开关 |

### 引用同步机制

`game.equipment` 和 `game.backpack` 通过**对象引用**直接指向当前角色的对应属性。修改装备/背包时自动反映到角色数据，无需手动同步。

`game.player.level/exp/expToNext` 是**原始值**，需要在关键时机同步：
- **Player → Char**: `saveGame()` 调用 `syncPlayerToChar()` 前
- **Char → Player**: `loadGame()` 和角色切换时调用 `syncCharToPlayer()`

### 共享 vs 独立

| 数据 | 范围 | 理由 |
|------|------|------|
| 等级、经验 | 每角色独立 | 核心养成进度 |
| 装备、背包 | 每角色独立 | Build 差异化 |
| 灵魂币 | 全角色共享 | 简化经济系统 |
| 关卡解锁 | 全角色共享 | 避免重复推进 |
| 技能、属性 | 运行时计算 | 从等级+装备派生 |

## 存档格式

### v2 (当前)

```json
{
  "version": 2,
  "characters": [ Character, ... ],
  "soulCoins": 100,
  "unlockedStages": [true, false, ...],
  "activeCharacterId": "char_xxx"
}
```

### v1 → v2 自动迁移

旧存档无 `version` 字段，`loadGame()` 检测后自动：
1. 创建默认角色 "勇者"
2. 将旧存档的 level/exp/equipment 注入该角色
3. 保持 soulCoins 和 unlockedStages
4. 保存为新格式

## UI 设计

### 准备界面角色栏

位于标题下方，显示 `角色: [名称] [切换 ▶] [+新角色]`。

两个按钮均为即时操作：
- **切换** — 打开角色管理面板
- **+新角色** — `prompt()` 输入名称，取消则自动命名

### 角色管理面板

居中弹窗 (`renderCharSelect`)，暗色半透明遮罩：

- 角色列表（可滚轮滚动）
  - 显示名称、等级、已装备槽位数
  - 当前角色绿色高亮 + `● 当前` 标记
  - `[选择]` 切换 / `[删除]` 删除（带 `confirm()` 确认）
- 底部 `+ 创建新角色` 按钮
- X 关闭按钮 + 点击遮罩外部关闭

点击处理：`gameplay.processClick()` 中 `showCharSelect` 分支优先于 `selectedEquipSlot` 分支。角色面板按钮通过 `charButtons` 数组管理，点击外部区域自动关闭面板。

**层级处理**：`renderCharSelect()` 调用后 `return` 提前退出，避免后续关卡选择按钮在弹窗上方渲染。

## 关键函数

| 函数 | 文件 | 职责 |
|------|------|------|
| `createCharacter(name)` | game-state.js | 创建新角色对象 |
| `getActiveCharacter()` | game-state.js | 获取当前活跃角色 |
| `syncPlayerToChar()` | game-state.js | 等级/经验写回角色 |
| `syncCharToPlayer()` | game-state.js | 角色数据加载到运行时 |
| `saveGame()` | persistence.js | 先 syncPlayerToChar 再写 localStorage |
| `loadGame()` | persistence.js | 含 v1 迁移逻辑，自动创建默认角色 |
| `renderCharSelect()` | renderer.js | 角色管理面板渲染 |

## 设计决策

**为什么用对象引用而非 getter/setter？**
游戏代码大量直接读写 `game.equipment[slot]` 和 `game.backpack[idx]`。对象引用方式零改动兼容所有现有代码，只需确保 `game.backpack = []` 改为 `game.backpack.length = 0` 避免断开引用。

**为什么灵魂币共享？**
类似 Diablo 的 Gold 账户共享设计。角色之间可以互相支援资源，降低新角色启动门槛。

**为什么关卡解锁共享？**
避免强迫玩家每个角色重新推图。解锁进度反映的是玩家对游戏内容的掌握，不是角色养成的一部分。
