import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isValidEventBusName } from '../../../src/aws/eventbridge-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALPHANUM = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

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
