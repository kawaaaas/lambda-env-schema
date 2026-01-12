/**
 * lambda-env-schema - A lightweight environment variable validator for AWS Lambda.
 *
 * @packageDocumentation
 */

// =============================================================================
// Main API
// =============================================================================

export { createEnv, toCamelCase } from './core/create-env';
export type { CreateEnvOptions, EnvResult } from './core/create-env';

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
  StringSchema
} from './share/types';

// =============================================================================
// AWS Lambda Environment
// =============================================================================

export { AWS_ENV_MAPPING, getAWSLambdaEnv } from './aws/aws-env';
export type { AWSLambdaEnv } from './aws/aws-env';

// =============================================================================
// AWS Validation Types
// =============================================================================

export { AWS_REGIONS, extractAccountIdFromIAMArn, extractRegionFromIAMArn, isValidAccessKeyId, isValidAWSAccountId, isValidAWSRegion, isValidIAMRoleArn, isValidIAMUserArn, isValidS3Arn, isValidS3BucketName, isValidSecretAccessKey } from './aws/aws-validation-types';
export type {
  AWSRegion,
  AWSValidationType,
  ValidationRule,
  ValidationScope
} from './aws/aws-validation-types';

// =============================================================================
// Error Handling
// =============================================================================

export {
  EnvironmentValidationError,
  formatErrorMessage,
  formatValue
} from './share/errors';
export type { ValidationError } from './share/errors';

