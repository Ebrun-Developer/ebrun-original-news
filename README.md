# ebrun-original-news

[中文](#中文) | [English](#english)

---

## 中文

获取 **亿邦动力网** 最新电商新闻报道。一个为 Claude Code / OpenClaw 设计的 Skill，支持智能关键词匹配与多格式自适应输出。

### 📦 安装

```bash
git clone https://github.com/EbrunDeveloper/ebrun-original-news.git
```

安装后请直接执行 `dist/index.js`，不要依赖 `ts-node src/index.ts`。仓库会随技能一起分发预编译产物，适合在未安装 `ts-node` 的环境中直接运行。

### ✨ 功能特性

- 🔍 **智能关键词匹配** - 根据自然语言查询自动识别目标频道，支持主频道和子频道二级匹配
- 📊 **多环境自适应输出**：
  - Claude Code 对话输出 **Markdown**（可点击链接，阅读舒适）
  - OpenClaw 终端自动输出 **ASCII 表格**（整洁美观）
  - 程序调用返回标准 **JSON** 便于二次处理
- 🌐 **全覆盖频道分类** - 推荐、未来零售、跨境电商、产业互联网、品牌、AI 六大板块，包含细分垂直子频道
- 🚀 **三级降级获取机制** - 原生请求 → Python 脚本 → Shell 脚本，确保在受限环境下仍能获取数据
- 🛡️ **企业级安全加固** - SSRF 防护、错误信息脱敏、域名白名单机制
- 🔄 **异步版本检查与安装引导** - 后台自动检测更新，不直接执行更新，而是提示用户复制安装最新版指令或访问 GitHub / Gitee 更新链接
- 🐍 **双语言实现** - 同时提供 Python 和 Bash 两个本地脚本版本，按需选择

### 🎯 触发方式（Claude Code）

以下任意语句都可以触发此技能：

- `查亿邦最新文章` - 获取亿邦动力网最新推荐文章
- `查跨境最新文章` - 获取跨境电商相关最新文章
- `产业最新报道` - 获取产业互联网相关报道
- `零售最新报道` - 获取未来零售相关报道
- `今日电商新闻` - 获取今日最新电商新闻
- `亚马逊最新消息` - 获取亚马逊子频道文章
- `看看有什么AI新闻` - 获取AI频道最新文章
- `品牌全球化报道` - 获取品牌全球化子频道文章
- `亿邦动力` - 快捷触发
- `电商新闻` - 快捷触发

### 🖥️ 命令行使用

#### Python 版本 (`fetch_news.py`)

```bash
# 自动检测输出格式（终端 → 表格，被程序调用 → JSON）
python3 scripts/fetch_news.py <api_url>

# 强制输出 JSON（供上层程序调用）
python3 scripts/fetch_news.py <api_url> --json

# 强制输出 ASCII 表格（终端查看）
python3 scripts/fetch_news.py <api_url> --table

# 查看帮助
python3 scripts/fetch_news.py --help
```

#### Shell 版本 (`fetch_news.sh`)

```bash
# 自动检测输出格式（终端 → 表格，被程序调用 → JSON）
bash scripts/fetch_news.sh <api_url>

# 强制输出 JSON
bash scripts/fetch_news.sh <api_url> --json

# 强制输出 ASCII 表格
bash scripts/fetch_news.sh <api_url> --table

# 查看帮助
bash scripts/fetch_news.sh --help
```

### 📋 输出示例

#### Claude Code 对话 (Markdown)

```
📰 亿邦原创新闻 | 跨境电商 亚马逊
获取时间: 2026/4/14 14:30:00
---

### [TikTok Shop 宣布东南亚新政策，佣金下调5%](https://www.ebrun.com/article/12345)
👤 张晓明  ·  🕐 2026-04-13 10:30
TikTok Shop今日宣布对东南亚市场卖家下调佣金费率，整体降幅约5%，旨在吸引更多品牌卖家入驻...

### [亚马逊发布Q1财报，跨境卖家营收增长超预期](https://www.ebrun.com/article/12346)
👤 李思思  ·  🕐 2026-04-13 09:15
亚马逊发布2026年第一季度财报，跨境电商业务营收同比增长18%，超出市场预期...

---
更多资讯请见[亿邦官网](https://www.ebrun.com/)
```

#### 终端表格输出 (ASCII)

```
┌───────────────────────────────────────────────────────────────────┐
│  亿邦动力网 - 跨境电商 - 亚马逊                                     │
├───────────────────────────────────────────────────────────────────┤
│   1. TikTok Shop 宣布东南亚新政策，佣金下调5%                      │
│       👤 张晓明             🕐 2026-04-13 10:30                   │
│       https://www.ebrun.com/article/12345                         │
├───────────────────────────────────────────────────────────────────┤
│   2. 亚马逊发布Q1财报，跨境卖家营收增长超预期                      │
│       👤 李思思             🕐 2026-04-13 09:15                   │
│       https://www.ebrun.com/article/12346                         │
└───────────────────────────────────────────────────────────────────┘

共 2 篇文章
```

### 🔄 更新说明

当检测到 skill 有新版本时，结果末尾会追加更新提示：

- 显示最新版本号
- 提示用户回复：`请你为我安装亿邦原创Skill最新版 <Gitee更新地址>`
- 同时提供 GitHub 和 Gitee 更新链接

Skill 本身不会在 `dist/index.js` 中直接执行更新命令，也不会拦截“更新”这类输入。更新动作由上层 AI 根据用户发送的安装指令继续处理，这样更适合 GitHub、Gitee、ClawHub 等不同分发来源。

### 📁 支持的频道

| 一级频道 | 支持的子频道 |
|---------|-------------|
| 📰 **推荐** | 最新 |
| 🛒 **未来零售** | 最新、淘宝天猫、抖音、京东、视频号、美团、快手、拼多多、小红书 |
| 🌏 **跨境电商** | 最新、亚马逊、阿里国际、TikTok、Temu、SHEIN |
| 🏭 **产业互联网** | 最新、B2B、产业科技、数据要素、产业出海、数智供应链、数智化采购 |
| 🏷️ **品牌** | 最新、新竞争力品牌、品牌全球化 |
| 🤖 **AI** | 最新 |

### 🏗️ 技术架构

```
ebrun-original-news/
├── dist/
│   └── index.js          # 预编译运行入口，安装后直接执行
├── src/
│   └── index.ts          # 源码入口，构建后生成 dist/index.js
├── scripts/
│   ├── fetch_news.py    # Python 本地获取脚本
│   └── fetch_news.sh    # Shell 本地获取脚本
├── references/
│   ├── channel-list.json # 频道配置列表
│   └── version.json     # 版本信息（用于更新检查）
├── SKILL.md             # Claude Code Skill 规范定义
└── api-reference.md     # API 接口文档
```

**核心设计：**

1. **三级降级机制** - 优先使用原生 fetch，失败后自动降级到 Python/Shell 脚本，绕过 Claude Code 云环境网络限制
2. **智能模糊匹配** - 支持用户自然语言查询，自动匹配最相关的频道和子频道
3. **安全加固** - SSRF 防护、域名白名单、错误路径脱敏
4. **异步更新检查与安装引导** - 后台并行执行版本检查，有新版本时提示用户复制安装最新版指令或访问 GitHub / Gitee 更新链接
5. **预编译发布** - 默认分发 `dist/index.js`，避免目标机器依赖 `ts-node`

### 🔒 安全特性

| 安全措施 | 说明 |
|---------|------|
| 域名白名单 | 仅允许请求 `ebrun.com` 和更新域名，防止 SSRF 攻击 |
| HTTPS 强制 | 只允许 HTTPS 请求，禁止 HTTP 和 IP 直连 |
| 错误脱敏 | 错误信息中的本地路径自动脱敏，保护用户隐私 |
| 参数校验 | 对所有输入参数进行长度和类型校验 |

### 📡 数据来源

- [亿邦动力网](https://www.ebrun.com/)

### 👨‍💼 作者

EbrunDeveloper

### 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## English

Get the latest e-commerce news from **[Ebrun](https://www.ebrun.com/)**, a leading Chinese e-commerce industry media. A Claude Code / OpenClaw Skill that features intelligent keyword matching and multi-format adaptive output.

### 📦 Installation

```bash
git clone https://github.com/EbrunDeveloper/ebrun-original-news.git
```

### ✨ Features

- 🔍 **Intelligent Keyword Matching** - Automatically identifies target channels based on natural language queries, supports primary and secondary channel matching
- 📊 **Multi-environment Adaptive Output**:
  - **Markdown** for Claude Code conversations (clickable links, comfortable reading)
  - **ASCII Table** for OpenClaw terminal (clean and beautiful)
  - Standard **JSON** for programmatic access
- 🌐 **Comprehensive Channel Coverage** - Six major categories: Recommendation, Future Retail, Cross-border E-commerce, Industrial Internet, Brands, AI, with vertical sub-channels
- 🚀 **Three-level Degradation Mechanism** - Native fetch → Python script → Shell script, ensuring data availability in restricted environments
- 🛡️ **Enterprise-grade Security** - SSRF protection, error message sanitization, domain allowlist
- 🔄 **Asynchronous Version Check with Install Guidance** - Automatically checks for updates in the background and guides the user to install the latest version instead of executing an in-skill update
- 🐍 **Dual Implementation** - Both Python and Bash versions provided, choose as needed

### 🎯 Trigger Phrases (Claude Code)

This Skill is triggered when user says:

- "查亿邦最新文章" (Check latest Ebrun articles)
- "查跨境最新文章" (Check latest cross-border articles)
- "产业最新报道" (Industry latest reports)
- "零售最新报道" (Retail latest reports)
- "今日电商新闻" (Today's e-commerce news)
- "亚马逊最新消息" (Latest news from Amazon)
- "看看有什么AI新闻" (Check latest AI news)

### 🖥️ Command Line Usage

#### Python version (`fetch_news.py`)

```bash
# Auto-detect format (table in terminal, JSON for program call)
python3 scripts/fetch_news.py <api_url>

# Force JSON output (for program call)
python3 scripts/fetch_news.py <api_url> --json

# Force ASCII table output (terminal viewing)
python3 scripts/fetch_news.py <api_url> --table

# Show help
python3 scripts/fetch_news.py --help
```

#### Shell version (`fetch_news.sh`)

```bash
# Auto-detect format (table in terminal, JSON for program call)
bash scripts/fetch_news.sh <api_url>

# Force JSON output
bash scripts/fetch_news.sh <api_url> --json

# Force ASCII table output (terminal viewing)
bash scripts/fetch_news.sh <api_url> --table

# Show help
bash scripts/fetch_news.sh --help
```

### 📋 Output Example

#### Claude Code Conversation (Markdown)

```
📰 亿邦原创新闻 | 跨境电商 亚马逊
获取时间: 2026/4/14 14:30:00
---

### [TikTok Shop 宣布东南亚新政策，佣金下调5%](https://www.ebrun.com/article/12345)
👤 张晓明  ·  🕐 2026-04-13 10:30
TikTok Shop今日宣布对东南亚市场卖家下调佣金费率，整体降幅约5%，旨在吸引更多品牌卖家入驻...

### [亚马逊发布Q1财报，跨境卖家营收增长超预期](https://www.ebrun.com/article/12346)
👤 李思思  ·  🕐 2026-04-13 09:15
亚马逊发布2026年第一季度财报，跨境电商业务营收同比增长18%，超出市场预期...

---
More news at [Ebrun Official Website](https://www.ebrun.com/)
```

#### Terminal Table Output (ASCII)

```
┌───────────────────────────────────────────────────────────────────┐
│  亿邦动力网 - 跨境电商 - 亚马逊                                     │
├───────────────────────────────────────────────────────────────────┤
│   1. TikTok Shop 宣布东南亚新政策，佣金下调5%                      │
│       👤 张晓明             🕐 2026-04-13 10:30                   │
│       https://www.ebrun.com/article/12345                         │
├───────────────────────────────────────────────────────────────────┤
│   2. 亚马逊发布Q1财报，跨境卖家营收增长超预期                      │
│       👤 李思思             🕐 2026-04-13 09:15                   │
│       https://www.ebrun.com/article/12346                         │
└───────────────────────────────────────────────────────────────────┘

Total 2 articles
```

### 🔄 Update Notes

When a new version of the skill is detected, the result footer will include an update prompt that:

- shows the latest version number
- suggests replying with `请你为我安装亿邦原创Skill最新版 <Gitee update URL>`
- provides both GitHub and Gitee update links

The skill does not execute update commands directly inside `dist/index.js`, and it does not intercept generic update phrases. The actual installation step is delegated to the upper-layer AI after the user sends the install instruction, which is more reliable across GitHub, Gitee, and ClawHub distribution channels.

### 📁 Supported Channels

| Primary Channel | Sub-channels |
|-----------------|-------------|
| 📰 **Recommendation** | Latest |
| 🛒 **Future Retail** | Latest, Taobao Tmall, Douyin, JD, Video Channel, Meituan, Kuaishou, Pinduoduo, Xiaohongshu |
| 🌏 **Cross-border E-commerce** | Latest, Amazon, Alibaba International, TikTok, Temu, SHEIN |
| 🏭 **Industrial Internet** | Latest, B2B, Industrial Tech, Data Elements, Industrial Going Global, Digital Supply Chain |
| 🏷️ **Brands** | Latest, Competitive Brands, Brand Globalization |
| 🤖 **AI** | Latest |

### 🏗️ Technical Architecture

```
ebrun-original-news/
├── dist/
│   └── index.js          # Prebuilt runtime entry, executed directly after installation
├── src/
│   └── index.ts          # Source entry, compiled into dist/index.js
├── scripts/
│   ├── fetch_news.py    # Python local fetch script
│   └── fetch_news.sh    # Shell local fetch script
├── references/
│   ├── channel-list.json # Channel configuration
│   └── version.json     # Version info for update checking
├── SKILL.md             # Claude Code Skill specification
└── api-reference.md     # API documentation
```

**Core Design:**

1. **Three-level Degradation** - Prioritizes native fetch, automatically falls back to Python/Shell scripts to bypass Claude Code cloud environment network restrictions
2. **Intelligent Fuzzy Matching** - Supports natural language queries, automatically matches the most relevant channel and sub-channel
3. **Security Hardening** - SSRF protection, domain allowlist, error path sanitization
4. **Asynchronous Update Check with Install Guidance** - Background parallel version checking that prompts the user to install the latest version via the provided instruction or GitHub / Gitee links

### 🔒 Security Features

| Security Measure | Description |
|-----------------|-------------|
| Domain Allowlist | Only allows requests to authorized domains, prevents SSRF attacks |
| HTTPS Enforced | Only allows HTTPS requests, prohibits HTTP and direct IP connections |
| Error Sanitization | Local paths in error messages are automatically redacted to protect user privacy |
| Parameter Validation | Validates all input parameters for length and type |

### 📡 Data Source

- [Ebrun](https://www.ebrun.com/)

### 👨‍💼 Author

EbrunDeveloper

### 📄 License

MIT License - see [LICENSE](LICENSE) for details
