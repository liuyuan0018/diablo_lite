# Diablo Lite — 知识索引

> 最后更新: 2026-06-07
> 
> **代码是唯一事实来源。** 本索引用于快速导航和理解设计意图，具体实现以对应系统代码为准。

## 核心概念

- [[concepts/Elementalist-Harmony-Stacking|元素使谐律叠层]] — 自动攻击癞子牌、autoUsed 单次限制、同元素重置到 1 而非 0
- [[concepts/Combat-Balance|战斗平衡]] — 难度重调、黑洞易伤(+50%)、元素戒指(50-150%)
- [[concepts/Build-Testfield|Build 测试场]] — 训练木桩 + 一键配装 + DPS 统计 + 槽位选择弹窗，沙箱隔离
- [[concepts/Build-Constraint-System|Build 约束体系]] — 套装(2套×3层) + 传奇协同(4组) + 法器(4个)，9 槽位体系
- [[concepts/Character-Management|角色管理系统]] — 多角色存档架构，独立装备/等级，自动迁移旧存档
- [[concepts/LootDetailView|装备悬停对比弹窗]] — 悬停物品触发左右对比弹窗，属性差异绿/红/金标记
- [[concepts/Equipment|装备系统]] — ilvl、品质、掉落机制、背包规则（战斗8件/准备无限）
- [[concepts/LegendaryPowers|传奇词缀]] — 8 种传奇效果详解
- [[concepts/Build|Build 系统]] — 流派分化与装备组合（v2：三层约束体系）
- [[concepts/Difficulty|难度曲线]] — 10 关指数难度设计
- [[concepts/Skills|技能系统]] — 3 技能 + 自动攻击
- [[concepts/Audio-SFX-Design|音效系统设计]] — 四层优先级混音架构 + 频谱分区 + 双轨(Juicy+Power)全程序化合成的音效方案
- [[concepts/Competitive-Assumptions|三项假设验证]] — 受众规模/深度传递/变现模式的证据评估

## 实体

- [[entities/Player|玩家]] — 属性、等级、移动
- [[entities/Monsters|怪物]] — 10 种怪物 + 精英词缀 + Boss
- [[entities/EquipmentSlots|装备槽位]] — 6 槽位属性映射

### Diablo Lite 套装
- [[entities/Elementalist-Set|元素使套装]] — 交替元素 → 谐律爆发
- [[entities/Chronomancer-Set|时空术士套装]] — 造场 → 引爆 → 回 CD

## D3 Wizard Builds 调研 (2026-06-07)

- [[questions/Research-D3-Wizard-Builds|D3 法师 Build 发展史]] — 2012-2026 设计范式演变
- [[concepts/Wizard-Build-History|法师 Build 历史演变]] — 四大纪元 + 五条设计线索
- [[comparisons/D3-Build-Design-Lessons|设计经验提取 → Diablo Lite]] — 7 条原则 + 优先级建议
- [[concepts/Critical-Mass-Permafreeze|Critical Mass Permafreeze (CMWW)]] — 正反馈失控的经典案例
- [[concepts/Attack-Speed-Breakpoints|攻速断点 (Hydra)]] — 离散阈值替代连续梯度
- [[concepts/Arcane-Dynamo-Snapshotting|Arcane Dynamo 快照]] — 释放时机 > 持续按键

### D3 套装实体
- [[entities/Tal-Rasha-Set|Tal Rasha's Elements]] — 元素多样性范式载体
- [[entities/Typhon-Veil-Set|The Typhon's Veil]] — 宠物快照+断点优化载体
- [[entities/Firebird-Set|Firebird's Finery]] — 条件式攻防一体设计
- [[entities/Vyr-Amazing-Arcana|Vyr's Amazing Arcana]] — 变身窗口期节奏设计
- [[entities/Delsere-Magnum-Opus|Delsere's Magnum Opus]] — 空间即资源设计

## D4 Sorcerer Builds 调研 (2026-06-07)

- [[questions/Research-D4-Sorcerer-Builds|D4 Sorcerer Build 发展史]] — 2023-2026 赛季演变 + D3 对比
- [[concepts/D4-Sorcerer-Build-Evolution|D4 Sorcerer 完整演变叙事]] — 五个阶段 + 三条设计线索
- [[concepts/D4-Enchantment-System|D4 Enchantment 系统]] — 被动技能的法师进化版

### D4 暗金装备与 Build 关系
- [[questions/Research-D4-Sorcerer-Uniques|D4 暗金如何定义 Sorcerer Build]] — 行为改造 vs 数值放大、Give and Take 争议、双暗金锁
- [[concepts/D4-Uniques-Build-Relationship|暗金-Build 关系深度分析]] — 三个设计层级 + 对 Diablo Lite 的具体启示

### D3 调研来源
- [[sources/Maxroll-Typhon-Hydra-Guide|Maxroll Typhon Hydra Guide]]
- [[sources/Maxroll-LoD-Twister-Guide|Maxroll LoD Twister Guide]]
- [[sources/Maxroll-LoD-Hydra-Guide|Maxroll LoD Hydra Guide]]
- [[sources/Blizzard-Forum-Typhon-TK|Blizzard Forum Typhon TK]]

## Mobile Habby Games 调研 (2026-06-08)

- [[questions/Research-Mobile-Habby-Games|Mobile Habby Games vs Diablo Lite 竞争力分析]] — 三款Habby手游对比 + 我们的核心竞争力判断
- [[comparisons/Diablo-Lite-vs-Habby|Diablo Lite vs Habby 对比矩阵]] — 13维度逐项对比
- [[concepts/Habby-Template|Habby 模板化生产体系]] — 7条设计规律 + 模板适用范围
- [[concepts/Power-Wall-Problem|Power Wall 问题]] — Roguelike×数值付费的结构性矛盾

### Habby 游戏实体
- [[entities/Archero|Archero (弓箭传说)]] — 类型定义者，$2.65亿
- [[entities/Survivor.io|Survivor.io (弹壳特攻队)]] — 生存竞技场模板，$5亿+
- [[entities/PunBall|PunBall (砰砰法师)]] — 物理弹射，模板偏离案例

### Mobile 调研来源
- [[sources/Naavik-Survivorio-vs-Archero|Naavik — Survivor.io vs Archero 深度对比]]
- [[sources/DoF-Habby-Hybridcasual-Empire|Deconstructor of Fun — Habby 混合休闲帝国]]

### 竖屏ARPG对标产品
- [[entities/Hero-Without-Flash|英雄没有闪]] — 年流水21亿，竖屏半自动暗黑Like，50+流派

## 设计决策

- [[meta/GameArchitecture|游戏架构]] — ES 模块架构，18 文件拆分

## 文件索引

- `index.html` — HTML 外壳（21 行），加载 `js/main.js`
- `js/` — 18 个 ES 模块（2603 行总计，零依赖，无打包器）
- `server.py` — 无缓存 HTTP 服务器
