import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AWS_REGIONS } from '../../../src/aws/aws-regions';
import {
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
  isValidSQSQueueArn,
  isValidSQSQueueUrl,
} from '../../../src/aws/sqs-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALPHANUM = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

describe('sqs-queue-url validation', () => {
  // Generator for valid AWS regions
  const validRegionArb = fc.constantFrom(...AWS_REGIONS);

  // Generator for valid 12-digit account IDs
  const validAccountIdArb = fc
    .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
    .map(charArrayToString);

  // SQS queue name characters: alphanumeric, hyphens, underscores
  const SQS_QUEUE_NAME_CHARS = [...ALPHANUM, '-', '_'];

  // Generator for valid SQS queue names
  const validQueueNameArb = fc
    .array(fc.constantFrom(...SQS_QUEUE_NAME_CHARS), {
      minLength: 1,
      maxLength: 80,
    })
    .map(charArrayToString);

  // Generator for valid SQS queue URLs
  const validSQSQueueUrlArb = fc
    .tuple(validRegionArb, validAccountIdArb, validQueueNameArb)
    .map(
      ([region, accountId, queueName]) =>
        `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
    );

  // Generator for valid FIFO SQS queue URLs
  const validFifoSQSQueueUrlArb = fc
    .tuple(validRegionArb, validAccountIdArb, validQueueNameArb)
    .map(
      ([region, accountId, queueName]) =>
        `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}.fifo`
    );

  it('accepts valid SQS queue URLs', () => {
    fc.assert(
      fc.property(validSQSQueueUrlArb, (url) => {
        expect(isValidSQSQueueUrl(url)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('accepts valid FIFO SQS queue URLs', () => {
    fc.assert(
      fc.property(validFifoSQSQueueUrlArb, (url) => {
        expect(isValidSQSQueueUrl(url)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects URLs with invalid account ID', () => {
    const invalidAccountIdArb = fc
      .array(fc.constantFrom(...DIGITS), { minLength: 1, maxLength: 20 })
      .map(charArrayToString)
      .filter((s) => s.length !== 12);

    fc.assert(
      fc.property(
        validRegionArb,
        invalidAccountIdArb,
        validQueueNameArb,
        (region, invalidAccountId, queueName) => {
          const invalidUrl = `https://sqs.${region}.amazonaws.com/${invalidAccountId}/${queueName}`;
          expect(isValidSQSQueueUrl(invalidUrl)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects URLs with http instead of https', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validQueueNameArb,
        (region, accountId, queueName) => {
          const httpUrl = `http://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
          expect(isValidSQSQueueUrl(httpUrl)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts region correctly from valid SQS queue URL', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validQueueNameArb,
        (region, accountId, queueName) => {
          const url = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
          expect(extractRegionFromSQSQueueUrl(url)).toBe(region);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts account ID correctly from valid SQS queue URL', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validQueueNameArb,
        (region, accountId, queueName) => {
          const url = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
          expect(extractAccountIdFromSQSQueueUrl(url)).toBe(accountId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('sqs-queue-arn validation', () => {
  // Generator for valid AWS regions
  const validRegionArb = fc.constantFrom(...AWS_REGIONS);

  // Generator for valid 12-digit account IDs
  const validAccountIdArb = fc
    .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
    .map(charArrayToString);

  // SQS queue name characters: alphanumeric, hyphens, underscores
  const SQS_QUEUE_NAME_CHARS = [...ALPHANUM, '-', '_'];

  // Generator for valid SQS queue names
  const validQueueNameArb = fc
    .array(fc.constantFrom(...SQS_QUEUE_NAME_CHARS), {
      minLength: 1,
      maxLength: 80,
    })
    .map(charArrayToString);

  // Generator for valid SQS queue ARNs
  const validSQSQueueArnArb = fc
    .tuple(validRegionArb, validAccountIdArb, validQueueNameArb)
    .map(
      ([region, accountId, queueName]) =>
        `arn:aws:sqs:${region}:${accountId}:${queueName}`
    );

  // Generator for valid FIFO SQS queue ARNs
  const validFifoSQSQueueArnArb = fc
    .tuple(validRegionArb, validAccountIdArb, validQueueNameArb)
    .map(
      ([region, accountId, queueName]) =>
        `arn:aws:sqs:${region}:${accountId}:${queueName}.fifo`
    );

  it('accepts valid SQS queue ARNs', () => {
    fc.assert(
      fc.property(validSQSQueueArnArb, (arn) => {
        expect(isValidSQSQueueArn(arn)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('accepts valid FIFO SQS queue ARNs', () => {
    fc.assert(
      fc.property(validFifoSQSQueueArnArb, (arn) => {
        expect(isValidSQSQueueArn(arn)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with wrong service', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validQueueNameArb,
        (region, accountId, queueName) => {
          const wrongServiceArn = `arn:aws:sns:${region}:${accountId}:${queueName}`;
          expect(isValidSQSQueueArn(wrongServiceArn)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with invalid account ID', () => {
    const invalidAccountIdArb = fc
      .array(fc.constantFrom(...DIGITS), { minLength: 1, maxLength: 20 })
      .map(charArrayToString)
      .filter((s) => s.length !== 12);

    fc.assert(
      fc.property(
        validRegionArb,
        invalidAccountIdArb,
        validQueueNameArb,
        (region, invalidAccountId, queueName) => {
          const invalidArn = `arn:aws:sqs:${region}:${invalidAccountId}:${queueName}`;
          expect(isValidSQSQueueArn(invalidArn)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts region correctly from valid SQS queue ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validQueueNameArb,
        (region, accountId, queueName) => {
          const arn = `arn:aws:sqs:${region}:${accountId}:${queueName}`;
          expect(extractRegionFromSQSQueueArn(arn)).toBe(region);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts account ID correctly from valid SQS queue ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validQueueNameArb,
        (region, accountId, queueName) => {
          const arn = `arn:aws:sqs:${region}:${accountId}:${queueName}`;
          expect(extractAccountIdFromSQSQueueArn(arn)).toBe(accountId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
