import {
  messageFilters,
  type MessageFilter,
  type NewMessageFilter,
} from "../db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { FilterResult, ConfigValidationResult } from "../types/config";

/**
 * 过滤服务类
 */
class FilterService {
  /**
   * 验证正则表达式的安全性和有效性
   * @param regex 正则表达式
   * @returns 验证结果
   */
  validateRegex(regex: string): ConfigValidationResult {
    // 1. 长度限制
    if (regex.length > 500) {
      return { valid: false, error: "正则表达式过长（最大500字符）" };
    }

    // 2. 语法验证
    try {
      new RegExp(regex);
    } catch (error) {
      return { valid: false, error: "正则表达式语法错误" };
    }

    // 3. 简单的 ReDoS 检测（嵌套量词）
    if (/(\+|\*|\{[0-9,]+\}){2,}/.test(regex)) {
      return {
        valid: false,
        error: "正则表达式可能存在性能问题（避免嵌套量词）",
      };
    }

    return { valid: true };
  }

  /**
   * 添加过滤规则
   * @param db 数据库实例
   * @param regex 正则表达式
   * @param mode 拦截模式
   * @param note 备注
   * @param priority 优先级
   * @returns 成功或错误信息
   */
  async addFilter(
    db: DrizzleD1Database<typeof schema>,
    regex: string,
    mode: "block" | "drop",
    note?: string,
    priority: number = 100
  ): Promise<{ success: boolean; error?: string; filterId?: number }> {
    try {
      // 检查规则数量上限
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(messageFilters);

      const count = countResult[0]?.count || 0;
      if (count >= 50) {
        return { success: false, error: "过滤规则已达上限（50条）" };
      }

      // 验证正则表达式
      const validation = this.validateRegex(regex);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 插入规则
      const [inserted] = await db
        .insert(messageFilters)
        .values({
          regex,
          mode,
          note: note || null,
          priority,
          isActive: true,
        })
        .returning();

      console.log("[FilterService]", "Filter rule added", {
        filterId: inserted.id,
        regex,
        mode,
        priority,
      });

      return { success: true, filterId: inserted.id };
    } catch (error) {
      console.error("[FilterService]", "Failed to add filter", error);
      return { success: false, error: "添加过滤规则失败" };
    }
  }

  /**
   * 删除过滤规则
   * @param db 数据库实例
   * @param filterId 规则ID
   * @returns 成功或错误信息
   */
  async deleteFilter(
    db: DrizzleD1Database<typeof schema>,
    filterId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const deleted = await db
        .delete(messageFilters)
        .where(eq(messageFilters.id, filterId))
        .returning();

      if (deleted.length === 0) {
        return { success: false, error: "规则不存在" };
      }

      console.log("[FilterService]", "Filter rule deleted", { filterId });
      return { success: true };
    } catch (error) {
      console.error("[FilterService]", "Failed to delete filter", error);
      return { success: false, error: "删除过滤规则失败" };
    }
  }

  /**
   * 获取所有活跃规则
   * @param db 数据库实例
   * @returns 规则列表（按优先级降序）
   */
  async getActiveFilters(
    db: DrizzleD1Database<typeof schema>
  ): Promise<MessageFilter[]> {
    try {
      const filters = await db.query.messageFilters.findMany({
        where: eq(messageFilters.isActive, true),
        orderBy: [desc(messageFilters.priority), asc(messageFilters.id)],
      });

      return filters;
    } catch (error) {
      console.error("[FilterService]", "Failed to get active filters", error);
      return [];
    }
  }

  /**
   * 获取所有规则（包括禁用的）
   * @param db 数据库实例
   * @returns 规则列表
   */
  async getAllFilters(
    db: DrizzleD1Database<typeof schema>
  ): Promise<MessageFilter[]> {
    try {
      const filters = await db.query.messageFilters.findMany({
        orderBy: [desc(messageFilters.priority), asc(messageFilters.id)],
      });

      return filters;
    } catch (error) {
      console.error("[FilterService]", "Failed to get all filters", error);
      return [];
    }
  }

  /**
   * 启用/禁用规则
   * @param db 数据库实例
   * @param filterId 规则ID
   * @param isActive 是否启用
   * @returns 成功或错误信息
   */
  async toggleFilter(
    db: DrizzleD1Database<typeof schema>,
    filterId: number,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updated = await db
        .update(messageFilters)
        .set({ isActive })
        .where(eq(messageFilters.id, filterId))
        .returning();

      if (updated.length === 0) {
        return { success: false, error: "规则不存在" };
      }

      console.log("[FilterService]", "Filter rule toggled", {
        filterId,
        isActive,
      });
      return { success: true };
    } catch (error) {
      console.error("[FilterService]", "Failed to toggle filter", error);
      return { success: false, error: "操作失败" };
    }
  }

  /**
   * 更新规则优先级
   * @param db 数据库实例
   * @param filterId 规则ID
   * @param priority 新优先级
   * @returns 成功或错误信息
   */
  async updatePriority(
    db: DrizzleD1Database<typeof schema>,
    filterId: number,
    priority: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updated = await db
        .update(messageFilters)
        .set({ priority })
        .where(eq(messageFilters.id, filterId))
        .returning();

      if (updated.length === 0) {
        return { success: false, error: "规则不存在" };
      }

      console.log("[FilterService]", "Filter priority updated", {
        filterId,
        priority,
      });
      return { success: true };
    } catch (error) {
      console.error("[FilterService]", "Failed to update priority", error);
      return { success: false, error: "设置失败" };
    }
  }

  /**
   * 检查内容是否匹配过滤规则
   * @param db 数据库实例
   * @param content 要检查的内容
   * @returns 匹配结果
   */
  async checkContent(
    db: DrizzleD1Database<typeof schema>,
    content: string
  ): Promise<FilterResult> {
    try {
      const filters = await this.getActiveFilters(db);

      for (const filter of filters) {
        try {
          const regex = new RegExp(filter.regex);
          if (regex.test(content)) {
            return {
              matched: true,
              rule: {
                id: filter.id,
                regex: filter.regex,
                mode: filter.mode,
                note: filter.note,
              },
            };
          }
        } catch (error) {
          console.error("[FilterService]", "Regex match error", {
            filterId: filter.id,
            regex: filter.regex,
            error,
          });
          // 继续检查下一个规则
          continue;
        }
      }

      return { matched: false };
    } catch (error) {
      console.error("[FilterService]", "Failed to check content", error);
      return { matched: false };
    }
  }
}

export const filterService = new FilterService();
