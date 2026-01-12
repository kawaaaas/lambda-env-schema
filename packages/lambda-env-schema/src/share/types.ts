import type {
  AWSValidationType,
  ValidationScope,
} from '../aws/aws-validation-types';

/**
 * Environment variable types supported by the schema.
 */
export type EnvType = 'string' | 'number' | 'boolean' | 'array' | 'json';

/**
 * Base schema interface with common properties.
 */
export interface BaseSchema {
  /** Whether the environment variable is required */
  required?: boolean;
  /** Whether the value should be masked in error messages */
  secret?: boolean;
  /** Description of the environment variable */
  description?: string;
}

/**
 * Schema for string environment variables.
 */
export interface StringSchema<E extends string = string> extends BaseSchema {
  type: 'string';
  /** Default value if not set */
  default?: E;
  /** Allowed values */
  enum?: readonly E[];
  /** Regex pattern the value must match */
  pattern?: RegExp;
  /** Minimum string length */
  minLength?: number;
  /** Maximum string length */
  maxLength?: number;
  /** AWS-specific validation type */
  validation?: AWSValidationType;
  /** Scope validation for ARNs (region/accountId) */
  scope?: ValidationScope;
}

/**
 * Schema for number environment variables.
 */
export interface NumberSchema extends BaseSchema {
  type: 'number';
  /** Default value if not set */
  default?: number;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
}

/**
 * Schema for boolean environment variables.
 */
export interface BooleanSchema extends BaseSchema {
  type: 'boolean';
  /** Default value if not set */
  default?: boolean;
}

/**
 * Schema for array environment variables.
 */
export interface ArraySchema<T extends 'string' | 'number' = 'string'>
  extends BaseSchema {
  type: 'array';
  /** Type of array items */
  itemType: T;
  /** Separator used to split the string (default: ",") */
  separator?: string;
  /** Default value if not set */
  default?: T extends 'string' ? string[] : number[];
  /** Minimum array length */
  minLength?: number;
  /** Maximum array length */
  maxLength?: number;
}

/**
 * Schema for JSON environment variables.
 */
export interface JsonSchema<T = unknown> extends BaseSchema {
  type: 'json';
  /** Default value if not set */
  default?: T;
}

/**
 * Union of all schema types.
 */
export type SchemaItem =
  | StringSchema<string>
  | NumberSchema
  | BooleanSchema
  | ArraySchema<'string' | 'number'>
  | JsonSchema;

/**
 * Schema definition object mapping environment variable names to their schemas.
 */
export type EnvSchema = Record<string, SchemaItem>;

// ============================================================================
// Type Inference Utilities
// ============================================================================

/**
 * Infers the value type from a schema item.
 *
 * @example
 * ```typescript
 * type S = StringSchema<'dev' | 'prod'>;
 * type V = InferValue<S>; // 'dev' | 'prod'
 * ```
 */
export type InferValue<S extends SchemaItem> =
  S extends StringSchema<infer E>
    ? E
    : S extends NumberSchema
      ? number
      : S extends BooleanSchema
        ? boolean
        : S extends ArraySchema<infer T>
          ? T extends 'string'
            ? string[]
            : number[]
          : S extends JsonSchema<infer T>
            ? T
            : never;

/**
 * Checks if a schema item is required (has `required: true` or has a `default` value).
 */
export type IsRequired<S extends SchemaItem> = S extends { required: true }
  ? true
  : S extends { default: unknown }
    ? true
    : false;

/**
 * Infers the result type for a schema item, handling optional values.
 * If the item is required or has a default, the type is non-optional.
 * Otherwise, the type includes `undefined`.
 */
export type InferResult<S extends SchemaItem> =
  IsRequired<S> extends true ? InferValue<S> : InferValue<S> | undefined;

/**
 * Converts a SNAKE_CASE string to camelCase at the type level.
 *
 * @example
 * ```typescript
 * type Result = SnakeToCamel<'MY_ENV_VAR'>; // 'myEnvVar'
 * ```
 */
export type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${Lowercase<T>}${Capitalize<SnakeToCamel<U>>}`
  : Lowercase<S>;

/**
 * Infers the entire environment object type from a schema.
 *
 * @example
 * ```typescript
 * const schema = {
 *   PORT: { type: 'number', default: 3000 },
 *   API_KEY: { type: 'string', required: true }
 * } as const;
 *
 * type Env = InferEnv<typeof schema>;
 * // { PORT: number; API_KEY: string }
 *
 * type EnvCamel = InferEnv<typeof schema, 'camelCase'>;
 * // { port: number; apiKey: string }
 * ```
 */
export type InferEnv<
  S extends EnvSchema,
  Strategy extends 'preserve' | 'camelCase' = 'preserve',
> = {
  [K in keyof S as Strategy extends 'camelCase'
    ? SnakeToCamel<K & string>
    : K]: InferResult<S[K]>;
};
