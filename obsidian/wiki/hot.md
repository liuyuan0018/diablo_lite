# 当前热点

> 2026-06-09 | 存档系统健壮性修复

## 刚发生

修复了"每次更新代码后存档丢失"的问题。根因是 localStorage 单一存储无备份、无导出导入机制、保存/加载错误被静默吞掉。

### 改动内容

**`js/persistence.js`**:
- 新增 `exportSave()` — 下载存档为 JSON 文件
- 新增 `importSave(file)` — 从文件导入存档，含格式校验
- `saveGame()` 同时写入 sessionStorage 作为后备
- `loadGame()` 在 localStorage 为空时回退到 sessionStorage
- 所有 catch 块改为 `console.error` 输出具体错误

**`js/renderer.js`**:
- 主菜单新增「导出存档」「导入存档」按钮
- `equipFromBackpack()` 新增 auto-save
- `pickupGroundItem()` 新增 auto-save
- 背包 ✕删除装备 新增 auto-save

### 自动存档触发点（完整列表）

升级、Boss击败、死亡、卸下装备、从背包装备、拾取地面装备、背包删除、角色管理操作、测试场返回

## 活跃领域

- 存档系统 ([[concepts/Game-Persistence|游戏存档与持久化]])
- 音效系统调优 ([[concepts/Audio-SFX-Design|音效系统设计]])
- 元素使 / 时空术士套装平衡 ([[concepts/Build-Constraint-System|Build 约束体系]])
- Build 测试场 ([[concepts/Build-Testfield|测试场]])
- 三项假设验证 ([[concepts/Competitive-Assumptions|竖屏约束·实时操作是未验证假设]])

## 最近归档

- [[concepts/Game-Persistence|游戏存档与持久化]] — localStorage+sessionStorage 双保险、导出/导入、装备操作 auto-save
- [[concepts/Audio-SFX-Design|音效系统设计]] — 四层混音 + 频谱分区 + 双轨全程序化合成
- [[concepts/Competitive-Assumptions|三项假设验证]] — v3: 竖屏约束·实时操作是未验证假设
