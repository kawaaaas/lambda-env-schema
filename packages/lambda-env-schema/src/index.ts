/**
 * lambda-env-schema - A lightweight environment variable validator for AWS Lambda.
 *
 * @packageDocumentation
 */

// =============================================================================
// Main API
// =============================================================================

export type { CreateEnvOptions, EnvResult } from './create-env';
export { createEnv, toCamelCase } from './create-env';

// =============================================================================
// Schema Types
// =============================================================================

export type {
  ArraySchema,
  BaseSchema,
  BooleanSchema,
  EnvSchema,
  // Base types
  EnvType,
  InferEnv,
  InferResult,
  // Type inference utilities
  InferValue,
  IsRequired,
  JsonSchema,
  NumberSchema,
  SchemaItem,
  SnakeToCamel,
  // Schema definitions
  StringSchema,
} from './types';

// =============================================================================
// AWS Lambda Environment
// =============================================================================

export type { AWSLambdaEnv } from './aws-env';
export { AWS_ENV_MAPPING, getAWSLambdaEnv } from './aws-env';

// =============================================================================
// Error Handling
// =============================================================================

export type { ValidationError } from './errors';
export {
  EnvironmentValidationError,
  formatErrorMessage,
  formatValue,
} from './errors';
