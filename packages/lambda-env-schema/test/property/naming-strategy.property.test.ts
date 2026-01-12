import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createEnv, toCamelCase } from '../../src/core/create-env';

describe('naming strategy property tests', () => {
  describe('toCamelCase transformation', () => {
    it('converts SNAKE_CASE to camelCase correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[A-Z][A-Z0-9]*$/), {
            minLength: 1,
            maxLength: 5,
          }),
          (parts) => {
            const snakeCase = parts.join('_');
            const result = toCamelCase(snakeCase);

            // First part should be lowercase
            const expectedFirst = parts[0].toLowerCase();
            expect(result.startsWith(expectedFirst)).toBe(true);

            // Result should not contain underscores
            expect(result).not.toContain('_');

            // Result should be all lowercase except for word boundaries
            const expectedCamel = parts
              .map((p, i) =>
                i === 0
                  ? p.toLowerCase()
                  : p.charAt(0) + p.slice(1).toLowerCase()
              )
              .join('');
            expect(result).toBe(expectedCamel);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('handles single word keys', () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[A-Z][A-Z0-9]*$/), (word) => {
          const result = toCamelCase(word);

          // Single word should just be lowercased
          expect(result).toBe(word.toLowerCase());
          expect(result).not.toContain('_');
        }),
        { numRuns: 100 }
      );
    });

    it('is idempotent for already camelCase strings', () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[a-z][a-zA-Z0-9]*$/), (camelCase) => {
          const result = toCamelCase(camelCase);

          // Already camelCase (no underscores) should remain unchanged
          // (since toCamelCase lowercases everything first, then capitalizes after _)
          expect(result).toBe(camelCase.toLowerCase());
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('preserve strategy', () => {
    it('keeps original keys unchanged', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[A-Z][A-Z0-9_]*[A-Z0-9]$/), {
            minLength: 1,
            maxLength: 5,
          }),
          (keys) => {
            // Create a schema with the generated keys
            const schema: Record<string, { type: 'string'; default: string }> =
              {};
            const env: Record<string, string> = {};

            for (const key of keys) {
              schema[key] = { type: 'string', default: 'test' };
              env[key] = 'value';
            }

            const result = createEnv(schema, {
              namingStrategy: 'preserve',
              env,
            });

            // All original keys should be present
            for (const key of keys) {
              expect(key in result).toBe(true);
              expect(result[key as keyof typeof result]).toBe('value');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('default strategy behaves like preserve', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[A-Z][A-Z0-9_]*[A-Z0-9]$/), {
            minLength: 1,
            maxLength: 3,
          }),
          (keys) => {
            const schema: Record<string, { type: 'string'; default: string }> =
              {};
            const env: Record<string, string> = {};

            for (const key of keys) {
              schema[key] = { type: 'string', default: 'test' };
              env[key] = 'value';
            }

            const withPreserve = createEnv(schema, {
              namingStrategy: 'preserve',
              env,
            });
            const withDefault = createEnv(schema, { env });

            // Both should have the same keys (excluding aws)
            for (const key of keys) {
              expect(key in withPreserve).toBe(true);
              expect(key in withDefault).toBe(true);
              expect(withPreserve[key as keyof typeof withPreserve]).toBe(
                withDefault[key as keyof typeof withDefault]
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('camelCase strategy', () => {
    it('converts SNAKE_CASE keys to camelCase', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.stringMatching(/^[A-Z][A-Z0-9]*$/),
              fc.stringMatching(/^[A-Z][A-Z0-9]*$/)
            ),
            { minLength: 1, maxLength: 3 }
          ),
          (keyParts) => {
            const schema: Record<string, { type: 'string'; default: string }> =
              {};
            const env: Record<string, string> = {};
            const expectedKeys: string[] = [];

            for (const [part1, part2] of keyParts) {
              const snakeKey = `${part1}_${part2}`;
              const camelKey = toCamelCase(snakeKey);

              schema[snakeKey] = { type: 'string', default: 'test' };
              env[snakeKey] = 'value';
              expectedKeys.push(camelKey);
            }

            const result = createEnv(schema, {
              namingStrategy: 'camelCase',
              env,
            });

            // All camelCase keys should be present
            for (const camelKey of expectedKeys) {
              expect(camelKey in result).toBe(true);
            }

            // Original SNAKE_CASE keys should NOT be present (except aws)
            for (const [part1, part2] of keyParts) {
              const snakeKey = `${part1}_${part2}`;
              if (snakeKey !== 'aws') {
                expect(snakeKey in result).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('values are preserved after key transformation', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.stringMatching(/^[A-Z][A-Z0-9]*$/),
              fc.stringMatching(/^[A-Z][A-Z0-9]*$/),
              fc.string()
            ),
            { minLength: 1, maxLength: 3 }
          ),
          (entries) => {
            const schema: Record<string, { type: 'string'; default: string }> =
              {};
            const env: Record<string, string> = {};
            const keyValueMap: Map<string, string> = new Map();

            for (const [part1, part2, value] of entries) {
              const snakeKey = `${part1}_${part2}`;
              const camelKey = toCamelCase(snakeKey);

              schema[snakeKey] = { type: 'string', default: '' };
              env[snakeKey] = value;
              keyValueMap.set(camelKey, value);
            }

            const result = createEnv(schema, {
              namingStrategy: 'camelCase',
              env,
            });

            // Values should be preserved
            for (const [camelKey, expectedValue] of keyValueMap) {
              expect(result[camelKey as keyof typeof result]).toBe(
                expectedValue
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('aws property', () => {
    it('aws property always uses camelCase regardless of strategy', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('preserve', 'camelCase') as fc.Arbitrary<
            'preserve' | 'camelCase'
          >,
          (strategy) => {
            const schema = {
              TEST_VAR: { type: 'string' as const, default: 'test' },
            };

            const result = createEnv(schema, {
              namingStrategy: strategy,
              env: {},
            });

            // aws property should always exist
            expect('aws' in result).toBe(true);
            expect(result.aws).toBeDefined();

            // aws properties should always be camelCase
            expect('region' in result.aws).toBe(true);
            expect('functionName' in result.aws).toBe(true);
            expect('memoryLimitInMB' in result.aws).toBe(true);

            // aws properties should NOT be SNAKE_CASE
            expect('AWS_REGION' in result.aws).toBe(false);
            expect('AWS_LAMBDA_FUNCTION_NAME' in result.aws).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
