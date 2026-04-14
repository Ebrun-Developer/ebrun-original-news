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
import os from 'os';

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
  update_url: string;
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

const ALLOWED_DOMAINS = ['www.ebrun.com', 'api.ebrun.com'];

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

    return { channel: '推荐', subChannel: '最新', isFallback: true };
  }

  private async fetchNews(apiUrl: string, limit: number, context?: SkillContext): Promise<NewsArticle[]> {
    if (!isSafeUrl(apiUrl)) {
      throw new Error(`安全性风险：禁止请求非授权域名或不安全协议`);
    }

    const fetchFn = context?.fetch || globalThis.fetch;
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (EbrunSkill/1.0)',
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
        console.debug('Fetch 策略失效，尝试脚本降级...');
      }
    }

    const pyPath = join(__dirname, '..', 'scripts', 'fetch_news.py');
    if (existsSync(pyPath)) {
      try {
        const { stdout } = await execFileAsync('python3', [pyPath, apiUrl, '--json'], {
          encoding: 'utf-8',
          timeout: 10000
        });
        return this.parseRawData(JSON.parse(stdout), limit);
      } catch (e) {
        console.debug('Python 策略失效');
      }
    }

    const shPath = join(__dirname, '..', 'scripts', 'fetch_news.sh');
    if (existsSync(shPath)) {
      try {
        const { stdout } = await execFileAsync('bash', [shPath, apiUrl, '--json'], {
          encoding: 'utf-8',
          timeout: 10000
        });
        return this.parseRawData(JSON.parse(stdout), limit);
      } catch (e) {
        console.debug('Shell 策略失效');
      }
    }

    throw new Error('网络连接受阻或 API 无响应，请稍后再试。');
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

  private formatOutput(articles: NewsArticle[], channel: string, isFallback: boolean): string {
    if (articles.length === 0) return '📭 当前频道暂无最新文章，请稍后再试。';

    let output = '';
    if (isFallback) {
      output += `💡 未匹配到指定频道，为您推荐 **${channel}** 频道的内容：\n\n`;
    }

    output += `## 📰 亿邦原创新闻 | ${channel}\n\n`;

    articles.forEach(article => {
      output += `### [${article.title}](${article.url})\n`;
      output += `👤 ${article.author}  ·  🕐 ${article.publishTime}\n`;
      output += `> ${article.summary}\n\n`;
    });

    output += `---\n`;
    output += `可用频道：推荐、未来零售、跨境电商、产业互联网、品牌、AI\n`;
    output += `访问官网获取更多：[亿邦动力网](https://www.ebrun.com/)\n`;

    const updateTip = this.getUpdateTip();
    if (updateTip) output += `\n---\n${updateTip}`;

    return output;
  }

  private getUpdateTip(): string {
    try {
      const versionPath = join(__dirname, '..', 'references', 'version.json');
      if (!existsSync(versionPath)) return '';
      const info: VersionInfo = JSON.parse(readFileSync(versionPath, 'utf-8'));
      
      if (info.latest_version && info.current_version !== info.latest_version) {
        return `✨ **发现新版本 v${info.latest_version}**\n如需体验最新功能，请访问 [更新地址](${info.update_url})`;
      }
    } catch (e) {
      // 静默失败
    }
    return '';
  }

  async run(ctx: SkillContext): Promise<void> {
    const userInput = ctx.input || ctx.args?.join(' ') || '';

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

      const articles = await this.fetchNews(apiUrl, limit, ctx);
      const output = this.formatOutput(articles, channel, isFallback);

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
