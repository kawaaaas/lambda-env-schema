import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseSQSQueueArn } from '../../../src/aws/sqs-validators';

describe('SQS Queue ARN parsing property tests', () => {
  describe('Property 5: SQS Queue ARN Parsing', () => {
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

    // Generator for valid queue names (alphanumeric, hyphens, underscores)
    const validQueueName = fc
      .string({ minLength: 1, maxLength: 80 })
      .filter((name) => /^[\w-]+$/.test(name))
      .map((name) => name || 'default-queue'); // Ensure non-empty

    // Generator for valid FIFO queue names
    const validFifoQueueName = validQueueName.map((name) => `${name}.fifo`);

    // Generator for standard (non-FIFO) SQS Queue ARNs
    const standardQueueArn = fc
      .tuple(validRegion, validAccountId, validQueueName)
      .map(
        ([region, accountId, queueName]) =>
          `arn:aws:sqs:${region}:${accountId}:${queueName}`
      );

    // Generator for FIFO SQS Queue ARNs
    const fifoQueueArn = fc
      .tuple(validRegion, validAccountId, validFifoQueueName)
      .map(
        ([region, accountId, queueName]) =>
          `arn:aws:sqs:${region}:${accountId}:${queueName}`
      );

    // Generator for all valid SQS Queue ARNs
    const validSQSQueueArn = fc.oneof(standardQueueArn, fifoQueueArn);

    it('when value is valid, parsed result contains queueName extracted from the ARN', () => {
      fc.assert(
        fc.property(validSQSQueueArn, (arn) => {
          const parsed = parseSQSQueueArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected queue name from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);
            const expectedQueueName = parts[5];
            expect(parsed.queueName).toBe(expectedQueueName);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains accountId extracted from the ARN', () => {
      fc.assert(
        fc.property(validSQSQueueArn, (arn) => {
          const parsed = parseSQSQueueArn(arn);

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

    it('when value is valid, parsed result contains region extracted from the ARN', () => {
      fc.assert(
        fc.property(validSQSQueueArn, (arn) => {
          const parsed = parseSQSQueueArn(arn);

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

    it('isFifo is true if and only if the queue name ends with .fifo', () => {
      fc.assert(
        fc.property(validSQSQueueArn, (arn) => {
          const parsed = parseSQSQueueArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            const expectedIsFifo = parsed.queueName.endsWith('.fifo');
            expect(parsed.isFifo).toBe(expectedIsFifo);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('FIFO queues have isFifo set to true', () => {
      fc.assert(
        fc.property(fifoQueueArn, (arn) => {
          const parsed = parseSQSQueueArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.isFifo).toBe(true);
            expect(parsed.queueName).toMatch(/\.fifo$/);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('standard queues have isFifo set to false', () => {
      fc.assert(
        fc.property(standardQueueArn, (arn) => {
          const parsed = parseSQSQueueArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.isFifo).toBe(false);
            expect(parsed.queueName).not.toMatch(/\.fifo$/);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('parsed value contains original value', () => {
      fc.assert(
        fc.property(validSQSQueueArn, (arn) => {
          const parsed = parseSQSQueueArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid SQS Queue ARNs return null', () => {
      const invalidArns = fc.oneof(
        // Wrong service
        fc
          .tuple(validRegion, validAccountId, validQueueName)
          .map(
            ([region, accountId, queueName]) =>
              `arn:aws:sns:${region}:${accountId}:${queueName}`
          ),
        // Invalid account ID (not 12 digits)
        fc
          .tuple(validRegion, validQueueName)
          .map(
            ([region, queueName]) => `arn:aws:sqs:${region}:12345:${queueName}`
          ),
        // Invalid region format
        fc
          .tuple(validAccountId, validQueueName)
          .map(
            ([accountId, queueName]) =>
              `arn:aws:sqs:invalid-region:${accountId}:${queueName}`
          ),
        // Missing queue name
        fc
          .tuple(validRegion, validAccountId)
          .map(([region, accountId]) => `arn:aws:sqs:${region}:${accountId}:`),
        // Invalid queue name (contains invalid characters)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:sqs:${region}:${accountId}:invalid@queue`
          ),
        // Wrong ARN format (missing parts)
        fc
          .tuple(validRegion, validAccountId)
          .map(([region, accountId]) => `arn:aws:sqs:${region}:${accountId}`),
        // Not an ARN at all
        fc
          .string()
          .filter((s) => !s.startsWith('arn:aws:sqs:'))
      );

      fc.assert(
        fc.property(invalidArns, (invalidArn) => {
          const parsed = parseSQSQueueArn(invalidArn);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
