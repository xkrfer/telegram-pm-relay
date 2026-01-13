import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * 创建数据库实例
 * @param d1 D1Database binding
 * @returns Drizzle ORM实例
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// 导出schema供其他模块使用
export * from './schema';
