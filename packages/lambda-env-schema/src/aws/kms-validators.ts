/**
 * KMS (Key Management Service) validators.
 */

/**
 * Regular expression pattern for KMS Key ID validation (UUID format).
 *
 * KMS Key IDs are UUIDs in the format: 8-4-4-4-12 hexadecimal characters
 * Example: 12345678-1234-1234-1234-123456789012
 */
const KMS_KEY_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Regular expression pattern for KMS Key ARN validation.
 *
 * Format: arn:aws:kms:<region>:<account-id>:key/<key-id>
 * - Region: AWS region code (e.g., us-east-1, ap-northeast-1)
 * - Account ID: 12-digit AWS account ID
 * - Key ID: UUID format (8-4-4-4-12 hexadecimal)
 */
const KMS_KEY_ARN_PATTERN =
  /^arn:aws:kms:[a-z]{2}-[a-z]+-\d:\d{12}:key\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates a KMS Key ID (UUID format).
 *
 * KMS Key IDs are UUIDs in the format: 8-4-4-4-12 hexadecimal characters
 *
 * @param value - The KMS Key ID to validate
 * @returns true if the value is a valid KMS Key ID, false otherwise
 *
 * @example
 * ```typescript
 * isValidKMSKeyId('12345678-1234-1234-1234-123456789012'); // true
 * isValidKMSKeyId('abcdef12-3456-7890-abcd-ef1234567890'); // true
 * isValidKMSKeyId('invalid-uuid'); // false
 * isValidKMSKeyId('12345678123412341234123456789012'); // false (no hyphens)
 * ```
 */
export function isValidKMSKeyId(value: string): boolean {
  return KMS_KEY_ID_PATTERN.test(value);
}

/**
 * Validates a KMS Key ARN.
 *
 * KMS Key ARNs follow the format:
 * arn:aws:kms:<region>:<account-id>:key/<key-id>
 *
 * @param value - The KMS Key ARN to validate
 * @returns true if the value is a valid KMS Key ARN, false otherwise
 *
 * @example
 * ```typescript
 * isValidKMSKeyArn('arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'); // true
 * isValidKMSKeyArn('arn:aws:kms:ap-northeast-1:123456789012:key/abcdef12-3456-7890-abcd-ef1234567890'); // true
 * isValidKMSKeyArn('arn:aws:kms:us-east-1:123456789012:alias/my-key'); // false (alias, not key)
 * isValidKMSKeyArn('invalid'); // false
 * ```
 */
export function isValidKMSKeyArn(value: string): boolean {
  return KMS_KEY_ARN_PATTERN.test(value);
}

/**
 * Extracts the AWS region from a KMS Key ARN.
 *
 * @param value - The KMS Key ARN to extract region from
 * @returns The region code, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractRegionFromKMSKeyArn('arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'); // 'us-east-1'
 * extractRegionFromKMSKeyArn('arn:aws:kms:ap-northeast-1:123456789012:key/12345678-1234-1234-1234-123456789012'); // 'ap-northeast-1'
 * extractRegionFromKMSKeyArn('invalid'); // undefined
 * ```
 */
export function extractRegionFromKMSKeyArn(value: string): string | undefined {
  // KMS Key ARN format: arn:aws:kms:<region>:<account-id>:key/<key-id>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'kms'
  ) {
    const region = parts[3];
    // Basic region format check: xx-xxxx-N
    if (/^[a-z]{2}-[a-z]+-\d$/.test(region)) {
      return region;
    }
  }
  return undefined;
}

/**
 * Extracts the AWS account ID from a KMS Key ARN.
 *
 * @param value - The KMS Key ARN to extract account ID from
 * @returns The 12-digit account ID, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractAccountIdFromKMSKeyArn('arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'); // '123456789012'
 * extractAccountIdFromKMSKeyArn('invalid'); // undefined
 * ```
 */
export function extractAccountIdFromKMSKeyArn(
  value: string
): string | undefined {
  // KMS Key ARN format: arn:aws:kms:<region>:<account-id>:key/<key-id>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'kms'
  ) {
    const accountId = parts[4];
    if (/^\d{12}$/.test(accountId)) {
      return accountId;
    }
  }
  return undefined;
}
