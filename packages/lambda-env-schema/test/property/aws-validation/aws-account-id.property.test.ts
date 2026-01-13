import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isValidAWSAccountId } from '../../../src/aws/aws-regions';

// Character sets for generators
const DIGITS = '0123456789'.split('');

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

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
