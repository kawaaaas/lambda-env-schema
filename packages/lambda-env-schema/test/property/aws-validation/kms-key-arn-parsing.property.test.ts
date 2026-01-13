import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseKMSKeyArn } from '../../../src/aws/kms-validators';

describe('KMS Key ARN parsing property tests', () => {
  describe('Property 10: KMS Key ARN Parsing', () => {
    // Character sets for generators
    const HEX_LOWER = '0123456789abcdef'.split('');

    // Helper to create a string from an array of characters
    const charArrayToString = (chars: string[]): string => chars.join('');

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

    // Generator for valid KMS Key IDs (UUID format: 8-4-4-4-12 hexadecimal)
    const validKeyId = fc
      .tuple(
        fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 8, maxLength: 8 }),
        fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 4, maxLength: 4 }),
        fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 4, maxLength: 4 }),
        fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 4, maxLength: 4 }),
        fc.array(fc.constantFrom(...HEX_LOWER), {
          minLength: 12,
          maxLength: 12,
        })
      )
      .map(
        ([part1, part2, part3, part4, part5]) =>
          `${charArrayToString(part1)}-${charArrayToString(part2)}-${charArrayToString(part3)}-${charArrayToString(part4)}-${charArrayToString(part5)}`
      );

    // Generator for valid KMS Key ARNs
    const validKMSKeyArn = fc
      .tuple(validRegion, validAccountId, validKeyId)
      .map(
        ([region, accountId, keyId]) =>
          `arn:aws:kms:${region}:${accountId}:key/${keyId}`
      );

    it('when value is valid, parsed result contains keyId extracted from the ARN', () => {
      fc.assert(
        fc.property(validKMSKeyArn, (arn) => {
          const parsed = parseKMSKeyArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected key ID from ARN
            const match = arn.match(/key\/([0-9a-f-]{36})$/i);
            expect(match).not.toBeNull();
            if (match) {
              const expectedKeyId = match[1];
              expect(parsed.keyId).toBe(expectedKeyId);
              // Verify UUID format
              expect(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                  parsed.keyId
                )
              ).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains region extracted from the ARN', () => {
      fc.assert(
        fc.property(validKMSKeyArn, (arn) => {
          const parsed = parseKMSKeyArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected region from ARN
            const parts = arn.split(':');
            expect(parts.length).toBe(6);

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
        fc.property(validKMSKeyArn, (arn) => {
          const parsed = parseKMSKeyArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected account ID from ARN
            const parts = arn.split(':');
            expect(parts.length).toBe(6);

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
        fc.property(validKMSKeyArn, (arn) => {
          const parsed = parseKMSKeyArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid KMS Key ARNs return null', () => {
      const invalidArns = fc.oneof(
        // Wrong service
        fc
          .tuple(validRegion, validAccountId, validKeyId)
          .map(
            ([region, accountId, keyId]) =>
              `arn:aws:s3:${region}:${accountId}:key/${keyId}`
          ),
        // Invalid region format
        fc
          .tuple(validAccountId, validKeyId)
          .map(
            ([accountId, keyId]) =>
              `arn:aws:kms:invalid-region:${accountId}:key/${keyId}`
          ),
        // Invalid account ID (not 12 digits)
        fc
          .tuple(validRegion, validKeyId)
          .map(([region, keyId]) => `arn:aws:kms:${region}:12345:key/${keyId}`),
        // Invalid key ID format (not UUID)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:kms:${region}:${accountId}:key/invalid-key-id`
          ),
        // Missing key ID
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) => `arn:aws:kms:${region}:${accountId}:key/`
          ),
        // Wrong resource type (alias instead of key)
        fc
          .tuple(validRegion, validAccountId)
          .map(
            ([region, accountId]) =>
              `arn:aws:kms:${region}:${accountId}:alias/my-key`
          ),
        // Not an ARN at all
        fc
          .string()
          .filter((s) => !s.startsWith('arn:aws:kms:'))
      );

      fc.assert(
        fc.property(invalidArns, (invalidArn) => {
          const parsed = parseKMSKeyArn(invalidArn);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
