import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseSNSTopicArn } from '../../../src/aws/sns-validators';

describe('SNS Topic ARN parsing property tests', () => {
  describe('Property 6: SNS Topic ARN Parsing', () => {
    // Generator for valid AWS regions
    const validRegion = fc.oneof(
      fc.constant('us-east-1'),
      fc.constant('us-east-2'),
      fc.constant('us-west-1'),
      fc.constant('us-west-2'),
      fc.constant('eu-west-1'),
      fc.constant('eu-west-2'),
      fc.constant('eu-central-1'),
      fc.constant('ap-northeast-1'),
      fc.constant('ap-southeast-1'),
      fc.constant('ap-southeast-2'),
      fc.constant('ap-south-1'),
      fc.constant('ca-central-1'),
      fc.constant('sa-east-1')
    );

    // Generator for valid AWS account IDs (12 digits)
    const validAccountId = fc
      .integer({ min: 100000000000, max: 999999999999 })
      .map((num) => num.toString());

    // Generator for valid topic names (alphanumeric, hyphens, underscores)
    const validTopicName = fc
      .string({ minLength: 1, maxLength: 256 })
      .filter((name) => /^[\w-]+$/.test(name))
      .map((name) => name || 'default-topic'); // Ensure non-empty

    // Generator for valid FIFO topic names
    const validFifoTopicName = validTopicName.map((name) => `${name}.fifo`);

    // Generator for standard (non-FIFO) SNS Topic ARNs
    const standardTopicArn = fc
      .tuple(validRegion, validAccountId, validTopicName)
      .map(
        ([region, accountId, topicName]) =>
          `arn:aws:sns:${region}:${accountId}:${topicName}`
      );

    // Generator for FIFO SNS Topic ARNs
    const fifoTopicArn = fc
      .tuple(validRegion, validAccountId, validFifoTopicName)
      .map(
        ([region, accountId, topicName]) =>
          `arn:aws:sns:${region}:${accountId}:${topicName}`
      );

    // Generator for all valid SNS Topic ARNs
    const validSNSTopicArn = fc.oneof(standardTopicArn, fifoTopicArn);

    it('when value is valid, parsed result contains topicName extracted from the ARN', () => {
      fc.assert(
        fc.property(validSNSTopicArn, (arn) => {
          const parsed = parseSNSTopicArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected topic name from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);
            const expectedTopicName = parts[5];
            expect(parsed.topicName).toBe(expectedTopicName);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains region extracted from the ARN', () => {
      fc.assert(
        fc.property(validSNSTopicArn, (arn) => {
          const parsed = parseSNSTopicArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected region from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);
            const expectedRegion = parts[3];
            expect(parsed.region).toBe(expectedRegion);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains accountId extracted from the ARN', () => {
      fc.assert(
        fc.property(validSNSTopicArn, (arn) => {
          const parsed = parseSNSTopicArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected account ID from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);
            const expectedAccountId = parts[4];
            expect(parsed.accountId).toBe(expectedAccountId);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('parsed value contains original value', () => {
      fc.assert(
        fc.property(validSNSTopicArn, (arn) => {
          const parsed = parseSNSTopicArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid SNS Topic ARNs return null', () => {
      const invalidArns = fc.oneof(
        // Wrong service
        fc
          .tuple(validRegion, validAccountId, validTopicName)
          .map(
            ([region, accountId, topicName]) =>
              `arn:aws:sqs:${region}:${accountId}:${topicName}`
          ),
        // Invalid account ID (not 12 digits)
        fc
          .tuple(validRegion, validTopicName)
          .map(
            ([region, topicName]) => `arn:aws:sns:${region}:12345:${topicName}`
          ),
        // Invalid region format
        fc
          .tuple(validAccountId, validTopicName)
          .map(
            ([accountId, topicName]) =>
              `arn:aws:sns:invalid-region:${accountId}:${topicName}`
          ),
        // Missing topic name
        fc
          .tuple(validRegion, validAccountId)
          .map(([region, accountId]) => `arn:aws:sns:${region}:${accountId}:`),
        // Invalid topic name (contains invalid characters)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:sns:${region}:${accountId}:invalid@topic`
          ),
        // Wrong ARN format (missing parts)
        fc
          .tuple(validRegion, validAccountId)
          .map(([region, accountId]) => `arn:aws:sns:${region}:${accountId}`),
        // Not an ARN at all
        fc
          .string()
          .filter((s) => !s.startsWith('arn:aws:sns:'))
      );

      fc.assert(
        fc.property(invalidArns, (invalidArn) => {
          const parsed = parseSNSTopicArn(invalidArn);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
