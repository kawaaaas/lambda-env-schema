import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseLambdaFunctionArn } from '../../../src/aws/lambda-validators';

describe('Lambda Function ARN parsing property tests', () => {
  describe('Property 9: Lambda Function ARN Parsing', () => {
    // Generator for valid AWS regions
    const validRegion = fc.oneof(
      fc.constant('us-east-1'),
      fc.constant('us-east-2'),
      fc.constant('us-west-1'),
      fc.constant('us-west-2'),
      fc.constant('eu-west-1'),
      fc.constant('eu-west-2'),
      fc.constant('eu-central-1'),
      fc.constant('ap-northeast-1'),
      fc.constant('ap-southeast-1'),
      fc.constant('ap-southeast-2'),
      fc.constant('ap-south-1'),
      fc.constant('ca-central-1'),
      fc.constant('sa-east-1')
    );

    // Generator for valid AWS account IDs (12 digits)
    const validAccountId = fc
      .integer({ min: 100000000000, max: 999999999999 })
      .map(String);

    // Generator for valid Lambda function names (1-64 chars, alphanumeric, hyphens, underscores)
    const validFunctionName = fc
      .string({ minLength: 1, maxLength: 64 })
      .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s))
      .map((s) => s || 'my-function'); // Ensure non-empty

    // Generator for valid aliases/qualifiers (alphanumeric, hyphens, underscores, or $LATEST)
    const validAlias = fc.oneof(
      fc.constant('$LATEST'),
      fc.constant('prod'),
      fc.constant('dev'),
      fc.constant('staging'),
      fc
        .string({ minLength: 1, maxLength: 20 })
        .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s))
        .map((s) => s || 'alias1'), // Ensure non-empty
      fc
        .integer({ min: 1, max: 999 })
        .map(String) // Version numbers
    );

    // Generator for Lambda Function ARNs without alias
    const lambdaFunctionArnWithoutAlias = fc
      .tuple(validRegion, validAccountId, validFunctionName)
      .map(
        ([region, accountId, functionName]) =>
          `arn:aws:lambda:${region}:${accountId}:function:${functionName}`
      );

    // Generator for Lambda Function ARNs with alias
    const lambdaFunctionArnWithAlias = fc
      .tuple(validRegion, validAccountId, validFunctionName, validAlias)
      .map(
        ([region, accountId, functionName, alias]) =>
          `arn:aws:lambda:${region}:${accountId}:function:${functionName}:${alias}`
      );

    // Generator for all valid Lambda Function ARNs
    const validLambdaFunctionArn = fc.oneof(
      lambdaFunctionArnWithoutAlias,
      lambdaFunctionArnWithAlias
    );

    it('when value matches Lambda function ARN pattern, parsed result contains functionName extracted from the ARN', () => {
      fc.assert(
        fc.property(validLambdaFunctionArn, (arn) => {
          const parsed = parseLambdaFunctionArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected function name from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(7);

            const functionPart = parts[6]; // Should be the function name
            expect(parsed.functionName).toBe(functionPart);
            expect(parsed.functionName).toMatch(/^[a-zA-Z0-9_-]{1,64}$/);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value contains an alias or version, parsed result contains alias property', () => {
      fc.assert(
        fc.property(lambdaFunctionArnWithAlias, (arn) => {
          const parsed = parseLambdaFunctionArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected alias from ARN
            const parts = arn.split(':');
            expect(parts.length).toBe(8); // Should have 8 parts when alias is present

            const expectedAlias = parts[7];
            expect(parsed.alias).toBe(expectedAlias);
            expect(parsed.alias).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value does not contain an alias, parsed result has alias as undefined', () => {
      fc.assert(
        fc.property(lambdaFunctionArnWithoutAlias, (arn) => {
          const parsed = parseLambdaFunctionArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.alias).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains qualifier property (same as alias)', () => {
      fc.assert(
        fc.property(validLambdaFunctionArn, (arn) => {
          const parsed = parseLambdaFunctionArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // qualifier should be the same as alias
            expect(parsed.qualifier).toBe(parsed.alias);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains region extracted from the ARN', () => {
      fc.assert(
        fc.property(validLambdaFunctionArn, (arn) => {
          const parsed = parseLambdaFunctionArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected region from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);

            const expectedRegion = parts[3];
            expect(parsed.region).toBe(expectedRegion);
            expect(/^[a-z]{2}-[a-z]+-\d$/.test(parsed.region)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains accountId extracted from the ARN', () => {
      fc.assert(
        fc.property(validLambdaFunctionArn, (arn) => {
          const parsed = parseLambdaFunctionArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected account ID from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);

            const expectedAccountId = parts[4];
            expect(parsed.accountId).toBe(expectedAccountId);
            expect(/^\d{12}$/.test(parsed.accountId)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('parsed value contains original value', () => {
      fc.assert(
        fc.property(validLambdaFunctionArn, (arn) => {
          const parsed = parseLambdaFunctionArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid Lambda Function ARNs return null', () => {
      const invalidArns = fc.oneof(
        // Wrong service
        fc
          .tuple(validRegion, validAccountId, validFunctionName)
          .map(
            ([region, accountId, functionName]) =>
              `arn:aws:ec2:${region}:${accountId}:function:${functionName}`
          ),
        // Invalid region format
        fc
          .tuple(validAccountId, validFunctionName)
          .map(
            ([accountId, functionName]) =>
              `arn:aws:lambda:invalid-region:${accountId}:function:${functionName}`
          ),
        // Invalid account ID (not 12 digits)
        fc
          .tuple(validRegion, validFunctionName)
          .map(
            ([region, functionName]) =>
              `arn:aws:lambda:${region}:12345:function:${functionName}`
          ),
        // Missing function name
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:lambda:${region}:${accountId}:function:`
          ),
        // Invalid function name (too long)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:lambda:${region}:${accountId}:function:${'a'.repeat(65)}`
          ),
        // Invalid function name (invalid characters)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:lambda:${region}:${accountId}:function:my.function`
          ),
        // Not an ARN at all
        fc
          .string()
          .filter((s) => !s.startsWith('arn:aws:lambda:'))
      );

      fc.assert(
        fc.property(invalidArns, (invalidArn) => {
          const parsed = parseLambdaFunctionArn(invalidArn);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
