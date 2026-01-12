/**
 * IAM (Identity and Access Management) validators and parsers.
 */

import type { ParsedIAMRoleArn } from './parsed-types';

/**
 * Regular expression pattern for IAM Role ARN validation.
 * Format: arn:aws:iam::<account-id>:role[/path]/<role-name>
 * Path: optional, can contain multiple segments (e.g., /service-role/)
 * Role name: 1-64 characters, alphanumeric plus +=,.@_-
 */
const IAM_ROLE_ARN_PATTERN = /^arn:aws:iam::\d{12}:role(\/[\w+=,.@-]+)*\/[\w+=,.@-]{1,64}$/;

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
 * IAM Role ARNs follow the format: arn:aws:iam::<account-id>:role[/path]/<role-name>
 * - Account ID: exactly 12 digits
 * - Path: optional, can contain multiple segments (e.g., /service-role/)
 * - Role name: 1-64 characters, alphanumeric plus +=,.@_-
 *
 * @param value - The value to validate
 * @returns true if the value is a valid IAM Role ARN, false otherwise
 *
 * @example
 * ```typescript
 * isValidIAMRoleArn('arn:aws:iam::123456789012:role/MyRole'); // true
 * isValidIAMRoleArn('arn:aws:iam::123456789012:role/my-role_name'); // true
 * isValidIAMRoleArn('arn:aws:iam::123456789012:role/service-role/MyRole'); // true (with path)
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


/**
 * Parses an IAM Role ARN into its components.
 *
 * @param value - The IAM Role ARN to parse
 * @returns Parsed IAM Role ARN object, or null if invalid
 *
 * @example
 * ```typescript
 * parseIAMRoleArn('arn:aws:iam::123456789012:role/MyRole');
 * // {
 * //   value: 'arn:aws:iam::123456789012:role/MyRole',
 * //   roleName: 'MyRole',
 * //   accountId: '123456789012',
 * //   path: undefined
 * // }
 *
 * parseIAMRoleArn('arn:aws:iam::123456789012:role/service-role/MyRole');
 * // {
 * //   value: 'arn:aws:iam::123456789012:role/service-role/MyRole',
 * //   roleName: 'MyRole',
 * //   accountId: '123456789012',
 * //   path: '/service-role/'
 * // }
 *
 * parseIAMRoleArn('invalid');
 * // null
 * ```
 */
export function parseIAMRoleArn(value: string): ParsedIAMRoleArn | null {
  if (!isValidIAMRoleArn(value)) return null;

  const accountId = extractAccountIdFromIAMArn(value);
  if (!accountId) return null;

  // arn:aws:iam::<account-id>:role[/path]/<role-name>
  // Extract everything after "role/"
  const rolePartMatch = value.match(/:role\/(.+)$/);
  if (!rolePartMatch) return null;

  const rolePart = rolePartMatch[1];
  const segments = rolePart.split('/');
  
  // The last segment is the role name
  const roleName = segments[segments.length - 1];
  
  // If there are more than one segment, the rest is the path
  let path: string | undefined;
  if (segments.length > 1) {
    // Path includes leading and trailing slashes
    path = '/' + segments.slice(0, -1).join('/') + '/';
  }

  return {
    value,
    roleName,
    accountId,
    path,
  };
}
