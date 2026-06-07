# 当前热点

> 2026-06-07 | save: 测试场 UI 完善 + 装备弹窗套装/法器显示

## 测试场最终布局

- **左侧**：配装面板（5 预设 + 自由搭配，可折叠）+ DPS 统计弹窗（左下）
- **右侧**：装备网格（复用 `renderEquipGrid`，3×3，沙箱数据源）
- **中间**：游戏画面（木桩 + 技能 + 浮动伤害数字）
- **底部**：战斗 HUD（`renderHUD` — 技能栏 + 血条）

## 装备弹窗增强

`renderCompareTooltip` 现在支持：
- **套装物品**：显示套装名 + 2件/3件/4件效果名称 + 详细描述
- **法器**：显示金**法器名 + 效果描述
- **套装对比**：同套装 `(=)` / 不同套装 `(不同套装)` / 新套装 `✦新`
- **测试场适配**：自动从 `sandboxEquipment` 读取对比数据

## 关键修复

- 自动攻击扩展至 `trainingDummies`（之前只扫描 `game.monsters`）
- `renderEquipGrid` 提取为可复用组件（准备界面和测试场共用）
- 配装面板/弹窗移至左侧避免与右侧装备网格重叠
- 修复 `const artInfo` 重复声明导致黑屏

## 核心链接

- [[concepts/Build-Testfield|Build 测试场]]
- [[concepts/Build-Constraint-System|Build 约束体系]]
- [[concepts/Equipment|装备系统]]
- [[concepts/LootDetailView|装备悬停对比弹窗]]
