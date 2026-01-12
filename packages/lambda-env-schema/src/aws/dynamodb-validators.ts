/**
 * DynamoDB validators and parsers.
 */

import type { ParsedDynamoDBTableArn } from './parsed-types';

/**
 * Regular expression pattern for DynamoDB table name validation.
 *
 * DynamoDB table names must:
 * - Be 3-255 characters long
 * - Contain only alphanumeric characters, underscores, hyphens, and periods
 *
 * @see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 */
const DYNAMODB_TABLE_NAME_PATTERN = /^[a-zA-Z0-9_.-]{3,255}$/;

/**
 * Validates a DynamoDB table name against AWS naming rules.
 *
 * DynamoDB table names must:
 * - Be 3-255 characters long
 * - Contain only alphanumeric characters (a-z, A-Z, 0-9), underscores (_), hyphens (-), and periods (.)
 *
 * @param value - The table name to validate
 * @returns true if the table name is valid, false otherwise
 *
 * @see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 *
 * @example
 * ```typescript
 * isValidDynamoDBTableName('my-table');           // true
 * isValidDynamoDBTableName('MyTable_123');        // true
 * isValidDynamoDBTableName('table.name');         // true
 * isValidDynamoDBTableName('ab');                 // false (too short)
 * isValidDynamoDBTableName('a'.repeat(256));      // false (too long)
 * isValidDynamoDBTableName('table name');         // false (contains space)
 * isValidDynamoDBTableName('table@name');         // false (invalid character)
 * ```
 */
export function isValidDynamoDBTableName(value: string): boolean {
  return DYNAMODB_TABLE_NAME_PATTERN.test(value);
}

/**
 * Regular expression pattern for DynamoDB table ARN validation.
 *
 * Format: arn:aws:dynamodb:<region>:<account-id>:table/<table-name>
 * - Region: AWS region code (e.g., us-east-1, ap-northeast-1)
 * - Account ID: 12-digit AWS account ID
 * - Table name: 3-255 characters, alphanumeric plus _.-
 */
const DYNAMODB_TABLE_ARN_PATTERN =
  /^arn:aws:dynamodb:[a-z]{2}-[a-z]+-\d:\d{12}:table\/[a-zA-Z0-9_.-]{3,255}$/;

/**
 * Validates a DynamoDB table ARN.
 *
 * DynamoDB table ARNs follow the format:
 * arn:aws:dynamodb:<region>:<account-id>:table/<table-name>
 *
 * @param value - The DynamoDB table ARN to validate
 * @returns true if the value is a valid DynamoDB table ARN, false otherwise
 *
 * @see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 *
 * @example
 * ```typescript
 * isValidDynamoDBTableArn('arn:aws:dynamodb:us-east-1:123456789012:table/MyTable'); // true
 * isValidDynamoDBTableArn('arn:aws:dynamodb:ap-northeast-1:123456789012:table/my-table_123'); // true
 * isValidDynamoDBTableArn('arn:aws:dynamodb:us-east-1:123456789012:table/ab'); // false (table name too short)
 * isValidDynamoDBTableArn('arn:aws:s3:::my-bucket'); // false (wrong service)
 * isValidDynamoDBTableArn('invalid'); // false
 * ```
 */
export function isValidDynamoDBTableArn(value: string): boolean {
  return DYNAMODB_TABLE_ARN_PATTERN.test(value);
}

/**
 * Extracts the AWS region from a DynamoDB table ARN.
 *
 * @param value - The DynamoDB table ARN to extract region from
 * @returns The region code, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractRegionFromDynamoDBArn('arn:aws:dynamodb:us-east-1:123456789012:table/MyTable'); // 'us-east-1'
 * extractRegionFromDynamoDBArn('arn:aws:dynamodb:ap-northeast-1:123456789012:table/MyTable'); // 'ap-northeast-1'
 * extractRegionFromDynamoDBArn('invalid'); // undefined
 * ```
 */
export function extractRegionFromDynamoDBArn(
  value: string
): string | undefined {
  // DynamoDB ARN format: arn:aws:dynamodb:<region>:<account-id>:table/<table-name>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'dynamodb'
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
 * Extracts the AWS account ID from a DynamoDB table ARN.
 *
 * @param value - The DynamoDB table ARN to extract account ID from
 * @returns The 12-digit account ID, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractAccountIdFromDynamoDBArn('arn:aws:dynamodb:us-east-1:123456789012:table/MyTable'); // '123456789012'
 * extractAccountIdFromDynamoDBArn('invalid'); // undefined
 * ```
 */
export function extractAccountIdFromDynamoDBArn(
  value: string
): string | undefined {
  // DynamoDB ARN format: arn:aws:dynamodb:<region>:<account-id>:table/<table-name>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'dynamodb'
  ) {
    const accountId = parts[4];
    if (/^\d{12}$/.test(accountId)) {
      return accountId;
    }
  }
  return undefined;
}


/**
 * Parses a DynamoDB Table ARN into its components.
 *
 * @param value - The DynamoDB Table ARN to parse
 * @returns Parsed DynamoDB Table ARN object, or null if invalid
 *
 * @example
 * ```typescript
 * parseDynamoDBTableArn('arn:aws:dynamodb:us-east-1:123456789012:table/MyTable');
 * // {
 * //   value: 'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable',
 * //   tableName: 'MyTable',
 * //   region: 'us-east-1',
 * //   accountId: '123456789012'
 * // }
 *
 * parseDynamoDBTableArn('invalid');
 * // null
 * ```
 */
export function parseDynamoDBTableArn(value: string): ParsedDynamoDBTableArn | null {
  if (!isValidDynamoDBTableArn(value)) return null;

  const region = extractRegionFromDynamoDBArn(value);
  const accountId = extractAccountIdFromDynamoDBArn(value);

  // arn:aws:dynamodb:<region>:<account-id>:table/<table-name>
  const match = value.match(/table\/([^/]+)$/);
  if (!match || !region || !accountId) return null;

  return {
    value,
    tableName: match[1],
    region,
    accountId,
  };
}
