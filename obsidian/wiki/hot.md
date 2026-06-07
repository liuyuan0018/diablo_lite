# 当前热点

> 2026-06-07 | save: Build 测试场

## 测试场功能

独立 build 验证工具，准备界面左下角入口：

- **6 个训练木桩**：单体 / 减伤 30% / 减伤 60% / 群体×3
- **配装面板**（左侧）：5 个预设模板 + 自由搭配，一键装备满级满值 build
- **DPS 统计**（左下弹窗）：DPS（3s 窗口）/ 总伤 / 峰值 / 计时 / 重置
- **装备网格**（右侧）：复用准备界面 3×3 网格 + 悬停对比弹窗
- **沙箱隔离**：深拷贝装备 → 测试 → 退出恢复，不影响真实角色

## Build 约束体系

全项目 14 个 JS 文件变更，+1388/-51 行。2 套套装、4 组传奇协同、4 个法器。
套装仅 ilvl 70（篇章 3+）掉落，练级阶段散件传奇掉率提升。

## D4 暗金调研启示

- 行为改造放技能系统，不放装备
- 一个 build 最多锁 1 件暗金
- "全职业必带"级装备应内置为技能

## 核心链接

- [[concepts/Build-Testfield|Build 测试场]]
- [[concepts/Build-Constraint-System|Build 约束体系]]
- [[concepts/D4-Uniques-Build-Relationship|暗金-Build 关系分析]]
- [[concepts/Equipment|装备系统]]
- [[meta/GameArchitecture|游戏架构]]
