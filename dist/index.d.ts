/**
 * ebrun-original-news
 * 兼容 Claude Code CLI 与 OpenClaw 的亿邦动力网新闻获取插件
 * 已进行安全加固与逻辑优化
 */
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
    aliases?: string[];
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
export declare const run: (ctx: SkillContext) => Promise<void>;
export declare const main: (args?: string[]) => Promise<void>;
//# sourceMappingURL=index.d.ts.map