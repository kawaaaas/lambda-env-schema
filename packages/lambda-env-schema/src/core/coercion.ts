/**
 * Coercion functions for converting environment variable strings to typed values.
 */

/**
 * Result of a coercion operation.
 * Either a successful value or an error message.
 */
export type CoercionResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

/**
 * Truthy string values that convert to `true`.
 */
const TRUTHY_VALUES = new Set(['true', '1', 'yes']);

/**
 * Falsy string values that convert to `false`.
 */
const FALSY_VALUES = new Set(['false', '0', 'no', '']);

/**
 * Converts a string to a number.
 *
 * @param value - The string value to convert
 * @returns CoercionResult with the number or an error message
 *
 * @example
 * ```typescript
 * coerceNumber('42');     // { success: true, value: 42 }
 * coerceNumber('3.14');   // { success: true, value: 3.14 }
 * coerceNumber('abc');    // { success: false, error: '...' }
 * ```
 */
export function coerceNumber(value: string): CoercionResult<number> {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return {
      success: false,
      error: `Expected number, got "${value}"`,
    };
  }
  return { success: true, value: num };
}

/**
 * Converts a string to a boolean.
 * Accepts "true", "1", "yes" (case-insensitive) as truthy values.
 * Accepts "false", "0", "no", "" (case-insensitive) as falsy values.
 *
 * @param value - The string value to convert
 * @returns CoercionResult with the boolean or an error message
 *
 * @example
 * ```typescript
 * coerceBoolean('true');  // { success: true, value: true }
 * coerceBoolean('YES');   // { success: true, value: true }
 * coerceBoolean('0');     // { success: true, value: false }
 * coerceBoolean('maybe'); // { success: false, error: '...' }
 * ```
 */
export function coerceBoolean(value: string): CoercionResult<boolean> {
  const lower = value.toLowerCase();

  if (TRUTHY_VALUES.has(lower)) {
    return { success: true, value: true };
  }

  if (FALSY_VALUES.has(lower)) {
    return { success: true, value: false };
  }

  return {
    success: false,
    error: `Expected boolean (true/false/1/0/yes/no), got "${value}"`,
  };
}

/**
 * Returns a string value as-is (identity transformation).
 *
 * @param value - The string value
 * @returns CoercionResult with the same string value
 *
 * @example
 * ```typescript
 * coerceString('hello'); // { success: true, value: 'hello' }
 * ```
 */
export function coerceString(value: string): CoercionResult<string> {
  return { success: true, value };
}

/**
 * Default separator for array values.
 */
const DEFAULT_SEPARATOR = ',';

/**
 * Converts a string to an array of strings.
 * Splits by the separator and trims whitespace from each item.
 * Empty strings return an empty array.
 *
 * @param value - The string value to convert
 * @param separator - The separator to split by (default: ",")
 * @returns CoercionResult with the string array
 *
 * @example
 * ```typescript
 * coerceStringArray('a,b,c');       // { success: true, value: ['a', 'b', 'c'] }
 * coerceStringArray('a | b', '|');  // { success: true, value: ['a', 'b'] }
 * coerceStringArray('');            // { success: true, value: [] }
 * ```
 */
export function coerceStringArray(
  value: string,
  separator: string = DEFAULT_SEPARATOR
): CoercionResult<string[]> {
  if (value === '') {
    return { success: true, value: [] };
  }

  const items = value.split(separator).map((item) => item.trim());
  return { success: true, value: items };
}

/**
 * Converts a string to an array of numbers.
 * Splits by the separator, trims whitespace, and converts each item to a number.
 * Empty strings return an empty array.
 *
 * @param value - The string value to convert
 * @param separator - The separator to split by (default: ",")
 * @returns CoercionResult with the number array or an error message
 *
 * @example
 * ```typescript
 * coerceNumberArray('1,2,3');       // { success: true, value: [1, 2, 3] }
 * coerceNumberArray('1 | 2', '|');  // { success: true, value: [1, 2] }
 * coerceNumberArray('');            // { success: true, value: [] }
 * coerceNumberArray('1,abc,3');     // { success: false, error: '...' }
 * ```
 */
export function coerceNumberArray(
  value: string,
  separator: string = DEFAULT_SEPARATOR
): CoercionResult<number[]> {
  if (value === '') {
    return { success: true, value: [] };
  }

  const items = value.split(separator).map((item) => item.trim());
  const numbers: number[] = [];

  for (let i = 0; i < items.length; i++) {
    const num = Number(items[i]);
    if (Number.isNaN(num)) {
      return {
        success: false,
        error: `Expected number at index ${i}, got "${items[i]}"`,
      };
    }
    numbers.push(num);
  }

  return { success: true, value: numbers };
}

/**
 * Converts a string to an array with the specified item type.
 * This is a convenience function that delegates to coerceStringArray or coerceNumberArray.
 *
 * @param value - The string value to convert
 * @param itemType - The type of items in the array ('string' or 'number')
 * @param separator - The separator to split by (default: ",")
 * @returns CoercionResult with the typed array or an error message
 *
 * @example
 * ```typescript
 * coerceArray('a,b,c', 'string');   // { success: true, value: ['a', 'b', 'c'] }
 * coerceArray('1,2,3', 'number');   // { success: true, value: [1, 2, 3] }
 * ```
 */
export function coerceArray<T extends 'string' | 'number'>(
  value: string,
  itemType: T,
  separator: string = DEFAULT_SEPARATOR
): CoercionResult<T extends 'string' ? string[] : number[]> {
  if (itemType === 'string') {
    return coerceStringArray(value, separator) as CoercionResult<
      T extends 'string' ? string[] : number[]
    >;
  }
  return coerceNumberArray(value, separator) as CoercionResult<
    T extends 'string' ? string[] : number[]
  >;
}

/**
 * Parses a JSON string into a typed value.
 *
 * @param value - The JSON string to parse
 * @returns CoercionResult with the parsed value or an error message
 *
 * @example
 * ```typescript
 * coerceJson('{"key": "value"}');  // { success: true, value: { key: 'value' } }
 * coerceJson('[1, 2, 3]');         // { success: true, value: [1, 2, 3] }
 * coerceJson('invalid');           // { success: false, error: '...' }
 * ```
 */
export function coerceJson<T = unknown>(value: string): CoercionResult<T> {
  try {
    const parsed = JSON.parse(value) as T;
    return { success: true, value: parsed };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return {
      success: false,
      error: `Invalid JSON: ${errorMessage}`,
    };
  }
}
