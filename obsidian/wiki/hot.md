# 当前热点

> 2026-06-07 | save: 角色管理系统

## 多角色存档架构

5 个文件改动，核心设计：

- **game-state.js**: `characters[]` + `activeCharacterId` + 4 辅助函数
- **persistence.js**: v2 格式 + v1 自动迁移，`saveGame()` 内置 sync
- **renderer.js**: 准备界面角色栏 + `renderCharSelect()` 管理面板
- **gameplay.js**: 点击分支优先处理角色面板，`backpack.length=0` 保持引用
- **input.js**: 角色面板滚轮支持

## 关键设计决定

- **对象引用同步**: `game.equipment`/`game.backpack` 直接指向角色对象 → 零改动兼容现有装备代码
- **原始值手动同步**: level/exp 在 save/load/switch 时通过 `syncPlayerToChar`/`syncCharToPlayer` 传递
- **共享资源**: soulCoins + unlockedStages 全角色共享，装备/等级/背包每角色独立
- **旧档迁移**: 检测 `!data.version`，自动包装为单角色新格式

## 核心链接

- [[concepts/Character-Management|角色管理系统]]
- [[concepts/Equipment|装备系统]]
- [[meta/GameArchitecture|游戏架构]]
- [[concepts/Build|Build 系统]]
- [[questions/Research-D3-Wizard-Builds|D3 调研]]
