import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isValidApiGatewayId } from '../../../src/aws/api-gateway-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const LOWER_ALPHANUM = [...LOWER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

describe('api-gateway-id validation', () => {
  // Generator for valid API Gateway IDs (exactly 10 lowercase alphanumeric characters)
  const validApiGatewayIdArb = fc
    .array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 10, maxLength: 10 })
    .map(charArrayToString);

  it('accepts valid API Gateway IDs', () => {
    fc.assert(
      fc.property(validApiGatewayIdArb, (id) => {
        expect(isValidApiGatewayId(id)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong length', () => {
    // Generate IDs with length != 10
    const wrongLengthArb = fc
      .array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 1, maxLength: 20 })
      .map(charArrayToString)
      .filter((s) => s.length !== 10);

    fc.assert(
      fc.property(wrongLengthArb, (id) => {
        expect(isValidApiGatewayId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with uppercase characters', () => {
    const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    // Generate IDs with at least one uppercase character
    const withUppercaseArb = fc
      .tuple(
        fc.array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 0, maxLength: 9 }),
        fc.constantFrom(...UPPER_ALPHA),
        fc.array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 0, maxLength: 9 })
      )
      .map(([prefix, upper, suffix]) => {
        const combined = [...prefix, upper, ...suffix];
        // Ensure exactly 10 characters
        return combined.slice(0, 10).join('');
      })
      .filter((s) => s.length === 10 && /[A-Z]/.test(s));

    fc.assert(
      fc.property(withUppercaseArb, (id) => {
        expect(isValidApiGatewayId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with special characters', () => {
    const SPECIAL_CHARS = ['-', '_', '.', '@', '#', '$', '%'];
    
    // Generate IDs with at least one special character
    const withSpecialArb = fc
      .tuple(
        fc.array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 0, maxLength: 9 }),
        fc.constantFrom(...SPECIAL_CHARS),
        fc.array(fc.constantFrom(...LOWER_ALPHANUM), { minLength: 0, maxLength: 9 })
      )
      .map(([prefix, special, suffix]) => {
        const combined = [...prefix, special, ...suffix];
        return combined.slice(0, 10).join('');
      })
      .filter((s) => s.length === 10);

    fc.assert(
      fc.property(withSpecialArb, (id) => {
        expect(isValidApiGatewayId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
