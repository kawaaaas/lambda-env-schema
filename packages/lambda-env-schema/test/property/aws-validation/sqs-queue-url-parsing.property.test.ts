import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseSQSQueueUrl } from '../../../src/aws/sqs-validators';

describe('SQS Queue URL parsing property tests', () => {
  describe('Property 4: SQS Queue URL Parsing', () => {
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

    // Generator for standard (non-FIFO) SQS Queue URLs
    const standardQueueUrl = fc
      .tuple(validRegion, validAccountId, validQueueName)
      .map(
        ([region, accountId, queueName]) =>
          `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
      );

    // Generator for FIFO SQS Queue URLs
    const fifoQueueUrl = fc
      .tuple(validRegion, validAccountId, validFifoQueueName)
      .map(
        ([region, accountId, queueName]) =>
          `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
      );

    // Generator for all valid SQS Queue URLs
    const validSQSQueueUrl = fc.oneof(standardQueueUrl, fifoQueueUrl);

    it('when value is valid, parsed result contains queueName extracted from the URL', () => {
      fc.assert(
        fc.property(validSQSQueueUrl, (url) => {
          const parsed = parseSQSQueueUrl(url);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected queue name from URL
            const match = url.match(/\/\d{12}\/([\w-]+(\.fifo)?)$/);
            expect(match).not.toBeNull();
            if (match) {
              expect(parsed.queueName).toBe(match[1]);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains accountId extracted from the URL', () => {
      fc.assert(
        fc.property(validSQSQueueUrl, (url) => {
          const parsed = parseSQSQueueUrl(url);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected account ID from URL
            const match = url.match(/\/(\d{12})\//);
            expect(match).not.toBeNull();
            if (match) {
              expect(parsed.accountId).toBe(match[1]);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains region extracted from the URL', () => {
      fc.assert(
        fc.property(validSQSQueueUrl, (url) => {
          const parsed = parseSQSQueueUrl(url);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected region from URL
            const match = url.match(
              /^https:\/\/sqs\.([a-z]{2}-[a-z]+-\d)\.amazonaws\.com\//
            );
            expect(match).not.toBeNull();
            if (match) {
              expect(parsed.region).toBe(match[1]);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('isFifo is true if and only if the queue name ends with .fifo', () => {
      fc.assert(
        fc.property(validSQSQueueUrl, (url) => {
          const parsed = parseSQSQueueUrl(url);

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
        fc.property(fifoQueueUrl, (url) => {
          const parsed = parseSQSQueueUrl(url);

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
        fc.property(standardQueueUrl, (url) => {
          const parsed = parseSQSQueueUrl(url);

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
        fc.property(validSQSQueueUrl, (url) => {
          const parsed = parseSQSQueueUrl(url);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(url);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid SQS Queue URLs return null', () => {
      const invalidUrls = fc.oneof(
        // Wrong protocol
        fc
          .tuple(validRegion, validAccountId, validQueueName)
          .map(
            ([region, accountId, queueName]) =>
              `http://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
          ),
        // Wrong service
        fc
          .tuple(validRegion, validAccountId, validQueueName)
          .map(
            ([region, accountId, queueName]) =>
              `https://sns.${region}.amazonaws.com/${accountId}/${queueName}`
          ),
        // Invalid account ID (not 12 digits)
        fc
          .tuple(validRegion, validQueueName)
          .map(
            ([region, queueName]) =>
              `https://sqs.${region}.amazonaws.com/12345/${queueName}`
          ),
        // Invalid region format
        fc
          .tuple(validAccountId, validQueueName)
          .map(
            ([accountId, queueName]) =>
              `https://sqs.invalid-region.amazonaws.com/${accountId}/${queueName}`
          ),
        // Missing queue name
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `https://sqs.${region}.amazonaws.com/${accountId}/`
          ),
        // Invalid queue name (contains invalid characters)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `https://sqs.${region}.amazonaws.com/${accountId}/invalid@queue`
          ),
        // Not a URL at all
        fc
          .string()
          .filter((s) => !s.startsWith('https://sqs.'))
      );

      fc.assert(
        fc.property(invalidUrls, (invalidUrl) => {
          const parsed = parseSQSQueueUrl(invalidUrl);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
