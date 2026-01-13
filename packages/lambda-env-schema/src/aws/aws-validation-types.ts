/**
 * AWS-specific validation types for environment variables.
 *
 * These validation types allow Lambda developers to validate that environment
 * variables contain properly formatted AWS resource identifiers (ARNs, IDs, names, etc.)
 * at startup time, preventing runtime errors from misconfiguration.
 */

// Re-export types from share/types.ts
export type {
  AWSParsedType,
  AWSValidationOnlyType,
} from '../share/types';
// Re-export all validators
export { isValidApiGatewayId } from './api-gateway-validators';
export { isValidArn, parseArn } from './arn-validators';
export {
  AWS_REGIONS,
  type AWSRegion,
  isValidAWSAccountId,
  isValidAWSRegion,
} from './aws-regions';
export { isValidCloudFrontDistId } from './cloudfront-validators';
export {
  extractAccountIdFromDynamoDBArn,
  extractRegionFromDynamoDBArn,
  isValidDynamoDBTableArn,
  isValidDynamoDBTableName,
  parseDynamoDBTableArn,
} from './dynamodb-validators';
export { isValidEventBusName } from './eventbridge-validators';
export {
  extractAccountIdFromIAMArn,
  extractRegionFromIAMArn,
  isValidIAMRoleArn,
  isValidIAMUserArn,
  parseIAMRoleArn,
} from './iam-validators';
export {
  extractAccountIdFromKMSKeyArn,
  extractRegionFromKMSKeyArn,
  isValidKMSKeyArn,
  isValidKMSKeyId,
  parseKMSKeyArn,
} from './kms-validators';
export {
  isValidLambdaFunctionArn,
  isValidLambdaFunctionName,
  parseLambdaFunctionArn,
} from './lambda-validators';
export {
  extractRegionFromRDSEndpoint,
  isValidRDSClusterId,
  isValidRDSEndpoint,
  parseRDSEndpoint,
} from './rds-validators';
export {
  isValidS3Arn,
  isValidS3BucketName,
  isValidS3Uri,
  parseS3Arn,
  parseS3Uri,
} from './s3-validators';
export {
  extractAccountIdFromSecretsManagerArn,
  extractRegionFromSecretsManagerArn,
  isValidSecretsManagerArn,
  parseSecretsManagerArn,
} from './secrets-manager-validators';
export {
  extractAccountIdFromSNSTopicArn,
  extractRegionFromSNSTopicArn,
  isValidSNSTopicArn,
  parseSNSTopicArn,
} from './sns-validators';
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
export { isValidSSMParameterName } from './ssm-validators';
export {
  isValidEc2InstanceId,
  isValidSecurityGroupId,
  isValidSubnetId,
  isValidVpcId,
} from './vpc-validators';

/**
 * AWS resource types that return plain string (validation only).
 * These types validate the format but return the original string value.
 *
 * @example
 * ```typescript
 * const env = createEnv({
 *   AWS_REGION: { type: 'aws-region' },
 *   BUCKET_NAME: { type: 's3-bucket-name' }
 * });
 * // env.AWS_REGION is string
 * // env.BUCKET_NAME is string
 * ```
 *
 * @deprecated Use AWSValidationOnlyType from '../share/types' instead
 */
export type AWSValidationOnlyTypeLocal =
  // Identity & Access
  | 'aws-region'
  | 'aws-account-id'
  | 'iam-user-arn'
  // Storage
  | 's3-bucket-name'
  // Database
  | 'dynamodb-table-name'
  | 'rds-cluster-id'
  // Compute
  | 'lambda-function-name'
  // Messaging
  | 'event-bus-name'
  // API & Networking
  | 'api-gateway-id'
  | 'vpc-id'
  | 'subnet-id'
  | 'security-group-id'
  | 'ec2-instance-id'
  | 'cloudfront-dist-id'
  // Security
  | 'kms-key-id'
  | 'ssm-parameter-name';

/**
 * AWS resource types that return ParsedValue (with property access).
 * These types validate the format and return a parsed object with extracted properties.
 *
 * @example
 * ```typescript
 * const env = createEnv({
 *   QUEUE_URL: { type: 'sqs-queue-url' },
 *   BUCKET_ARN: { type: 's3-arn' }
 * });
 * // env.QUEUE_URL.queueName, env.QUEUE_URL.region, etc.
 * // env.BUCKET_ARN.bucketName, env.BUCKET_ARN.key, etc.
 * ```
 *
 * @deprecated Use AWSParsedType from '../share/types' instead
 */
export type AWSParsedTypeLocal =
  // Storage
  | 's3-arn'
  | 's3-uri'
  // Database
  | 'dynamodb-table-arn'
  | 'rds-endpoint'
  // Compute
  | 'lambda-function-arn'
  // Messaging
  | 'sqs-queue-url'
  | 'sqs-queue-arn'
  | 'sns-topic-arn'
  // Security
  | 'kms-key-arn'
  | 'secrets-manager-arn'
  | 'iam-role-arn'
  // Generic
  | 'arn';

/**
 * All supported AWS validation types.
 *
 * This is a union of:
 * - AWSValidationOnlyType: Types that return plain string after validation
 * - AWSParsedType: Types that return ParsedValue with extracted properties
 *
 * @example
 * ```typescript
 * const env = createEnv({
 *   AWS_REGION: { type: 'aws-region' },           // returns string
 *   QUEUE_URL: { type: 'sqs-queue-url' },         // returns ParsedSQSQueueUrl
 *   TABLE_ARN: { type: 'dynamodb-table-arn' }     // returns ParsedDynamoDBTableArn
 * });
 * ```
 */
export type AWSValidationType = AWSValidationOnlyTypeLocal | AWSParsedTypeLocal;

/**
 * Validation rule definition for AWS resource identifiers.
 *
 * Each validation type has a corresponding rule that defines:
 * - A regex pattern (or custom function) for format validation
 * - A human-readable description for error messages
 *
 * @example
 * ```typescript
 * const dynamoDbTableArnRule: ValidationRule = {
 *   pattern: /^arn:aws:dynamodb:[\w-]+:\d{12}:table\/[a-zA-Z0-9_.-]+$/,
 *   description: 'DynamoDB table ARN (arn:aws:dynamodb:<region>:<account-id>:table/<table-name>)'
 * };
 * ```
 */
export interface ValidationRule {
  /** Regular expression pattern for validation */
  pattern: RegExp;
  /** Human-readable description of expected format (used in error messages) */
  description: string;
}
