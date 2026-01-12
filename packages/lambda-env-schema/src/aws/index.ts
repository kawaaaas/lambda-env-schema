/**
 * AWS validators subpath export.
 *
 * This module provides AWS-specific validation functions that can be imported
 * separately from the main package to enable tree-shaking.
 *
 * @example
 * ```typescript
 * import { isValidS3BucketName, isValidAWSRegion } from '@kawaaaas/lambda-env-schema/aws';
 *
 * if (isValidS3BucketName(bucketName)) {
 *   // ...
 * }
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// AWS Regions & Account
// =============================================================================

export {
  AWS_REGIONS,
  type AWSRegion,
  isValidAWSAccountId,
  isValidAWSRegion,
} from './aws-regions';

// =============================================================================
// Validation Types
// =============================================================================

export type {
  AWSParsedType,
  AWSValidationOnlyType,
  AWSValidationType,
  ValidationRule,
} from './aws-validation-types';

// =============================================================================
// Parsed Types
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
  ParsedSQSQueueUrl,
} from './parsed-types';

// =============================================================================
// Service-specific Validators
// =============================================================================

// API Gateway
export { isValidApiGatewayId } from './api-gateway-validators';
// Generic ARN
export { isValidArn, parseArn } from './arn-validators';
// CloudFront
export { isValidCloudFrontDistId } from './cloudfront-validators';
// DynamoDB
export {
  extractAccountIdFromDynamoDBArn,
  extractRegionFromDynamoDBArn,
  isValidDynamoDBTableArn,
  isValidDynamoDBTableName,
  parseDynamoDBTableArn,
} from './dynamodb-validators';
// EventBridge
export { isValidEventBusName } from './eventbridge-validators';
// IAM
export {
  extractAccountIdFromIAMArn,
  extractRegionFromIAMArn,
  isValidIAMRoleArn,
  isValidIAMUserArn,
  parseIAMRoleArn,
} from './iam-validators';
// KMS
export {
  extractAccountIdFromKMSKeyArn,
  extractRegionFromKMSKeyArn,
  isValidKMSKeyArn,
  isValidKMSKeyId,
  parseKMSKeyArn,
} from './kms-validators';
// Lambda
export {
  isValidLambdaFunctionArn,
  isValidLambdaFunctionName,
  parseLambdaFunctionArn,
} from './lambda-validators';
// RDS
export {
  extractRegionFromRDSEndpoint,
  isValidRDSClusterId,
  isValidRDSEndpoint,
  parseRDSEndpoint,
} from './rds-validators';
// S3
export {
  isValidS3Arn,
  isValidS3BucketName,
  isValidS3Uri,
  parseS3Arn,
  parseS3Uri,
} from './s3-validators';
// Secrets Manager
export {
  extractAccountIdFromSecretsManagerArn,
  extractRegionFromSecretsManagerArn,
  isValidSecretsManagerArn,
  parseSecretsManagerArn,
} from './secrets-manager-validators';
// SNS
export {
  extractAccountIdFromSNSTopicArn,
  extractRegionFromSNSTopicArn,
  isValidSNSTopicArn,
  parseSNSTopicArn,
} from './sns-validators';
// SQS
export {
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
  isValidSQSQueueArn,
  isValidSQSQueueUrl,
  parseSQSQueueArn,
  parseSQSQueueUrl,
} from './sqs-validators';
// SSM
export { isValidSSMParameterName } from './ssm-validators';
// VPC & EC2
export {
  isValidEc2InstanceId,
  isValidSecurityGroupId,
  isValidSubnetId,
  isValidVpcId,
} from './vpc-validators';
