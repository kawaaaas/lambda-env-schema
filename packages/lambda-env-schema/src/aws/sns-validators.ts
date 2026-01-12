/**
 * SNS (Simple Notification Service) validators and parsers.
 */


/**
 * Regular expression pattern for SNS topic ARN validation.
 *
 * SNS topic ARNs follow the format:
 * arn:aws:sns:<region>:<account-id>:<topic-name>
 *
 * Topic names can contain alphanumeric characters, hyphens, and underscores.
 * FIFO topic names end with ".fifo".
 *
 * @see https://docs.aws.amazon.com/sns/latest/dg/sns-create-topic.html
 */
const SNS_TOPIC_ARN_PATTERN =
  /^arn:aws:sns:[a-z]{2}-[a-z]+-\d:\d{12}:[\w-]+(\.fifo)?$/;

/**
 * Validates an SNS topic ARN.
 *
 * SNS topic ARNs follow the format:
 * arn:aws:sns:<region>:<account-id>:<topic-name>
 *
 * Topic names can contain alphanumeric characters, hyphens (-), and underscores (_).
 * FIFO topic names must end with ".fifo".
 *
 * @param value - The SNS topic ARN to validate
 * @returns true if the value is a valid SNS topic ARN, false otherwise
 *
 * @see https://docs.aws.amazon.com/sns/latest/dg/sns-create-topic.html
 *
 * @example
 * ```typescript
 * isValidSNSTopicArn('arn:aws:sns:us-east-1:123456789012:my-topic'); // true
 * isValidSNSTopicArn('arn:aws:sns:ap-northeast-1:123456789012:MyTopic_123'); // true
 * isValidSNSTopicArn('arn:aws:sns:us-east-1:123456789012:my-topic.fifo'); // true (FIFO topic)
 * isValidSNSTopicArn('arn:aws:sns:us-east-1:12345678901:my-topic'); // false (invalid account ID)
 * isValidSNSTopicArn('arn:aws:sqs:us-east-1:123456789012:my-queue'); // false (wrong service)
 * isValidSNSTopicArn('invalid'); // false
 * ```
 */
export function isValidSNSTopicArn(value: string): boolean {
  return SNS_TOPIC_ARN_PATTERN.test(value);
}

/**
 * Extracts the AWS region from an SNS topic ARN.
 *
 * @param value - The SNS topic ARN to extract region from
 * @returns The region code, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractRegionFromSNSTopicArn('arn:aws:sns:us-east-1:123456789012:my-topic'); // 'us-east-1'
 * extractRegionFromSNSTopicArn('arn:aws:sns:ap-northeast-1:123456789012:my-topic'); // 'ap-northeast-1'
 * extractRegionFromSNSTopicArn('invalid'); // undefined
 * ```
 */
export function extractRegionFromSNSTopicArn(
  value: string
): string | undefined {
  // SNS ARN format: arn:aws:sns:<region>:<account-id>:<topic-name>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'sns'
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
 * Extracts the AWS account ID from an SNS topic ARN.
 *
 * @param value - The SNS topic ARN to extract account ID from
 * @returns The 12-digit account ID, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractAccountIdFromSNSTopicArn('arn:aws:sns:us-east-1:123456789012:my-topic'); // '123456789012'
 * extractAccountIdFromSNSTopicArn('invalid'); // undefined
 * ```
 */
export function extractAccountIdFromSNSTopicArn(
  value: string
): string | undefined {
  // SNS ARN format: arn:aws:sns:<region>:<account-id>:<topic-name>
  const parts = value.split(':');
  if (
    parts.length >= 6 &&
    parts[0] === 'arn' &&
    parts[1] === 'aws' &&
    parts[2] === 'sns'
  ) {
    const accountId = parts[4];
    if (/^\d{12}$/.test(accountId)) {
      return accountId;
    }
  }
  return undefined;
}


/**
 * Parses an SNS Topic ARN into its components.
 *
 * @param value - The SNS Topic ARN to parse
 * @returns Parsed SNS Topic ARN object, or null if invalid
 *
 * @example
 * ```typescript
 * parseSNSTopicArn('arn:aws:sns:us-east-1:123456789012:my-topic');
 * // {
 * //   value: 'arn:aws:sns:us-east-1:123456789012:my-topic',
 * //   topicName: 'my-topic',
 * //   region: 'us-east-1',
 * //   accountId: '123456789012'
 * // }
 *
 * parseSNSTopicArn('invalid');
 * // null
 * ```
 */
export function parseSNSTopicArn(value: string): ParsedSNSTopicArn | null {
  if (!isValidSNSTopicArn(value)) return null;

  const region = extractRegionFromSNSTopicArn(value);
  const accountId = extractAccountIdFromSNSTopicArn(value);

  // arn:aws:sns:<region>:<account-id>:<topic-name>
  const parts = value.split(':');
  if (parts.length < 6 || !region || !accountId) return null;

  return {
    value,
    topicName: parts[5],
    region,
    accountId,
  };
}
