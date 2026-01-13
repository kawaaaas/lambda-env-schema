import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AWS_REGIONS } from '../../../src/aws/aws-regions';
import {
  extractAccountIdFromSNSTopicArn,
  extractRegionFromSNSTopicArn,
  isValidSNSTopicArn,
} from '../../../src/aws/sns-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALPHANUM = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

describe('sns-topic-arn validation', () => {
  // Generator for valid AWS regions
  const validRegionArb = fc.constantFrom(...AWS_REGIONS);

  // Generator for valid 12-digit account IDs
  const validAccountIdArb = fc
    .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
    .map(charArrayToString);

  // SNS topic name characters: alphanumeric, hyphens, underscores
  const SNS_TOPIC_NAME_CHARS = [...ALPHANUM, '-', '_'];

  // Generator for valid SNS topic names
  const validTopicNameArb = fc
    .array(fc.constantFrom(...SNS_TOPIC_NAME_CHARS), {
      minLength: 1,
      maxLength: 256,
    })
    .map(charArrayToString);

  // Generator for valid SNS topic ARNs
  const validSNSTopicArnArb = fc
    .tuple(validRegionArb, validAccountIdArb, validTopicNameArb)
    .map(
      ([region, accountId, topicName]) =>
        `arn:aws:sns:${region}:${accountId}:${topicName}`
    );

  // Generator for valid FIFO SNS topic ARNs
  const validFifoSNSTopicArnArb = fc
    .tuple(validRegionArb, validAccountIdArb, validTopicNameArb)
    .map(
      ([region, accountId, topicName]) =>
        `arn:aws:sns:${region}:${accountId}:${topicName}.fifo`
    );

  it('accepts valid SNS topic ARNs', () => {
    fc.assert(
      fc.property(validSNSTopicArnArb, (arn) => {
        expect(isValidSNSTopicArn(arn)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('accepts valid FIFO SNS topic ARNs', () => {
    fc.assert(
      fc.property(validFifoSNSTopicArnArb, (arn) => {
        expect(isValidSNSTopicArn(arn)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with wrong service', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validTopicNameArb,
        (region, accountId, topicName) => {
          const wrongServiceArn = `arn:aws:sqs:${region}:${accountId}:${topicName}`;
          expect(isValidSNSTopicArn(wrongServiceArn)).toBe(false);
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
        validTopicNameArb,
        (region, invalidAccountId, topicName) => {
          const invalidArn = `arn:aws:sns:${region}:${invalidAccountId}:${topicName}`;
          expect(isValidSNSTopicArn(invalidArn)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts region correctly from valid SNS topic ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validTopicNameArb,
        (region, accountId, topicName) => {
          const arn = `arn:aws:sns:${region}:${accountId}:${topicName}`;
          expect(extractRegionFromSNSTopicArn(arn)).toBe(region);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts account ID correctly from valid SNS topic ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validTopicNameArb,
        (region, accountId, topicName) => {
          const arn = `arn:aws:sns:${region}:${accountId}:${topicName}`;
          expect(extractAccountIdFromSNSTopicArn(arn)).toBe(accountId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
