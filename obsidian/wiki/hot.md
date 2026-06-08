# 当前热点

> 2026-06-09 | 装备流转 Bug 修复 + 存档系统

## 刚发生

修复了装备系统的三处流转 Bug，核心问题是装备对象在多个转移点手工重建，导致新增字段静默丢失。

### Bug 1: 法器词条不显示

传说力场发生器等在背包里显示 `?+0`，没有描述文字。根因是 4 个流转点遗漏了 `artifactId`/`setName`/`desc` 字段，且渲染层法器没有特殊处理。

**修复**: 补全所有流转点的字段 + `generateArtifact()` 写入 `desc` + 渲染层对法器显示描述和 `✦法器` 标记。

### Bug 2: 背包满时物品消失

`updatePickup()` 中 `game.drops.splice()` 在背包满判断外面，物品从地面消失但不进背包。

**修复**: 将 splice 移入 `if(backpack.length<8)` 块内。

### Bug 3: 丢弃装备不回地面

背包点 ✕ 丢弃仅 splice 删除，未创建掉落物。加上掉落物后，位置在玩家脚底被瞬间自动回收。

**修复**: 丢弃时创建掉落物并偏移 ±80px，超出 40px 拾取范围。

## 活跃领域

- 装备系统稳定性 ([[concepts/Equipment-Data-Flow-Pitfalls|装备数据流转陷阱]])
- 存档系统 ([[concepts/Game-Persistence|游戏存档与持久化]])
- 音效系统 ([[concepts/Audio-SFX-Design|音效系统设计]])
- Build 约束体系 ([[concepts/Build-Constraint-System|Build 约束体系]])
- Build 测试场 ([[concepts/Build-Testfield|测试场]])

## 最近归档

- [[concepts/Equipment-Data-Flow-Pitfalls|装备数据流转陷阱]] — 手工重建反模式、字段丢失、三处流转 Bug 修复
- [[concepts/Game-Persistence|游戏存档与持久化]] — localStorage+sessionStorage 双保险、导出/导入、装备操作 auto-save
- [[concepts/Audio-SFX-Design|音效系统设计]] — 四层混音 + 频谱分区 + 双轨全程序化合成
