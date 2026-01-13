import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseDynamoDBTableArn } from '../../../src/aws/dynamodb-validators';

describe('DynamoDB Table ARN parsing property tests', () => {
  describe('Property 7: DynamoDB Table ARN Parsing', () => {
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

    // Generator for valid DynamoDB table names (3-255 chars, alphanumeric plus _.- )
    const validTableName = fc
      .string({ minLength: 3, maxLength: 255 })
      .filter((name) => /^[a-zA-Z0-9_.-]+$/.test(name))
      .map((name) => name || 'default-table'); // Ensure non-empty

    // Generator for valid DynamoDB Table ARNs
    const validDynamoDBTableArn = fc
      .tuple(validRegion, validAccountId, validTableName)
      .map(
        ([region, accountId, tableName]) =>
          `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`
      );

    it('when value is valid, parsed result contains tableName extracted from the ARN', () => {
      fc.assert(
        fc.property(validDynamoDBTableArn, (arn) => {
          const parsed = parseDynamoDBTableArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected table name from ARN
            const match = arn.match(/table\/([^/]+)$/);
            expect(match).not.toBeNull();
            if (match) {
              const expectedTableName = match[1];
              expect(parsed.tableName).toBe(expectedTableName);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains region extracted from the ARN', () => {
      fc.assert(
        fc.property(validDynamoDBTableArn, (arn) => {
          const parsed = parseDynamoDBTableArn(arn);

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
        fc.property(validDynamoDBTableArn, (arn) => {
          const parsed = parseDynamoDBTableArn(arn);

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
        fc.property(validDynamoDBTableArn, (arn) => {
          const parsed = parseDynamoDBTableArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid DynamoDB Table ARNs return null', () => {
      const invalidArns = fc.oneof(
        // Wrong service
        fc
          .tuple(validRegion, validAccountId, validTableName)
          .map(
            ([region, accountId, tableName]) =>
              `arn:aws:s3:${region}:${accountId}:table/${tableName}`
          ),
        // Invalid account ID (not 12 digits)
        fc
          .tuple(validRegion, validTableName)
          .map(
            ([region, tableName]) =>
              `arn:aws:dynamodb:${region}:12345:table/${tableName}`
          ),
        // Invalid region format
        fc
          .tuple(validAccountId, validTableName)
          .map(
            ([accountId, tableName]) =>
              `arn:aws:dynamodb:invalid-region:${accountId}:table/${tableName}`
          ),
        // Missing table name
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:dynamodb:${region}:${accountId}:table/`
          ),
        // Invalid table name (too short)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:dynamodb:${region}:${accountId}:table/ab`
          ),
        // Invalid table name (contains invalid characters)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:dynamodb:${region}:${accountId}:table/invalid@table`
          ),
        // Wrong resource type
        fc
          .tuple(validRegion, validAccountId, validTableName)
          .map(
            ([region, accountId, tableName]) =>
              `arn:aws:dynamodb:${region}:${accountId}:stream/${tableName}`
          ),
        // Wrong ARN format (missing parts)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) => `arn:aws:dynamodb:${region}:${accountId}`
          ),
        // Not an ARN at all
        fc
          .string()
          .filter((s) => !s.startsWith('arn:aws:dynamodb:'))
      );

      fc.assert(
        fc.property(invalidArns, (invalidArn) => {
          const parsed = parseDynamoDBTableArn(invalidArn);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
