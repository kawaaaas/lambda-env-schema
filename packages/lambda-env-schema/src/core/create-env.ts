/**
 * Main createEnv function implementation.
 */

import { type AWSLambdaEnv, getAWSLambdaEnv } from './aws/aws-env';
import {
  coerceArray,
  coerceBoolean,
  coerceJson,
  coerceNumber,
  coerceString,
} from './coercion';
import type { ValidationError } from './share/errors';
import { EnvironmentValidationError } from './share/errors';
import type { EnvSchema, InferEnv, SchemaItem } from './share/types';
import {
  applyDefault,
  checkConstraints,
  checkEnum,
  checkRequired,
  formatValue,
} from './validation';

/**
 * Options for createEnv function.
 */
export interface CreateEnvOptions {
  /**
   * Naming strategy for output keys.
   * - 'preserve': Keep original environment variable names (default)
   * - 'camelCase': Convert SNAKE_CASE to camelCase
   */
  namingStrategy?: 'preserve' | 'camelCase';
  /**
   * Custom environment object to read from.
   * Defaults to process.env.
   */
  env?: Record<string, string | undefined>;
}

/**
 * Result type for createEnv function.
 * Includes the validated environment variables and AWS Lambda environment.
 */
export type EnvResult<
  S extends EnvSchema,
  O extends CreateEnvOptions = object,
> = InferEnv<
  S,
  O['namingStrategy'] extends 'camelCase' ? 'camelCase' : 'preserve'
> & {
  /** AWS Lambda environment variables */
  aws: AWSLambdaEnv;
};

/**
 * Coerces a string value to the type specified in the schema.
 */
function coerceValue(
  key: string,
  schema: SchemaItem,
  value: string,
  isSecret: boolean
):
  | { success: true; value: unknown }
  | { success: false; errors: ValidationError[] } {
  switch (schema.type) {
    case 'string': {
      const result = coerceString(value);
      if (!result.success) {
        return {
          success: false,
          errors: [
            {
              key,
              message: result.error,
              received: formatValue(value, isSecret),
            },
          ],
        };
      }
      return { success: true, value: result.value };
    }

    case 'number': {
      const result = coerceNumber(value);
      if (!result.success) {
        return {
          success: false,
          errors: [
            {
              key,
              message: result.error,
              received: formatValue(value, isSecret),
            },
          ],
        };
      }
      return { success: true, value: result.value };
    }

    case 'boolean': {
      const result = coerceBoolean(value);
      if (!result.success) {
        return {
          success: false,
          errors: [
            {
              key,
              message: result.error,
              received: formatValue(value, isSecret),
            },
          ],
        };
      }
      return { success: true, value: result.value };
    }

    case 'array': {
      const separator = schema.separator ?? ',';
      const result = coerceArray(value, schema.itemType, separator);
      if (!result.success) {
        return {
          success: false,
          errors: [
            {
              key,
              message: result.error,
              received: formatValue(value, isSecret),
            },
          ],
        };
      }
      return { success: true, value: result.value };
    }

    case 'json': {
      const result = coerceJson(value);
      if (!result.success) {
        return {
          success: false,
          errors: [
            {
              key,
              message: result.error,
              received: formatValue(value, isSecret),
            },
          ],
        };
      }
      return { success: true, value: result.value };
    }

    default:
      return {
        success: false,
        errors: [{ key, message: 'Unknown schema type' }],
      };
  }
}

/**
 * Validates a single environment variable against its schema.
 */
function validateItem(
  key: string,
  schema: SchemaItem,
  rawValue: string | undefined
):
  | { success: true; value: unknown }
  | { success: false; errors: ValidationError[] } {
  const isSecret = schema.secret === true;
  const errors: ValidationError[] = [];

  // Step 1: Check required
  const requiredResult = checkRequired(key, schema, rawValue);
  if (!requiredResult.valid) {
    return { success: false, errors: [requiredResult.error] };
  }

  // Step 2: Apply default
  const defaultResult = applyDefault(schema, rawValue);
  if (!defaultResult.hasValue) {
    return { success: true, value: undefined };
  }

  const valueToProcess = defaultResult.value;

  // If the value is already the default (not a string), skip coercion
  if (typeof valueToProcess !== 'string') {
    const enumResult = checkEnum(key, schema, valueToProcess);
    if (!enumResult.valid) {
      errors.push(enumResult.error);
    }

    const constraintResult = checkConstraints(key, schema, valueToProcess);
    if (!constraintResult.valid) {
      errors.push(...constraintResult.errors);
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }
    return { success: true, value: valueToProcess };
  }

  // Step 3: Coerce the string value
  const coercionResult = coerceValue(key, schema, valueToProcess, isSecret);
  if (!coercionResult.success) {
    return { success: false, errors: coercionResult.errors };
  }

  const coercedValue = coercionResult.value;

  // Step 4: Check enum
  const enumResult = checkEnum(key, schema, coercedValue);
  if (!enumResult.valid) {
    errors.push(enumResult.error);
  }

  // Step 5: Check constraints
  const constraintResult = checkConstraints(key, schema, coercedValue);
  if (!constraintResult.valid) {
    errors.push(...constraintResult.errors);
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, value: coercedValue };
}

/**
 * Converts a SNAKE_CASE string to camelCase.
 *
 * @param str - The SNAKE_CASE string to convert
 * @returns The camelCase equivalent
 *
 * @example
 * ```typescript
 * toCamelCase('MY_ENV_VAR'); // 'myEnvVar'
 * toCamelCase('API_KEY');    // 'apiKey'
 * toCamelCase('PORT');       // 'port'
 * ```
 */
export function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Creates a typed environment configuration from the given schema.
 *
 * @param schema - The environment variable schema definition
 * @param options - Optional configuration options
 * @returns A typed environment object with validated values
 * @throws {EnvironmentValidationError} When validation fails
 *
 * @example
 * ```typescript
 * const env = createEnv({
 *   PORT: { type: 'number', default: 3000 },
 *   API_KEY: { type: 'string', required: true, secret: true },
 *   NODE_ENV: { type: 'string', enum: ['development', 'production'] as const },
 *   FEATURES: { type: 'array', itemType: 'string', default: [] },
 * });
 *
 * // env.PORT is number
 * // env.API_KEY is string
 * // env.NODE_ENV is 'development' | 'production' | undefined
 * // env.FEATURES is string[]
 * // env.aws.region is string | undefined
 * ```
 */
export function createEnv<
  S extends EnvSchema,
  O extends CreateEnvOptions = object,
>(schema: S, options?: O): EnvResult<S, O> {
  const env = options?.env ?? process.env;
  const namingStrategy = options?.namingStrategy ?? 'preserve';
  const errors: ValidationError[] = [];
  const result: Record<string, unknown> = {};

  // Validate each schema item
  for (const [key, schemaItem] of Object.entries(schema)) {
    const rawValue = env[key];
    const validationResult = validateItem(key, schemaItem, rawValue);

    if (!validationResult.success) {
      errors.push(...validationResult.errors);
    } else {
      const outputKey = namingStrategy === 'camelCase' ? toCamelCase(key) : key;
      result[outputKey] = validationResult.value;
    }
  }

  // Throw if there are any errors
  if (errors.length > 0) {
    throw new EnvironmentValidationError(errors);
  }

  // Add AWS Lambda environment variables
  result.aws = getAWSLambdaEnv(env);

  return result as EnvResult<S, O>;
}
