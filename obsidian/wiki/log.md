# 变更日志

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
