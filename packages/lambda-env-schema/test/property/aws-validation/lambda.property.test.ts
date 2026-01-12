import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isValidLambdaFunctionName } from '../../../src/aws/lambda-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALPHANUM = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

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
