# 变更日志

## [2026-06-09] save | 掉落表 condition 字段 + Buff 系统更新
- 类型: concept (update)
- 文件: wiki/concepts/Config-Driven-Buff-System.md
- 来源: QUALITY_CURVE 每行加 condition 字段替代 STAGE_RESTRICTIONS + Math.min cap

## [2026-06-09] save | 配置驱动的 Buff/装备系统
- 类型: concept
- 文件: wiki/concepts/Config-Driven-Buff-System.md
- 来源: 装备系统重构 — 三表（Buff/装备/掉落）+ Buff Engine + Skill Hooks，将硬编码效果迁移为数据驱动

## [2026-06-09] save | 装备数据流转陷阱
- 类型: concept
- 文件: wiki/concepts/Equipment-Data-Flow-Pitfalls.md
- 来源: 修复三处装备流转 Bug — 法器词条不显示(字段丢失)、背包满时物品消失、丢弃装备不回地面(自动回收)

## [2026-06-09] save | 游戏存档与持久化
- 类型: concept
- 文件: wiki/concepts/Game-Persistence.md
- 来源: 修复"更新后存档丢失"问题 — 添加导出/导入按钮、sessionStorage 后备、装备操作自动存档补齐

## [2026-06-09] save | 音效系统设计
- 类型: concept
- 文件: wiki/concepts/Audio-SFX-Design.md
- 来源: 完整的音效系统重设计 — 四层混音架构、频谱分区、20个音效逐层定义、引擎技术细节（node生命周期/增益包络/vary随机化）

## [2026-06-08] autoresearch | 品类纠正：竖屏放置挂机 ≠ 竖屏实时战斗（假设调研第三波修正）
- 搜索: 6 次 WebSearch
- 更新: 3 (concepts/Competitive-Assumptions完全重写, entities/Hero-Without-Flash纠偏, questions/Research-Mobile-Habby-Games)
- 关键发现: 英雄没有闪/迷雾大陆是放置挂机游戏，不是实时动作ARPG。**竖屏 × 实时主动技能战斗 × 深度Build —— 这个交叉点从未被尝试。** 最高风险假设变为"竖屏能否承载3主动技能"，必须原型验证

## [2026-06-08] autoresearch | 三项竞争力假设验证 (假设调研第二波)
- 搜索: 18 次 WebSearch
- 创建页面: 1 (concept/Competitive-Assumptions), 更新 1 (questions/Research-Mobile-Habby-Games)
- 综合页: [[concepts/Competitive-Assumptions|三项假设验证]]
- 关键发现: 三项假设中两项强证据、一项中强证据。Soul Knight Prequel/Torchlight Infinite/Diablo Immortal/Duet Night Abyss 分别验证了深度Build需求、移动端复杂度承载、和纯外观变现的可行性

## [2026-06-08] autoresearch | Mobile Habby Games vs Diablo Lite 竞争力分析 (v2: 移动端同赛道)
- 轮次: 2
- 搜索: 18 次 WebSearch + 3 次 WebFetch
- 创建页面: 10 (2 sources, 3 entities, 3 concepts, 1 question, 1 comparison)
- 综合页: [[questions/Research-Mobile-Habby-Games|Research-Mobile-Habby-Games]]
- v2更新: 用户明确目标平台也是手游后，重新以"同赛道正面竞争"视角重写分析。核心结论：Build三层约束体系是Habby无法复制的核心壁垒。三个待验证假设：受众规模、上手门槛、变现模式

## [2026-06-08] save | 元素使谐律叠层机制 — 自动攻击癞子牌 + autoUsed 修复
- 类型: concept (new) + entity (update)
- 文件: wiki/concepts/Elementalist-Harmony-Stacking.md (new), wiki/entities/Elementalist-Set.md (update, 去除 stub)
- 来源: 发现自动攻击火球可反复充当元素轮转桥梁（黑洞→火球→火球→暴风雪也能到 3 层）。修复为癞子牌模式——每技能周期限用一次，不修改 lastElement；同元素技能重置改为 stacks=1 而非 0。4 文件改动（game-state + player + skills + gameplay）

## [2026-06-08] save | 战斗平衡 — 难度重调 + 黑洞易伤 + 元素戒指
- 类型: concept (new) + update × 3
- 文件: wiki/concepts/Combat-Balance.md (new), wiki/concepts/Build-Testfield.md (update)
- 来源: 难度曲线重调（前两章随等级成长、第四章起陡增），黑洞新增 3s 易伤 debuff（受伤害+50%），元素戒指作为传奇词缀（50-150%），测试场自由搭配新增槽位选择弹窗

## [2026-06-07] save | 测试场 UI 完善 + 装备弹窗套装/法器显示
- 类型: concept (update)
- 文件: wiki/concepts/Build-Testfield.md (update)
- 来源: 测试场 UI 修复 — 自动攻击目标扩展至木桩、复用准备界面装备网格、配装面板/DPS 弹窗移至左侧、悬停对比弹窗显示套装效果详情（desc + detail）和法器描述

## [2026-06-07] save | Build 测试场
- 类型: concept (new) + update × 3
- 文件: wiki/concepts/Build-Testfield.md (new)
- 来源: 新增独立 build 验证工具 — 6 个训练木桩（单体/减伤/群体）、5 个预设配装模板 + 自由搭配面板、DPS/总伤/峰值统计、沙箱装备隔离、复用准备界面装备网格和悬停对比弹窗。8 个提交，+700 行。

## [2026-06-07] autoresearch | D4 暗金装备与 Sorcerer Build 的关系
- 轮次: 1 (广撒网 + 深挖)
- 搜索: 8 次
- 创建页面: 2（concepts × 1 + questions × 1）
- 综合页: [[questions/Research-D4-Sorcerer-Uniques|D4 暗金如何定义 Sorcerer Build]]
- 核心发现: 暗金分三个设计层级（行为改造/机制联动/数值放大），仅 L1+L2 能定义 build；"Give and Take"是 Sorcerer 独有惩罚（6+ 负面暗金 vs 其他职业 0-1）；Fireball 等需要双暗金才能玩；Raiment 悖论——一件聚怪暗金统治所有 build

## [2026-06-07] autoresearch | Diablo 4 Sorcerer Builds 发展史
- 轮次: 1 (广撒网 + 深挖)
- 来源: 搜索 16 次，抓取 0 次（搜索结果内容直接充足）
- 创建页面: 3（concepts × 2 + questions × 1）
- 综合页: [[questions/Research-D4-Sorcerer-Builds|D4 Sorcerer Build 发展史]]
- 核心叙事: 追踪 5 个赛季阶段的范式转变——Enchantment 系统、Gravitational Aspect 行为改造、Winterglass 生态定义、Conjuration 膨胀 → 职业认同危机

## [2026-06-07] save | 战利品掉落规则调整 — 套装等级限制
- 类型: concept (update)
- 文件: wiki/concepts/Equipment.md (update)
- 来源: 散件传奇全等级掉落，套装仅 ilvl 70（篇章 3+）掉落。rollQuality/rollBossQuality 增加 stageIdx 参数，篇章 0-2 套装概率合并到传说。

## [2026-06-07] save | Build 约束体系 — D3 调研落地
- 类型: concept (new) + update × 3
- 文件: wiki/concepts/Build-Constraint-System.md (new), wiki/concepts/Build.md (update)
- 来源: 将 D3 法师 Build 调研的 7 条设计原则落地为可运行系统 — 9 槽位、2 套套装（元素使/时空术士）、4 组传奇协同、4 个法器，16 个提交，+654/-42 行

## [2026-06-07] save | 角色管理系统
- 类型: concept
- 文件: wiki/concepts/Character-Management.md
- 来源: 新增多角色存档架构 — 创建/切换/删除角色，装备等级独立，灵魂币关卡共享，旧存档自动迁移

## [2026-06-07] save | 代码模块化拆分 — 单文件 → 18 个 ES 模块
- 类型: meta (update)
- 文件: wiki/meta/GameArchitecture.md
- 来源: 将 2685 行 index.html 拆分为 18 个 ES 模块（config, game-state, player, skills, monsters, spawner, projectiles, particles, towers, equipment, renderer, input, camera, persistence, gameplay, helpers, canvas, main），零循环依赖，支持并行开发

## [2026-06-07] autoresearch | Diablo 3 Wizard Builds 发展史 + 设计经验提取
- 轮次: 1 (广撒网 + 深挖)
- 来源: 4
- 创建页面: 15
- 综合页: [[questions/Research-D3-Wizard-Builds|D3 法师 Build 发展史]]
- 设计经验页: [[comparisons/D3-Build-Design-Lessons|设计经验 → Diablo Lite]] — 7 条原则 + 优先级建议
- 核心叙事: 追踪设计范式演变（技能驱动→套装定义→宝石解放→维护稳定），非强度排名

## [2026-06-07] save | 装备悬停对比弹窗 + 背包系统重构
- 类型: concept (update) × 2
- 文件: wiki/concepts/LootDetailView.md, wiki/concepts/Equipment.md
- 来源: 点击弹窗改为悬停对比（左装备/右悬停，属性差异绿↑红↓金✦标记），背包界面去左侧装备面板改用对比弹窗，战斗背包限制8件/准备无限，添加滚轮滚动支持，修复卸下装备丢失和 prepButtons 清空 bug

## [2026-06-07] save | 战利品详情查看
- 类型: concept
- 文件: wiki/concepts/LootDetailView.md
- 来源: 结算界面增加装备详情弹窗，点击物品先查看完整信息再决定操作

## [2026-06-07] save | 掉落等级曲线调整
- 类型: concept (update)
- 文件: wiki/concepts/Equipment.md
- 来源: 修改 rollIlvl() — stageIdx>=3 固定掉落 ilvl 70，后期聚焦品质/词缀筛选


- 类型: concept
- 文件: wiki/concepts/ProjectilePierce.md
- 来源: 修复 `createMonster()` 无 ID 导致穿透失效的 bug

## [2026-06-07] save | Diablo Lite 核心系统知识沉淀
- 类型: concepts × 4
- 文件: wiki/concepts/Equipment.md, Build.md, Difficulty.md, LegendaryPowers.md, Skills.md
- 来源: Diablo Lite 游戏设计对话
