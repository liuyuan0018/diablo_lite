# 当前热点

> 2026-06-09 | 音效系统完整重设计

## 刚发生

完成了 Diablo Lite 全部 20 种游戏音效的从零重新设计及实现。设计驱动来自 Hybrid Casual 休闲赛道定位（对标 Archero/Survivor.io），确立"Juicy Casual + Power Skills"双轨设计理念。

### 核心成果

**四层优先级混音架构**:
- L1 关键: 受击/Boss出现/Boss击杀/GameOver/胜利
- L2 重要: 四大技能/精英击杀/升级
- L3 频繁: 普攻/击杀/拾取/生命球/爆炸
- L4 微妙: 按钮/装备卸装

**频谱分区**: 从 14Hz (黑洞) 到 6000Hz (陨石尖啸)，六八度频跨，每类声音占据独立频段防止战斗时糊成一片。

**技能音效 (dur=2.0s)**:
- teleport: sine 200→3000Hz 上行呼啸 (唯一上行)
- blackHole: sine 55→10Hz 极低频引力 (游戏最低音)
- blizzard: both 双纹理 (sine 120→60 呼啸 + bandpass 3000→300 寒风)
- meteor: saw 1200→20 + lp 6000→40 尖啸撞击 (最大频跨)

**引擎修复**:
- 修复 AudioNode 内存泄漏 (onended cleanup)
- 解除增益包络 decay 的 20ms 硬上限
- 添加 vary 频率随机化支持 (fire 20% jitter)

## 活跃领域

- 音效系统调优 ([[concepts/Audio-SFX-Design|音效系统设计]])
- 元素使 / 时空术士套装平衡 ([[concepts/Build-Constraint-System|Build 约束体系]])
- Build 测试场 ([[concepts/Build-Testfield|测试场]])
- 三项假设验证 ([[concepts/Competitive-Assumptions|竖屏约束·实时操作是未验证假设]])
- 移动端适配挑战 ([[concepts/Mobile-Adaptation|操作转型分析]])

## 最近归档

- [[concepts/Audio-SFX-Design|音效系统设计]] — 四层混音 + 频谱分区 + 双轨全程序化合成
- [[concepts/Competitive-Assumptions|三项假设验证]] — v3: 竖屏约束·实时操作是未验证假设
- [[comparisons/Diablo-Lite-vs-Habby|Diablo Lite vs Habby 对比矩阵]] — 13维度对比
