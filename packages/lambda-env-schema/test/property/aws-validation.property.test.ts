import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  AWS_REGIONS,
  extractAccountIdFromDynamoDBArn,
  extractAccountIdFromIAMArn,
  extractAccountIdFromSNSTopicArn,
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromDynamoDBArn,
  extractRegionFromRDSEndpoint,
  extractRegionFromSNSTopicArn,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
  isValidAWSAccountId,
  isValidAWSRegion,
  isValidDynamoDBTableArn,
  isValidDynamoDBTableName,
  isValidEventBusName,
  isValidIAMRoleArn,
  isValidIAMUserArn,
  isValidLambdaFunctionName,
  isValidRDSClusterId,
  isValidRDSEndpoint,
  isValidS3Arn,
  isValidS3BucketName,
  isValidSNSTopicArn,
  isValidSQSQueueArn,
  isValidSQSQueueUrl,
} from '../../src/aws/aws-validation-types';

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALPHANUM = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS];
const LOWER_ALPHANUM = [...LOWER_ALPHA, ...DIGITS];
const IAM_NAME_CHARS = [
  ...UPPER_ALPHA,
  ...LOWER_ALPHA,
  ...DIGITS,
  '+',
  '=',
  ',',
  '.',
  '@',
  '_',
  '-',
];
const S3_BUCKET_CHARS = [...LOWER_ALPHA, ...DIGITS, '-'];

describe('AWS validation property tests', () => {
  describe('aws-region validation', () => {
    it('accepts all valid AWS regions', () => {
      fc.assert(
        fc.property(fc.constantFrom(...AWS_REGIONS), (region) => {
          expect(isValidAWSRegion(region)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects strings not in the AWS regions list', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1 })
            .filter(
              (s) => !AWS_REGIONS.includes(s as (typeof AWS_REGIONS)[number])
            ),
          (invalidRegion) => {
            expect(isValidAWSRegion(invalidRegion)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects empty strings', () => {
      expect(isValidAWSRegion('')).toBe(false);
    });

    it('rejects region-like strings with typos', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'us-east-99',
            'ap-northeast-99',
            'eu-west-99',
            'us-weast-1',
            'ap-north-1',
            'eu-central-99'
          ),
          (typoRegion) => {
            expect(isValidAWSRegion(typoRegion)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('aws-account-id validation', () => {
    // Generator for valid 12-digit account IDs
    const validAccountIdArb = fc
      .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
      .map(charArrayToString);

    it('accepts exactly 12-digit strings', () => {
      fc.assert(
        fc.property(validAccountIdArb, (accountId) => {
          expect(isValidAWSAccountId(accountId)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects strings with non-digit characters', () => {
      const invalidAccountIdArb = fc
        .string({ minLength: 12, maxLength: 12 })
        .filter((s) => /[^0-9]/.test(s));

      fc.assert(
        fc.property(invalidAccountIdArb, (invalidAccountId) => {
          expect(isValidAWSAccountId(invalidAccountId)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects strings with incorrect length', () => {
      const wrongLengthArb = fc
        .array(fc.constantFrom(...DIGITS), { minLength: 1, maxLength: 20 })
        .map(charArrayToString)
        .filter((s) => s.length !== 12);

      fc.assert(
        fc.property(wrongLengthArb, (wrongLength) => {
          expect(isValidAWSAccountId(wrongLength)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('iam-role-arn validation', () => {
    const validRoleNameArb = fc
      .array(fc.constantFrom(...IAM_NAME_CHARS), {
        minLength: 1,
        maxLength: 64,
      })
      .map(charArrayToString);

    const validAccountIdArb = fc
      .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
      .map(charArrayToString);

    const validIAMRoleArnArb = fc
      .tuple(validAccountIdArb, validRoleNameArb)
      .map(
        ([accountId, roleName]) => `arn:aws:iam::${accountId}:role/${roleName}`
      );

    it('accepts valid IAM Role ARN format', () => {
      fc.assert(
        fc.property(validIAMRoleArnArb, (arn) => {
          expect(isValidIAMRoleArn(arn)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects ARNs with wrong resource type', () => {
      fc.assert(
        fc.property(
          validAccountIdArb,
          validRoleNameArb,
          (accountId, roleName) => {
            const wrongTypeArn = `arn:aws:iam::${accountId}:user/${roleName}`;
            expect(isValidIAMRoleArn(wrongTypeArn)).toBe(false);
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
          invalidAccountIdArb,
          validRoleNameArb,
          (invalidAccountId, roleName) => {
            const invalidArn = `arn:aws:iam::${invalidAccountId}:role/${roleName}`;
            expect(isValidIAMRoleArn(invalidArn)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('extracts account ID correctly from valid IAM Role ARN', () => {
      fc.assert(
        fc.property(
          validAccountIdArb,
          validRoleNameArb,
          (accountId, roleName) => {
            const arn = `arn:aws:iam::${accountId}:role/${roleName}`;
            expect(extractAccountIdFromIAMArn(arn)).toBe(accountId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('iam-user-arn validation', () => {
    const validUserNameArb = fc
      .array(fc.constantFrom(...IAM_NAME_CHARS), {
        minLength: 1,
        maxLength: 64,
      })
      .map(charArrayToString);

    const validAccountIdArb = fc
      .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
      .map(charArrayToString);

    const validIAMUserArnArb = fc
      .tuple(validAccountIdArb, validUserNameArb)
      .map(
        ([accountId, userName]) => `arn:aws:iam::${accountId}:user/${userName}`
      );

    it('accepts valid IAM User ARN format', () => {
      fc.assert(
        fc.property(validIAMUserArnArb, (arn) => {
          expect(isValidIAMUserArn(arn)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects ARNs with wrong resource type', () => {
      fc.assert(
        fc.property(
          validAccountIdArb,
          validUserNameArb,
          (accountId, userName) => {
            const wrongTypeArn = `arn:aws:iam::${accountId}:role/${userName}`;
            expect(isValidIAMUserArn(wrongTypeArn)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('extracts account ID correctly from valid IAM User ARN', () => {
      fc.assert(
        fc.property(
          validAccountIdArb,
          validUserNameArb,
          (accountId, userName) => {
            const arn = `arn:aws:iam::${accountId}:user/${userName}`;
            expect(extractAccountIdFromIAMArn(arn)).toBe(accountId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('s3-bucket-name validation', () => {
    // Generator for valid S3 bucket names
    // Rules: 3-63 chars, lowercase letters/numbers/hyphens, no start/end hyphen, no consecutive hyphens
    const validS3BucketNameArb = fc
      .tuple(
        // First character: lowercase letter or digit (not hyphen)
        fc.constantFrom(...LOWER_ALPHANUM),
        // Middle characters: lowercase letters, digits, or single hyphens (no consecutive)
        fc
          .array(fc.constantFrom(...S3_BUCKET_CHARS), {
            minLength: 1,
            maxLength: 60,
          })
          .map((chars) => {
            // Remove consecutive hyphens
            const result: string[] = [];
            for (const char of chars) {
              if (char === '-' && result[result.length - 1] === '-') {
                continue;
              }
              result.push(char);
            }
            return result.join('');
          }),
        // Last character: lowercase letter or digit (not hyphen)
        fc.constantFrom(...LOWER_ALPHANUM)
      )
      .map(([first, middle, last]) => first + middle + last)
      .filter((name) => {
        // Ensure length is 3-63
        if (name.length < 3 || name.length > 63) return false;
        // Ensure no consecutive hyphens
        if (name.includes('--')) return false;
        // Ensure no reserved prefixes/suffixes
        if (name.startsWith('xn--')) return false;
        if (name.endsWith('-s3alias') || name.endsWith('--ol-s3')) return false;
        return true;
      });

    it('accepts valid S3 bucket names', () => {
      fc.assert(
        fc.property(validS3BucketNameArb, (bucketName) => {
          expect(isValidS3BucketName(bucketName)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects bucket names shorter than 3 characters', () => {
      const shortNameArb = fc
        .array(fc.constantFrom(...LOWER_ALPHANUM), {
          minLength: 1,
          maxLength: 2,
        })
        .map(charArrayToString);

      fc.assert(
        fc.property(shortNameArb, (shortName) => {
          expect(isValidS3BucketName(shortName)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects bucket names longer than 63 characters', () => {
      const longNameArb = fc
        .array(fc.constantFrom(...LOWER_ALPHANUM), {
          minLength: 64,
          maxLength: 100,
        })
        .map(charArrayToString);

      fc.assert(
        fc.property(longNameArb, (longName) => {
          expect(isValidS3BucketName(longName)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects bucket names starting with hyphen', () => {
      const hyphenStartArb = fc
        .array(fc.constantFrom(...LOWER_ALPHANUM), {
          minLength: 2,
          maxLength: 62,
        })
        .map((chars) => `-${chars.join('')}`);

      fc.assert(
        fc.property(hyphenStartArb, (name) => {
          expect(isValidS3BucketName(name)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects bucket names ending with hyphen', () => {
      const hyphenEndArb = fc
        .array(fc.constantFrom(...LOWER_ALPHANUM), {
          minLength: 2,
          maxLength: 62,
        })
        .map((chars) => `${chars.join('')}-`);

      fc.assert(
        fc.property(hyphenEndArb, (name) => {
          expect(isValidS3BucketName(name)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects bucket names with consecutive hyphens', () => {
      const consecutiveHyphenArb = fc
        .tuple(
          fc
            .array(fc.constantFrom(...LOWER_ALPHANUM), {
              minLength: 1,
              maxLength: 30,
            })
            .map(charArrayToString),
          fc
            .array(fc.constantFrom(...LOWER_ALPHANUM), {
              minLength: 1,
              maxLength: 30,
            })
            .map(charArrayToString)
        )
        .map(([before, after]) => `${before}--${after}`)
        .filter((name) => name.length >= 3 && name.length <= 63);

      fc.assert(
        fc.property(consecutiveHyphenArb, (name) => {
          expect(isValidS3BucketName(name)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects bucket names formatted as IP addresses', () => {
      const ipAddressArb = fc
        .tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        )
        .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

      fc.assert(
        fc.property(ipAddressArb, (ipAddress) => {
          expect(isValidS3BucketName(ipAddress)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects bucket names starting with xn--', () => {
      const xnPrefixArb = fc
        .array(fc.constantFrom(...LOWER_ALPHANUM), {
          minLength: 1,
          maxLength: 59,
        })
        .map((chars) => `xn--${chars.join('')}`)
        .filter((name) => name.length >= 3 && name.length <= 63);

      fc.assert(
        fc.property(xnPrefixArb, (name) => {
          expect(isValidS3BucketName(name)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects bucket names ending with -s3alias', () => {
      const s3aliasSuffixArb = fc
        .array(fc.constantFrom(...LOWER_ALPHANUM), {
          minLength: 1,
          maxLength: 55,
        })
        .map((chars) => `${chars.join('')}-s3alias`)
        .filter((name) => name.length >= 3 && name.length <= 63);

      fc.assert(
        fc.property(s3aliasSuffixArb, (name) => {
          expect(isValidS3BucketName(name)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects bucket names with uppercase characters', () => {
      const uppercaseArb = fc
        .array(
          fc.constantFrom(...[...LOWER_ALPHA, ...UPPER_ALPHA, ...DIGITS]),
          { minLength: 3, maxLength: 63 }
        )
        .map(charArrayToString)
        .filter((s) => /[A-Z]/.test(s));

      fc.assert(
        fc.property(uppercaseArb, (name) => {
          expect(isValidS3BucketName(name)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('s3-arn validation', () => {
    // Generator for valid S3 bucket names (simplified for ARN testing)
    const validBucketNameForArnArb = fc
      .tuple(
        fc.constantFrom(...LOWER_ALPHANUM),
        fc
          .array(fc.constantFrom(...[...LOWER_ALPHANUM, '.']), {
            minLength: 1,
            maxLength: 60,
          })
          .map(charArrayToString),
        fc.constantFrom(...LOWER_ALPHANUM)
      )
      .map(([first, middle, last]) => first + middle + last)
      .filter((name) => name.length >= 3 && name.length <= 63);

    // Generator for valid S3 bucket ARNs
    const validS3BucketArnArb = validBucketNameForArnArb.map(
      (bucketName) => `arn:aws:s3:::${bucketName}`
    );

    // Generator for valid S3 object ARNs
    const validS3ObjectArnArb = fc
      .tuple(
        validBucketNameForArnArb,
        fc
          .string({ minLength: 1, maxLength: 100 })
          .filter((s) => !s.includes('\n') && !s.includes('\r'))
      )
      .map(
        ([bucketName, objectKey]) => `arn:aws:s3:::${bucketName}/${objectKey}`
      );

    it('accepts valid S3 bucket ARNs', () => {
      fc.assert(
        fc.property(validS3BucketArnArb, (arn) => {
          expect(isValidS3Arn(arn)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('accepts valid S3 object ARNs', () => {
      fc.assert(
        fc.property(validS3ObjectArnArb, (arn) => {
          expect(isValidS3Arn(arn)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects ARNs with wrong service', () => {
      const wrongServiceArb = fc
        .constantFrom('dynamodb', 'lambda', 'sqs', 'sns', 'ec2')
        .chain((service) =>
          validBucketNameForArnArb.map(
            (bucketName) => `arn:aws:${service}:::${bucketName}`
          )
        );

      fc.assert(
        fc.property(wrongServiceArb, (arn) => {
          expect(isValidS3Arn(arn)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects non-ARN strings', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1 })
            .filter((s) => !s.startsWith('arn:aws:s3:::')),
          (nonArn) => {
            expect(isValidS3Arn(nonArn)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects ARNs with bucket names starting with hyphen', () => {
      const invalidBucketArnArb = fc
        .array(fc.constantFrom(...LOWER_ALPHANUM), {
          minLength: 2,
          maxLength: 62,
        })
        .map((chars) => `arn:aws:s3:::-${chars.join('')}`);

      fc.assert(
        fc.property(invalidBucketArnArb, (arn) => {
          expect(isValidS3Arn(arn)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

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

  describe('rds-endpoint validation', () => {
    // Generator for valid AWS regions
    const validRegionArb = fc.constantFrom(...AWS_REGIONS);

    // Generator for valid RDS identifier (alphanumeric and hyphens)
    const validIdentifierArb = fc
      .array(fc.constantFrom(...[...LOWER_ALPHA, ...DIGITS, '-']), {
        minLength: 1,
        maxLength: 30,
      })
      .map(charArrayToString)
      .filter(
        (s) => !s.startsWith('-') && !s.endsWith('-') && !s.includes('--')
      );

    // Generator for random ID portion
    const randomIdArb = fc
      .array(fc.constantFrom(...[...LOWER_ALPHA, ...DIGITS]), {
        minLength: 5,
        maxLength: 15,
      })
      .map(charArrayToString);

    // Generator for valid RDS endpoints
    const validRDSEndpointArb = fc
      .tuple(validIdentifierArb, randomIdArb, validRegionArb)
      .map(
        ([identifier, randomId, region]) =>
          `${identifier}.${randomId}.${region}.rds.amazonaws.com`
      );

    it('accepts valid RDS endpoints', () => {
      fc.assert(
        fc.property(validRDSEndpointArb, (endpoint) => {
          expect(isValidRDSEndpoint(endpoint)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects endpoints with wrong service suffix', () => {
      fc.assert(
        fc.property(
          validIdentifierArb,
          randomIdArb,
          validRegionArb,
          (identifier, randomId, region) => {
            const wrongServiceEndpoint = `${identifier}.${randomId}.${region}.ec2.amazonaws.com`;
            expect(isValidRDSEndpoint(wrongServiceEndpoint)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects endpoints with invalid region format', () => {
      const invalidRegionArb = fc
        .string({ minLength: 1, maxLength: 20 })
        .filter((s) => !/^[a-z]{2}-[a-z]+-\d$/.test(s));

      fc.assert(
        fc.property(
          validIdentifierArb,
          randomIdArb,
          invalidRegionArb,
          (identifier, randomId, invalidRegion) => {
            const invalidEndpoint = `${identifier}.${randomId}.${invalidRegion}.rds.amazonaws.com`;
            expect(isValidRDSEndpoint(invalidEndpoint)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('extracts region correctly from valid RDS endpoint', () => {
      fc.assert(
        fc.property(
          validIdentifierArb,
          randomIdArb,
          validRegionArb,
          (identifier, randomId, region) => {
            const endpoint = `${identifier}.${randomId}.${region}.rds.amazonaws.com`;
            expect(extractRegionFromRDSEndpoint(endpoint)).toBe(region);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('rds-cluster-id validation', () => {
    // Generator for valid RDS cluster IDs
    // Rules: 1-63 chars, starts with letter, alphanumeric + hyphens, no trailing hyphen, no consecutive hyphens
    const validClusterIdArb = fc
      .tuple(
        // First character: must be a letter
        fc.constantFrom(...[...UPPER_ALPHA, ...LOWER_ALPHA]),
        // Middle characters: alphanumeric or single hyphens (no consecutive)
        fc
          .array(fc.constantFrom(...[...ALPHANUM, '-']), {
            minLength: 0,
            maxLength: 61,
          })
          .map((chars) => {
            // Remove consecutive hyphens
            const result: string[] = [];
            for (const char of chars) {
              if (char === '-' && result[result.length - 1] === '-') {
                continue;
              }
              result.push(char);
            }
            return result.join('');
          })
      )
      .map(([first, rest]) => first + rest)
      .filter((id) => {
        // Ensure length is 1-63
        if (id.length < 1 || id.length > 63) return false;
        // Ensure no trailing hyphen
        if (id.endsWith('-')) return false;
        // Ensure no consecutive hyphens
        if (id.includes('--')) return false;
        return true;
      });

    it('accepts valid RDS cluster IDs', () => {
      fc.assert(
        fc.property(validClusterIdArb, (clusterId) => {
          expect(isValidRDSClusterId(clusterId)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects cluster IDs not starting with a letter', () => {
      const invalidStartArb = fc
        .tuple(
          fc.constantFrom(...[...DIGITS, '-']),
          fc
            .array(fc.constantFrom(...ALPHANUM), {
              minLength: 0,
              maxLength: 62,
            })
            .map(charArrayToString)
        )
        .map(([first, rest]) => first + rest)
        .filter((id) => id.length >= 1 && id.length <= 63);

      fc.assert(
        fc.property(invalidStartArb, (clusterId) => {
          expect(isValidRDSClusterId(clusterId)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects cluster IDs ending with hyphen', () => {
      const hyphenEndArb = fc
        .tuple(
          fc.constantFrom(...[...UPPER_ALPHA, ...LOWER_ALPHA]),
          fc
            .array(fc.constantFrom(...ALPHANUM), {
              minLength: 0,
              maxLength: 61,
            })
            .map(charArrayToString)
        )
        .map(([first, rest]) => `${first}${rest}-`)
        .filter((id) => id.length >= 1 && id.length <= 63);

      fc.assert(
        fc.property(hyphenEndArb, (clusterId) => {
          expect(isValidRDSClusterId(clusterId)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects cluster IDs with consecutive hyphens', () => {
      const consecutiveHyphenArb = fc
        .tuple(
          fc.constantFrom(...[...UPPER_ALPHA, ...LOWER_ALPHA]),
          fc
            .array(fc.constantFrom(...ALPHANUM), {
              minLength: 1,
              maxLength: 30,
            })
            .map(charArrayToString),
          fc
            .array(fc.constantFrom(...ALPHANUM), {
              minLength: 1,
              maxLength: 30,
            })
            .map(charArrayToString)
        )
        .map(([first, before, after]) => `${first}${before}--${after}`)
        .filter((id) => id.length >= 1 && id.length <= 63);

      fc.assert(
        fc.property(consecutiveHyphenArb, (clusterId) => {
          expect(isValidRDSClusterId(clusterId)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects cluster IDs longer than 63 characters', () => {
      const longIdArb = fc
        .tuple(
          fc.constantFrom(...[...UPPER_ALPHA, ...LOWER_ALPHA]),
          fc
            .array(fc.constantFrom(...ALPHANUM), {
              minLength: 63,
              maxLength: 100,
            })
            .map(charArrayToString)
        )
        .map(([first, rest]) => first + rest);

      fc.assert(
        fc.property(longIdArb, (clusterId) => {
          expect(isValidRDSClusterId(clusterId)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects cluster IDs with invalid characters', () => {
      const invalidCharsArb = fc
        .tuple(
          fc.constantFrom(...[...UPPER_ALPHA, ...LOWER_ALPHA]),
          fc
            .array(fc.constantFrom(...ALPHANUM), {
              minLength: 1,
              maxLength: 30,
            })
            .map(charArrayToString),
          fc.constantFrom('_', '.', '@', '#', '$', '%', '&', '*', '!', ' '),
          fc
            .array(fc.constantFrom(...ALPHANUM), {
              minLength: 1,
              maxLength: 30,
            })
            .map(charArrayToString)
        )
        .map(
          ([first, before, invalidChar, after]) =>
            `${first}${before}${invalidChar}${after}`
        )
        .filter((id) => id.length >= 1 && id.length <= 63);

      fc.assert(
        fc.property(invalidCharsArb, (clusterId) => {
          expect(isValidRDSClusterId(clusterId)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('lambda-function-name validation', () => {
    // Lambda function name characters: alphanumeric, hyphens, underscores
    const LAMBDA_NAME_CHARS = [...ALPHANUM, '-', '_'];

    // Generator for valid Lambda function names (1-64 chars)
    const validFunctionNameArb = fc
      .array(fc.constantFrom(...LAMBDA_NAME_CHARS), {
        minLength: 1,
        maxLength: 64,
      })
      .map(charArrayToString);

    it('accepts valid Lambda function names', () => {
      fc.assert(
        fc.property(validFunctionNameArb, (functionName) => {
          expect(isValidLambdaFunctionName(functionName)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects function names longer than 64 characters', () => {
      const longNameArb = fc
        .array(fc.constantFrom(...LAMBDA_NAME_CHARS), {
          minLength: 65,
          maxLength: 100,
        })
        .map(charArrayToString);

      fc.assert(
        fc.property(longNameArb, (longName) => {
          expect(isValidLambdaFunctionName(longName)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects empty function names', () => {
      expect(isValidLambdaFunctionName('')).toBe(false);
    });

    it('rejects function names with invalid characters', () => {
      const invalidCharsArb = fc
        .tuple(
          fc
            .array(fc.constantFrom(...LAMBDA_NAME_CHARS), {
              minLength: 1,
              maxLength: 30,
            })
            .map(charArrayToString),
          fc.constantFrom('.', '@', '#', '$', '%', '&', '*', '!', ' ', '/'),
          fc
            .array(fc.constantFrom(...LAMBDA_NAME_CHARS), {
              minLength: 1,
              maxLength: 30,
            })
            .map(charArrayToString)
        )
        .map(
          ([before, invalidChar, after]) => `${before}${invalidChar}${after}`
        )
        .filter((name) => name.length >= 1 && name.length <= 64);

      fc.assert(
        fc.property(invalidCharsArb, (name) => {
          expect(isValidLambdaFunctionName(name)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

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

  describe('event-bus-name validation', () => {
    // EventBridge event bus name characters: alphanumeric, hyphens, underscores, periods, forward slashes
    const EVENT_BUS_NAME_CHARS = [...ALPHANUM, '-', '_', '.', '/'];

    // Generator for valid custom event bus names (1-256 chars)
    const validCustomBusNameArb = fc
      .array(fc.constantFrom(...EVENT_BUS_NAME_CHARS), {
        minLength: 1,
        maxLength: 256,
      })
      .map(charArrayToString);

    it('accepts "default" event bus name', () => {
      expect(isValidEventBusName('default')).toBe(true);
    });

    it('accepts valid custom event bus names', () => {
      fc.assert(
        fc.property(validCustomBusNameArb, (busName) => {
          expect(isValidEventBusName(busName)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects event bus names longer than 256 characters', () => {
      const longNameArb = fc
        .array(fc.constantFrom(...EVENT_BUS_NAME_CHARS), {
          minLength: 257,
          maxLength: 300,
        })
        .map(charArrayToString);

      fc.assert(
        fc.property(longNameArb, (longName) => {
          expect(isValidEventBusName(longName)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects empty event bus names', () => {
      expect(isValidEventBusName('')).toBe(false);
    });

    it('rejects event bus names with invalid characters', () => {
      const invalidCharsArb = fc
        .tuple(
          fc
            .array(fc.constantFrom(...EVENT_BUS_NAME_CHARS), {
              minLength: 1,
              maxLength: 100,
            })
            .map(charArrayToString),
          fc.constantFrom('@', '#', '$', '%', '&', '*', '!', ' ', '\\'),
          fc
            .array(fc.constantFrom(...EVENT_BUS_NAME_CHARS), {
              minLength: 1,
              maxLength: 100,
            })
            .map(charArrayToString)
        )
        .map(
          ([before, invalidChar, after]) => `${before}${invalidChar}${after}`
        )
        .filter((name) => name.length >= 1 && name.length <= 256);

      fc.assert(
        fc.property(invalidCharsArb, (name) => {
          expect(isValidEventBusName(name)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
