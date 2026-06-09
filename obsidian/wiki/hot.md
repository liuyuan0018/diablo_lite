# 当前热点

> 2026-06-09 | 装备系统配置驱动化重构

## 刚发生

将 Diablo Lite 装备系统从硬编码 if-else 重构为配置驱动架构。核心成果：

### 三张配置表

- `js/config/buff-table.js` — 所有 stat Buff 定义为数据行（传说威能/法器条件/套装 stat/技能计时），每行包含 condition + effects
- `js/config/equipment-table.js` — SLOT_DEF / ARTIFACT_DEFS / QUALITY_* 的唯一真相源，config.js 改为 re-export
- `js/config/drop-table.js` — 品质掉落曲线 + 词条池 + weightedChoice 选择器

### 两个运行时引擎

- `js/buff-engine.js` — rebuildAllBuffs（装备→buff实例）→ evaluateStatCalc（条件求值+效果聚合）→ getActiveBuffs（buff栏渲染）
- `js/config/skill-hooks.js` + buff-engine dispatchHook — 5 个钩子（onTeleportCast/onBlackholeCast/onBlizzardCast/onProjectileSpawn/onSingularitySpawn），每条 `{id, condition, apply}`

### 数据流

```
equipment-table.js ──→ equipment-factory.js ──→ equipment.js (掉落/拾取)
                              │
buff-table.js ──→ buff-engine.js ──→ calcPlayerStats (stat 计算)
                              │
skill-hooks.js ──→ buff-engine.js ──→ skills.js (技能参数修改)
                              │
drop-table.js ──→ equipment-factory.js (品质曲线)
```

### calcPlayerStats 重构

前：遍历装备累加 → 查 artifact if-else → 查 set if-else → 查 legendary 手工乘 → 返回
后：`rebuildAllBuffs()` + `evaluateStatCalc()` → 聚合 deltas → 只保留 fireballDmg 手工处理（乘 bATK 非 baseATK）

### 未配置化

内爆逻辑、谐律叠层/爆发、harmonyEye 追踪弹、ringElement 轮转、synergies（点燃/冻结/双倍/CD减半）——复杂多步骤逻辑暂留在代码中。

## 设计提炼

- 掉落表 `QUALITY_CURVE` 每行自带 `condition` 字段（如 `{ type: 'minStage', value: 3 }`），`weightedChoice(items, ctx)` 按 ctx 过滤后再加权随机。行自己声明可用条件，不需外置 STAGE_RESTRICTIONS 或 `Math.min(q, cap)` 补救逻辑。

## 活跃领域

- 配置驱动架构 ([[concepts/Config-Driven-Buff-System|Buff/装备系统]])
- 装备系统稳定性 ([[concepts/Equipment-Data-Flow-Pitfalls|装备数据流转陷阱]])
- Build 约束体系 ([[concepts/Build-Constraint-System|Build 约束体系]])
- Build 测试场 ([[concepts/Build-Testfield|测试场]])

## 最近归档

- [[concepts/Config-Driven-Buff-System|配置驱动的 Buff/装备系统]] — 三表两引擎架构，硬编码→数据驱动
- [[concepts/Equipment-Data-Flow-Pitfalls|装备数据流转陷阱]] — 手工重建反模式、字段丢失、三处流转 Bug 修复
- [[concepts/Game-Persistence|游戏存档与持久化]] — localStorage+sessionStorage 双保险、导出/导入
