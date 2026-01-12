import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AWS_REGIONS } from '../../../src/aws/aws-regions';
import {
    extractAccountIdFromDynamoDBArn,
    extractRegionFromDynamoDBArn,
    isValidDynamoDBTableArn,
    isValidDynamoDBTableName,
} from '../../../src/aws/dynamodb-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALPHANUM = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

describe('dynamodb-table-name validation', () => {
  // DynamoDB table name characters: alphanumeric, underscore, hyphen, period
  const DYNAMODB_TABLE_CHARS = [...ALPHANUM, '_', '-', '.'];

  // Generator for valid DynamoDB table names (3-255 chars)
  const validTableNameArb = fc
    .array(fc.constantFrom(...DYNAMODB_TABLE_CHARS), {
      minLength: 3,
      maxLength: 255,
    })
    .map(charArrayToString);

  it('accepts valid DynamoDB table names', () => {
    fc.assert(
      fc.property(validTableNameArb, (tableName) => {
        expect(isValidDynamoDBTableName(tableName)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects table names shorter than 3 characters', () => {
    const shortNameArb = fc
      .array(fc.constantFrom(...DYNAMODB_TABLE_CHARS), {
        minLength: 1,
        maxLength: 2,
      })
      .map(charArrayToString);

    fc.assert(
      fc.property(shortNameArb, (shortName) => {
        expect(isValidDynamoDBTableName(shortName)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects table names longer than 255 characters', () => {
    const longNameArb = fc
      .array(fc.constantFrom(...DYNAMODB_TABLE_CHARS), {
        minLength: 256,
        maxLength: 300,
      })
      .map(charArrayToString);

    fc.assert(
      fc.property(longNameArb, (longName) => {
        expect(isValidDynamoDBTableName(longName)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects table names with invalid characters', () => {
    const invalidCharsArb = fc
      .tuple(
        fc
          .array(fc.constantFrom(...DYNAMODB_TABLE_CHARS), {
            minLength: 1,
            maxLength: 100,
          })
          .map(charArrayToString),
        fc.constantFrom('@', '#', '$', '%', '&', '*', '!', ' ', '/', '\\'),
        fc
          .array(fc.constantFrom(...DYNAMODB_TABLE_CHARS), {
            minLength: 1,
            maxLength: 100,
          })
          .map(charArrayToString)
      )
      .map(
        ([before, invalidChar, after]) => `${before}${invalidChar}${after}`
      )
      .filter((name) => name.length >= 3 && name.length <= 255);

    fc.assert(
      fc.property(invalidCharsArb, (name) => {
        expect(isValidDynamoDBTableName(name)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('dynamodb-table-arn validation', () => {
  // Generator for valid AWS regions (simplified format: xx-xxxx-N)
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

  // Generator for valid DynamoDB table ARNs
  const validDynamoDBTableArnArb = fc
    .tuple(validRegionArb, validAccountIdArb, validTableNameArb)
    .map(
      ([region, accountId, tableName]) =>
        `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`
    );

  it('accepts valid DynamoDB table ARNs', () => {
    fc.assert(
      fc.property(validDynamoDBTableArnArb, (arn) => {
        expect(isValidDynamoDBTableArn(arn)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with wrong service', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validTableNameArb,
        (region, accountId, tableName) => {
          const wrongServiceArn = `arn:aws:s3:${region}:${accountId}:table/${tableName}`;
          expect(isValidDynamoDBTableArn(wrongServiceArn)).toBe(false);
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
        validTableNameArb,
        (region, invalidAccountId, tableName) => {
          const invalidArn = `arn:aws:dynamodb:${region}:${invalidAccountId}:table/${tableName}`;
          expect(isValidDynamoDBTableArn(invalidArn)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts region correctly from valid DynamoDB table ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validTableNameArb,
        (region, accountId, tableName) => {
          const arn = `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`;
          expect(extractRegionFromDynamoDBArn(arn)).toBe(region);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts account ID correctly from valid DynamoDB table ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validTableNameArb,
        (region, accountId, tableName) => {
          const arn = `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`;
          expect(extractAccountIdFromDynamoDBArn(arn)).toBe(accountId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
