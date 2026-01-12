/**
 * AWS-specific validation types for environment variables.
 *
 * These validation types allow Lambda developers to validate that environment
 * variables contain properly formatted AWS resource identifiers (ARNs, IDs, names, etc.)
 * at startup time, preventing runtime errors from misconfiguration.
 */

/**
 * List of all valid AWS regions.
 *
 * This list includes all current AWS regions as of the latest update.
 * Used for validating `aws-region` validation type.
 *
 * @see https://docs.aws.amazon.com/general/latest/gr/rande.html
 */
export const AWS_REGIONS = [
  // Asia Pacific
  'ap-east-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-south-1',
  'ap-south-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-southeast-3',
  'ap-southeast-4',
  // Europe
  'eu-central-1',
  'eu-central-2',
  'eu-north-1',
  'eu-south-1',
  'eu-south-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  // Americas
  'ca-central-1',
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  // Middle East & Africa
  'af-south-1',
  'il-central-1',
  'me-central-1',
  'me-south-1',
] as const;

/**
 * Type representing a valid AWS region code.
 *
 * @example
 * ```typescript
 * const region: AWSRegion = 'ap-northeast-1'; // Valid
 * const invalid: AWSRegion = 'invalid-region'; // Type error
 * ```
 */
export type AWSRegion = (typeof AWS_REGIONS)[number];

/**
 * Checks if a value is a valid AWS region code.
 *
 * @param value - The value to validate
 * @returns true if the value is a valid AWS region, false otherwise
 *
 * @example
 * ```typescript
 * isValidAWSRegion('ap-northeast-1'); // true
 * isValidAWSRegion('us-east-1');      // true
 * isValidAWSRegion('invalid-region'); // false
 * isValidAWSRegion('');               // false
 * ```
 */
export function isValidAWSRegion(value: string): value is AWSRegion {
  return AWS_REGIONS.includes(value as AWSRegion);
}

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
  | 'access-key-id'
  | 'secret-access-key'
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
