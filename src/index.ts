/**
 * ebrun-original-news
 * 兼容 Claude Code CLI 与 OpenClaw 的亿邦动力网新闻获取插件
 * 已进行安全加固与逻辑优化
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

// ==================== 类型定义 ====================

export interface NewsArticle {
  title: string;
  author: string;
  summary: string;
  url: string;
  publishTime: string;
  category: string;
}

export interface ChannelConfig {
  id: string;
  sub_channels: Record<string, string>;
}

export interface ChannelList {
  base_url: string;
  channels: Record<string, ChannelConfig>;
  notes: Record<string, string>;
}

export interface VersionInfo {
  current_version: string;
  latest_version: string;
  update_url_github: string;
  update_url_gitee: string;
  changelog_url_github?: string;
  changelog_url_gitee?: string;
  check_interval_hours?: number;
  last_check_time?: number;
}

export interface SkillContext {
  input?: string;
  args?: string[];
  say?: (text: string) => void;
  fetch?: typeof fetch;
  limit?: number;
  [key: string]: any;
}

// ==================== 安全与工具 ====================

const ALLOWED_DOMAINS = ['www.ebrun.com', 'api.ebrun.com', 'raw.githubusercontent.com', 'gitee.com'];

/**
 * 安全校验：确保 URL 为 HTTPS 且属于白名单域名，防御 SSRF
 */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    // 确保 Hostname 存在且不包含 IP 地址格式
    if (!parsed.hostname || /^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname)) return false;
    return ALLOWED_DOMAINS.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * 跨平台清理错误信息，移除敏感路径，保护隐私
 */
function sanitizeError(message: string): string {
  let safeMsg = message;
  
  // 1. 获取所有需要脱敏的基础路径
  const pathsToMask = [__dirname, process.cwd()];
  try { pathsToMask.push(os.homedir()); } catch {}

  pathsToMask.forEach(p => {
    if (!p) return;
    // 转义路径中的特殊字符用于正则
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    safeMsg = safeMsg.replace(new RegExp(escaped, 'gi'), '[PATH]');
  });

  // 2. 通用敏感模式脱敏 (Windows & Unix 用户名脱敏)
  safeMsg = safeMsg.replace(/\/Users\/[^\/:\s]+/g, '/[REDACTED]')
                   .replace(/[A-Z]:\\Users\\[^\s\\]+/gi, '[REDACTED]');

  return safeMsg;
}

const DEFAULT_CONFIG: ChannelList = {
  base_url: 'https://www.ebrun.com/',
  channels: {
    '推荐': {
      id: 'tuijian',
      sub_channels: {
        '最新': '_index/ClaudeCode/SkillJson/information_recommend.json'
      }
    }
  },
  notes: {}
};

// ==================== 核心逻辑类 ====================

class EbrunSkill {
  private config: ChannelList | null = null;
  private localInfo: VersionInfo | null = null;
  private updateAvailable: { version: string; updateUrl: string; changelogUrl?: string } | null = null;
  private isRunning: boolean = false;

  private loadConfig(): ChannelList {
    if (this.config) return this.config;
    try {
      const configPath = join(__dirname, '..', 'references', 'channel-list.json');
      this.config = JSON.parse(readFileSync(configPath, 'utf-8'));
      return this.config!;
    } catch (error) {
      this.config = DEFAULT_CONFIG;
      return this.config;
    }
  }

  /**
   * 增强型频道匹配逻辑：支持双向模糊匹配
   */
  private matchChannel(userInput: string): { channel: string; subChannel: string; isFallback: boolean } {
    const config = this.loadConfig();
    const input = (userInput || '').toLowerCase().trim();
    if (!input) return { channel: '推荐', subChannel: '最新', isFallback: true };

    // 预处理：切分词组
    const inputWords = input.split(/[\s,，.。!！?？]+/).filter(w => w.length > 0);

    // 策略 A: 遍历所有子频道关键词（最细粒度优先）
    for (const [channelName, channelData] of Object.entries(config.channels)) {
      for (const [subName] of Object.entries(channelData.sub_channels)) {
        if (subName === '最新') continue;
        const subLower = subName.toLowerCase();
        if (input.includes(subLower) || inputWords.some(w => subLower.includes(w) || w.includes(subLower))) {
          return { channel: channelName, subChannel: subName, isFallback: false };
        }
      }
    }

    // 策略 B: 匹配主频道关键词
    for (const channelName of Object.keys(config.channels)) {
      const cnLower = channelName.toLowerCase();
      // 支持 "跨境" 匹配 "跨境电商"，也支持 "跨境电商新闻" 匹配 "跨境电商"
      if (input.includes(cnLower) || cnLower.includes(input) || inputWords.some(w => cnLower.includes(w) || w.includes(cnLower))) {
        return { channel: channelName, subChannel: '最新', isFallback: false };
      }
    }

    // 策略 C: 通用新闻意图词 → 推荐频道，不触发 fallback 提示
    // 用户说"查亿邦原创新闻"/"今日电商新闻"等，意图是看新闻而非找特定频道
    const generalKeywords = ['亿邦', 'ebrun', '原创', '新闻', '资讯', '报道', '文章', '动态', '头条', '今日', '最新'];
    if (generalKeywords.some(kw => input.includes(kw))) {
      return { channel: '推荐', subChannel: '最新', isFallback: false };
    }

    // 以上均未匹配：用户指定了一个不存在的具体频道（如 eBay）
    return { channel: '推荐', subChannel: '最新', isFallback: true };
  }

  private async fetchNews(apiUrl: string, limit: number, context?: SkillContext): Promise<NewsArticle[]> {
    if (!isSafeUrl(apiUrl)) {
      throw new Error(`安全性风险：禁止请求非授权域名或不安全协议`);
    }

    const fetchFn = context?.fetch || globalThis.fetch;
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (EbrunSkill/1.1)',
      'Accept': 'application/json',
      'Referer': 'https://www.ebrun.com/',
    };

    if (typeof fetchFn === 'function') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetchFn(apiUrl, {
          headers: fetchHeaders,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return this.parseRawData(data, limit);
        }
      } catch (e) {
        // 尝试降级
      }
    }

    // 脚本降级策略
    const strategies = [
      { cmd: 'python3', path: join(__dirname, '..', 'scripts', 'fetch_news.py'), args: [apiUrl, '--json'] },
      { cmd: 'bash', path: join(__dirname, '..', 'scripts', 'fetch_news.sh'), args: [apiUrl, '--json'] }
    ];

    for (const strat of strategies) {
      if (existsSync(strat.path)) {
        try {
          const { stdout } = await execFileAsync(strat.cmd, [strat.path, ...strat.args], {
            encoding: 'utf-8',
            timeout: 10000
          });
          return this.parseRawData(JSON.parse(stdout), limit);
        } catch (e) {
          continue;
        }
      }
    }

    throw new Error('网络连接受阻或 API 无响应，请检查环境配置。');
  }

  private parseRawData(data: any, limit: number): NewsArticle[] {
    if (!Array.isArray(data)) return [];
    return data.slice(0, limit).map(item => ({
      title: String(item.title || '无标题').trim(),
      author: String(item.author || '亿邦动力').trim(),
      summary: String(item.summary || item.description || '点击查看详情').trim(),
      url: String(item.url || item.link || 'https://www.ebrun.com/').trim(),
      publishTime: String(item.publish_time || item.publishTime || '').trim(),
      category: '新闻'
    }));
  }

  private formatOutput(articles: NewsArticle[], channel: string, subChannel: string, isFallback: boolean, userInput: string): string {
    if (articles.length === 0) return '📭 当前频道暂无最新文章，请稍后再试。';

    const currentDate = new Date().toLocaleDateString('zh-CN');
    const subChannelDisplay = subChannel === '最新' ? '' : ` ${subChannel}`;
    let output = '';

    // 情况2：频道未匹配，页头前加提示
    if (isFallback && userInput) {
      output += `未找到"${userInput}"频道的文章，将为您展示推荐内容。\n\n`;
    }

    // 页头
    output += `📰 亿邦原创新闻 | ${channel}${subChannelDisplay}\n`;
    output += `获取时间: ${currentDate}\n`;
    output += `---\n\n`;

    // 文章列表
    articles.forEach((article, index) => {
      const num = index + 1;
      output += `${num}. **[${article.title}](${article.url})**\n`;
      output += `    👤 作者：${article.author} | 🕐 发布时间：${article.publishTime}\n`;
      output += `    📝 ${article.summary}\n\n`;
    });

    // 页脚
    output += `---\n`;
    if (isFallback) {
      output += `可用的频道有：\n`;
      output += `📰 推荐 | 🛒 未来零售 | 🌏 跨境电商 | 🏭 产业互联网 | 🏷️ 品牌 | 🤖 AI\n\n`;
      output += `您可以直接说：\n`;
      output += `• "查跨境最新文章" 或 "查亚马逊新闻"\n`;
      output += `• "产业有什么新动态"\n`;
      output += `• "看看AI新闻"\n\n`;
    }
    output += `更多资讯请见[亿邦官网](https://www.ebrun.com/)\n`;

    // 情况3：检测到新版本，追加在页脚之后
    if (this.updateAvailable) {
      const { version, updateUrl } = this.updateAvailable;
      output += `\n---\n💡 检测到有新版本可用（v${version}），如需更新请回复"更新"，或访问 [更新链接](${updateUrl})`;
    }

    return output;
  }

  private loadLocalInfo(): VersionInfo {
    if (this.localInfo) return this.localInfo;
    const versionPath = join(__dirname, '..', 'references', 'version.json');
    this.localInfo = JSON.parse(readFileSync(versionPath, 'utf-8'));
    return this.localInfo!;
  }

  /**
   * 构建版本文件的远程原始 URL
   */
  private buildRemoteUrl(baseUrl: string, type: 'github' | 'gitee'): string {
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (type === 'github') {
      return cleanUrl.replace('github.com', 'raw.githubusercontent.com') + '/main/references/version.json';
    } else {
      return cleanUrl + '/raw/main/references/version.json';
    }
  }

  /**
   * 后台检查更新 (增加 Gitee 降级逻辑)
   */
  private async checkUpdateInBackground(ctx: SkillContext): Promise<void> {
    const local = this.loadLocalInfo();

    // 检查检查间隔，如果没到时间跳过
    const now = Date.now();
    const interval = (local.check_interval_hours || 24) * 60 * 60 * 1000;
    if (local.last_check_time && now - local.last_check_time < interval) {
      return;
    }

    const fetchFn = ctx.fetch || globalThis.fetch;
    if (typeof fetchFn !== 'function') return;

    // 优先从 GitHub 检查，失败则尝试 Gitee
    const urls = [
      { url: this.buildRemoteUrl(local.update_url_github, 'github'), source: 'GitHub' },
      { url: this.buildRemoteUrl(local.update_url_gitee, 'gitee'), source: 'Gitee' }
    ].filter(item => item.url && isSafeUrl(item.url));

    let remote: VersionInfo | null = null;
    for (const item of urls) {
      try {
        const res = await fetchFn(item.url);
        if (res.ok) {
          remote = await res.json() as VersionInfo;
          break; // 成功获取则停止尝试
        }
      } catch (e) {
        // 忽略单个源的失败，尝试下一个
      }
    }

    if (remote && remote.latest_version !== local.current_version) {
      this.updateAvailable = {
        version: remote.latest_version,
        updateUrl: local.update_url_github,
        changelogUrl: local.changelog_url_github
      };
    }
  }

  /**
   * 执行更新引导逻辑
   */
  private async handleUpdate(ctx: SkillContext): Promise<void> {
    const local = this.loadLocalInfo();
    const remoteUrl = local.update_url_github.replace('github.com', 'raw.githubusercontent.com') + '/main/references/version.json';
    
    let remote: any = null;
    const fetchFn = ctx.fetch || globalThis.fetch;
    if (typeof fetchFn === 'function') {
      try {
        const res = await fetchFn(remoteUrl);
        if (res.ok) remote = await res.json() as VersionInfo;
      } catch (e) {}
    }

    if (remote && remote.latest_version !== local.current_version) {
      const msg = `🚀 **开始更新技能...**\n\n检测到新版本 v${remote.latest_version}，请运行以下指令完成更新：\n\n\`\`\`bash\ngit -C [PATH] pull\n\`\`\`\n\n*(注：[PATH] 为当前技能所在目录。如果你使用的是 Claude Code，我可以自动帮你执行此操作，只需告诉我“帮我执行 git pull”即可)*`;
      ctx.say ? ctx.say(sanitizeError(msg)) : console.log(sanitizeError(msg));
    } else {
      const msg = `✅ 当前已是最新版本 (v${local.current_version})，无需更新。`;
      ctx.say ? ctx.say(msg) : console.log(msg);
    }
  }

  async run(ctx: SkillContext): Promise<void> {
    // 防止重复执行：如果正在执行中，直接返回
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;

    try {
      await this._runInternal(ctx);
    } finally {
      this.isRunning = false;
    }
  }

  private async _runInternal(ctx: SkillContext): Promise<void> {
    const userInput = ctx.input || ctx.args?.join(' ') || '';

    // 拦截更新命令
    if (userInput.trim() === '更新' || ctx.args?.[0] === 'update' || ctx.args?.[0] === 'u') {
      await this.handleUpdate(ctx);
      return;
    }

    try {
      const { channel, subChannel, isFallback } = this.matchChannel(userInput);
      let limit = ctx.limit || 10;

      // 提取数字参数作为 limit
      const argsArray = ctx.args || userInput.split(' ');
      const argLimit = argsArray.find(a => /^\d+$/.test(a));
      if (argLimit) limit = parseInt(argLimit, 10);
      limit = Math.min(Math.max(1, limit), 20);

      const config = this.loadConfig();
      const path = config.channels[channel]?.sub_channels[subChannel];
      if (!path) throw new Error(`配置缺失: 无法找到 ${channel} 频道对应的路径`);

      const apiUrl = `${config.base_url}${path}`;

      if (!ctx.say) console.log(`🔍 正在获取 ${channel}${subChannel === '最新' ? '' : ' - ' + subChannel} 最新动态...\n`);

      // 优化：并行执行新闻获取和后台更新检查
      // 这样 checkUpdateInBackground 有极大概率在 formatOutput 之前完成
      const [articles] = await Promise.all([
        this.fetchNews(apiUrl, limit, ctx),
        this.checkUpdateInBackground(ctx).catch(() => {}) 
      ]);

      const output = this.formatOutput(articles, channel, subChannel, isFallback, userInput);
      ctx.say ? ctx.say(output) : console.log(output);

    } catch (error: any) {
      const safeMessage = sanitizeError(error.message || String(error));
      const safeError = `❌ 获取失败: ${safeMessage}`;
      ctx.say ? ctx.say(safeError) : console.error(safeError);
    }
  }
}

const skill = new EbrunSkill();
export const run = (ctx: SkillContext) => skill.run(ctx);
export const main = (args: string[] = []) => skill.run({ args });

// 命令行执行入口
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  skill.run({ args: process.argv.slice(2) }).catch(err => {
    console.error('Fatal Error:', sanitizeError(String(err)));
    process.exit(1);
  });
}
