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
  ScopeValidationResult,
  ValidationRule,
  ValidationScope,
} from './aws/aws-validation-types';
export {
  // Region and Account ID
  AWS_REGIONS,
  // DynamoDB
  extractAccountIdFromDynamoDBArn,
  // IAM
  extractAccountIdFromIAMArn,
  // KMS
  extractAccountIdFromKMSKeyArn,
  // Secrets Manager
  extractAccountIdFromSecretsManagerArn,
  // SNS
  extractAccountIdFromSNSTopicArn,
  // SQS
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromDynamoDBArn,
  extractRegionFromIAMArn,
  extractRegionFromKMSKeyArn,
  // RDS
  extractRegionFromRDSEndpoint,
  extractRegionFromSecretsManagerArn,
  extractRegionFromSNSTopicArn,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
  // Scoped Validation
  formatScopeError,
  // API Gateway
  isValidApiGatewayId,
  isValidAWSAccountId,
  isValidAWSRegion,
  // CloudFront
  isValidCloudFrontDistId,
  isValidDynamoDBTableArn,
  isValidDynamoDBTableName,
  // VPC Resources
  isValidEc2InstanceId,
  // EventBridge
  isValidEventBusName,
  isValidIAMRoleArn,
  isValidIAMUserArn,
  isValidKMSKeyArn,
  isValidKMSKeyId,
  // Lambda
  isValidLambdaFunctionName,
  isValidRDSClusterId,
  isValidRDSEndpoint,
  // S3
  isValidS3Arn,
  isValidS3BucketName,
  isValidSecretsManagerArn,
  isValidSecurityGroupId,
  isValidSNSTopicArn,
  isValidSQSQueueArn,
  isValidSQSQueueUrl,
  // SSM Parameter Store
  isValidSSMParameterName,
  isValidSubnetId,
  isValidVpcId,
  supportsScope,
  validateScope,
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

// =============================================================================
// AWS Validation Error Formatting
// =============================================================================

export {
  AWS_VALIDATION_DESCRIPTIONS,
  formatAWSValidationError,
} from './core/validation';
