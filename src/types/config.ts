/**
 * 通用系统配置类型定义
 */
export interface GeneralConfig {
  // 允许的消息类型列表
  allowedTypes: MessageType[];
  // 是否启用编辑监听通知
  editNotificationEnabled: boolean;
}

export type MessageType = 
  | 'text' 
  | 'photo' 
  | 'video' 
  | 'document' 
  | 'voice' 
  | 'sticker' 
  | 'animation' 
  | 'location' 
  | 'contact';

/**
 * 过滤结果
 */
export interface FilterResult {
  matched: boolean;
  rule?: {
    id: number;
    regex: string;
    mode: 'block' | 'drop';
    note?: string | null;
  };
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  valid: boolean;
  error?: string;
}
