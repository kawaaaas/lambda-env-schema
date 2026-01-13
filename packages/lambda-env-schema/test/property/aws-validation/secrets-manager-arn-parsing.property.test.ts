import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseSecretsManagerArn } from '../../../src/aws/secrets-manager-validators';

describe('Secrets Manager ARN parsing property tests', () => {
  describe('Property 11: Secrets Manager ARN Parsing', () => {
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

    // Generator for valid secret names (alphanumeric, hyphens, underscores, periods, forward slashes, plus, equals, at)
    const validSecretName = fc.oneof(
      // Simple names
      fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((name) => /^[\w._+=@/-]+$/.test(name))
        .map((name) => name || 'default-secret'),
      // Path-like names
      fc
        .tuple(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[\w-]+$/.test(s)),
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[\w-]+$/.test(s)),
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[\w-]+$/.test(s))
        )
        .map(([part1, part2, part3]) => `${part1}/${part2}/${part3}`),
      // Names with special characters
      fc.constantFrom(
        'my-secret',
        'prod/db/password',
        'app_config',
        'api.key',
        'service+token',
        'user=credentials',
        'email@domain'
      )
    );

    // Generator for valid random suffixes (6 alphanumeric characters)
    const validRandomSuffix = fc
      .string({ minLength: 6, maxLength: 6 })
      .filter((suffix) => /^[A-Za-z0-9]{6}$/.test(suffix))
      .map((suffix) => suffix || 'AbCdEf');

    // Generator for valid Secrets Manager ARNs
    const validSecretsManagerArn = fc
      .tuple(validRegion, validAccountId, validSecretName, validRandomSuffix)
      .map(
        ([region, accountId, secretName, randomSuffix]) =>
          `arn:aws:secretsmanager:${region}:${accountId}:secret:${secretName}-${randomSuffix}`
      );

    it('when value is valid, parsed result contains secretName extracted from the ARN without random suffix', () => {
      fc.assert(
        fc.property(validSecretsManagerArn, (arn) => {
          const parsed = parseSecretsManagerArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected secret name from ARN (without random suffix)
            const match = arn.match(/secret:(.*)-[A-Za-z0-9]{6}$/);
            expect(match).not.toBeNull();
            if (match) {
              const expectedSecretName = match[1];
              expect(parsed.secretName).toBe(expectedSecretName);
              // Verify the original ARN contains the random suffix
              expect(arn).toMatch(/-[A-Za-z0-9]{6}$/);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains region extracted from the ARN', () => {
      fc.assert(
        fc.property(validSecretsManagerArn, (arn) => {
          const parsed = parseSecretsManagerArn(arn);

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
        fc.property(validSecretsManagerArn, (arn) => {
          const parsed = parseSecretsManagerArn(arn);

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
        fc.property(validSecretsManagerArn, (arn) => {
          const parsed = parseSecretsManagerArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid Secrets Manager ARNs return null', () => {
      const invalidArns = fc.oneof(
        // Wrong service
        fc
          .tuple(
            validRegion,
            validAccountId,
            validSecretName,
            validRandomSuffix
          )
          .map(
            ([region, accountId, secretName, randomSuffix]) =>
              `arn:aws:kms:${region}:${accountId}:secret:${secretName}-${randomSuffix}`
          ),
        // Invalid region format
        fc
          .tuple(validAccountId, validSecretName, validRandomSuffix)
          .map(
            ([accountId, secretName, randomSuffix]) =>
              `arn:aws:secretsmanager:invalid-region:${accountId}:secret:${secretName}-${randomSuffix}`
          ),
        // Invalid account ID (not 12 digits)
        fc
          .tuple(validRegion, validSecretName, validRandomSuffix)
          .map(
            ([region, secretName, randomSuffix]) =>
              `arn:aws:secretsmanager:${region}:12345:secret:${secretName}-${randomSuffix}`
          ),
        // Invalid random suffix (not 6 characters)
        fc
          .tuple(validRegion, validAccountId, validSecretName)
          .map(
            ([region, accountId, secretName]) =>
              `arn:aws:secretsmanager:${region}:${accountId}:secret:${secretName}-ABC`
          ),
        // Invalid random suffix (contains invalid characters)
        fc
          .tuple(validRegion, validAccountId, validSecretName)
          .map(
            ([region, accountId, secretName]) =>
              `arn:aws:secretsmanager:${region}:${accountId}:secret:${secretName}-ABC@#$`
          ),
        // Missing secret name
        fc
          .tuple(validRegion, validAccountId, validRandomSuffix)
          .map(
            ([region, accountId, randomSuffix]) =>
              `arn:aws:secretsmanager:${region}:${accountId}:secret:-${randomSuffix}`
          ),
        // Wrong resource type (key instead of secret)
        fc
          .tuple(
            validRegion,
            validAccountId,
            validSecretName,
            validRandomSuffix
          )
          .map(
            ([region, accountId, secretName, randomSuffix]) =>
              `arn:aws:secretsmanager:${region}:${accountId}:key:${secretName}-${randomSuffix}`
          ),
        // Not an ARN at all
        fc
          .string()
          .filter((s) => !s.startsWith('arn:aws:secretsmanager:'))
      );

      fc.assert(
        fc.property(invalidArns, (invalidArn) => {
          const parsed = parseSecretsManagerArn(invalidArn);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
