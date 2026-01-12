import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  coerceJson,
  coerceNumber,
  coerceNumberArray,
  coerceString,
  coerceStringArray,
} from '../src/coercion';

describe('coercion property tests', () => {
  describe('number coercion correctness', () => {
    it('converts valid numeric strings to the equivalent number', () => {
      fc.assert(
        fc.property(fc.double({ noNaN: true }), (num) => {
          const str = String(num);
          const result = coerceNumber(str);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.value).toBe(Number(str));
          }
        }),
        { numRuns: 100 }
      );
    });

    it('converts integer strings to the equivalent number', () => {
      fc.assert(
        fc.property(fc.integer(), (num) => {
          const str = String(num);
          const result = coerceNumber(str);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.value).toBe(num);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('returns error for non-numeric strings', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => Number.isNaN(Number(s)) && s.length > 0),
          (str) => {
            const result = coerceNumber(str);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('string identity', () => {
    it('returns the input string unchanged', () => {
      fc.assert(
        fc.property(fc.string(), (str) => {
          const result = coerceString(str);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.value).toBe(str);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('array coercion round-trip', () => {
    it('string array: join then split produces equivalent array', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string().filter((s) => !s.includes(',') && s.trim() === s)
          ),
          (arr) => {
            const joined = arr.join(',');
            const result = coerceStringArray(joined, ',');

            expect(result.success).toBe(true);
            if (result.success) {
              if (arr.length === 0) {
                // Empty array joined becomes empty string, which returns empty array
                expect(result.value).toEqual([]);
              } else if (arr.length === 1 && arr[0] === '') {
                // Single empty string joined becomes empty string, returns empty array
                expect(result.value).toEqual([]);
              } else {
                expect(result.value).toEqual(arr);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('number array: join then split produces equivalent array', () => {
      fc.assert(
        fc.property(
          fc.array(fc.double({ noNaN: true, noDefaultInfinity: true })),
          (arr) => {
            const joined = arr.join(',');
            const result = coerceNumberArray(joined, ',');

            expect(result.success).toBe(true);
            if (result.success) {
              if (arr.length === 0) {
                expect(result.value).toEqual([]);
              } else {
                expect(result.value.length).toBe(arr.length);
                for (let i = 0; i < arr.length; i++) {
                  expect(result.value[i]).toBe(Number(String(arr[i])));
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('trims whitespace from array items', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string().filter((s) => !s.includes(','))),
          (arr) => {
            // Add random whitespace around items
            const withWhitespace = arr.map((s) => `  ${s}  `);
            const joined = withWhitespace.join(',');
            const result = coerceStringArray(joined, ',');

            expect(result.success).toBe(true);
            if (result.success) {
              if (arr.length === 0) {
                expect(result.value).toEqual([]);
              } else {
                // Each item should be trimmed
                for (let i = 0; i < result.value.length; i++) {
                  expect(result.value[i]).toBe(arr[i].trim());
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('custom separator works correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string().filter((s) => !s.includes('|') && s.trim() === s)
          ),
          (arr) => {
            const joined = arr.join('|');
            const result = coerceStringArray(joined, '|');

            expect(result.success).toBe(true);
            if (result.success) {
              if (arr.length === 0 || (arr.length === 1 && arr[0] === '')) {
                expect(result.value).toEqual([]);
              } else {
                expect(result.value).toEqual(arr);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('JSON round-trip', () => {
    it('stringify then parse produces equivalent value for objects', () => {
      fc.assert(
        fc.property(fc.jsonValue(), (value) => {
          const jsonStr = JSON.stringify(value);
          const result = coerceJson(jsonStr);

          expect(result.success).toBe(true);
          if (result.success) {
            // Use JSON.stringify comparison to handle -0 vs 0 edge case
            expect(JSON.stringify(result.value)).toBe(JSON.stringify(value));
          }
        }),
        { numRuns: 100 }
      );
    });

    it('returns error for invalid JSON strings', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => {
            try {
              JSON.parse(s);
              return false;
            } catch {
              return true;
            }
          }),
          (str) => {
            const result = coerceJson(str);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error).toContain('Invalid JSON');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('handles nested objects correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string(),
            count: fc.integer(),
            active: fc.boolean(),
            tags: fc.array(fc.string()),
            nested: fc.option(
              fc.record({
                id: fc.integer(),
                value: fc.string(),
              })
            ),
          }),
          (obj) => {
            const jsonStr = JSON.stringify(obj);
            const result = coerceJson(jsonStr);

            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.value).toEqual(obj);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
