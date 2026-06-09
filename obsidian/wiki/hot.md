# 当前热点

> 2026-06-09 | 技能系统原子化 + 表现层分离

## 刚发生

技能系统从 switch-case 大块重构为原子架构，确立了技能→光环→Buff 三层模型。

### 核心洞察

`periodicDamage` 不是独立原子 — 它是光环（aura）的一个 modifier。同样地，pull、debuff 施加都是光环 modifier。

三者关系：**技能通过原子创建光环，光环通过 modifier 向实体施加 Buff。** 是"动作→区域→状态"的因果链。

### 技能原子（6 种）

movement / spawnAura / applyBuff / stateTrack / cooldownMod / conditional

每个技能是 atoms[] 列表，castSkill 变为统一执行器遍历原子。元素追踪（3处）和时空共鸣（2处）的 copy-paste 通过 stateTrack/cooldownMod 消除。

### 光环引擎

`js/atoms/aura-engine.js` 的 `tickAuras(dt)` 替代了 updateSkillEffects 的 ~140 行 switch。7 种光环风格定义在 aura-defs.js，每种由 modifier 列表组成。

modifier: damageTick(连续/间隔/单发/终结) / pull(恒定/递增) / applyBuff / onEnd

### 表现层分离

`js/atoms/skill-presentation.js` 是唯一引用 particles.js/audio.js/renderer.js 的文件。引擎层只调用 `present.xxx()`，不看具体实现。

### 代码消除

skills.js castSkill switch (~170行) + updateSkillEffects switch (~140行) → createAura() + tickAuras() + present

## 活跃领域

- 技能原子化 ([[concepts/Skill-Atom-Aura-Architecture|三层架构]])
- 配置驱动 ([[concepts/Config-Driven-Buff-System|Buff/装备系统]])
- 装备系统 ([[concepts/Equipment-Data-Flow-Pitfalls|陷阱]])

## 最近归档

- [[concepts/Skill-Atom-Aura-Architecture|技能原子/光环/Buff 架构]] — 因果链、6原子、7光环、表现层分离
- [[concepts/Config-Driven-Buff-System|配置驱动的 Buff/装备]] — 三表两引擎
- [[concepts/Equipment-Data-Flow-Pitfalls|装备数据流转陷阱]]
