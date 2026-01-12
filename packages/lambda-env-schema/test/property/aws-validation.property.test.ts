import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  AWS_REGIONS,
  extractAccountIdFromIAMArn,
  isValidAccessKeyId,
  isValidAWSAccountId,
  isValidAWSRegion,
  isValidIAMRoleArn,
  isValidIAMUserArn,
  isValidSecretAccessKey,
} from '../../src/aws/aws-validation-types';

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const UPPER_ALPHANUM = [...UPPER_ALPHA, ...DIGITS];
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
const SECRET_KEY_CHARS = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS, '+', '/', '='];

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

  describe('access-key-id validation', () => {
    const validAccessKeyIdArb = fc
      .tuple(
        fc.constantFrom('AKIA', 'ASIA'),
        fc.array(fc.constantFrom(...UPPER_ALPHANUM), { minLength: 16, maxLength: 16 }).map(charArrayToString)
      )
      .map(([prefix, suffix]) => prefix + suffix);

    it('accepts valid Access Key ID format', () => {
      fc.assert(
        fc.property(validAccessKeyIdArb, (accessKeyId) => {
          expect(isValidAccessKeyId(accessKeyId)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects Access Key IDs with wrong prefix', () => {
      const invalidPrefixArb = fc
        .array(fc.constantFrom(...UPPER_ALPHA), { minLength: 4, maxLength: 4 })
        .map(charArrayToString)
        .filter((s) => s !== 'AKIA' && s !== 'ASIA');

      const invalidKeyArb = fc
        .tuple(
          invalidPrefixArb,
          fc.array(fc.constantFrom(...UPPER_ALPHANUM), { minLength: 16, maxLength: 16 }).map(charArrayToString)
        )
        .map(([prefix, suffix]) => prefix + suffix);

      fc.assert(
        fc.property(invalidKeyArb, (invalidKey) => {
          expect(isValidAccessKeyId(invalidKey)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects Access Key IDs with wrong length', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('AKIA', 'ASIA'),
          fc
            .array(fc.constantFrom(...UPPER_ALPHANUM), { minLength: 1, maxLength: 30 })
            .map(charArrayToString)
            .filter((s) => s.length !== 16),
          (prefix, suffix) => {
            const invalidKey = prefix + suffix;
            expect(isValidAccessKeyId(invalidKey)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects Access Key IDs with lowercase characters', () => {
      const lowerAlphanumChars = [...LOWER_ALPHA, ...DIGITS];
      const lowercaseSuffixArb = fc
        .array(fc.constantFrom(...lowerAlphanumChars), { minLength: 16, maxLength: 16 })
        .map(charArrayToString)
        .filter((s) => /[a-z]/.test(s));

      fc.assert(
        fc.property(fc.constantFrom('AKIA', 'ASIA'), lowercaseSuffixArb, (prefix, suffix) => {
          const invalidKey = prefix + suffix;
          expect(isValidAccessKeyId(invalidKey)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('secret-access-key validation', () => {
    const validSecretKeyArb = fc
      .array(fc.constantFrom(...SECRET_KEY_CHARS), { minLength: 40, maxLength: 40 })
      .map(charArrayToString);

    it('accepts valid Secret Access Key format', () => {
      fc.assert(
        fc.property(validSecretKeyArb, (secretKey) => {
          expect(isValidSecretAccessKey(secretKey)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects Secret Access Keys with wrong length', () => {
      const wrongLengthArb = fc
        .array(fc.constantFrom(...SECRET_KEY_CHARS), { minLength: 1, maxLength: 60 })
        .map(charArrayToString)
        .filter((s) => s.length !== 40);

      fc.assert(
        fc.property(wrongLengthArb, (wrongLengthKey) => {
          expect(isValidSecretAccessKey(wrongLengthKey)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rejects Secret Access Keys with invalid characters', () => {
      const invalidCharArb = fc
        .string({ minLength: 40, maxLength: 40 })
        .filter((s) => /[^A-Za-z0-9+/=]/.test(s));

      fc.assert(
        fc.property(invalidCharArb, (invalidKey) => {
          expect(isValidSecretAccessKey(invalidKey)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
