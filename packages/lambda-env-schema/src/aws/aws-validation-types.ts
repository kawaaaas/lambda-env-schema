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
 * Regular expression pattern for AWS Account ID validation.
 * AWS Account IDs are exactly 12 digits.
 */
const AWS_ACCOUNT_ID_PATTERN = /^\d{12}$/;

/**
 * Regular expression pattern for IAM Role ARN validation.
 * Format: arn:aws:iam::<account-id>:role/<role-name>
 * Role name: 1-64 characters, alphanumeric plus +=,.@_-
 */
const IAM_ROLE_ARN_PATTERN = /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]{1,64}$/;

/**
 * Regular expression pattern for IAM User ARN validation.
 * Format: arn:aws:iam::<account-id>:user/<user-name>
 * User name: alphanumeric plus +=,.@_-
 */
const IAM_USER_ARN_PATTERN = /^arn:aws:iam::\d{12}:user\/[\w+=,.@-]+$/;

/**
 * Checks if a value is a valid AWS Account ID.
 *
 * AWS Account IDs must be exactly 12 digits (0-9).
 *
 * @param value - The value to validate
 * @returns true if the value is a valid AWS Account ID, false otherwise
 *
 * @example
 * ```typescript
 * isValidAWSAccountId('123456789012'); // true
 * isValidAWSAccountId('000000000000'); // true
 * isValidAWSAccountId('12345678901');  // false (11 digits)
 * isValidAWSAccountId('1234567890123'); // false (13 digits)
 * isValidAWSAccountId('12345678901a'); // false (contains non-digit)
 * isValidAWSAccountId('');             // false
 * ```
 */
export function isValidAWSAccountId(value: string): boolean {
  return AWS_ACCOUNT_ID_PATTERN.test(value);
}

/**
 * Checks if a value is a valid IAM Role ARN.
 *
 * IAM Role ARNs follow the format: arn:aws:iam::<account-id>:role/<role-name>
 * - Account ID: exactly 12 digits
 * - Role name: 1-64 characters, alphanumeric plus +=,.@_-
 *
 * @param value - The value to validate
 * @returns true if the value is a valid IAM Role ARN, false otherwise
 *
 * @example
 * ```typescript
 * isValidIAMRoleArn('arn:aws:iam::123456789012:role/MyRole'); // true
 * isValidIAMRoleArn('arn:aws:iam::123456789012:role/my-role_name'); // true
 * isValidIAMRoleArn('arn:aws:iam::123456789012:user/MyUser'); // false (wrong type)
 * isValidIAMRoleArn('invalid'); // false
 * ```
 */
export function isValidIAMRoleArn(value: string): boolean {
  return IAM_ROLE_ARN_PATTERN.test(value);
}

/**
 * Checks if a value is a valid IAM User ARN.
 *
 * IAM User ARNs follow the format: arn:aws:iam::<account-id>:user/<user-name>
 * - Account ID: exactly 12 digits
 * - User name: alphanumeric plus +=,.@_-
 *
 * @param value - The value to validate
 * @returns true if the value is a valid IAM User ARN, false otherwise
 *
 * @example
 * ```typescript
 * isValidIAMUserArn('arn:aws:iam::123456789012:user/MyUser'); // true
 * isValidIAMUserArn('arn:aws:iam::123456789012:user/my-user_name'); // true
 * isValidIAMUserArn('arn:aws:iam::123456789012:role/MyRole'); // false (wrong type)
 * isValidIAMUserArn('invalid'); // false
 * ```
 */
export function isValidIAMUserArn(value: string): boolean {
  return IAM_USER_ARN_PATTERN.test(value);
}

/**
 * Extracts the AWS account ID from an IAM ARN.
 *
 * Works with both IAM Role ARNs and IAM User ARNs.
 * Returns undefined if the ARN format is invalid.
 *
 * @param value - The IAM ARN to extract account ID from
 * @returns The 12-digit account ID, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractAccountIdFromIAMArn('arn:aws:iam::123456789012:role/MyRole'); // '123456789012'
 * extractAccountIdFromIAMArn('arn:aws:iam::123456789012:user/MyUser'); // '123456789012'
 * extractAccountIdFromIAMArn('invalid'); // undefined
 * ```
 */
export function extractAccountIdFromIAMArn(value: string): string | undefined {
  // IAM ARN format: arn:aws:iam::<account-id>:role/<name> or arn:aws:iam::<account-id>:user/<name>
  const parts = value.split(':');
  if (parts.length >= 5 && parts[0] === 'arn' && parts[1] === 'aws' && parts[2] === 'iam') {
    const accountId = parts[4];
    if (AWS_ACCOUNT_ID_PATTERN.test(accountId)) {
      return accountId;
    }
  }
  return undefined;
}

/**
 * Extracts the AWS region from an IAM ARN.
 *
 * IAM is a global service, so IAM ARNs do not contain a region.
 * This function always returns undefined for IAM ARNs.
 *
 * @param _value - The IAM ARN (unused, as IAM ARNs have no region)
 * @returns Always undefined, as IAM is a global service
 *
 * @example
 * ```typescript
 * extractRegionFromIAMArn('arn:aws:iam::123456789012:role/MyRole'); // undefined
 * extractRegionFromIAMArn('arn:aws:iam::123456789012:user/MyUser'); // undefined
 * ```
 */
export function extractRegionFromIAMArn(_value: string): string | undefined {
  // IAM is a global service, so IAM ARNs do not contain a region
  // The region field in IAM ARNs is always empty: arn:aws:iam::<account-id>:...
  return undefined;
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

/**
 * Regular expression pattern for IP address format.
 * Used to reject S3 bucket names that look like IP addresses.
 */
const IP_ADDRESS_PATTERN = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/**
 * Validates an S3 bucket name against AWS naming rules.
 *
 * S3 bucket names must follow these rules:
 * - Be 3-63 characters long
 * - Contain only lowercase letters, numbers, and hyphens
 * - Must not start or end with a hyphen
 * - Must not contain consecutive hyphens
 * - Must not be formatted as an IP address (e.g., 192.168.1.1)
 * - Must not start with "xn--" (reserved for IDN)
 * - Must not end with "-s3alias" or "--ol-s3" (reserved suffixes)
 *
 * @param value - The bucket name to validate
 * @returns true if the bucket name is valid, false otherwise
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
 *
 * @example
 * ```typescript
 * isValidS3BucketName('my-bucket');           // true
 * isValidS3BucketName('my-bucket-123');       // true
 * isValidS3BucketName('mybucket');            // true
 * isValidS3BucketName('ab');                  // false (too short)
 * isValidS3BucketName('-my-bucket');          // false (starts with hyphen)
 * isValidS3BucketName('my-bucket-');          // false (ends with hyphen)
 * isValidS3BucketName('my--bucket');          // false (consecutive hyphens)
 * isValidS3BucketName('192.168.1.1');         // false (IP address format)
 * isValidS3BucketName('xn--bucket');          // false (reserved prefix)
 * isValidS3BucketName('bucket-s3alias');      // false (reserved suffix)
 * isValidS3BucketName('bucket--ol-s3');       // false (reserved suffix)
 * isValidS3BucketName('My-Bucket');           // false (uppercase)
 * ```
 */
export function isValidS3BucketName(value: string): boolean {
  // Length: 3-63 characters
  if (value.length < 3 || value.length > 63) {
    return false;
  }

  // Only lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(value)) {
    return false;
  }

  // Must not start or end with hyphen
  if (value.startsWith('-') || value.endsWith('-')) {
    return false;
  }

  // Must not contain consecutive hyphens
  if (value.includes('--')) {
    return false;
  }

  // Must not be formatted as IP address
  if (IP_ADDRESS_PATTERN.test(value)) {
    return false;
  }

  // Must not start with xn--
  if (value.startsWith('xn--')) {
    return false;
  }

  // Must not end with -s3alias or --ol-s3
  if (value.endsWith('-s3alias') || value.endsWith('--ol-s3')) {
    return false;
  }

  return true;
}

/**
 * Regular expression pattern for S3 ARN validation.
 *
 * S3 ARNs can be either:
 * - Bucket ARN: arn:aws:s3:::<bucket-name>
 * - Object ARN: arn:aws:s3:::<bucket-name>/<object-key>
 *
 * Note: S3 ARNs do not contain region or account ID (they are global resources).
 * The bucket name portion must follow S3 bucket naming rules.
 */
const S3_ARN_PATTERN = /^arn:aws:s3:::[a-z0-9][a-z0-9.-]{1,61}[a-z0-9](\/.*)?$/;

/**
 * Validates an S3 ARN (bucket or object ARN).
 *
 * S3 ARNs follow these formats:
 * - Bucket ARN: arn:aws:s3:::<bucket-name>
 * - Object ARN: arn:aws:s3:::<bucket-name>/<object-key>
 *
 * The bucket name portion must be a valid S3 bucket name (3-63 characters,
 * lowercase letters, numbers, hyphens, and periods).
 *
 * Note: S3 is a global service, so S3 ARNs do not contain region or account ID.
 *
 * @param value - The S3 ARN to validate
 * @returns true if the value is a valid S3 ARN, false otherwise
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-arn-format.html
 *
 * @example
 * ```typescript
 * // Bucket ARNs
 * isValidS3Arn('arn:aws:s3:::my-bucket');           // true
 * isValidS3Arn('arn:aws:s3:::my-bucket-123');       // true
 *
 * // Object ARNs
 * isValidS3Arn('arn:aws:s3:::my-bucket/my-object'); // true
 * isValidS3Arn('arn:aws:s3:::my-bucket/path/to/object.txt'); // true
 *
 * // Invalid ARNs
 * isValidS3Arn('arn:aws:s3:::ab');                  // false (bucket name too short)
 * isValidS3Arn('arn:aws:s3:::-my-bucket');          // false (bucket starts with hyphen)
 * isValidS3Arn('arn:aws:dynamodb:::my-bucket');     // false (wrong service)
 * isValidS3Arn('my-bucket');                        // false (not an ARN)
 * ```
 */
export function isValidS3Arn(value: string): boolean {
  return S3_ARN_PATTERN.test(value);
}
