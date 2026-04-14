# ebrun-original-news

[中文](#中文) | [English](#english)

---

## 中文

获取亿邦动力网最新电商新闻报道。一个为 Claude Code / openclaw 设计的 Skill，自动绕过网络限制，支持终端美观输出。

### 📦 安装

通过 skills-manager 安装：

```bash
skill-add ebrun-original-news
```

或者直接克隆：

```bash
git clone https://github.com/<your-username>/ebrun-original-news.git
```

### ✨ 功能特性

- 🔍 **自动关键词匹配** - 根据自然语言查询自动识别目标频道
- 📊 **双格式自动适配**：
  - Claude Code 对话输出 **Markdown**（可点击链接，阅读舒适）
  - openclaw 终端自动输出 **ASCII 表格**（整洁美观）
- 🌐 **支持多频道** - 推荐、未来零售、跨境电商、产业互联网、品牌、AI 全覆盖
- 🚀 **本地网络穿透** - 通过本地脚本请求，绕过 Claude Code 云环境网络限制
- 🐍 **多语言实现** - 提供 Python 和 Bash 两个版本，按需选择

### 🎯 触发方式（Claude Code）

以下任意语句都可以触发此技能：

- `查亿邦最新文章` - 获取亿邦动力网最新文章
- `查跨境最新文章` - 获取跨境电商相关最新文章
- `产业最新报道` - 获取产业电商相关报道
- `零售最新报道` - 获取零售电商相关报道
- `今日电商新闻` - 获取今日最新电商新闻
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

### 📋 输出示例（终端表格）

```
┌───────────────────────────────────────────────────────────────────┐
│  亿邦动力网 - 最新电商新闻                                        │
├───────────────────────────────────────────────────────────────────┤
│   1. 跨境电商2026年一季度趋势分析报告                             │
│       👤 张三             🕐 2026-04-13 10:30        │
│       https://www.ebrun.com/article/12345                        │
├───────────────────────────────────────────────────────────────────┤
│   2. TikTok Shop 宣布新政策，佣金下调                             │
│       👤 李四             🕐 2026-04-13 09:15        │
│       https://www.ebrun.com/article/12346                        │
└───────────────────────────────────────────────────────────────────┘

共 2 篇文章
```

### 📁 支持的频道

| 频道 | 子频道 |
|------|--------|
| 📰 **推荐** | 综合推荐 |
| 🛒 **未来零售** | 淘宝天猫、抖音、京东、视频号、美团、快手、拼多多、小红书 |
| 🌏 **跨境电商** | 亚马逊、阿里国际、TikTok、Temu、SHEIN |
| 🏭 **产业互联网** | B2B、产业科技、数据要素、产业出海 |
| 🏷️ **品牌** | 新竞争力品牌、品牌全球化 |
| 🤖 **AI** | AI 相关报道 |

### 📡 数据来源

- [亿邦动力网](https://www.ebrun.com/) - 权威电商行业媒体

### 👨‍💼 作者

EbrunDeveloper

### 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## English

Get the latest e-commerce news from [Ebrun](https://www.ebrun.com/), a leading Chinese e-commerce industry media. A Claude Code / openclaw skill that bypasses network restrictions and automatically adapts output format.

### 📦 Installation

Via skills-manager:

```bash
skill-add ebrun-original-news
```

Or clone directly:

```bash
git clone https://github.com/<your-username>/ebrun-original-news.git
```

### ✨ Features

- 🔍 **Automatic keyword matching** - Identifies target channels based on natural language queries
- 📊 **Auto-adaptive output format**:
  - Claude Code conversation outputs **Markdown** (clickable links, comfortable reading)
  - openclaw terminal automatically outputs **ASCII table** (clean and beautiful)
- 🌐 **Multiple channels supported** - Covers recommendation, future retail, cross-border e-commerce, industrial internet, brands, and AI
- 🚀 **Local network bypass** - Requests via local script, bypasses Claude Code cloud environment network restrictions
- 🐍 **Dual implementation** - Provides both Python and Bash versions, choose as needed

### 🎯 Trigger phrases (Claude Code)

This skill is triggered when user says:

- "查亿邦最新文章" (Check latest Ebrun articles)
- "查跨境最新文章" (Check latest cross-border articles)
- "产业最新报道" (Industry latest reports)
- "零售最新报道" (Retail latest reports)
- "今日电商新闻" (Today's e-commerce news)

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

# Force ASCII table output
bash scripts/fetch_news.sh <api_url> --table

# Show help
bash scripts/fetch_news.sh --help
```

### 📋 Output Example (Terminal Table)

```
┌───────────────────────────────────────────────────────────────────┐
│  亿邦动力网 - 最新电商新闻                                        │
├───────────────────────────────────────────────────────────────────┤
│   1. 跨境电商2026年一季度趋势分析报告                             │
│       👤 张三             🕐 2026-04-13 10:30        │
│       https://www.ebrun.com/article/12345                        │
├───────────────────────────────────────────────────────────────────┤
│   2. TikTok Shop  announced new policy, commission reduced        │
│       👤 Li Si             🕐 2026-04-13 09:15        │
│       https://www.ebrun.com/article/12346                        │
└───────────────────────────────────────────────────────────────────┘

Total 2 articles
```

### 📁 Supported Channels

| Channel | Sub-channels |
|---------|--------------|
| 📰 **Recommendation** | General recommendation |
| 🛒 **Future Retail** | Taobao Tmall, Douyin, JD, Video Channel, Meituan, Kuaishou, Pinduoduo, Xiaohongshu |
| 🌏 **Cross-border E-commerce** | Amazon, Alibaba International, TikTok, Temu, SHEIN |
| 🏭 **Industrial Internet** | B2B, Industrial Technology, Data Elements, Industrial Going Global |
| 🏷️ **Brands** | Competitive Brands, Brand Globalization |
| 🤖 **AI** | AI related reports |

### 📡 Data Source

- [Ebrun](https://www.ebrun.com/) - Authoritative e-commerce industry media in China

### 👨‍💼 Author

EbrunDeveloper

### 📄 License

MIT License - see [LICENSE](LICENSE) for details