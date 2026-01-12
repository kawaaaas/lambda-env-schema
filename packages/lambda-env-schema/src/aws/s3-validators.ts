/**
 * S3 (Simple Storage Service) validators.
 */

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
