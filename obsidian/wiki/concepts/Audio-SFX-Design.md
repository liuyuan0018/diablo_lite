---
type: concept
title: "音效系统设计"
created: 2026-06-09
updated: 2026-06-09
tags: [audio, sound-design, game-feel, hybrid-casual]
status: developing
related:
  - "[[concepts/Competitive-Assumptions]]"
  - "[[comparisons/Diablo-Lite-vs-Habby]]"
---

## 设计理念

**双轨设计**: Juicy Casual + Power Skills

| 轨道 | 音效类型 | 情感目标 | 设计原则 |
|------|----------|----------|----------|
| Juicy 轨 | 普攻、拾取、击杀、升级 | 爽、解压、dopamine | 短促清脆，像捏气泡膜，听不腻 |
| Power 轨 | 技能、Boss、受击 | 力量、仪式感、信号明确 | 有分量、不可忽略、辨识度高 |

技术路线: 纯 Web Audio API 程序化合成，零外部音频文件。所有音效在 `js/audio.js` 的 `AUDIO_CFG` 中声明式定义。

---

## 四层优先级混音架构

借鉴混音台 ducking 思路 — 高层级声音自动在心理上压过低层级:

```
Layer 1 (CRITICAL)  — 受击·Boss出现·Boss击杀·GameOver·胜利
  ↓ 永远不能被淹没
Layer 2 (IMPORTANT) — 四大技能·精英击杀·升级
  ↓ 需要突出但不霸道
Layer 3 (FREQUENT)  — 普攻·普通击杀·拾取·生命球·爆炸
  ↓ 听得清但不抢戏
Layer 4 (SUBTLE)    — 按钮·装备卸装
  ↓ 轻反馈，锦上添花
```

### 频谱分区

不同声音占据不同频段，即使同时播放也能分辨:

| 频段 | Hz 范围 | 分配的声效 |
|------|---------|-----------|
| 次低频 | 20-60 | 黑洞、Boss出场（身体感应） |
| 低频 | 60-250 | 陨石撞击、爆炸、Boss击杀 |
| 中低 | 250-600 | 精英击杀、玩家受击 |
| 中频 | 600-2000 | 普攻、传送、暴雪、拾取、升级、装备 |
| 高频 | 2000-8000 | 按钮、普攻噪声层、陨石尖叫段 |

---

## 逐层音效定义

### Layer 4 — 微妙层

| 音效 | 类型 | 频率 | 持续 | 设计意图 |
|------|------|------|------|----------|
| click | sine osc | 2000→2400Hz | 0.04s | 极短促亮 ping |
| equip | sine osc | 700↗1200Hz | 0.12s | 上行=正向确认 |
| unequip | sine osc | 1200↘700Hz | 0.10s | 下行="卸下" |

### Layer 3 — 频繁战斗层

| 音效 | 类型 | 频率 | 持续 | 设计意图 |
|------|------|------|------|----------|
| fire | square+noise | osc 700→180Hz / noise 1800→500Hz | 0.06s | 魔法弹，vary:0.20 防疲劳 |
| hit | noise | 1200Hz | 0.03s | 命中瞬间反馈 |
| kill | saw+noise | osc 500→80Hz / noise 2000→300Hz | 0.15s | 击杀"kshh"解压 |
| eliteKill | saw+noise | osc 600→50Hz / noise 2500→200Hz | 0.25s | kill 加重版 |
| explode | saw+noise | osc 400→25Hz / noise 4000→100Hz | 0.35s | 宽幅爆炸 |
| pickup | sine osc | 880↗1320Hz | 0.08s | 捡金币"叮" |
| healthGlb | sine osc | 990↘700Hz | 0.10s | 柔和下行回血 |

### Layer 2 — 技能层 (dur=2.0s)

| 技能 | 类型 | 频率跨度 | 叙事结构 |
|------|------|----------|----------|
| teleport | both (sine+highpass noise) | sin 200→3000 / hp 400→2500 | 魔法蓄力→撕裂空间→余韵 |
| blackHole | both (sine+lowpass noise) | sin 55→10 / lp 500→40 | 引力井形成→吞噬→收束 |
| blizzard | both (sine+bandpass noise) | sin 120→60 / bp 3000→300 | 风起→咆哮→渐远 |
| meteor | both (saw+lowpass noise) | saw 1200→20 / lp 6000→40 | 坠落→尖啸→撞击→余震 |

辨识维度:
- **teleport**: 唯一上行扫频 (200→3000Hz)，highpass 噪声
- **blackHole**: 极低频 (55→10Hz)，游戏最低声音
- **blizzard**: 双纹理 — 低频 sine 呼啸(120→60Hz) + bandpass 寒风(3000→300Hz)
- **meteor**: 最大频跨 (1200→20 + 6000→40 = 全频带)

### Layer 1 — 关键事件层

| 音效 | 类型 | 频率 | 持续 | 设计意图 |
|------|------|------|------|----------|
| playerHit | square+noise | osc 250→80Hz / noise 800→120Hz | 0.15s | 中低频冲击，不被普攻淹没 |
| bossSpawn | both (sine+lowpass noise) | sin 40→14 / lp 300→50 | 0.60s | 极低频隆隆，"有大事" |
| bossKill | both (saw+lowpass noise) | saw 200→12 / lp 3500→60 | 0.70s | 最重的死亡音 |
| levelUp | arp (sine C→E→G) | 523/659/784Hz | 0.45s | 明亮上行，不与任何战斗音冲突 |
| gameOver | triangle osc | 220→35Hz | 0.90s | 悲伤下行三角波 |
| victory | arp (sine C→E→G→C) | 四音符 | 0.70s | 完整上行琶音 |

---

## 引擎技术细节

### 合成器

三个内部合成函数:
- **oscSweep**: 振荡器 + 频率扫频 + ADSR 增益包络。支持 `vary` 随机化（jitter 应用于 freq/fEnd）
- **noiseSweep**: 白噪声缓冲 → BiquadFilter 扫频 → 增益包络。支持 `vary` 随机化（jitter 应用于 nf/nfEnd）
- **playArp**: 多音符序列，每个音符独立 osc+gain

### Node 生命周期

每个音效播放完通过 `onended` 回调自动断开:
- oscSweep: `osc.onended → g.disconnect()`
- noiseSweep: `src.onended → g.disconnect(); filter.disconnect()`
- playArp: 每 note `osc.onended → g.disconnect()`

之前死节点无限累积在 masterNode 上是音效失效的根因。

### 增益包络（无上限版）

```
oscSweep: attack(5%dur) → decay(30%dur, 无上限) → sustain(60%peak) → release(rest)
noiseSweep: attack(4ms) → decay(60%dur, to 15%) → release(rest)
```

关键修复: 去除了 `decay = Math.min(0.02, ...)` 的 20ms 上限，使长声音的包络能正确展开。

### 音量堆栈

```
实际音量 = sound.V × category.vol × master
```

当前: master=0.55, combat=0.60, skill=0.55, event=0.50, ui=0.40
