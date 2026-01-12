/**
 * SQS (Simple Queue Service) validators.
 */

/**
 * Regular expression pattern for SQS queue URL validation.
 *
 * SQS queue URLs follow the format:
 * https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>
 *
 * Queue names can contain alphanumeric characters, hyphens, and underscores.
 * FIFO queue names end with ".fifo".
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-message-identifiers.html
 */
const SQS_QUEUE_URL_PATTERN =
  /^https:\/\/sqs\.[a-z]{2}-[a-z]+-\d\.amazonaws\.com\/\d{12}\/[\w-]+(\.fifo)?$/;

/**
 * Validates an SQS queue URL.
 *
 * SQS queue URLs follow the format:
 * https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>
 *
 * Queue names can contain alphanumeric characters, hyphens (-), and underscores (_).
 * FIFO queue names must end with ".fifo".
 *
 * @param value - The SQS queue URL to validate
 * @returns true if the value is a valid SQS queue URL, false otherwise
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-message-identifiers.html
 *
 * @example
 * ```typescript
 * isValidSQSQueueUrl('https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'); // true
 * isValidSQSQueueUrl('https://sqs.ap-northeast-1.amazonaws.com/123456789012/MyQueue_123'); // true
 * isValidSQSQueueUrl('https://sqs.us-east-1.amazonaws.com/123456789012/my-queue.fifo'); // true (FIFO queue)
 * isValidSQSQueueUrl('https://sqs.us-east-1.amazonaws.com/12345678901/my-queue'); // false (invalid account ID)
 * isValidSQSQueueUrl('http://sqs.us-east-1.amazonaws.com/123456789012/my-queue'); // false (http instead of https)
 * isValidSQSQueueUrl('https://sns.us-east-1.amazonaws.com/123456789012/my-topic'); // false (wrong service)
 * ```
 */
export function isValidSQSQueueUrl(value: string): boolean {
  return SQS_QUEUE_URL_PATTERN.test(value);
}

/**
 * Extracts the AWS region from an SQS queue URL.
 *
 * @param value - The SQS queue URL to extract region from
 * @returns The region code, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractRegionFromSQSQueueUrl('https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'); // 'us-east-1'
 * extractRegionFromSQSQueueUrl('https://sqs.ap-northeast-1.amazonaws.com/123456789012/my-queue'); // 'ap-northeast-1'
 * extractRegionFromSQSQueueUrl('invalid'); // undefined
 * ```
 */
export function extractRegionFromSQSQueueUrl(
  value: string
): string | undefined {
  // SQS queue URL format: https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>
  const match = value.match(
    /^https:\/\/sqs\.([a-z]{2}-[a-z]+-\d)\.amazonaws\.com\//
  );
  return match ? match[1] : undefined;
}

/**
 * Extracts the AWS account ID from an SQS queue URL.
 *
 * @param value - The SQS queue URL to extract account ID from
 * @returns The 12-digit account ID, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractAccountIdFromSQSQueueUrl('https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'); // '123456789012'
 * extractAccountIdFromSQSQueueUrl('invalid'); // undefined
 * ```
 */
export function extractAccountIdFromSQSQueueUrl(
  value: string
): string | undefined {
  // SQS queue URL format: https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>
  const match = value.match(
    /^https:\/\/sqs\.[a-z]{2}-[a-z]+-\d\.amazonaws\.com\/(\d{12})\//
  );
  return match ? match[1] : undefined;
}

/**
 * Regular expression pattern for SQS queue ARN validation.
 *
 * SQS queue ARNs follow the format:
 * arn:aws:sqs:<region>:<account-id>:<queue-name>
 *
 * Queue names can contain alphanumeric characters, hyphens, and underscores.
 * FIFO queue names end with ".fifo".
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-message-identifiers.html
 */
const SQS_QUEUE_ARN_PATTERN =
  /^arn:aws:sqs:[a-z]{2}-[a-z]+-\d:\d{12}:[\w-]+(\.fifo)?$/;

/**
 * Validates an SQS queue ARN.
 *
 * SQS queue ARNs follow the format:
 * arn:aws:sqs:<region>:<account-id>:<queue-name>
 *
 * Queue names can contain alphanumeric characters, hyphens (-), and underscores (_).
 * FIFO queue names must end with ".fifo".
 *
 * @param value - The SQS queue ARN to validate
 * @returns true if the value is a valid SQS queue ARN, false otherwise
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-message-identifiers.html
 *
 * @example
 * ```typescript
 * isValidSQSQueueArn('arn:aws:sqs:us-east-1:123456789012:my-queue'); // true
 * isValidSQSQueueArn('arn:aws:sqs:ap-northeast-1:123456789012:MyQueue_123'); // true
 * isValidSQSQueueArn('arn:aws:sqs:us-east-1:123456789012:my-queue.fifo'); // true (FIFO queue)
 * isValidSQSQueueArn('arn:aws:sqs:us-east-1:12345678901:my-queue'); // false (invalid account ID)
 * isValidSQSQueueArn('arn:aws:sns:us-east-1:123456789012:my-topic'); // false (wrong service)
 * isValidSQSQueueArn('invalid'); // false
 * ```
 */
export function isValidSQSQueueArn(value: string): boolean {
  return SQS_QUEUE_ARN_PATTERN.test(value);
}

/**
 * Extracts the AWS region from an SQS queue ARN.
 *
 * @param value - The SQS queue ARN to extract region from
 * @returns The region code, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractRegionFromSQSQueueArn('arn:aws:sqs:us-east-1:123456789012:my-queue'); // 'us-east-1'
 * extractRegionFromSQSQueueArn('arn:aws:sqs:ap-northeast-1:123456789012:my-queue'); // 'ap-northeast-1'
 * extractRegionFromSQSQueueArn('invalid'); // undefined
 * ```
 */
export function extractRegionFromSQSQueueArn(
  value: string
): string | undefined {
  // SQS ARN format: arn:aws:sqs:<region>:<account-id>:<queue-name>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'sqs'
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
 * Extracts the AWS account ID from an SQS queue ARN.
 *
 * @param value - The SQS queue ARN to extract account ID from
 * @returns The 12-digit account ID, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractAccountIdFromSQSQueueArn('arn:aws:sqs:us-east-1:123456789012:my-queue'); // '123456789012'
 * extractAccountIdFromSQSQueueArn('invalid'); // undefined
 * ```
 */
export function extractAccountIdFromSQSQueueArn(
  value: string
): string | undefined {
  // SQS ARN format: arn:aws:sqs:<region>:<account-id>:<queue-name>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'sqs'
  ) {
    const accountId = parts[4];
    if (/^\d{12}$/.test(accountId)) {
      return accountId;
    }
  }
  return undefined;
}
