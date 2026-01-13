import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createEnv } from '../../../src/core/create-env';
import { EnvironmentValidationError } from '../../../src/share/errors';
import type {
  AWSParsedType,
  AWSValidationOnlyType,
  EnvSchema,
} from '../../../src/share/types';

describe('Invalid Values Error Generation property tests', () => {
  describe('Property 15: Invalid Values Produce Errors', () => {
    // All AWS resource types that should be tested
    const awsParsedTypes: AWSParsedType[] = [
      's3-arn',
      's3-uri',
      'sqs-queue-url',
      'sqs-queue-arn',
      'sns-topic-arn',
      'dynamodb-table-arn',
      'rds-endpoint',
      'lambda-function-arn',
      'kms-key-arn',
      'secrets-manager-arn',
      'iam-role-arn',
      'arn',
    ];

    const awsValidationOnlyTypes: AWSValidationOnlyType[] = [
      'aws-region',
      'aws-account-id',
      's3-bucket-name',
      'dynamodb-table-name',
      'rds-cluster-id',
      'lambda-function-name',
      'event-bus-name',
      'api-gateway-id',
      'vpc-id',
      'subnet-id',
      'security-group-id',
      'ec2-instance-id',
      'cloudfront-dist-id',
      'kms-key-id',
      'ssm-parameter-name',
      'iam-user-arn',
    ];

    // Generator for obviously invalid values that should fail validation for all AWS types
    const invalidValue = fc.oneof(
      // Invalid characters that no AWS resource type accepts
      fc.constant('invalid@#$%^&*()'),
      fc.constant('spaces are not allowed'),
      fc.constant('contains\nnewlines'),
      fc.constant('contains\ttabs'),
      // Too long values (exceeds all AWS limits)
      fc.constant('a'.repeat(1000)),
      // Unicode and special characters that should be invalid for all AWS types
      fc.constant('invalid🚀emoji'),
      fc.constant('invalid中文'),
      fc.constant('invalid\x00null'),
      fc.constant('invalid\x01control'),
      // Invalid characters that are definitely not allowed in any AWS resource
      fc.constant('invalid"quotes'),
      fc.constant("invalid'quotes"),
      fc.constant('invalid`backticks'),
      fc.constant('invalid~tilde'),
      fc.constant('invalid!exclamation')
    );

    it('AWS parsed types produce validation errors for invalid values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...awsParsedTypes),
          invalidValue,
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[A-Z_][A-Z0-9_]*$/i.test(s)),
          (awsType, value, envKey) => {
            // Create a schema with the invalid value
            const schema = {
              [envKey]: { type: awsType, required: true },
            };

            // Set up environment with the invalid value
            const env = { [envKey]: value };

            // Expect createEnv to throw EnvironmentValidationError
            expect(() => createEnv(schema, { env })).toThrow(
              EnvironmentValidationError
            );

            try {
              createEnv(schema, { env });
            } catch (error) {
              if (error instanceof EnvironmentValidationError) {
                // Should have exactly one error for our invalid variable
                expect(error.errors.length).toBe(1);

                const validationError = error.errors[0];

                // Error should reference the correct key
                expect(validationError.key).toBe(envKey);

                // Error message should include the validation type name
                expect(validationError.message).toContain(awsType);

                // Error message should include descriptive information
                expect(validationError.message).toContain('Invalid');
                expect(validationError.message.length).toBeGreaterThan(10);

                // Should have expected and received fields
                expect(validationError.expected).toBeDefined();
                expect(validationError.received).toBeDefined();

                // The main error message should contain the key
                expect(error.message).toContain(envKey);
                expect(error.message).toContain('failed validation');
              } else {
                throw error;
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('AWS validation-only types produce validation errors for invalid values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...awsValidationOnlyTypes),
          invalidValue,
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[A-Z_][A-Z0-9_]*$/i.test(s)),
          (awsType, value, envKey) => {
            // Create a schema with the invalid value
            const schema = {
              [envKey]: { type: awsType, required: true },
            };

            // Set up environment with the invalid value
            const env = { [envKey]: value };

            // Expect createEnv to throw EnvironmentValidationError
            expect(() => createEnv(schema, { env })).toThrow(
              EnvironmentValidationError
            );

            try {
              createEnv(schema, { env });
            } catch (error) {
              if (error instanceof EnvironmentValidationError) {
                // Should have exactly one error for our invalid variable
                expect(error.errors.length).toBe(1);

                const validationError = error.errors[0];

                // Error should reference the correct key
                expect(validationError.key).toBe(envKey);

                // Error message should include the validation type name
                expect(validationError.message).toContain(awsType);

                // Error message should include descriptive information
                expect(validationError.message).toContain('Invalid');
                expect(validationError.message.length).toBeGreaterThan(10);

                // Should have expected and received fields
                expect(validationError.expected).toBeDefined();
                expect(validationError.received).toBeDefined();

                // The main error message should contain the key
                expect(error.message).toContain(envKey);
                expect(error.message).toContain('failed validation');
              } else {
                throw error;
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('error messages contain expected format descriptions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...[...awsParsedTypes, ...awsValidationOnlyTypes]),
          invalidValue,
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[A-Z_][A-Z0-9_]*$/i.test(s)),
          (awsType, value, envKey) => {
            const schema = {
              [envKey]: { type: awsType, required: true },
            } as EnvSchema;

            const env = { [envKey]: value };

            try {
              createEnv(schema, { env });
            } catch (error) {
              if (error instanceof EnvironmentValidationError) {
                const validationError = error.errors[0];

                // Error message should contain "Must be" or "Must" indicating expected format
                expect(validationError.message).toMatch(/Must/);

                // Expected field should contain format description
                expect(validationError.expected).toMatch(/Must/);

                // For specific types, check for specific format hints
                if (awsType === 'aws-region') {
                  expect(validationError.expected).toContain('AWS region');
                } else if (awsType === 'aws-account-id') {
                  expect(validationError.expected).toContain('12 digits');
                } else if (awsType.includes('arn')) {
                  expect(validationError.expected).toContain('ARN');
                } else if (awsType.includes('url')) {
                  expect(validationError.expected).toContain('URL');
                } else if (awsType === 's3-uri') {
                  expect(validationError.expected).toContain('URI');
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('secret values are masked in error messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...awsParsedTypes),
          invalidValue,
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[A-Z_][A-Z0-9_]*$/i.test(s)),
          (awsType, value, envKey) => {
            // Create a schema with secret: true
            const schema = {
              [envKey]: { type: awsType, required: true, secret: true },
            };

            const env = { [envKey]: value };

            try {
              createEnv(schema, { env });
            } catch (error) {
              if (error instanceof EnvironmentValidationError) {
                const validationError = error.errors[0];

                // Error message should contain *** instead of the actual value
                expect(validationError.message).toContain('***');
                // Only check that the actual value is not contained if it's not empty and not a substring of common format descriptions
                if (
                  value.length > 0 &&
                  !['arn:aws:', 'arn:aws:s3:::', 'https://', 's3://'].some(
                    (pattern) => pattern.includes(value)
                  )
                ) {
                  expect(validationError.message).not.toContain(value);
                }

                // Received field should be masked
                expect(validationError.received).toBe('***');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple invalid AWS values produce multiple errors', () => {
      fc.assert(
        fc.property(
          fc
            .array(
              fc.record({
                key: fc
                  .string({ minLength: 1, maxLength: 20 })
                  .filter((s) => /^[A-Z_][A-Z0-9_]*$/i.test(s)),
                type: fc.constantFrom(
                  ...[...awsParsedTypes, ...awsValidationOnlyTypes]
                ),
                value: invalidValue,
              }),
              { minLength: 2, maxLength: 5 }
            )
            .filter((items) => {
              // Ensure all keys are unique
              const keys = items.map((item) => item.key);
              return new Set(keys).size === keys.length;
            }),
          (invalidItems) => {
            // Create schema with all invalid items
            const schema = Object.fromEntries(
              invalidItems.map((item) => [
                item.key,
                { type: item.type, required: true },
              ])
            ) as EnvSchema;

            // Create environment with all invalid values
            const env = Object.fromEntries(
              invalidItems.map((item) => [item.key, item.value])
            );

            try {
              createEnv(schema, { env });
            } catch (error) {
              if (error instanceof EnvironmentValidationError) {
                // Should have exactly as many errors as invalid items
                expect(error.errors.length).toBe(invalidItems.length);

                // Each invalid item should have a corresponding error
                for (const item of invalidItems) {
                  const correspondingError = error.errors.find(
                    (e) => e.key === item.key
                  );
                  expect(correspondingError).toBeDefined();
                  if (correspondingError) {
                    expect(correspondingError.message).toContain(item.type);
                    expect(correspondingError.message).toContain('Invalid');
                  }
                }

                // Main error message should mention the correct count
                expect(error.message).toContain(
                  `${invalidItems.length} environment variable(s) failed validation`
                );
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
