#!/usr/bin/env bash
# fetch_news.sh - 获取亿邦动力网最新电商新闻
# 增强版逻辑：通过管道处理 JSON 数据，避免 ARG_MAX 限制

set -euo pipefail

# 配置
ALLOWED_DOMAINS=("www.ebrun.com" "api.ebrun.com")
WIDTH=72

log_error() { echo "[ERROR] $*" >&2; }

is_safe_url() {
    local url="$1"
    # 强制 HTTPS
    if [[ ! "$url" =~ ^https:// ]]; then return 1; fi
    
    # 提取 Host
    local host
    host=$(echo "$url" | sed -E 's|^https://([^/]+).*|\1|')
    
    for domain in "${ALLOWED_DOMAINS[@]}"; do
        if [[ "$host" == "$domain" ]] || [[ "$host" == *".$domain" ]]; then
            return 0
        fi
    done
    return 1
}

check_deps() {
    if ! command -v curl &> /dev/null; then
        log_error "需要 curl 命令，请先安装 curl"
        exit 1
    fi
}

extract_field() {
    local json="$1"
    local field="$2"
    
    # 使用管道传参而非 argv，避免大型 JSON 触及系统参数长度限制 (ARG_MAX)
    if command -v python3 &>/dev/null; then
        python3 -c "import sys, json; data=json.loads(sys.stdin.read()); v=data.get(sys.argv[1], ''); print(v if v is not None else '')" "$field" <<< "$json" 2>/dev/null
    else
        # 降级方案：简单的正则提取
        echo "$json" | grep -o "\"$field\"[^\"]*\"[^\"]*\"" | sed -E 's/'"\"$field\":[[:space:]]*\"//; s/\"$//" | head -1
    fi
}

fetch_news() {
    local api_url="$1"
    
    if ! is_safe_url "$api_url"; then
        log_error "安全性风险: 禁止请求非授权域名或不安全协议 -> $api_url"
        echo "[]"
        return 1
    fi

    local tmp_body
    tmp_body=$(mktemp)
    trap 'rm -f "$tmp_body"' EXIT

    local http_code
    http_code=$(curl -s -o "$tmp_body" -w "%{http_code}" --max-time 10 \
        -H "User-Agent: Mozilla/5.0 (EbrunSkill/1.0)" \
        -H "Accept: application/json, text/plain, */*" \
        -H "Referer: https://www.ebrun.com/" \
        "$api_url" 2>/dev/null)

    if [ "$http_code" != "200" ]; then
        log_error "请求失败: HTTP $http_code"
        echo "[]"
        return 1
    fi

    cat "$tmp_body"
}

print_ascii_table() {
    local json="$1"

    if [ "$json" = "[]" ] || [ -z "$json" ]; then
        echo "暂无文章数据"
        return
    fi

    # 格式化 JSON 为每行一个对象
    local items
    if command -v python3 &>/dev/null; then
        items=$(python3 -c "import sys, json; data=json.loads(sys.stdin.read()); [print(json.dumps(i)) for i in data]" <<< "$json")
    else
        items=$(echo "$json" | sed 's/^\[//; s/]$//; s/},{/}\n{/g')
    fi

    echo
    printf "┌%*s┐\n" $((WIDTH - 2)) "" | sed 's/ /─/g'
    printf "│  亿邦动力网 - 最新电商新闻%*s│\n" $((WIDTH - 2 - 24)) ""
    printf "├%*s┤\n" $((WIDTH - 2)) "" | sed 's/ /─/g'

    local i=0
    while IFS= read -r article; do
        [ -z "$article" ] && continue
        i=$((i + 1))

        local title=$(extract_field "$article" "title")
        local author=$(extract_field "$article" "author")
        local pub_time=$(extract_field "$article" "publish_time")
        [ -z "$pub_time" ] && pub_time=$(extract_field "$article" "publishTime")
        local summary=$(extract_field "$article" "summary")
        [ -z "$summary" ] && summary=$(extract_field "$article" "description")
        local url=$(extract_field "$article" "url")
        [ -z "$url" ] && url=$(extract_field "$article" "link")

        printf "│  %2d. %-58s │\n" "$i" "${title:0:58}"
        printf "│       👤 %-12s  🕐 %-16s │\n" "${author:0:12}" "${pub_time:0:16}"
        printf "│       %-*s │\n" $((WIDTH - 8)) "${summary:0:64}"
        [ -n "$url" ] && printf "│       %-*s │\n" $((WIDTH - 8)) "${url:0:64}"
        
        # 简单分割线
        printf "├%*s┤\n" $((WIDTH - 2)) "" | sed 's/ /─/g'
    done <<<"$items"

    echo "共 $i 篇文章"
}

main() {
    local api_url=""
    local force_json=false
    local force_table=false

    while [ $# -gt 0 ]; do
        case "$1" in
            --json) force_json=true; shift ;;
            --table) force_table=true; shift ;;
            --help|-h) grep -E '^# ' "$0" | sed 's/^# //'; exit 0 ;;
            *) api_url="$1"; shift ;;
        esac
    done

    if [ -z "$api_url" ]; then
        log_error "缺少参数: api_url"
        exit 1
    fi

    check_deps
    local json=$(fetch_news "$api_url")

    if $force_json || { ! $force_table && [ ! -t 1 ]; }; then
        if command -v python3 &>/dev/null; then
            echo "$json" | python3 -m json.tool
        else
            echo "$json"
        fi
    else
        print_ascii_table "$json"
    fi
}

main "$@"
