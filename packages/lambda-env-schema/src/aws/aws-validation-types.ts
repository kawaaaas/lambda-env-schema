/**
 * AWS-specific validation types for environment variables.
 *
 * These validation types allow Lambda developers to validate that environment
 * variables contain properly formatted AWS resource identifiers (ARNs, IDs, names, etc.)
 * at startup time, preventing runtime errors from misconfiguration.
 */

// Re-export all validators
export { isValidApiGatewayId } from './api-gateway-validators';
export {
  AWS_REGIONS, isValidAWSAccountId,
  isValidAWSRegion, type AWSRegion
} from './aws-regions';
export { isValidCloudFrontDistId } from './cloudfront-validators';
export {
  extractAccountIdFromDynamoDBArn,
  extractRegionFromDynamoDBArn,
  isValidDynamoDBTableArn,
  isValidDynamoDBTableName
} from './dynamodb-validators';
export { isValidEventBusName } from './eventbridge-validators';
export {
  extractAccountIdFromIAMArn,
  extractRegionFromIAMArn,
  isValidIAMRoleArn,
  isValidIAMUserArn
} from './iam-validators';
export {
  extractAccountIdFromKMSKeyArn,
  extractRegionFromKMSKeyArn,
  isValidKMSKeyArn,
  isValidKMSKeyId
} from './kms-validators';
export { isValidLambdaFunctionName } from './lambda-validators';
export {
  extractRegionFromRDSEndpoint,
  isValidRDSClusterId,
  isValidRDSEndpoint
} from './rds-validators';
export { isValidS3Arn, isValidS3BucketName } from './s3-validators';
export {
  extractAccountIdFromSecretsManagerArn,
  extractRegionFromSecretsManagerArn,
  isValidSecretsManagerArn
} from './secrets-manager-validators';
export {
  extractAccountIdFromSNSTopicArn,
  extractRegionFromSNSTopicArn,
  isValidSNSTopicArn
} from './sns-validators';
export {
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
  isValidSQSQueueArn,
  isValidSQSQueueUrl
} from './sqs-validators';
export { isValidSSMParameterName } from './ssm-validators';
export {
  isValidEc2InstanceId,
  isValidSecurityGroupId,
  isValidSubnetId,
  isValidVpcId
} from './vpc-validators';

/**
 * All supported AWS validation types.
 *
 * @example
 * ```typescript
 * const env = createEnv({
 *   AWS_REGION: { type: 'string', validation: 'aws-region' },
 *   TABLE_ARN: { type: 'string', validation: 'dynamodb-table-arn' }
 * });
 * ```
 */
export type AWSValidationType =
  // Identity & Access
  | 'aws-region'
  | 'aws-account-id'
  | 'iam-role-arn'
  | 'iam-user-arn'
  // Storage
  | 's3-bucket-name'
  | 's3-arn'
  // Database
  | 'dynamodb-table-name'
  | 'dynamodb-table-arn'
  | 'rds-endpoint'
  | 'rds-cluster-id'
  // Compute
  | 'lambda-function-name'
  // Messaging
  | 'sqs-queue-url'
  | 'sqs-queue-arn'
  | 'sns-topic-arn'
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
  | 'kms-key-arn'
  | 'secrets-manager-arn'
  | 'ssm-parameter-name';

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
