import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
    extractAccountIdFromIAMArn,
    isValidIAMRoleArn,
    isValidIAMUserArn,
} from '../../../src/aws/iam-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
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

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

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
