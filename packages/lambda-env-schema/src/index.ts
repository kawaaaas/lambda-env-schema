/**
 * lambda-env-schema - A lightweight environment variable validator for AWS Lambda.
 *
 * @packageDocumentation
 */

// =============================================================================
// Main API
// =============================================================================

export { createEnv } from './core/create-env';
export type { CreateEnvOptions, EnvResult } from './core/create-env';

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
  StringSchema
} from './share/types';

// =============================================================================
// AWS Lambda Environment
// =============================================================================

export type { AWSLambdaEnv } from './aws/aws-env';

// =============================================================================
// Error Handling
// =============================================================================

export { EnvironmentValidationError } from './share/errors';
export type { ValidationError } from './share/errors';

// =============================================================================
// AWS Validation Types
// =============================================================================

export type {
  AWSParsedType,
  AWSValidationOnlyType,
  AWSValidationType,
  ValidationRule
} from './aws/aws-validation-types';

// =============================================================================
// AWS Parsed Value Types
// =============================================================================

export type {
  BaseParsedValue,
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
  ParsedSQSQueueUrl
} from './aws/parsed-types';

// =============================================================================
// AWS Validators
// =============================================================================

// API Gateway
export { isValidApiGatewayId } from './aws/api-gateway-validators';
// Generic ARN
export { isValidArn, parseArn } from './aws/arn-validators';
// AWS Regions & Account
export {
  AWS_REGIONS, isValidAWSAccountId,
  isValidAWSRegion, type AWSRegion
} from './aws/aws-regions';

// CloudFront
export { isValidCloudFrontDistId } from './aws/cloudfront-validators';

// DynamoDB
export {
  extractAccountIdFromDynamoDBArn,
  extractRegionFromDynamoDBArn,
  isValidDynamoDBTableArn,
  isValidDynamoDBTableName,
  parseDynamoDBTableArn
} from './aws/dynamodb-validators';

// EventBridge
export { isValidEventBusName } from './aws/eventbridge-validators';

// IAM
export {
  extractAccountIdFromIAMArn,
  extractRegionFromIAMArn,
  isValidIAMRoleArn,
  isValidIAMUserArn,
  parseIAMRoleArn
} from './aws/iam-validators';

// KMS
export {
  extractAccountIdFromKMSKeyArn,
  extractRegionFromKMSKeyArn,
  isValidKMSKeyArn,
  isValidKMSKeyId,
  parseKMSKeyArn
} from './aws/kms-validators';

// Lambda
export {
  isValidLambdaFunctionArn,
  isValidLambdaFunctionName,
  parseLambdaFunctionArn
} from './aws/lambda-validators';

// RDS
export {
  extractRegionFromRDSEndpoint,
  isValidRDSClusterId,
  isValidRDSEndpoint,
  parseRDSEndpoint
} from './aws/rds-validators';

// S3
export {
  isValidS3Arn,
  isValidS3BucketName,
  isValidS3Uri,
  parseS3Arn,
  parseS3Uri
} from './aws/s3-validators';

// Secrets Manager
export {
  extractAccountIdFromSecretsManagerArn,
  extractRegionFromSecretsManagerArn,
  isValidSecretsManagerArn,
  parseSecretsManagerArn
} from './aws/secrets-manager-validators';

// SNS
export {
  extractAccountIdFromSNSTopicArn,
  extractRegionFromSNSTopicArn,
  isValidSNSTopicArn,
  parseSNSTopicArn
} from './aws/sns-validators';

// SQS
export {
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
  isValidSQSQueueArn,
  isValidSQSQueueUrl,
  parseSQSQueueArn,
  parseSQSQueueUrl
} from './aws/sqs-validators';

// SSM
export { isValidSSMParameterName } from './aws/ssm-validators';

// VPC & EC2
export {
  isValidEc2InstanceId,
  isValidSecurityGroupId,
  isValidSubnetId,
  isValidVpcId
} from './aws/vpc-validators';

