/**
 * AWS region definitions and validation.
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
