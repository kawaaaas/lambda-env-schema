import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  AWS_REGIONS,
  extractAccountIdFromIAMArn,
  isValidAWSAccountId,
  isValidAWSRegion,
  isValidIAMRoleArn,
  isValidIAMUserArn,
  isValidS3Arn,
  isValidS3BucketName,
} from '../../src/aws/aws-validation-types';

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
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
            .filter((s) => !AWS_REGIONS.includes(s as (typeof AWS_REGIONS)[number])),
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
      .array(fc.constantFrom(...IAM_NAME_CHARS), { minLength: 1, maxLength: 64 })
      .map(charArrayToString);

    const validAccountIdArb = fc
      .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
      .map(charArrayToString);

    const validIAMRoleArnArb = fc
      .tuple(validAccountIdArb, validRoleNameArb)
      .map(([accountId, roleName]) => `arn:aws:iam::${accountId}:role/${roleName}`);

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
        fc.property(validAccountIdArb, validRoleNameArb, (accountId, roleName) => {
          const wrongTypeArn = `arn:aws:iam::${accountId}:user/${roleName}`;
          expect(isValidIAMRoleArn(wrongTypeArn)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects ARNs with invalid account ID', () => {
      const invalidAccountIdArb = fc
        .array(fc.constantFrom(...DIGITS), { minLength: 1, maxLength: 20 })
        .map(charArrayToString)
        .filter((s) => s.length !== 12);

      fc.assert(
        fc.property(invalidAccountIdArb, validRoleNameArb, (invalidAccountId, roleName) => {
          const invalidArn = `arn:aws:iam::${invalidAccountId}:role/${roleName}`;
          expect(isValidIAMRoleArn(invalidArn)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('extracts account ID correctly from valid IAM Role ARN', () => {
      fc.assert(
        fc.property(validAccountIdArb, validRoleNameArb, (accountId, roleName) => {
          const arn = `arn:aws:iam::${accountId}:role/${roleName}`;
          expect(extractAccountIdFromIAMArn(arn)).toBe(accountId);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('iam-user-arn validation', () => {
    const validUserNameArb = fc
      .array(fc.constantFrom(...IAM_NAME_CHARS), { minLength: 1, maxLength: 64 })
      .map(charArrayToString);

    const validAccountIdArb = fc
      .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
      .map(charArrayToString);

    const validIAMUserArnArb = fc
      .tuple(validAccountIdArb, validUserNameArb)
      .map(([accountId, userName]) => `arn:aws:iam::${accountId}:user/${userName}`);

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
        fc.property(validAccountIdArb, validUserNameArb, (accountId, userName) => {
          const wrongTypeArn = `arn:aws:iam::${accountId}:role/${userName}`;
          expect(isValidIAMUserArn(wrongTypeArn)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('extracts account ID correctly from valid IAM User ARN', () => {
      fc.assert(
        fc.property(validAccountIdArb, validUserNameArb, (accountId, userName) => {
          const arn = `arn:aws:iam::${accountId}:user/${userName}`;
          expect(extractAccountIdFromIAMArn(arn)).toBe(accountId);
        }),
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
          .array(fc.constantFrom(...S3_BUCKET_CHARS), { minLength: 1, maxLength: 60 })
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
        .array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 1, maxLength: 2 })
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
        .array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 64, maxLength: 100 })
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
        .array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 2, maxLength: 62 })
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
        .array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 2, maxLength: 62 })
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
          fc.array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 1, maxLength: 30 }).map(charArrayToString),
          fc.array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 1, maxLength: 30 }).map(charArrayToString)
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
        .array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 1, maxLength: 59 })
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
        .array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 1, maxLength: 55 })
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
        .array(fc.constantFrom(...[...LOWER_ALPHA, ...UPPER_ALPHA, ...DIGITS]), { minLength: 3, maxLength: 63 })
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
        fc.array(fc.constantFrom(...[...LOWER_ALPHANUM, '.']), { minLength: 1, maxLength: 60 }).map(charArrayToString),
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
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => !s.includes('\n') && !s.includes('\r'))
      )
      .map(([bucketName, objectKey]) => `arn:aws:s3:::${bucketName}/${objectKey}`);

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
          validBucketNameForArnArb.map((bucketName) => `arn:aws:${service}:::${bucketName}`)
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
          fc.string({ minLength: 1 }).filter((s) => !s.startsWith('arn:aws:s3:::')),
          (nonArn) => {
            expect(isValidS3Arn(nonArn)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects ARNs with bucket names starting with hyphen', () => {
      const invalidBucketArnArb = fc
        .array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 2, maxLength: 62 })
        .map((chars) => `arn:aws:s3:::-${chars.join('')}`);

      fc.assert(
        fc.property(invalidBucketArnArb, (arn) => {
          expect(isValidS3Arn(arn)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
