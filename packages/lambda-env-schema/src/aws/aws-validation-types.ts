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
} from './dynamodb-validators';
export { isValidEventBusName } from './eventbridge-validators';
export {
  extractAccountIdFromIAMArn,
  extractRegionFromIAMArn,
  isValidIAMRoleArn,
  isValidIAMUserArn,
} from './iam-validators';
export {
  extractAccountIdFromKMSKeyArn,
  extractRegionFromKMSKeyArn,
  isValidKMSKeyArn,
  isValidKMSKeyId,
} from './kms-validators';
export { isValidLambdaFunctionName } from './lambda-validators';
export {
  extractRegionFromRDSEndpoint,
  isValidRDSClusterId,
  isValidRDSEndpoint,
} from './rds-validators';
export { isValidS3Arn, isValidS3BucketName } from './s3-validators';
export type { ScopeValidationResult } from './scoped-validation';
// Scoped validation
export {
  formatScopeError,
  supportsScope,
  validateScope,
} from './scoped-validation';
export {
  extractAccountIdFromSecretsManagerArn,
  extractRegionFromSecretsManagerArn,
  isValidSecretsManagerArn,
} from './secrets-manager-validators';
export {
  extractAccountIdFromSNSTopicArn,
  extractRegionFromSNSTopicArn,
  isValidSNSTopicArn,
} from './sns-validators';
export {
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
  isValidSQSQueueArn,
  isValidSQSQueueUrl,
} from './sqs-validators';
export { isValidSSMParameterName } from './ssm-validators';
export {
  isValidEc2InstanceId,
  isValidSecurityGroupId,
  isValidSubnetId,
  isValidVpcId,
} from './vpc-validators';

/**
 * Scope configuration for ARN validation.
 *
 * When validating ARN values, you can optionally specify expected region and/or
 * account ID. If the ARN contains different values, a validation error will be
 * collected with both expected and actual values.
 *
 * Note: Scope validation is only applied to validation types that support it
 * (ARN-based types). For non-ARN types like `s3-bucket-name`, scope is ignored.
 *
 * @example
 * ```typescript
 * const env = createEnv({
 *   TABLE_ARN: {
 *     type: 'string',
 *     validation: 'dynamodb-table-arn',
 *     scope: {
 *       region: 'ap-northeast-1',
 *       accountId: '123456789012'
 *     }
 *   }
 * });
 * ```
 */
export interface ValidationScope {
  /** Expected AWS region (e.g., "ap-northeast-1", "us-east-1") */
  region?: string;
  /** Expected AWS account ID (12 digits) */
  accountId?: string;
}

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
 * - Whether the type supports scoped validation (region/accountId extraction)
 * - Optional functions to extract region and account ID from ARN values
 *
 * @example
 * ```typescript
 * const dynamoDbTableArnRule: ValidationRule = {
 *   pattern: /^arn:aws:dynamodb:[\w-]+:\d{12}:table\/[a-zA-Z0-9_.-]+$/,
 *   description: 'DynamoDB table ARN (arn:aws:dynamodb:<region>:<account-id>:table/<table-name>)',
 *   supportsScope: true,
 *   extractRegion: (value) => value.split(':')[3],
 *   extractAccountId: (value) => value.split(':')[4]
 * };
 * ```
 */
export interface ValidationRule {
  /** Regular expression pattern for validation */
  pattern: RegExp;
  /** Human-readable description of expected format (used in error messages) */
  description: string;
  /** Whether this validation type supports scoped validation (region/accountId) */
  supportsScope: boolean;
  /** Function to extract region from value (for scoped validation) */
  extractRegion?: (value: string) => string | undefined;
  /** Function to extract account ID from value (for scoped validation) */
  extractAccountId?: (value: string) => string | undefined;
}
