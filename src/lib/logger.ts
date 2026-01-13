/**
 * 简化的日志工具（Cloudflare Workers）
 * 在本地使用wrangler tail查看日志
 */

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

class Logger {
  private level: LogLevel = 'info';
  
  private levels: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
  };
  
  setLevel(level: LogLevel) {
    this.level = level;
  }
  
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }
  
  private format(level: LogLevel, data: any, message?: string): string {
    const timestamp = new Date().toISOString();
    const msg = message || '';
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return `[${timestamp}] ${level.toUpperCase()}: ${msg} ${dataStr}`;
  }
  
  trace(data: any, message?: string) {
    if (this.shouldLog('trace')) console.log(this.format('trace', data, message));
  }
  
  debug(data: any, message?: string) {
    if (this.shouldLog('debug')) console.log(this.format('debug', data, message));
  }
  
  info(data: any, message?: string) {
    if (this.shouldLog('info')) console.log(this.format('info', data, message));
  }
  
  warn(data: any, message?: string) {
    if (this.shouldLog('warn')) console.warn(this.format('warn', data, message));
  }
  
  error(data: any, message?: string) {
    if (this.shouldLog('error')) console.error(this.format('error', data, message));
  }
  
  fatal(data: any, message?: string) {
    if (this.shouldLog('fatal')) console.error(this.format('fatal', data, message));
  }
}

export const logger = new Logger();
