import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseIAMRoleArn } from '../../../src/aws/iam-validators';

describe('IAM Role ARN parsing property tests', () => {
  describe('Property 13: IAM Role ARN Parsing', () => {
    // Generator for valid AWS account IDs (12 digits)
    const validAccountId = fc
      .integer({ min: 100000000000, max: 999999999999 })
      .map(String);

    // Generator for valid IAM role names (1-64 chars, alphanumeric plus +=,.@_-)
    const validRoleName = fc
      .string({ minLength: 1, maxLength: 64 })
      .filter((s) => /^[\w+=,.@-]+$/.test(s))
      .map((s) => s || 'MyRole'); // Ensure non-empty

    // Generator for valid IAM paths (optional, can contain multiple segments)
    const validPath = fc.oneof(
      // No path
      fc.constant(''),
      // Single path segment
      fc
        .string({ minLength: 1, maxLength: 20 })
        .filter((s) => /^[\w+=,.@-]+$/.test(s))
        .map((s) => `/${s || 'service'}/`),
      // Multiple path segments
      fc
        .tuple(
          fc
            .string({ minLength: 1, maxLength: 15 })
            .filter((s) => /^[\w+=,.@-]+$/.test(s)),
          fc
            .string({ minLength: 1, maxLength: 15 })
            .filter((s) => /^[\w+=,.@-]+$/.test(s))
        )
        .map(([part1, part2]) => `/${part1 || 'service'}/${part2 || 'role'}/`),
      // Common AWS service paths
      fc.constantFrom(
        '/service-role/',
        '/aws-service-role/',
        '/application/',
        '/lambda-role/',
        '/ec2-role/'
      )
    );

    // Generator for IAM Role ARNs without path
    const iamRoleArnWithoutPath = fc
      .tuple(validAccountId, validRoleName)
      .map(
        ([accountId, roleName]) => `arn:aws:iam::${accountId}:role/${roleName}`
      );

    // Generator for IAM Role ARNs with path
    const iamRoleArnWithPath = fc
      .tuple(
        validAccountId,
        validPath.filter((p) => p !== ''),
        validRoleName
      )
      .map(
        ([accountId, path, roleName]) =>
          `arn:aws:iam::${accountId}:role${path}${roleName}`
      );

    // Generator for all valid IAM Role ARNs
    const validIAMRoleArn = fc.oneof(iamRoleArnWithoutPath, iamRoleArnWithPath);

    it('when value is valid, parsed result contains roleName extracted from the ARN', () => {
      fc.assert(
        fc.property(validIAMRoleArn, (arn) => {
          const parsed = parseIAMRoleArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected role name from ARN (last segment after final /)
            const rolePartMatch = arn.match(/:role\/(.+)$/);
            expect(rolePartMatch).not.toBeNull();
            if (rolePartMatch) {
              const rolePart = rolePartMatch[1];
              const segments = rolePart.split('/');
              const expectedRoleName = segments[segments.length - 1];

              expect(parsed.roleName).toBe(expectedRoleName);
              expect(parsed.roleName).toMatch(/^[\w+=,.@-]{1,64}$/);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains accountId extracted from the ARN', () => {
      fc.assert(
        fc.property(validIAMRoleArn, (arn) => {
          const parsed = parseIAMRoleArn(arn);

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

    it('when value contains a path, parsed result contains path property', () => {
      fc.assert(
        fc.property(iamRoleArnWithPath, (arn) => {
          const parsed = parseIAMRoleArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected path from ARN
            const rolePartMatch = arn.match(/:role\/(.+)$/);
            expect(rolePartMatch).not.toBeNull();
            if (rolePartMatch) {
              const rolePart = rolePartMatch[1];
              const segments = rolePart.split('/');

              if (segments.length > 1) {
                // Path includes leading and trailing slashes
                const expectedPath = `/${segments.slice(0, -1).join('/')}/`;
                expect(parsed.path).toBe(expectedPath);
                expect(parsed.path).toBeDefined();
              }
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value does not contain a path, parsed result has path as undefined', () => {
      fc.assert(
        fc.property(iamRoleArnWithoutPath, (arn) => {
          const parsed = parseIAMRoleArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.path).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('parsed value contains original value', () => {
      fc.assert(
        fc.property(validIAMRoleArn, (arn) => {
          const parsed = parseIAMRoleArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid IAM Role ARNs return null', () => {
      const invalidArns = fc.oneof(
        // Wrong service
        fc
          .tuple(validAccountId, validRoleName)
          .map(
            ([accountId, roleName]) =>
              `arn:aws:ec2::${accountId}:role/${roleName}`
          ),
        // Wrong resource type (user instead of role)
        fc
          .tuple(validAccountId, validRoleName)
          .map(
            ([accountId, roleName]) =>
              `arn:aws:iam::${accountId}:user/${roleName}`
          ),
        // Invalid account ID (not 12 digits)
        fc
          .tuple(validRoleName)
          .map(([roleName]) => `arn:aws:iam::12345:role/${roleName}`),
        // Missing role name
        fc
          .tuple(validAccountId)
          .map(([accountId]) => `arn:aws:iam::${accountId}:role/`),
        // Invalid role name (too long)
        fc
          .tuple(validAccountId)
          .map(
            ([accountId]) => `arn:aws:iam::${accountId}:role/${'a'.repeat(65)}`
          ),
        // Invalid role name (invalid characters)
        fc
          .tuple(validAccountId)
          .map(([accountId]) => `arn:aws:iam::${accountId}:role/my#role`),
        // Not an ARN at all
        fc
          .string()
          .filter((s) => !s.startsWith('arn:aws:iam:'))
      );

      fc.assert(
        fc.property(invalidArns, (invalidArn) => {
          const parsed = parseIAMRoleArn(invalidArn);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
