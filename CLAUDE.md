# Diablo Lite

## Obsidian vault 检索

项目包含 Obsidian vault (`obsidian/`)，vault 名称为 `obsidian`。检索 vault 时有两条路径，**按场景选择**：

### 纯文本检索

用 Grep 对 `obsidian/wiki/` 目录做关键词/正则搜索。适用：已知文件名模式、全文关键词搜索。Obsidian app 不需要运行。

### 结构化检索（Obsidian CLI）

**前提：Obsidian App 必须正在运行。** CLI 路径 `/c/Program Files/Obsidian/Obsidian.com`（Windows PATH 生效后可直接 `obsidian`）。

CLI 使用 `key=value` 参数格式（非 `--flag` 风格）：

| 场景 | 命令 |
|------|------|
| 标签列表及计数 | `obsidian tags counts format=json` |
| 查特定标签的文件 | `obsidian tag name=#concept verbose` |
| 全文搜索（按文件名返回） | `obsidian search query="关键词" limit=20` |
| 全文搜索（含上下文行） | `obsidian search:context query="关键词" limit=10` |
| 反向链接查询 | `obsidian backlinks file=NoteName counts` |
| properties 列表 | `obsidian properties counts format=yaml` |
| 读某属性值 | `obsidian property:read name=status file=NoteName` |
| 孤立笔记（无反链） | `obsidian orphans total` |
| 断链 | `obsidian unresolved total` |
| 打开 vault | `obsidian open "D:\claw\projects\diablo_lite\obsidian"` |

优先用 Grep，遇到标签查询、properties 过滤、反向链接、孤立笔记等结构化需求时切换到 CLI。
