/**
 * CloudFront validators.
 */

/**
 * Regular expression pattern for CloudFront Distribution ID validation.
 *
 * CloudFront Distribution IDs are 13-14 uppercase alphanumeric characters.
 *
 * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-overview.html
 */
const CLOUDFRONT_DIST_ID_PATTERN = /^[A-Z0-9]{13,14}$/;

/**
 * Validates a CloudFront Distribution ID.
 *
 * CloudFront Distribution IDs are 13-14 uppercase alphanumeric characters.
 *
 * @param value - The CloudFront Distribution ID to validate
 * @returns true if the value is a valid CloudFront Distribution ID, false otherwise
 *
 * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-overview.html
 *
 * @example
 * ```typescript
 * isValidCloudFrontDistId('E1A2B3C4D5E6F7');   // true (14 chars)
 * isValidCloudFrontDistId('EDFDVBD6EXAMPLE');  // true (14 chars)
 * isValidCloudFrontDistId('E1A2B3C4D5E6F');    // true (13 chars)
 * isValidCloudFrontDistId('E1A2B3C4D5E6');     // false (12 chars)
 * isValidCloudFrontDistId('E1A2B3C4D5E6F7G');  // false (15 chars)
 * isValidCloudFrontDistId('e1a2b3c4d5e6f7');   // false (lowercase)
 * isValidCloudFrontDistId('E1A2B3C4D5E6-7');   // false (contains hyphen)
 * ```
 */
export function isValidCloudFrontDistId(value: string): boolean {
  return CLOUDFRONT_DIST_ID_PATTERN.test(value);
}
