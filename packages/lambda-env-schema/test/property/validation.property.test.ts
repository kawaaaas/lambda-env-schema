import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { EnvironmentValidationError, formatValue } from '../../src/errors';
import type {
  ArraySchema,
  NumberSchema,
  SchemaItem,
  StringSchema,
} from '../../src/types';
import {
  applyDefault,
  checkConstraints,
  checkEnum,
  checkRequired,
  formatValue as validationFormatValue,
} from '../../src/validation';

describe('validation property tests', () => {
  describe('error aggregation', () => {
    it('collects exactly N errors for N invalid variables', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              key: fc
                .string({ minLength: 1 })
                .filter((s) => /^[A-Z_][A-Z0-9_]*$/i.test(s)),
              message: fc.string({ minLength: 1 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (errorInputs) => {
            const errors = errorInputs.map((e) => ({
              key: e.key,
              message: e.message,
            }));

            const error = new EnvironmentValidationError(errors);

            // Error count matches input count
            expect(error.errors.length).toBe(errorInputs.length);

            // All keys are present in the error message
            for (const e of errorInputs) {
              expect(error.message).toContain(e.key);
            }

            // Error message contains the correct count
            expect(error.message).toContain(
              `${errorInputs.length} environment variable(s) failed validation`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('preserves all error details in the errors array', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1 }),
              message: fc.string({ minLength: 1 }),
              received: fc.option(fc.string()),
              expected: fc.option(fc.string()),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (errorInputs) => {
            const errors = errorInputs.map((e) => ({
              key: e.key,
              message: e.message,
              ...(e.received !== null ? { received: e.received } : {}),
              ...(e.expected !== null ? { expected: e.expected } : {}),
            }));

            const error = new EnvironmentValidationError(errors);

            expect(error.errors.length).toBe(errors.length);
            for (let i = 0; i < errors.length; i++) {
              expect(error.errors[i].key).toBe(errors[i].key);
              expect(error.errors[i].message).toBe(errors[i].message);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('secret masking', () => {
    it('masks secret values with *** in formatValue', () => {
      fc.assert(
        fc.property(fc.string(), (value) => {
          const masked = formatValue(value, true);
          // Secret values should always be masked as "***"
          expect(masked).toBe('***');
          // The original value should not appear unless it's a substring of "***"
          if (value.length > 0 && !'***'.includes(value)) {
            expect(masked).not.toContain(value);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('shows actual value when not secret', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.length > 0),
          (value) => {
            const formatted = formatValue(value, false);
            expect(formatted).toBe(`"${value}"`);
            expect(formatted).toContain(value);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('validation formatValue also masks secrets', () => {
      fc.assert(
        fc.property(fc.string(), (value) => {
          const masked = validationFormatValue(value, true);
          expect(masked).toBe('***');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('required/default logic', () => {
    it('returns error when required and no value and no default', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1 })
            .filter((s) => /^[A-Z_][A-Z0-9_]*$/i.test(s)),
          (key) => {
            const schema: SchemaItem = { type: 'string', required: true };
            const result = checkRequired(key, schema, undefined);

            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.error.key).toBe(key);
              expect(result.error.message).toContain('Required');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('passes when required but has default value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string(),
          (key, defaultValue) => {
            const schema: StringSchema = {
              type: 'string',
              required: true,
              default: defaultValue,
            };
            const result = checkRequired(key, schema, undefined);

            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('passes when value is provided regardless of required flag', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string(),
          fc.boolean(),
          (key, value, required) => {
            const schema: StringSchema = { type: 'string', required };
            const result = checkRequired(key, schema, value);

            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('applyDefault returns default when no value is set', () => {
      fc.assert(
        fc.property(fc.string(), (defaultValue) => {
          const schema: StringSchema = {
            type: 'string',
            default: defaultValue,
          };
          const result = applyDefault(schema, undefined);

          expect(result.hasValue).toBe(true);
          if (result.hasValue) {
            expect(result.value).toBe(defaultValue);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('applyDefault returns original value when set', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (value, defaultValue) => {
          const schema: StringSchema = {
            type: 'string',
            default: defaultValue,
          };
          const result = applyDefault(schema, value);

          expect(result.hasValue).toBe(true);
          if (result.hasValue) {
            expect(result.value).toBe(value);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('applyDefault returns no value when no default and no value', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (_key) => {
          const schema: StringSchema = { type: 'string' };
          const result = applyDefault(schema, undefined);

          expect(result.hasValue).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('enum validation', () => {
    it('accepts values that are in the enum list', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(fc.string({ minLength: 1 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (key, enumValues) => {
            // Pick a random value from the enum
            const value =
              enumValues[Math.floor(Math.random() * enumValues.length)];
            const schema: StringSchema = {
              type: 'string',
              enum: enumValues as readonly string[],
            };

            const result = checkEnum(key, schema, value);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects values not in the enum list', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          fc.string({ minLength: 1 }),
          (key, enumValues, value) => {
            // Skip if value happens to be in enum
            if (enumValues.includes(value)) return;

            const schema: StringSchema = {
              type: 'string',
              enum: enumValues as readonly string[],
            };

            const result = checkEnum(key, schema, value);
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.error.key).toBe(key);
              // Error message should list allowed values
              for (const allowed of enumValues) {
                expect(result.error.message).toContain(allowed);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('passes when no enum is defined', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), fc.string(), (key, value) => {
          const schema: StringSchema = { type: 'string' };
          const result = checkEnum(key, schema, value);

          expect(result.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('constraint validation', () => {
    describe('number constraints', () => {
      it('rejects numbers below min', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.integer({ min: -1000, max: 1000 }),
            fc.integer({ min: 1, max: 100 }),
            (key, min, offset) => {
              const value = min - offset; // Always below min
              const schema: NumberSchema = { type: 'number', min };

              const result = checkConstraints(key, schema, value);
              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(
                  result.errors.some((e) => e.message.includes('at least'))
                ).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('rejects numbers above max', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.integer({ min: -1000, max: 1000 }),
            fc.integer({ min: 1, max: 100 }),
            (key, max, offset) => {
              const value = max + offset; // Always above max
              const schema: NumberSchema = { type: 'number', max };

              const result = checkConstraints(key, schema, value);
              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(
                  result.errors.some((e) => e.message.includes('at most'))
                ).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('accepts numbers within range', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.integer({ min: -1000, max: 0 }),
            fc.integer({ min: 0, max: 1000 }),
            (key, min, max) => {
              // Ensure min <= max
              const actualMin = Math.min(min, max);
              const actualMax = Math.max(min, max);
              const value = Math.floor((actualMin + actualMax) / 2);

              const schema: NumberSchema = {
                type: 'number',
                min: actualMin,
                max: actualMax,
              };

              const result = checkConstraints(key, schema, value);
              expect(result.valid).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('string constraints', () => {
      it('rejects strings shorter than minLength', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.integer({ min: 5, max: 20 }),
            fc.string({ minLength: 0, maxLength: 4 }),
            (key, minLength, value) => {
              // Ensure value is shorter than minLength
              if (value.length >= minLength) return;

              const schema: StringSchema = { type: 'string', minLength };

              const result = checkConstraints(key, schema, value);
              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(
                  result.errors.some((e) => e.message.includes('at least'))
                ).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('rejects strings longer than maxLength', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.integer({ min: 1, max: 5 }),
            fc.string({ minLength: 6, maxLength: 20 }),
            (key, maxLength, value) => {
              // Ensure value is longer than maxLength
              if (value.length <= maxLength) return;

              const schema: StringSchema = { type: 'string', maxLength };

              const result = checkConstraints(key, schema, value);
              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(
                  result.errors.some((e) => e.message.includes('at most'))
                ).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('rejects strings not matching pattern', () => {
        fc.assert(
          fc.property(fc.string({ minLength: 1 }), (key) => {
            // Use a simple pattern that we can control
            const pattern = /^[a-z]+$/;
            const value = 'ABC123'; // Definitely doesn't match lowercase only

            const schema: StringSchema = { type: 'string', pattern };

            const result = checkConstraints(key, schema, value);
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(
                result.errors.some((e) => e.message.includes('pattern'))
              ).toBe(true);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('accepts strings matching pattern', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.stringMatching(/^[a-z]+$/),
            (key, value) => {
              const pattern = /^[a-z]+$/;
              const schema: StringSchema = { type: 'string', pattern };

              const result = checkConstraints(key, schema, value);
              expect(result.valid).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('array constraints', () => {
      it('rejects arrays shorter than minLength', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.integer({ min: 3, max: 10 }),
            fc.array(fc.string(), { minLength: 0, maxLength: 2 }),
            (key, minLength, value) => {
              if (value.length >= minLength) return;

              const schema: ArraySchema = {
                type: 'array',
                itemType: 'string',
                minLength,
              };

              const result = checkConstraints(key, schema, value);
              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(
                  result.errors.some((e) => e.message.includes('at least'))
                ).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('rejects arrays longer than maxLength', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.integer({ min: 1, max: 3 }),
            fc.array(fc.string(), { minLength: 4, maxLength: 10 }),
            (key, maxLength, value) => {
              if (value.length <= maxLength) return;

              const schema: ArraySchema = {
                type: 'array',
                itemType: 'string',
                maxLength,
              };

              const result = checkConstraints(key, schema, value);
              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(
                  result.errors.some((e) => e.message.includes('at most'))
                ).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('accepts arrays within length bounds', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1 }),
            fc.array(fc.string(), { minLength: 2, maxLength: 5 }),
            (key, value) => {
              const schema: ArraySchema = {
                type: 'array',
                itemType: 'string',
                minLength: 1,
                maxLength: 10,
              };

              const result = checkConstraints(key, schema, value);
              expect(result.valid).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
