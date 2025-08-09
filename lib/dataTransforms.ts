/**
 * データ変換・フォーマット処理の共通ユーティリティ
 */

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: number | string | RegExp;
  message?: string;
  validator?: (value: unknown) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 文字列の安全な変換
 */
export function safeString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

/**
 * 数値の安全な変換
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  
  return fallback;
}

/**
 * ブール値の安全な変換
 */
export function safeBoolean(value: unknown, fallback: boolean = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

/**
 * 配列の安全な変換
 */
export function safeArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return fallback;
  return [value as T];
}

/**
 * オブジェクトの安全な変換
 */
export function safeObject<T extends Record<string, unknown>>(
  value: unknown, 
  fallback: T
): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

/**
 * 深いオブジェクトのクローン
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(deepClone) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * オブジェクトのマージ（深い）
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T, 
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item: unknown): item is Record<string, unknown> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * プレースホルダーの置換（高度版）
 */
export function replacePlaceholders(
  template: string,
  values: Record<string, unknown>,
  options: {
    prefix?: string;
    suffix?: string;
    escapeHtml?: boolean;
    allowUndefined?: boolean;
  } = {}
): string {
  const {
    prefix = '{{',
    suffix = '}}',
    escapeHtml = false,
    allowUndefined = false
  } = options;

  const regex = new RegExp(`${escapeRegExp(prefix)}([^${escapeRegExp(suffix)}]+)${escapeRegExp(suffix)}`, 'g');

  return template.replace(regex, (match, key: string) => {
    const trimmedKey = key.trim();
    const value = values[trimmedKey];

    if (value === undefined) {
      return allowUndefined ? match : '';
    }

    let stringValue = safeString(value);
    
    if (escapeHtml) {
      stringValue = escapeHtmlEntities(stringValue);
    }

    return stringValue;
  });
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlEntities(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, (s) => map[s]);
}

/**
 * データの検証
 */
export function validateData(
  data: unknown, 
  rules: Record<string, ValidationRule[]>
): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['データが無効です'] };
  }

  const obj = data as Record<string, unknown>;

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = obj[field];

    for (const rule of fieldRules) {
      const error = validateField(field, value, rule);
      if (error) {
        errors.push(error);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

function validateField(field: string, value: unknown, rule: ValidationRule): string | null {
  const { type, value: ruleValue, message } = rule;

  switch (type) {
    case 'required':
      if (value === null || value === undefined || value === '') {
        return message || `${field}は必須です`;
      }
      break;

    case 'minLength':
      const minLength = ruleValue as number;
      if (typeof value === 'string' && value.length < minLength) {
        return message || `${field}は${minLength}文字以上である必要があります`;
      }
      break;

    case 'maxLength':
      const maxLength = ruleValue as number;
      if (typeof value === 'string' && value.length > maxLength) {
        return message || `${field}は${maxLength}文字以下である必要があります`;
      }
      break;

    case 'pattern':
      const pattern = ruleValue as RegExp;
      if (typeof value === 'string' && !pattern.test(value)) {
        return message || `${field}の形式が正しくありません`;
      }
      break;

    case 'custom':
      if (rule.validator && !rule.validator(value)) {
        return message || `${field}の値が無効です`;
      }
      break;
  }

  return null;
}

/**
 * JSONの安全なパース
 */
export function safeJsonParse<T = unknown>(
  json: string, 
  fallback: T
): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * JSONの安全な文字列化
 */
export function safeJsonStringify(
  value: unknown, 
  space?: number
): string {
  try {
    return JSON.stringify(value, null, space);
  } catch {
    return '{}';
  }
}

/**
 * 文字列のトリム（全角スペースも含む）
 */
export function fullTrim(str: string): string {
  return str.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
}

/**
 * キャメルケースからスネークケースへ変換
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * スネークケースからキャメルケースへ変換
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * オブジェクトのキーを変換
 */
export function transformKeys<T extends Record<string, unknown>>(
  obj: T,
  transformer: (key: string) => string
): T {
  const result = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = transformer(key);
    if (isObject(value)) {
      result[newKey as keyof T] = transformKeys(value, transformer) as T[keyof T];
    } else {
      result[newKey as keyof T] = value as T[keyof T];
    }
  }
  
  return result;
}

/**
 * 文字列の省略表示
 */
export function truncateText(
  text: string, 
  maxLength: number, 
  suffix: string = '...'
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 配列の重複除去
 */
export function uniqueArray<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}