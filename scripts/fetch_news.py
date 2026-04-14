#!/usr/bin/env python3
"""
ebrun-original-news - 获取亿邦动力网最新电商新闻
通过本地脚本获取新闻数据，避免 Claude Code 网络限制

用法:
  python3 fetch_news.py <api_url>           # 自动检测输出格式（终端 → 表格，被调用 → JSON）
  python3 fetch_news.py <api_url> --json     # 强制输出 JSON
  python3 fetch_news.py <api_url> --table    # 强制输出 ASCII 表格
  python3 fetch_news.py --help               # 显示帮助
"""

import argparse
import json
import sys
from urllib import request
from urllib.error import URLError
from typing import List, Dict
from urllib.parse import urlparse

# 安全配置
ALLOWED_DOMAINS = ['www.ebrun.com', 'api.ebrun.com']
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.ebrun.com/'
}

def is_safe_url(url: str) -> bool:
    """校验 URL 安全性"""
    try:
        parsed = urlparse(url)
        if parsed.scheme != 'https':
            return False
        return any(parsed.hostname == d or (parsed.hostname and parsed.hostname.endswith('.' + d)) 
                   for d in ALLOWED_DOMAINS)
    except Exception:
        return False

def fetch_news(api_url: str) -> List[Dict]:
    """从 API 获取新闻数据"""
    if not is_safe_url(api_url):
        print(f"安全性风险: 禁止请求非授权域名或不安全协议 -> {api_url}", file=sys.stderr)
        return []

    try:
        req = request.Request(api_url, headers=HEADERS)
        with request.urlopen(req, timeout=10) as response:
            content = response.read().decode('utf-8')
            data = json.loads(content)
            return data if isinstance(data, list) else []
    except URLError as e:
        print(f"网络请求失败: {e}", file=sys.stderr)
        return []
    except json.JSONDecodeError as e:
        print(f"JSON 解析失败: {e}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"获取数据异常: {e}", file=sys.stderr)
        return []

def print_ascii_table(articles: List[Dict]):
    """以 ASCII 表格格式输出文章列表"""
    if not articles:
        print("暂无文章数据")
        return

    width = 72
    print(f"\n┌{'─' * (width - 2)}┐")
    print(f"│  亿邦动力网 - 最新电商新闻{' ' * (width - 2 - 24)}│")
    print(f"├{'─' * (width - 2)}┤")

    for i, article in enumerate(articles):
        title = str(article.get('title', '无标题'))[:58]
        author = str(article.get('author', '未知'))[:12]
        pub_time = str(article.get('publish_time', article.get('publishTime', '')))[:16]
        summary = str(article.get('summary', article.get('description', '暂无摘要')))[:64]
        url = str(article.get('url', article.get('link', '')))[:64]

        print(f"│  {i+1:2d}. {title:<58} │")
        print(f"│       👤 {author:<12}  🕐 {pub_time:<16} │")
        print(f"│       {summary:<68} │")
        if url:
            print(f"│       {url:<68} │")
        if i < len(articles) - 1:
            print(f"├{'─' * (width - 2)}┤")

    print(f"└{'─' * (width - 2)}┘")
    print(f"\n共 {len(articles)} 篇文章")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='获取亿邦动力网最新电商新闻',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('api_url', nargs='?', help='API 接口 URL')
    parser.add_argument('--json', action='store_true', help='强制输出 JSON 格式')
    parser.add_argument('--table', action='store_true', help='强制输出 ASCII 表格')

    args = parser.parse_args()

    if not args.api_url:
        parser.print_help()
        sys.exit(1)

    articles = fetch_news(args.api_url)

    if args.json:
        output_format = 'json'
    elif args.table:
        output_format = 'table'
    else:
        output_format = 'table' if sys.stdout.isatty() else 'json'

    if output_format == 'table':
        print_ascii_table(articles)
    else:
        print(json.dumps(articles, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
