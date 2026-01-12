/**
 * Validation functions for environment variable schema validation.
 */

import type {
  AWSValidationType,
  ValidationScope,
} from '../aws/aws-validation-types';
import {
  AWS_REGIONS,
  isValidApiGatewayId,
  isValidAWSAccountId,
  isValidAWSRegion,
  isValidCloudFrontDistId,
  isValidDynamoDBTableArn,
  isValidDynamoDBTableName,
  isValidEc2InstanceId,
  isValidEventBusName,
  isValidIAMRoleArn,
  isValidIAMUserArn,
  isValidKMSKeyArn,
  isValidKMSKeyId,
  isValidLambdaFunctionName,
  isValidRDSClusterId,
  isValidRDSEndpoint,
  isValidS3Arn,
  isValidS3BucketName,
  isValidSecretsManagerArn,
  isValidSecurityGroupId,
  isValidSNSTopicArn,
  isValidSQSQueueArn,
  isValidSQSQueueUrl,
  isValidSSMParameterName,
  isValidSubnetId,
  isValidVpcId,
  validateScope,
} from '../aws/aws-validation-types';
import type { ValidationError } from '../share/errors';
import type { SchemaItem } from '../share/types';

/**
 * Formats a value for display in error messages.
 * Masks secret values with "***" to prevent sensitive data exposure in logs.
 *
 * @param value - The value to format
 * @param isSecret - Whether the value should be masked
 * @returns A formatted string representation of the value
 *
 * @example
 * ```typescript
 * // Non-secret string value
 * formatValue('my-api-key', false);
 * // '"my-api-key"'
 *
 * // Secret value - masked
 * formatValue('my-api-key', true);
 * // '***'
 *
 * // Undefined value
 * formatValue(undefined, false);
 * // 'undefined'
 *
 * // Number value
 * formatValue(3000, false);
 * // '3000'
 * ```
 */
export function formatValue(value: unknown, isSecret: boolean): string {
  if (isSecret) {
    return '***';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return String(value);
}

/**
 * Result of checking if a value is required.
 * Contains either a validation error or indicates the check passed.
 */
export type RequiredCheckResult =
  | { valid: true }
  | { valid: false; error: ValidationError };

/**
 * Checks if a required environment variable is set.
 * A variable is considered required if `required: true` is set AND no default value exists.
 *
 * @param key - The environment variable name
 * @param schema - The schema item for this variable
 * @param value - The environment variable value (may be undefined)
 * @returns RequiredCheckResult indicating if the check passed
 *
 * @example
 * ```typescript
 * // Required variable not set - returns error
 * checkRequired('API_KEY', { type: 'string', required: true }, undefined);
 * // { valid: false, error: { key: 'API_KEY', message: 'Required but not set' } }
 *
 * // Required variable with default - passes (default will be applied)
 * checkRequired('PORT', { type: 'number', required: true, default: 3000 }, undefined);
 * // { valid: true }
 *
 * // Required variable is set - passes
 * checkRequired('API_KEY', { type: 'string', required: true }, 'secret');
 * // { valid: true }
 * ```
 */
export function checkRequired(
  key: string,
  schema: SchemaItem,
  value: string | undefined
): RequiredCheckResult {
  // If value is set, no need to check required
  if (value !== undefined) {
    return { valid: true };
  }

  // If there's a default value, the variable is effectively not required
  if ('default' in schema && schema.default !== undefined) {
    return { valid: true };
  }

  // If required: true and no default, this is an error
  if (schema.required === true) {
    return {
      valid: false,
      error: {
        key,
        message: 'Required but not set',
      },
    };
  }

  // Not required and no default - will be undefined, which is valid
  return { valid: true };
}

/**
 * Result of applying a default value.
 * Contains the value to use (either the original or the default).
 */
export type ApplyDefaultResult<T> =
  | { hasValue: true; value: T }
  | { hasValue: false };

/**
 * Applies a default value if the environment variable is not set.
 *
 * @param schema - The schema item for this variable
 * @param value - The environment variable value (may be undefined)
 * @returns ApplyDefaultResult with the value to use
 *
 * @example
 * ```typescript
 * // Value is set - returns original value
 * applyDefault({ type: 'number', default: 3000 }, '8080');
 * // { hasValue: true, value: '8080' }
 *
 * // Value not set, has default - returns default
 * applyDefault({ type: 'number', default: 3000 }, undefined);
 * // { hasValue: true, value: 3000 }
 *
 * // Value not set, no default - returns no value
 * applyDefault({ type: 'string' }, undefined);
 * // { hasValue: false }
 * ```
 */
export function applyDefault<T>(
  schema: SchemaItem,
  value: string | undefined
): ApplyDefaultResult<string | T> {
  // If value is set, use it
  if (value !== undefined) {
    return { hasValue: true, value };
  }

  // If there's a default value, use it
  if ('default' in schema && schema.default !== undefined) {
    return { hasValue: true, value: schema.default as T };
  }

  // No value and no default
  return { hasValue: false };
}

/**
 * Result of checking if a value is in the allowed enum values.
 */
export type EnumCheckResult =
  | { valid: true }
  | { valid: false; error: ValidationError };

/**
 * Checks if a value is in the allowed enum values.
 * Only applies to string schemas with an enum defined.
 *
 * @param key - The environment variable name
 * @param schema - The schema item for this variable
 * @param value - The coerced value to check
 * @returns EnumCheckResult indicating if the check passed
 *
 * @example
 * ```typescript
 * // Value is in enum - passes
 * checkEnum('NODE_ENV', { type: 'string', enum: ['development', 'production'] }, 'development');
 * // { valid: true }
 *
 * // Value is not in enum - returns error
 * checkEnum('NODE_ENV', { type: 'string', enum: ['development', 'production'] }, 'staging');
 * // { valid: false, error: { key: 'NODE_ENV', message: 'Must be one of ...', ... } }
 *
 * // No enum defined - passes
 * checkEnum('API_KEY', { type: 'string' }, 'any-value');
 * // { valid: true }
 * ```
 */
export function checkEnum(
  key: string,
  schema: SchemaItem,
  value: unknown
): EnumCheckResult {
  // Only string schemas can have enum
  if (schema.type !== 'string') {
    return { valid: true };
  }

  // If no enum defined, skip check
  if (!schema.enum || schema.enum.length === 0) {
    return { valid: true };
  }

  // Check if value is in the enum list
  if (schema.enum.includes(value as string)) {
    return { valid: true };
  }

  // Value not in enum - return error
  const allowedValues = schema.enum.map((v) => `"${v}"`).join(', ');
  return {
    valid: false,
    error: {
      key,
      message: `Must be one of [${allowedValues}], got "${value}"`,
      expected: `one of [${allowedValues}]`,
      received: String(value),
    },
  };
}

/**
 * Result of checking constraints on a value.
 */
export type ConstraintCheckResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

/**
 * Checks if a value satisfies the constraints defined in the schema.
 * Supports min/max for numbers, pattern/minLength/maxLength for strings,
 * and minLength/maxLength for arrays.
 *
 * @param key - The environment variable name
 * @param schema - The schema item for this variable
 * @param value - The coerced value to check
 * @returns ConstraintCheckResult indicating if all constraints passed
 *
 * @example
 * ```typescript
 * // Number within range - passes
 * checkConstraints('PORT', { type: 'number', min: 1, max: 65535 }, 3000);
 * // { valid: true }
 *
 * // Number below min - returns error
 * checkConstraints('PORT', { type: 'number', min: 1 }, 0);
 * // { valid: false, errors: [{ key: 'PORT', message: 'Must be at least 1, got 0' }] }
 *
 * // String matching pattern - passes
 * checkConstraints('EMAIL', { type: 'string', pattern: /@/ }, 'test@example.com');
 * // { valid: true }
 *
 * // Array length within bounds - passes
 * checkConstraints('TAGS', { type: 'array', itemType: 'string', minLength: 1 }, ['a', 'b']);
 * // { valid: true }
 * ```
 */
export function checkConstraints(
  key: string,
  schema: SchemaItem,
  value: unknown
): ConstraintCheckResult {
  const errors: ValidationError[] = [];

  // Number constraints: min, max
  if (schema.type === 'number' && typeof value === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        key,
        message: `Must be at least ${schema.min}, got ${value}`,
        expected: `>= ${schema.min}`,
        received: String(value),
      });
    }

    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        key,
        message: `Must be at most ${schema.max}, got ${value}`,
        expected: `<= ${schema.max}`,
        received: String(value),
      });
    }
  }

  // String constraints: pattern, minLength, maxLength
  if (schema.type === 'string' && typeof value === 'string') {
    if (schema.pattern !== undefined && !schema.pattern.test(value)) {
      errors.push({
        key,
        message: `Must match pattern ${schema.pattern}, got "${value}"`,
        expected: `match ${schema.pattern}`,
        received: value,
      });
    }

    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        key,
        message: `Must have at least ${schema.minLength} characters, got ${value.length}`,
        expected: `length >= ${schema.minLength}`,
        received: String(value.length),
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        key,
        message: `Must have at most ${schema.maxLength} characters, got ${value.length}`,
        expected: `length <= ${schema.maxLength}`,
        received: String(value.length),
      });
    }
  }

  // Array constraints: minLength, maxLength
  if (schema.type === 'array' && Array.isArray(value)) {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        key,
        message: `Must have at least ${schema.minLength} items, got ${value.length}`,
        expected: `length >= ${schema.minLength}`,
        received: String(value.length),
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        key,
        message: `Must have at most ${schema.maxLength} items, got ${value.length}`,
        expected: `length <= ${schema.maxLength}`,
        received: String(value.length),
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Descriptions for AWS validation types used in error messages.
 */
export const AWS_VALIDATION_DESCRIPTIONS: Record<AWSValidationType, string> = {
  'aws-region': `Must be a valid AWS region (e.g., ${AWS_REGIONS.slice(0, 3).join(', ')})`,
  'aws-account-id': 'Must be exactly 12 digits',
  'iam-role-arn':
    'Must be a valid IAM Role ARN (arn:aws:iam::<account-id>:role/<role-name>)',
  'iam-user-arn':
    'Must be a valid IAM User ARN (arn:aws:iam::<account-id>:user/<user-name>)',
  'access-key-id': 'Must start with AKIA or ASIA and be exactly 20 characters',
  'secret-access-key':
    'Must be exactly 40 characters containing alphanumeric, +, /, and =',
  's3-bucket-name': 'Must be 3-63 lowercase letters, numbers, and hyphens',
  's3-arn':
    'Must be a valid S3 ARN (arn:aws:s3:::<bucket-name>[/<object-key>])',
  'dynamodb-table-name':
    'Must be 3-255 characters containing alphanumeric, _, -, and .',
  'dynamodb-table-arn':
    'Must be a valid DynamoDB table ARN (arn:aws:dynamodb:<region>:<account-id>:table/<table-name>)',
  'rds-endpoint':
    'Must be a valid RDS endpoint (<identifier>.<random>.<region>.rds.amazonaws.com)',
  'rds-cluster-id':
    'Must be 1-63 characters, start with a letter, contain alphanumeric and hyphens',
  'lambda-function-name':
    'Must be 1-64 characters containing alphanumeric, -, and _',
  'sqs-queue-url':
    'Must be a valid SQS queue URL (https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>)',
  'sqs-queue-arn':
    'Must be a valid SQS queue ARN (arn:aws:sqs:<region>:<account-id>:<queue-name>)',
  'sns-topic-arn':
    'Must be a valid SNS topic ARN (arn:aws:sns:<region>:<account-id>:<topic-name>)',
  'event-bus-name':
    'Must be "default" or 1-256 characters containing alphanumeric, -, _, ., and /',
  'api-gateway-id': 'Must be exactly 10 lowercase alphanumeric characters',
  'vpc-id': 'Must be vpc- followed by 8 or 17 hexadecimal characters',
  'subnet-id': 'Must be subnet- followed by 8 or 17 hexadecimal characters',
  'security-group-id': 'Must be sg- followed by 8 or 17 hexadecimal characters',
  'ec2-instance-id': 'Must be i- followed by 8 or 17 hexadecimal characters',
  'cloudfront-dist-id': 'Must be 13-14 uppercase alphanumeric characters',
  'kms-key-id': 'Must be a valid UUID (8-4-4-4-12 hexadecimal)',
  'kms-key-arn':
    'Must be a valid KMS Key ARN (arn:aws:kms:<region>:<account-id>:key/<key-id>)',
  'secrets-manager-arn':
    'Must be a valid Secrets Manager ARN (arn:aws:secretsmanager:<region>:<account-id>:secret:<name>-<random>)',
  'ssm-parameter-name':
    'Must start with / and contain alphanumeric, -, _, ., and /',
};

/**
 * Formats an AWS validation error message.
 *
 * Creates a standardized error object for AWS validation failures that includes:
 * - The validation type name (e.g., "aws-region", "s3-bucket-name")
 * - A description of the expected format
 * - The received value (masked if secret)
 *
 * @param key - The environment variable name
 * @param validationType - The AWS validation type that failed
 * @param value - The invalid value
 * @param isSecret - Whether the value should be masked in error messages
 * @returns A ValidationError object with formatted message
 *
 * @example
 * ```typescript
 * // Non-secret value
 * formatAWSValidationError('AWS_REGION', 'aws-region', 'invalid-region', false);
 * // {
 * //   key: 'AWS_REGION',
 * //   message: 'Invalid aws-region: "invalid-region". Must be a valid AWS region (e.g., ap-northeast-1, ap-northeast-2, ap-northeast-3)',
 * //   expected: 'Must be a valid AWS region (e.g., ap-northeast-1, ap-northeast-2, ap-northeast-3)',
 * //   received: 'invalid-region'
 * // }
 *
 * // Secret value - masked
 * formatAWSValidationError('SECRET_KEY', 'secret-access-key', 'invalid', true);
 * // {
 * //   key: 'SECRET_KEY',
 * //   message: 'Invalid secret-access-key: ***. Must be exactly 40 characters containing alphanumeric, +, /, and =',
 * //   expected: 'Must be exactly 40 characters containing alphanumeric, +, /, and =',
 * //   received: '***'
 * // }
 * ```
 */
export function formatAWSValidationError(
  key: string,
  validationType: AWSValidationType,
  value: string,
  isSecret: boolean
): ValidationError {
  const displayValue = isSecret ? '***' : `"${value}"`;
  const description = AWS_VALIDATION_DESCRIPTIONS[validationType];

  return {
    key,
    message: `Invalid ${validationType}: ${displayValue}. ${description}`,
    expected: description,
    received: isSecret ? '***' : value,
  };
}

/**
 * Validates a value against an AWS validation type.
 *
 * @param value - The value to validate
 * @param validationType - The AWS validation type to use
 * @returns true if the value is valid, false otherwise
 */
function validateAWSType(
  value: string,
  validationType: AWSValidationType
): boolean {
  switch (validationType) {
    case 'aws-region':
      return isValidAWSRegion(value);
    case 'aws-account-id':
      return isValidAWSAccountId(value);
    case 'iam-role-arn':
      return isValidIAMRoleArn(value);
    case 'iam-user-arn':
      return isValidIAMUserArn(value);
    case 'access-key-id':
      return /^(AKIA|ASIA)[A-Z0-9]{16}$/.test(value);
    case 'secret-access-key':
      return /^[A-Za-z0-9+/=]{40}$/.test(value);
    case 's3-bucket-name':
      return isValidS3BucketName(value);
    case 's3-arn':
      return isValidS3Arn(value);
    case 'dynamodb-table-name':
      return isValidDynamoDBTableName(value);
    case 'dynamodb-table-arn':
      return isValidDynamoDBTableArn(value);
    case 'rds-endpoint':
      return isValidRDSEndpoint(value);
    case 'rds-cluster-id':
      return isValidRDSClusterId(value);
    case 'lambda-function-name':
      return isValidLambdaFunctionName(value);
    case 'sqs-queue-url':
      return isValidSQSQueueUrl(value);
    case 'sqs-queue-arn':
      return isValidSQSQueueArn(value);
    case 'sns-topic-arn':
      return isValidSNSTopicArn(value);
    case 'event-bus-name':
      return isValidEventBusName(value);
    case 'api-gateway-id':
      return isValidApiGatewayId(value);
    case 'vpc-id':
      return isValidVpcId(value);
    case 'subnet-id':
      return isValidSubnetId(value);
    case 'security-group-id':
      return isValidSecurityGroupId(value);
    case 'ec2-instance-id':
      return isValidEc2InstanceId(value);
    case 'cloudfront-dist-id':
      return isValidCloudFrontDistId(value);
    case 'kms-key-id':
      return isValidKMSKeyId(value);
    case 'kms-key-arn':
      return isValidKMSKeyArn(value);
    case 'secrets-manager-arn':
      return isValidSecretsManagerArn(value);
    case 'ssm-parameter-name':
      return isValidSSMParameterName(value);
    default:
      return true;
  }
}

/**
 * Result of checking AWS validation on a value.
 */
export type AWSValidationCheckResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

/**
 * Checks if a value passes AWS-specific validation.
 *
 * This function validates the value against the specified AWS validation type
 * and optionally checks scope (region/accountId) for ARN-based types.
 *
 * @param key - The environment variable name
 * @param value - The value to validate
 * @param validationType - The AWS validation type
 * @param scope - Optional scope configuration for ARN validation
 * @param isSecret - Whether the value should be masked in error messages
 * @returns AWSValidationCheckResult indicating if the check passed
 *
 * @example
 * ```typescript
 * // Valid AWS region
 * checkAWSValidation('AWS_REGION', 'us-east-1', 'aws-region');
 * // { valid: true }
 *
 * // Invalid AWS region
 * checkAWSValidation('AWS_REGION', 'invalid-region', 'aws-region');
 * // { valid: false, errors: [{ key: 'AWS_REGION', message: 'Invalid aws-region: ...' }] }
 *
 * // Valid DynamoDB ARN with scope check
 * checkAWSValidation(
 *   'TABLE_ARN',
 *   'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable',
 *   'dynamodb-table-arn',
 *   { region: 'us-east-1' }
 * );
 * // { valid: true }
 * ```
 */
export function checkAWSValidation(
  key: string,
  value: string,
  validationType: AWSValidationType,
  scope?: ValidationScope,
  isSecret?: boolean
): AWSValidationCheckResult {
  const errors: ValidationError[] = [];

  // Step 1: Validate the format
  const isValid = validateAWSType(value, validationType);
  if (!isValid) {
    errors.push(
      formatAWSValidationError(key, validationType, value, isSecret ?? false)
    );
    return { valid: false, errors };
  }

  // Step 2: Validate scope if provided
  if (scope) {
    const scopeResult = validateScope(key, value, validationType, scope);
    if (!scopeResult.valid) {
      errors.push(...scopeResult.errors);
      return { valid: false, errors };
    }
  }

  return { valid: true };
}
