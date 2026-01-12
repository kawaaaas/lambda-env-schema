import type {
  ParsedArn,
  ParsedDynamoDBTableArn,
  ParsedIAMRoleArn,
  ParsedKMSKeyArn,
  ParsedLambdaFunctionArn,
  ParsedRDSEndpoint,
  ParsedS3Arn,
  ParsedS3Uri,
  ParsedSecretsManagerArn,
  ParsedSNSTopicArn,
  ParsedSQSQueueArn,
  ParsedSQSQueueUrl,
} from '../aws/parsed-types';

/**
 * Primitive environment variable types.
 */
export type PrimitiveType = 'string' | 'number' | 'boolean' | 'array' | 'json';

/**
 * AWS resource types that return plain string (validation only).
 * These types validate the format but return the original string value.
 */
export type AWSValidationOnlyType =
  | 'aws-region'
  | 'aws-account-id'
  | 's3-bucket-name'
  | 'dynamodb-table-name'
  | 'rds-cluster-id'
  | 'lambda-function-name'
  | 'event-bus-name'
  | 'api-gateway-id'
  | 'vpc-id'
  | 'subnet-id'
  | 'security-group-id'
  | 'ec2-instance-id'
  | 'cloudfront-dist-id'
  | 'kms-key-id'
  | 'ssm-parameter-name'
  | 'iam-user-arn';

/**
 * AWS resource types that return ParsedValue (with property access).
 * These types validate the format and return a parsed object with extracted properties.
 */
export type AWSParsedType =
  | 's3-arn'
  | 's3-uri'
  | 'sqs-queue-url'
  | 'sqs-queue-arn'
  | 'sns-topic-arn'
  | 'dynamodb-table-arn'
  | 'rds-endpoint'
  | 'lambda-function-arn'
  | 'kms-key-arn'
  | 'secrets-manager-arn'
  | 'iam-role-arn'
  | 'arn';

/**
 * All supported schema types.
 */
export type SchemaType = PrimitiveType | AWSValidationOnlyType | AWSParsedType;

/**
 * Environment variable types supported by the schema.
 * @deprecated Use SchemaType instead
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
 * Schema for AWS validation-only types (returns string).
 */
export interface AWSValidationOnlySchema extends BaseSchema {
  type: AWSValidationOnlyType;
  /** Default value if not set */
  default?: string;
}

/**
 * Schema for AWS parsed types (returns ParsedValue).
 */
export interface AWSParsedSchema<T extends AWSParsedType = AWSParsedType>
  extends BaseSchema {
  type: T;
  // No default for parsed types (complex objects)
}

/**
 * Union of all schema types.
 */
export type SchemaItem =
  | StringSchema<string>
  | NumberSchema
  | BooleanSchema
  | ArraySchema<'string' | 'number'>
  | JsonSchema
  | AWSValidationOnlySchema
  | AWSParsedSchema;

/**
 * Schema definition object mapping environment variable names to their schemas.
 */
export type EnvSchema = Record<string, SchemaItem>;

// ============================================================================
// Type Inference Utilities
// ============================================================================

/**
 * Maps AWS parsed types to their ParsedValue interfaces.
 */
export type ParsedValueMap = {
  's3-arn': ParsedS3Arn;
  's3-uri': ParsedS3Uri;
  'sqs-queue-url': ParsedSQSQueueUrl;
  'sqs-queue-arn': ParsedSQSQueueArn;
  'sns-topic-arn': ParsedSNSTopicArn;
  'dynamodb-table-arn': ParsedDynamoDBTableArn;
  'rds-endpoint': ParsedRDSEndpoint;
  'lambda-function-arn': ParsedLambdaFunctionArn;
  'kms-key-arn': ParsedKMSKeyArn;
  'secrets-manager-arn': ParsedSecretsManagerArn;
  'iam-role-arn': ParsedIAMRoleArn;
  arn: ParsedArn;
};

/**
 * Infers the value type from a schema item.
 *
 * @example
 * ```typescript
 * type S = StringSchema<'dev' | 'prod'>;
 * type V = InferValue<S>; // 'dev' | 'prod'
 *
 * type Q = AWSParsedSchema<'sqs-queue-url'>;
 * type V2 = InferValue<Q>; // ParsedSQSQueueUrl
 * ```
 */
export type InferValue<S extends SchemaItem> = S extends { type: infer T }
  ? T extends keyof ParsedValueMap
    ? ParsedValueMap[T]
    : T extends AWSValidationOnlyType
      ? string
      : T extends 'string'
        ? S extends StringSchema<infer E>
          ? E
          : string
        : T extends 'number'
          ? number
          : T extends 'boolean'
            ? boolean
            : T extends 'array'
              ? S extends ArraySchema<infer I>
                ? I extends 'string'
                  ? string[]
                  : number[]
                : never
              : T extends 'json'
                ? S extends JsonSchema<infer J>
                  ? J
                  : unknown
                : never
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
