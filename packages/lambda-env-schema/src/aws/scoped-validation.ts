/**
 * Scoped validation for AWS ARN values.
 *
 * Validates that ARN values match expected region and/or account ID,
 * preventing cross-environment misconfigurations.
 */

import type { ValidationError } from '../share/errors';
import type {
  AWSValidationType,
  ValidationScope,
} from './aws-validation-types';

/**
 * Formats a scope validation error message.
 *
 * @param scopeType - The type of scope ('region' or 'accountId')
 * @param expected - The expected value
 * @param actual - The actual value found in the ARN
 * @returns A formatted error message string
 *
 * @example
 * ```typescript
 * formatScopeError('region', 'ap-northeast-1', 'us-west-2');
 * // 'Region mismatch: expected "ap-northeast-1", got "us-west-2"'
 *
 * formatScopeError('accountId', '123456789012', '987654321098');
 * // 'Account ID mismatch: expected "123456789012", got "987654321098"'
 * ```
 */
export function formatScopeError(
  scopeType: 'region' | 'accountId',
  expected: string,
  actual: string
): string {
  const label = scopeType === 'region' ? 'Region' : 'Account ID';
  return `${label} mismatch: expected "${expected}", got "${actual}"`;
}

import {
  extractAccountIdFromDynamoDBArn,
  extractAccountIdFromIAMArn,
  extractAccountIdFromKMSKeyArn,
  extractAccountIdFromSecretsManagerArn,
  extractAccountIdFromSNSTopicArn,
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromDynamoDBArn,
  extractRegionFromKMSKeyArn,
  extractRegionFromRDSEndpoint,
  extractRegionFromSecretsManagerArn,
  extractRegionFromSNSTopicArn,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
} from './aws-validation-types';

/**
 * Configuration for scope extraction functions per validation type.
 */
interface ScopeExtractors {
  extractRegion?: (value: string) => string | undefined;
  extractAccountId?: (value: string) => string | undefined;
}

/**
 * Map of validation types to their scope extraction functions.
 * Only types that support scoped validation are included.
 */
const SCOPE_EXTRACTORS: Partial<Record<AWSValidationType, ScopeExtractors>> = {
  // IAM ARNs - global service, no region but has account ID
  'iam-role-arn': {
    extractAccountId: extractAccountIdFromIAMArn,
  },
  'iam-user-arn': {
    extractAccountId: extractAccountIdFromIAMArn,
  },
  // DynamoDB ARNs
  'dynamodb-table-arn': {
    extractRegion: extractRegionFromDynamoDBArn,
    extractAccountId: extractAccountIdFromDynamoDBArn,
  },
  // RDS - endpoint has region
  'rds-endpoint': {
    extractRegion: extractRegionFromRDSEndpoint,
  },
  // SQS
  'sqs-queue-url': {
    extractRegion: extractRegionFromSQSQueueUrl,
    extractAccountId: extractAccountIdFromSQSQueueUrl,
  },
  'sqs-queue-arn': {
    extractRegion: extractRegionFromSQSQueueArn,
    extractAccountId: extractAccountIdFromSQSQueueArn,
  },
  // SNS
  'sns-topic-arn': {
    extractRegion: extractRegionFromSNSTopicArn,
    extractAccountId: extractAccountIdFromSNSTopicArn,
  },
  // KMS
  'kms-key-arn': {
    extractRegion: extractRegionFromKMSKeyArn,
    extractAccountId: extractAccountIdFromKMSKeyArn,
  },
  // Secrets Manager
  'secrets-manager-arn': {
    extractRegion: extractRegionFromSecretsManagerArn,
    extractAccountId: extractAccountIdFromSecretsManagerArn,
  },
};

/**
 * Checks if a validation type supports scoped validation.
 *
 * @param validationType - The AWS validation type to check
 * @returns true if the validation type supports scope validation
 *
 * @example
 * ```typescript
 * supportsScope('dynamodb-table-arn'); // true
 * supportsScope('s3-bucket-name');     // false
 * supportsScope('iam-role-arn');       // true (account ID only)
 * ```
 */
export function supportsScope(validationType: AWSValidationType): boolean {
  return validationType in SCOPE_EXTRACTORS;
}

/**
 * Result of scope validation.
 */
export type ScopeValidationResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

/**
 * Validates that an ARN value matches the expected scope (region and/or account ID).
 *
 * This function extracts the region and account ID from the ARN value and compares
 * them against the expected values in the scope configuration. If there's a mismatch,
 * validation errors are returned with both expected and actual values.
 *
 * For validation types that don't support scoped validation (e.g., s3-bucket-name),
 * this function returns valid without performing any checks.
 *
 * @param key - The environment variable name (for error messages)
 * @param value - The ARN value to validate
 * @param validationType - The AWS validation type
 * @param scope - The expected scope configuration
 * @returns ScopeValidationResult indicating if validation passed
 *
 * @example
 * ```typescript
 * // Valid - region matches
 * validateScope(
 *   'TABLE_ARN',
 *   'arn:aws:dynamodb:ap-northeast-1:123456789012:table/MyTable',
 *   'dynamodb-table-arn',
 *   { region: 'ap-northeast-1' }
 * );
 * // { valid: true }
 *
 * // Invalid - region mismatch
 * validateScope(
 *   'TABLE_ARN',
 *   'arn:aws:dynamodb:us-west-2:123456789012:table/MyTable',
 *   'dynamodb-table-arn',
 *   { region: 'ap-northeast-1' }
 * );
 * // { valid: false, errors: [{ key: 'TABLE_ARN', message: 'Region mismatch: expected "ap-northeast-1", got "us-west-2"', ... }] }
 *
 * // Ignored - validation type doesn't support scope
 * validateScope(
 *   'BUCKET_NAME',
 *   'my-bucket',
 *   's3-bucket-name',
 *   { region: 'ap-northeast-1' }
 * );
 * // { valid: true }
 * ```
 */
export function validateScope(
  key: string,
  value: string,
  validationType: AWSValidationType,
  scope: ValidationScope
): ScopeValidationResult {
  const errors: ValidationError[] = [];

  // Get extractors for this validation type
  const extractors = SCOPE_EXTRACTORS[validationType];

  // If validation type doesn't support scope, return valid (ignore scope)
  if (!extractors) {
    return { valid: true };
  }

  // Check region if expected and extractor exists
  if (scope.region !== undefined && extractors.extractRegion) {
    const actualRegion = extractors.extractRegion(value);
    if (actualRegion !== undefined && actualRegion !== scope.region) {
      errors.push({
        key,
        message: formatScopeError('region', scope.region, actualRegion),
        expected: scope.region,
        received: actualRegion,
      });
    }
  }

  // Check account ID if expected and extractor exists
  if (scope.accountId !== undefined && extractors.extractAccountId) {
    const actualAccountId = extractors.extractAccountId(value);
    if (actualAccountId !== undefined && actualAccountId !== scope.accountId) {
      errors.push({
        key,
        message: formatScopeError(
          'accountId',
          scope.accountId,
          actualAccountId
        ),
        expected: scope.accountId,
        received: actualAccountId,
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
