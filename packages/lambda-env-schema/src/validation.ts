/**
 * Validation functions for environment variable schema validation.
 */

import type { ValidationError } from './errors';
import type { SchemaItem } from './types';

/**
 * Formats a value for display in error messages.
 * Masks secret values with "***" to prevent sensitive data exposure in logs.
 *
 * @param value - The value to format
 * @param isSecret - Whether the value should be masked
 * @returns A formatted string representation of the value
 *
 * @example
 * ```typescript
 * // Non-secret string value
 * formatValue('my-api-key', false);
 * // '"my-api-key"'
 *
 * // Secret value - masked
 * formatValue('my-api-key', true);
 * // '***'
 *
 * // Undefined value
 * formatValue(undefined, false);
 * // 'undefined'
 *
 * // Number value
 * formatValue(3000, false);
 * // '3000'
 * ```
 */
export function formatValue(value: unknown, isSecret: boolean): string {
  if (isSecret) {
    return '***';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return String(value);
}

/**
 * Result of checking if a value is required.
 * Contains either a validation error or indicates the check passed.
 */
export type RequiredCheckResult =
  | { valid: true }
  | { valid: false; error: ValidationError };

/**
 * Checks if a required environment variable is set.
 * A variable is considered required if `required: true` is set AND no default value exists.
 *
 * @param key - The environment variable name
 * @param schema - The schema item for this variable
 * @param value - The environment variable value (may be undefined)
 * @returns RequiredCheckResult indicating if the check passed
 *
 * @example
 * ```typescript
 * // Required variable not set - returns error
 * checkRequired('API_KEY', { type: 'string', required: true }, undefined);
 * // { valid: false, error: { key: 'API_KEY', message: 'Required but not set' } }
 *
 * // Required variable with default - passes (default will be applied)
 * checkRequired('PORT', { type: 'number', required: true, default: 3000 }, undefined);
 * // { valid: true }
 *
 * // Required variable is set - passes
 * checkRequired('API_KEY', { type: 'string', required: true }, 'secret');
 * // { valid: true }
 * ```
 */
export function checkRequired(
  key: string,
  schema: SchemaItem,
  value: string | undefined
): RequiredCheckResult {
  // If value is set, no need to check required
  if (value !== undefined) {
    return { valid: true };
  }

  // If there's a default value, the variable is effectively not required
  if ('default' in schema && schema.default !== undefined) {
    return { valid: true };
  }

  // If required: true and no default, this is an error
  if (schema.required === true) {
    return {
      valid: false,
      error: {
        key,
        message: 'Required but not set',
      },
    };
  }

  // Not required and no default - will be undefined, which is valid
  return { valid: true };
}

/**
 * Result of applying a default value.
 * Contains the value to use (either the original or the default).
 */
export type ApplyDefaultResult<T> =
  | { hasValue: true; value: T }
  | { hasValue: false };

/**
 * Applies a default value if the environment variable is not set.
 *
 * @param schema - The schema item for this variable
 * @param value - The environment variable value (may be undefined)
 * @returns ApplyDefaultResult with the value to use
 *
 * @example
 * ```typescript
 * // Value is set - returns original value
 * applyDefault({ type: 'number', default: 3000 }, '8080');
 * // { hasValue: true, value: '8080' }
 *
 * // Value not set, has default - returns default
 * applyDefault({ type: 'number', default: 3000 }, undefined);
 * // { hasValue: true, value: 3000 }
 *
 * // Value not set, no default - returns no value
 * applyDefault({ type: 'string' }, undefined);
 * // { hasValue: false }
 * ```
 */
export function applyDefault<T>(
  schema: SchemaItem,
  value: string | undefined
): ApplyDefaultResult<string | T> {
  // If value is set, use it
  if (value !== undefined) {
    return { hasValue: true, value };
  }

  // If there's a default value, use it
  if ('default' in schema && schema.default !== undefined) {
    return { hasValue: true, value: schema.default as T };
  }

  // No value and no default
  return { hasValue: false };
}

/**
 * Result of checking if a value is in the allowed enum values.
 */
export type EnumCheckResult =
  | { valid: true }
  | { valid: false; error: ValidationError };

/**
 * Checks if a value is in the allowed enum values.
 * Only applies to string schemas with an enum defined.
 *
 * @param key - The environment variable name
 * @param schema - The schema item for this variable
 * @param value - The coerced value to check
 * @returns EnumCheckResult indicating if the check passed
 *
 * @example
 * ```typescript
 * // Value is in enum - passes
 * checkEnum('NODE_ENV', { type: 'string', enum: ['development', 'production'] }, 'development');
 * // { valid: true }
 *
 * // Value is not in enum - returns error
 * checkEnum('NODE_ENV', { type: 'string', enum: ['development', 'production'] }, 'staging');
 * // { valid: false, error: { key: 'NODE_ENV', message: 'Must be one of ...', ... } }
 *
 * // No enum defined - passes
 * checkEnum('API_KEY', { type: 'string' }, 'any-value');
 * // { valid: true }
 * ```
 */
export function checkEnum(
  key: string,
  schema: SchemaItem,
  value: unknown
): EnumCheckResult {
  // Only string schemas can have enum
  if (schema.type !== 'string') {
    return { valid: true };
  }

  // If no enum defined, skip check
  if (!schema.enum || schema.enum.length === 0) {
    return { valid: true };
  }

  // Check if value is in the enum list
  if (schema.enum.includes(value as string)) {
    return { valid: true };
  }

  // Value not in enum - return error
  const allowedValues = schema.enum.map((v) => `"${v}"`).join(', ');
  return {
    valid: false,
    error: {
      key,
      message: `Must be one of [${allowedValues}], got "${value}"`,
      expected: `one of [${allowedValues}]`,
      received: String(value),
    },
  };
}

/**
 * Result of checking constraints on a value.
 */
export type ConstraintCheckResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

/**
 * Checks if a value satisfies the constraints defined in the schema.
 * Supports min/max for numbers, pattern/minLength/maxLength for strings,
 * and minLength/maxLength for arrays.
 *
 * @param key - The environment variable name
 * @param schema - The schema item for this variable
 * @param value - The coerced value to check
 * @returns ConstraintCheckResult indicating if all constraints passed
 *
 * @example
 * ```typescript
 * // Number within range - passes
 * checkConstraints('PORT', { type: 'number', min: 1, max: 65535 }, 3000);
 * // { valid: true }
 *
 * // Number below min - returns error
 * checkConstraints('PORT', { type: 'number', min: 1 }, 0);
 * // { valid: false, errors: [{ key: 'PORT', message: 'Must be at least 1, got 0' }] }
 *
 * // String matching pattern - passes
 * checkConstraints('EMAIL', { type: 'string', pattern: /@/ }, 'test@example.com');
 * // { valid: true }
 *
 * // Array length within bounds - passes
 * checkConstraints('TAGS', { type: 'array', itemType: 'string', minLength: 1 }, ['a', 'b']);
 * // { valid: true }
 * ```
 */
export function checkConstraints(
  key: string,
  schema: SchemaItem,
  value: unknown
): ConstraintCheckResult {
  const errors: ValidationError[] = [];

  // Number constraints: min, max
  if (schema.type === 'number' && typeof value === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        key,
        message: `Must be at least ${schema.min}, got ${value}`,
        expected: `>= ${schema.min}`,
        received: String(value),
      });
    }

    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        key,
        message: `Must be at most ${schema.max}, got ${value}`,
        expected: `<= ${schema.max}`,
        received: String(value),
      });
    }
  }

  // String constraints: pattern, minLength, maxLength
  if (schema.type === 'string' && typeof value === 'string') {
    if (schema.pattern !== undefined && !schema.pattern.test(value)) {
      errors.push({
        key,
        message: `Must match pattern ${schema.pattern}, got "${value}"`,
        expected: `match ${schema.pattern}`,
        received: value,
      });
    }

    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        key,
        message: `Must have at least ${schema.minLength} characters, got ${value.length}`,
        expected: `length >= ${schema.minLength}`,
        received: String(value.length),
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        key,
        message: `Must have at most ${schema.maxLength} characters, got ${value.length}`,
        expected: `length <= ${schema.maxLength}`,
        received: String(value.length),
      });
    }
  }

  // Array constraints: minLength, maxLength
  if (schema.type === 'array' && Array.isArray(value)) {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        key,
        message: `Must have at least ${schema.minLength} items, got ${value.length}`,
        expected: `length >= ${schema.minLength}`,
        received: String(value.length),
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        key,
        message: `Must have at most ${schema.maxLength} items, got ${value.length}`,
        expected: `length <= ${schema.maxLength}`,
        received: String(value.length),
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
