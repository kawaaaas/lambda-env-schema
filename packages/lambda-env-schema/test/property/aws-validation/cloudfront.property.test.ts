import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isValidCloudFrontDistId } from '../../../src/aws/cloudfront-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const UPPER_ALPHANUM = [...UPPER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

describe('cloudfront-dist-id validation', () => {
  // Generator for valid CloudFront Distribution IDs (13-14 uppercase alphanumeric characters)
  const validCloudFrontDistIdArb = fc.oneof(
    // 13 characters
    fc
      .array(fc.constantFrom(...UPPER_ALPHANUM), {
        minLength: 13,
        maxLength: 13,
      })
      .map(charArrayToString),
    // 14 characters
    fc
      .array(fc.constantFrom(...UPPER_ALPHANUM), {
        minLength: 14,
        maxLength: 14,
      })
      .map(charArrayToString)
  );

  it('accepts valid CloudFront Distribution IDs', () => {
    fc.assert(
      fc.property(validCloudFrontDistIdArb, (id) => {
        expect(isValidCloudFrontDistId(id)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong length', () => {
    // Generate IDs with length != 13 and != 14
    const wrongLengthArb = fc
      .array(fc.constantFrom(...UPPER_ALPHANUM), {
        minLength: 1,
        maxLength: 20,
      })
      .map(charArrayToString)
      .filter((s) => s.length !== 13 && s.length !== 14);

    fc.assert(
      fc.property(wrongLengthArb, (id) => {
        expect(isValidCloudFrontDistId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with lowercase characters', () => {
    const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');

    // Generate IDs with at least one lowercase character
    const withLowercaseArb = fc
      .tuple(
        fc.array(fc.constantFrom(...UPPER_ALPHANUM), {
          minLength: 0,
          maxLength: 12,
        }),
        fc.constantFrom(...LOWER_ALPHA),
        fc.array(fc.constantFrom(...UPPER_ALPHANUM), {
          minLength: 0,
          maxLength: 12,
        })
      )
      .map(([prefix, lower, suffix]) => {
        const combined = [...prefix, lower, ...suffix];
        // Ensure 13 or 14 characters
        return combined.slice(0, 14).join('');
      })
      .filter((s) => (s.length === 13 || s.length === 14) && /[a-z]/.test(s));

    fc.assert(
      fc.property(withLowercaseArb, (id) => {
        expect(isValidCloudFrontDistId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with special characters', () => {
    const SPECIAL_CHARS = ['-', '_', '.', '@', '#', '$', '%'];

    // Generate IDs with at least one special character
    const withSpecialArb = fc
      .tuple(
        fc.array(fc.constantFrom(...UPPER_ALPHANUM), {
          minLength: 0,
          maxLength: 12,
        }),
        fc.constantFrom(...SPECIAL_CHARS),
        fc.array(fc.constantFrom(...UPPER_ALPHANUM), {
          minLength: 0,
          maxLength: 12,
        })
      )
      .map(([prefix, special, suffix]) => {
        const combined = [...prefix, special, ...suffix];
        return combined.slice(0, 14).join('');
      })
      .filter((s) => s.length === 13 || s.length === 14);

    fc.assert(
      fc.property(withSpecialArb, (id) => {
        expect(isValidCloudFrontDistId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
