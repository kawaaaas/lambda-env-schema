/**
 * IAM (Identity and Access Management) validators.
 */

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
 * Regular expression pattern for AWS Account ID validation.
 * AWS Account IDs are exactly 12 digits.
 */
const AWS_ACCOUNT_ID_PATTERN = /^\d{12}$/;

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
  if (
    parts.length >= 5 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'iam'
  ) {
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
