/**
 * lambda-env-schema - A lightweight environment variable validator for AWS Lambda.
 *
 * @packageDocumentation
 */

// =============================================================================
// Main API
// =============================================================================

export type { CreateEnvOptions, EnvResult } from './core/create-env';
export { createEnv } from './core/create-env';

// =============================================================================
// Schema Types
// =============================================================================

export type {
  ArraySchema,
  BooleanSchema,
  EnvSchema,
  InferEnv,
  JsonSchema,
  NumberSchema,
  // Schema item types for defining schemas
  StringSchema,
} from './share/types';

// =============================================================================
// AWS Lambda Environment
// =============================================================================

export type { AWSLambdaEnv } from './aws/aws-env';

// =============================================================================
// Error Handling
// =============================================================================

export type { ValidationError } from './share/errors';
export { EnvironmentValidationError } from './share/errors';
