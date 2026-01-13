import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AWS_REGIONS } from '../../../src/aws/aws-regions';
import {
  extractRegionFromRDSEndpoint,
  isValidRDSClusterId,
  isValidRDSEndpoint,
} from '../../../src/aws/rds-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALPHANUM = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

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
    .filter((s) => !s.startsWith('-') && !s.endsWith('-') && !s.includes('--'));

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
