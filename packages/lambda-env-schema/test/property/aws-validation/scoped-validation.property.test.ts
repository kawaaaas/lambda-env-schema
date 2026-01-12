import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AWS_REGIONS } from '../../../src/aws/aws-regions';
import type { AWSValidationType } from '../../../src/aws/aws-validation-types';
import {
  formatScopeError,
  supportsScope,
  validateScope,
} from '../../../src/aws/scoped-validation';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALPHANUM = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

// Generator for valid AWS regions
const validRegionArb = fc.constantFrom(...AWS_REGIONS);

// Generator for valid 12-digit account IDs
const validAccountIdArb = fc
  .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
  .map(charArrayToString);

// DynamoDB table name characters
const DYNAMODB_TABLE_CHARS = [...ALPHANUM, '_', '-', '.'];

// Generator for valid DynamoDB table names (3-255 chars)
const validTableNameArb = fc
  .array(fc.constantFrom(...DYNAMODB_TABLE_CHARS), {
    minLength: 3,
    maxLength: 100,
  })
  .map(charArrayToString);

// Validation types that support scope
const SCOPE_SUPPORTING_TYPES: AWSValidationType[] = [
  'iam-role-arn',
  'iam-user-arn',
  'dynamodb-table-arn',
  'rds-endpoint',
  'sqs-queue-url',
  'sqs-queue-arn',
  'sns-topic-arn',
  'kms-key-arn',
  'secrets-manager-arn',
];

// Validation types that do NOT support scope
const NON_SCOPE_SUPPORTING_TYPES: AWSValidationType[] = [
  'aws-region',
  'aws-account-id',
  's3-bucket-name',
  's3-arn',
  'dynamodb-table-name',
  'rds-cluster-id',
  'lambda-function-name',
  'event-bus-name',
  'api-gateway-id',
  'vpc-id',
  'subnet-id',
  'security-group-id',
  'ec2-instance-id',
  'cloudfront-dist-id',
  'kms-key-id',
  'ssm-parameter-name',
];

describe('scoped validation', () => {
  describe('supportsScope', () => {
    it('returns true for validation types that support scope', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...SCOPE_SUPPORTING_TYPES),
          (validationType) => {
            expect(supportsScope(validationType)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns false for validation types that do not support scope', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...NON_SCOPE_SUPPORTING_TYPES),
          (validationType) => {
            expect(supportsScope(validationType)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validateScope with DynamoDB table ARN', () => {
    it('returns valid when region matches', () => {
      fc.assert(
        fc.property(
          validRegionArb,
          validAccountIdArb,
          validTableNameArb,
          (region, accountId, tableName) => {
            const arn = `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`;
            const result = validateScope(
              'TABLE_ARN',
              arn,
              'dynamodb-table-arn',
              {
                region,
              }
            );
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns valid when account ID matches', () => {
      fc.assert(
        fc.property(
          validRegionArb,
          validAccountIdArb,
          validTableNameArb,
          (region, accountId, tableName) => {
            const arn = `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`;
            const result = validateScope(
              'TABLE_ARN',
              arn,
              'dynamodb-table-arn',
              {
                accountId,
              }
            );
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns valid when both region and account ID match', () => {
      fc.assert(
        fc.property(
          validRegionArb,
          validAccountIdArb,
          validTableNameArb,
          (region, accountId, tableName) => {
            const arn = `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`;
            const result = validateScope(
              'TABLE_ARN',
              arn,
              'dynamodb-table-arn',
              {
                region,
                accountId,
              }
            );
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns error when region does not match', () => {
      fc.assert(
        fc.property(
          validRegionArb,
          validRegionArb,
          validAccountIdArb,
          validTableNameArb,
          (actualRegion, expectedRegion, accountId, tableName) => {
            fc.pre(actualRegion !== expectedRegion);
            const arn = `arn:aws:dynamodb:${actualRegion}:${accountId}:table/${tableName}`;
            const result = validateScope(
              'TABLE_ARN',
              arn,
              'dynamodb-table-arn',
              {
                region: expectedRegion,
              }
            );
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.errors).toHaveLength(1);
              expect(result.errors[0].key).toBe('TABLE_ARN');
              expect(result.errors[0].expected).toBe(expectedRegion);
              expect(result.errors[0].received).toBe(actualRegion);
              expect(result.errors[0].message).toContain('Region mismatch');
              expect(result.errors[0].message).toContain(expectedRegion);
              expect(result.errors[0].message).toContain(actualRegion);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns error when account ID does not match', () => {
      fc.assert(
        fc.property(
          validRegionArb,
          validAccountIdArb,
          validAccountIdArb,
          validTableNameArb,
          (region, actualAccountId, expectedAccountId, tableName) => {
            fc.pre(actualAccountId !== expectedAccountId);
            const arn = `arn:aws:dynamodb:${region}:${actualAccountId}:table/${tableName}`;
            const result = validateScope(
              'TABLE_ARN',
              arn,
              'dynamodb-table-arn',
              {
                accountId: expectedAccountId,
              }
            );
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.errors).toHaveLength(1);
              expect(result.errors[0].key).toBe('TABLE_ARN');
              expect(result.errors[0].expected).toBe(expectedAccountId);
              expect(result.errors[0].received).toBe(actualAccountId);
              expect(result.errors[0].message).toContain('Account ID mismatch');
              expect(result.errors[0].message).toContain(expectedAccountId);
              expect(result.errors[0].message).toContain(actualAccountId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns two errors when both region and account ID do not match', () => {
      fc.assert(
        fc.property(
          validRegionArb,
          validRegionArb,
          validAccountIdArb,
          validAccountIdArb,
          validTableNameArb,
          (
            actualRegion,
            expectedRegion,
            actualAccountId,
            expectedAccountId,
            tableName
          ) => {
            fc.pre(
              actualRegion !== expectedRegion &&
                actualAccountId !== expectedAccountId
            );
            const arn = `arn:aws:dynamodb:${actualRegion}:${actualAccountId}:table/${tableName}`;
            const result = validateScope(
              'TABLE_ARN',
              arn,
              'dynamodb-table-arn',
              {
                region: expectedRegion,
                accountId: expectedAccountId,
              }
            );
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.errors).toHaveLength(2);
              // First error should be region mismatch
              expect(result.errors[0].message).toContain('Region mismatch');
              // Second error should be account ID mismatch
              expect(result.errors[1].message).toContain('Account ID mismatch');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validateScope ignores scope for non-supporting types', () => {
    it('returns valid for s3-bucket-name regardless of scope', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/),
          validRegionArb,
          validAccountIdArb,
          (bucketName, region, accountId) => {
            const result = validateScope(
              'BUCKET_NAME',
              bucketName,
              's3-bucket-name',
              {
                region,
                accountId,
              }
            );
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns valid for dynamodb-table-name regardless of scope', () => {
      fc.assert(
        fc.property(
          validTableNameArb,
          validRegionArb,
          validAccountIdArb,
          (tableName, region, accountId) => {
            const result = validateScope(
              'TABLE_NAME',
              tableName,
              'dynamodb-table-name',
              {
                region,
                accountId,
              }
            );
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('formatScopeError', () => {
    it('formats region mismatch errors correctly', () => {
      fc.assert(
        fc.property(validRegionArb, validRegionArb, (expected, actual) => {
          const message = formatScopeError('region', expected, actual);
          expect(message).toBe(
            `Region mismatch: expected "${expected}", got "${actual}"`
          );
        }),
        { numRuns: 100 }
      );
    });

    it('formats account ID mismatch errors correctly', () => {
      fc.assert(
        fc.property(
          validAccountIdArb,
          validAccountIdArb,
          (expected, actual) => {
            const message = formatScopeError('accountId', expected, actual);
            expect(message).toBe(
              `Account ID mismatch: expected "${expected}", got "${actual}"`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
