# API Reference - 亿邦动力新闻 API (Skill Standard)

本文档描述了亿邦动力网公开新闻 API 的接口规范及 Skill 内部实现细节，专为开发者及 AI Agent (Claude Code/OpenClaw) 设计。

## 目录

- [1. 概述](#1-概述)
- [2. Skill 内部调用架构](#2-skill-内部调用架构)
- [3. 频道映射配置](#3-频道映射配置)
- [4. API 调用规范](#4-api-调用规范)
- [5. 响应数据结构](#5-响应数据结构)
- [6. 异常与故障处理](#6-异常与故障处理)
- [7. 完整示例与测试](#7-完整示例与测试)

---

## 1. 概述

亿邦动力网 (`ebrun.com`) 提供各频道的最新文章 JSON 接口。该接口由 Ebrun Skill 进行二次封装，支持频道自动匹配及多级降级获取。

*   **Base URL**: `https://www.ebrun.com/`
*   **认证方式**: 公开接口 (Public API)。
*   **数据格式**: JSON (UTF-8)。

## 2. Skill 内部调用架构

为了确保在不同受限环境下的高可用性，Skill 遵循以下调用优先级：

1.  **Native Fetch**: Node.js 18+ 原生请求。
2.  **Python Script**: 调用 `scripts/fetch_news.py`。
3.  **Shell Script**: 调用 `scripts/fetch_news.sh`。

## 3. 频道映射配置

所有频道路径定义在 `references/channel-list.json` 中。Skill 会根据此文件动态构造请求。

| 一级频道 | 二级子频道关键词 (Sub-Channels) |
| :--- | :--- |
| **推荐** | 最新 |
| **未来零售** | 最新、淘宝天猫、抖音、京东、视频号、美团、快手、拼多多、小红书 |
| **跨境电商** | 最新、亚马逊、阿里国际、TikTok、Temu、SHEIN |
| **产业互联网** | 最新、B2B、产业科技、数据要素、产业出海、数智供应链 |
| **品牌** | 最新、新竞争力品牌、品牌全球化 |
| **AI** | 最新 |

## 4. API 调用规范

### 4.1 请求 URL 构造
```
GET {base_url}{channel_path}
```
*   `base_url`: `https://www.ebrun.com/`
*   `channel_path`: 来自配置文件的子频道相对路径（例如 `_index/ClaudeCode/SkillJson/information_recommend.json`）。

### 4.2 请求头 (Headers)
必须包含以下头信息以模拟合法请求：
```http
User-Agent: Mozilla/5.0 (EbrunSkill/1.0)
Accept: application/json
Referer: https://www.ebrun.com/
```

## 5. 响应数据结构

成功响应始终返回一个包含 10-20 条文章对象的 **JSON 数组**。

### 5.1 文章对象字段说明

| 字段 | 类型 | 说明 | 缺省行为 |
| :--- | :--- | :--- | :--- |
| `title` | string | 文章标题 | 返回 "亿邦动力原创新闻" |
| `author` | string | 作者或来源 | 返回 "亿邦动力" |
| `summary` | string | 文章摘要 (100-200字) | 返回 "点击查看详情" |
| `url` | string | 文章详情页完整链接 | 返回 官网主页 |
| `publish_time`| string | 发布时间 (YYYY-MM-DD HH:MM:SS) | 返回 空字符串 |

## 6. 异常与故障处理

Skill 在处理 API 响应时遵循以下原则：

| 错误类型 | 原因 | 处理逻辑 |
| :--- | :--- | :--- |
| **404 Not Found** | 频道路径已失效 | Skill 自动回退 (Fallback) 至「推荐」频道 |
| **403 Forbidden** | User-Agent 被拦截 | 切换至本地 Python/Shell 脚本重试 |
| **Empty Data** | 该频道暂时无更新 | 返回 "📭 当前频道暂无最新文章" 提示 |
| **Network Timeout**| 网络超时 (超过 8s) | 触发三级降级机制或返回友好错误信息 |

## 7. 完整示例与测试

### 7.1 Curl 测试命令
```bash
curl -H "Accept: application/json" -H "Referer: https://www.ebrun.com/" \
"https://www.ebrun.com/_index/ClaudeCode/SkillJson/information_recommend.json"
```

### 7.2 本地脚本测试 (Python)
```bash
python3 scripts/fetch_news.py "https://www.ebrun.com/_index/ClaudeCode/SkillJson/information_recommend.json" --json
```

---
*相关资源:*
- [SKILL 逻辑说明](./SKILL.md)
- [README](./README.md)
- [官网主页](https://www.ebrun.com/)
