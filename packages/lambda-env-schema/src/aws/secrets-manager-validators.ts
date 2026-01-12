/**
 * Secrets Manager validators.
 */

/**
 * Regular expression pattern for Secrets Manager ARN validation.
 *
 * Format: arn:aws:secretsmanager:<region>:<account-id>:secret:<secret-name>-<random>
 * - Region: AWS region code (e.g., us-east-1, ap-northeast-1)
 * - Account ID: 12-digit AWS account ID
 * - Secret name: alphanumeric, hyphens, underscores, periods, forward slashes, plus, equals, at
 * - Random suffix: 6 alphanumeric characters
 *
 * @see https://docs.aws.amazon.com/secretsmanager/latest/userguide/reference_iam-permissions.html
 */
const SECRETS_MANAGER_ARN_PATTERN =
  /^arn:aws:secretsmanager:[a-z]{2}-[a-z]+-\d:\d{12}:secret:[\w/_+=.@-]+-[A-Za-z0-9]{6}$/;

/**
 * Validates a Secrets Manager secret ARN.
 *
 * Secrets Manager ARNs follow the format:
 * arn:aws:secretsmanager:<region>:<account-id>:secret:<secret-name>-<random>
 *
 * The random suffix is a 6-character alphanumeric string appended by AWS.
 *
 * @param value - The Secrets Manager ARN to validate
 * @returns true if the value is a valid Secrets Manager ARN, false otherwise
 *
 * @example
 * ```typescript
 * isValidSecretsManagerArn('arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret-AbCdEf'); // true
 * isValidSecretsManagerArn('arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:prod/db/password-123456'); // true
 * isValidSecretsManagerArn('arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret'); // false (no random suffix)
 * isValidSecretsManagerArn('invalid'); // false
 * ```
 */
export function isValidSecretsManagerArn(value: string): boolean {
  return SECRETS_MANAGER_ARN_PATTERN.test(value);
}

/**
 * Extracts the AWS region from a Secrets Manager ARN.
 *
 * @param value - The Secrets Manager ARN to extract region from
 * @returns The region code, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractRegionFromSecretsManagerArn('arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret-AbCdEf'); // 'us-east-1'
 * extractRegionFromSecretsManagerArn('arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:my-secret-AbCdEf'); // 'ap-northeast-1'
 * extractRegionFromSecretsManagerArn('invalid'); // undefined
 * ```
 */
export function extractRegionFromSecretsManagerArn(
  value: string
): string | undefined {
  // Secrets Manager ARN format: arn:aws:secretsmanager:<region>:<account-id>:secret:<secret-name>-<random>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'secretsmanager'
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
 * Extracts the AWS account ID from a Secrets Manager ARN.
 *
 * @param value - The Secrets Manager ARN to extract account ID from
 * @returns The 12-digit account ID, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractAccountIdFromSecretsManagerArn('arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret-AbCdEf'); // '123456789012'
 * extractAccountIdFromSecretsManagerArn('invalid'); // undefined
 * ```
 */
export function extractAccountIdFromSecretsManagerArn(
  value: string
): string | undefined {
  // Secrets Manager ARN format: arn:aws:secretsmanager:<region>:<account-id>:secret:<secret-name>-<random>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'secretsmanager'
  ) {
    const accountId = parts[4];
    if (/^\d{12}$/.test(accountId)) {
      return accountId;
    }
  }
  return undefined;
}
