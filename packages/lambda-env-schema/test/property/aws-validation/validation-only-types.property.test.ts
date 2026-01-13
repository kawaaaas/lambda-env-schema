import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createEnv } from '../../../src/core/create-env';
import type { AWSValidationOnlyType } from '../../../src/share/types';

describe('Validation-Only Types property tests', () => {
  describe('Property 14: Validation-Only Types Return String', () => {
    // Simplified generators for faster execution

    // Generator for valid AWS regions (use predefined list)
    const validAWSRegion = fc.constantFrom(
      'us-east-1',
      'us-west-2',
      'eu-west-1',
      'ap-northeast-1'
    );

    // Generator for valid AWS account IDs (simple format)
    const validAWSAccountId = fc
      .integer({ min: 100000000000, max: 999999999999 })
      .map((n) => n.toString());

    // Simplified S3 bucket name generator
    const validS3BucketName = fc
      .tuple(
        fc.constantFrom('my', 'test', 'app', 'data'),
        fc.constantFrom('bucket', 'storage', 'files'),
        fc.integer({ min: 1, max: 999 })
      )
      .map(([prefix, suffix, num]) => `${prefix}-${suffix}-${num}`);

    // Simplified DynamoDB table name generator
    const validDynamoDBTableName = fc
      .tuple(
        fc.constantFrom('Users', 'Orders', 'Products', 'Sessions'),
        fc.integer({ min: 1, max: 999 })
      )
      .map(([name, num]) => `${name}_${num}`);

    // Simplified Lambda function name generator
    const validLambdaFunctionName = fc
      .tuple(
        fc.constantFrom('my', 'app', 'api'),
        fc.constantFrom('function', 'handler', 'processor'),
        fc.integer({ min: 1, max: 99 })
      )
      .map(([prefix, suffix, num]) => `${prefix}-${suffix}-${num}`);

    // Test only a subset of validation-only types for faster execution
    const testTypes: Array<{
      type: AWSValidationOnlyType;
      generator: fc.Arbitrary<string>;
    }> = [
      { type: 'aws-region', generator: validAWSRegion },
      { type: 'aws-account-id', generator: validAWSAccountId },
      { type: 's3-bucket-name', generator: validS3BucketName },
      { type: 'dynamodb-table-name', generator: validDynamoDBTableName },
      { type: 'lambda-function-name', generator: validLambdaFunctionName },
    ];

    testTypes.forEach(({ type, generator }) => {
      it(`returns plain string for valid ${type} values`, () => {
        fc.assert(
          fc.property(generator, (validValue) => {
            const env = createEnv(
              { TEST_VAR: { type, required: true } },
              { env: { TEST_VAR: validValue } }
            );

            // The result should be a plain string, not a parsed object
            expect(typeof env.TEST_VAR).toBe('string');
            expect(env.TEST_VAR).toBe(validValue);

            // Ensure it's not a parsed object (no additional properties)
            expect(env.TEST_VAR).not.toHaveProperty('value');
            expect(env.TEST_VAR).not.toHaveProperty('region');
            expect(env.TEST_VAR).not.toHaveProperty('accountId');
          }),
          { numRuns: 10 }
        );
      });
    });

    it('validation logic correctly accepts valid values and rejects invalid values', () => {
      // Test a few representative types with both valid and invalid values
      const testCases: Array<{
        type: AWSValidationOnlyType;
        validValue: string;
        invalidValue: string;
      }> = [
        {
          type: 'aws-region',
          validValue: 'us-east-1',
          invalidValue: 'invalid-region',
        },
        {
          type: 'aws-account-id',
          validValue: '123456789012',
          invalidValue: '12345', // too short
        },
        {
          type: 's3-bucket-name',
          validValue: 'my-bucket-123',
          invalidValue: 'My-Bucket', // uppercase not allowed
        },
      ];

      testCases.forEach(({ type, validValue, invalidValue }) => {
        // Valid value should work
        const validEnv = createEnv(
          { TEST_VAR: { type, required: true } },
          { env: { TEST_VAR: validValue } }
        );
        expect(validEnv.TEST_VAR).toBe(validValue);
        expect(typeof validEnv.TEST_VAR).toBe('string');

        // Invalid value should throw
        expect(() =>
          createEnv(
            { TEST_VAR: { type, required: true } },
            { env: { TEST_VAR: invalidValue } }
          )
        ).toThrow();
      });
    });

    it('validation-only types work with optional values', () => {
      fc.assert(
        fc.property(validAWSRegion, (validRegion) => {
          // Test with value provided
          const envWithValue = createEnv(
            { AWS_REGION: { type: 'aws-region' } },
            { env: { AWS_REGION: validRegion } }
          );
          expect(envWithValue.AWS_REGION).toBe(validRegion);
          expect(typeof envWithValue.AWS_REGION).toBe('string');

          // Test without value provided (should be undefined)
          const envWithoutValue = createEnv(
            { AWS_REGION: { type: 'aws-region' } },
            { env: {} }
          );
          expect(envWithoutValue.AWS_REGION).toBeUndefined();
        }),
        { numRuns: 5 }
      );
    });

    it('validation-only types work with default values', () => {
      fc.assert(
        fc.property(validAWSRegion, (defaultRegion) => {
          // Test with default value used
          const envWithDefault = createEnv(
            { AWS_REGION: { type: 'aws-region', default: defaultRegion } },
            { env: {} }
          );
          expect(envWithDefault.AWS_REGION).toBe(defaultRegion);
          expect(typeof envWithDefault.AWS_REGION).toBe('string');

          // Test with provided value overriding default
          const envWithOverride = createEnv(
            { AWS_REGION: { type: 'aws-region', default: defaultRegion } },
            { env: { AWS_REGION: 'us-west-2' } }
          );
          expect(envWithOverride.AWS_REGION).toBe('us-west-2');
          expect(typeof envWithOverride.AWS_REGION).toBe('string');
        }),
        { numRuns: 5 }
      );
    });
  });
});
