/**
 * lambda-env-schema - A lightweight environment variable validator for AWS Lambda.
 *
 * @packageDocumentation
 */

// =============================================================================
// Main API
// =============================================================================

export type { CreateEnvOptions, EnvResult } from './core/create-env';
export { createEnv, toCamelCase } from './core/create-env';

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
} from './share/types';

// =============================================================================
// AWS Lambda Environment
// =============================================================================

export type { AWSLambdaEnv } from './aws/aws-env';
export { AWS_ENV_MAPPING, getAWSLambdaEnv } from './aws/aws-env';

// =============================================================================
// AWS Validation Types
// =============================================================================

export type {
  AWSRegion,
  AWSValidationType,
  ValidationRule,
  ValidationScope,
} from './aws/aws-validation-types';
export {
  AWS_REGIONS,
  extractAccountIdFromDynamoDBArn,
  extractAccountIdFromIAMArn,
  extractAccountIdFromSNSTopicArn,
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromDynamoDBArn,
  extractRegionFromIAMArn,
  extractRegionFromRDSEndpoint,
  extractRegionFromSNSTopicArn,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
  isValidAWSAccountId,
  isValidAWSRegion,
  isValidDynamoDBTableArn,
  isValidDynamoDBTableName,
  isValidEventBusName,
  isValidIAMRoleArn,
  isValidIAMUserArn,
  isValidLambdaFunctionName,
  isValidRDSClusterId,
  isValidRDSEndpoint,
  isValidS3Arn,
  isValidS3BucketName,
  isValidSNSTopicArn,
  isValidSQSQueueArn,
  isValidSQSQueueUrl,
} from './aws/aws-validation-types';

// =============================================================================
// Error Handling
// =============================================================================

export type { ValidationError } from './share/errors';
export {
  EnvironmentValidationError,
  formatErrorMessage,
  formatValue,
} from './share/errors';
