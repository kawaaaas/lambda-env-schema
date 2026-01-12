/**
 * Generic ARN validators and parsers.
 */

import type { ParsedArn } from './parsed-types';

/**
 * Regular expression pattern for generic ARN validation.
 *
 * ARNs follow the format:
 * arn:aws:<service>:<region>:<account-id>:<resource>
 *
 * Where:
 * - service: AWS service name (e.g., s3, lambda, dynamodb)
 * - region: AWS region (may be empty for global services like IAM, S3)
 * - account-id: 12-digit AWS account ID (may be empty for some resources like S3)
 * - resource: Resource identifier (format varies by service)
 *
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/reference-arns.html
 */
const ARN_PATTERN = /^arn:aws:([^:]+):([^:]*):([^:]*):(.+)$/;

/**
 * Validates a generic ARN.
 *
 * ARNs follow the format:
 * arn:aws:<service>:<region>:<account-id>:<resource>
 *
 * Note: Region and account ID may be empty for some services (e.g., S3, IAM).
 *
 * @param value - The ARN to validate
 * @returns true if the value is a valid ARN, false otherwise
 *
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/reference-arns.html
 *
 * @example
 * ```typescript
 * // Valid ARNs
 * isValidArn('arn:aws:s3:::my-bucket');                                           // true
 * isValidArn('arn:aws:lambda:us-east-1:123456789012:function:my-function');       // true
 * isValidArn('arn:aws:iam::123456789012:role/my-role');                           // true
 * isValidArn('arn:aws:dynamodb:us-east-1:123456789012:table/my-table');           // true
 *
 * // Invalid ARNs
 * isValidArn('arn:aws:s3');                                                        // false (incomplete)
 * isValidArn('not-an-arn');                                                        // false (wrong format)
 * isValidArn('arn:azure:s3:::my-bucket');                                          // false (wrong partition)
 * ```
 */
export function isValidArn(value: string): boolean {
  return ARN_PATTERN.test(value);
}

/**
 * Parses a generic ARN into its components.
 *
 * @param value - The ARN to parse
 * @returns Parsed ARN object, or null if invalid
 *
 * @example
 * ```typescript
 * parseArn('arn:aws:lambda:us-east-1:123456789012:function:my-function');
 * // {
 * //   value: 'arn:aws:lambda:us-east-1:123456789012:function:my-function',
 * //   service: 'lambda',
 * //   region: 'us-east-1',
 * //   accountId: '123456789012',
 * //   resource: 'function:my-function'
 * // }
 *
 * parseArn('arn:aws:s3:::my-bucket/my-object');
 * // {
 * //   value: 'arn:aws:s3:::my-bucket/my-object',
 * //   service: 's3',
 * //   region: '',
 * //   accountId: '',
 * //   resource: 'my-bucket/my-object'
 * // }
 *
 * parseArn('arn:aws:iam::123456789012:role/my-role');
 * // {
 * //   value: 'arn:aws:iam::123456789012:role/my-role',
 * //   service: 'iam',
 * //   region: '',
 * //   accountId: '123456789012',
 * //   resource: 'role/my-role'
 * // }
 *
 * parseArn('invalid');
 * // null
 * ```
 */
export function parseArn(value: string): ParsedArn | null {
  const match = value.match(ARN_PATTERN);
  if (!match) return null;

  return {
    value,
    service: match[1],
    region: match[2],
    accountId: match[3],
    resource: match[4],
  };
}
