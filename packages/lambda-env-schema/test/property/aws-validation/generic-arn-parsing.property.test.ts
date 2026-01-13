import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseArn } from '../../../src/aws/arn-validators';

describe('Generic ARN parsing property tests', () => {
  describe('Property 12: Generic ARN Parsing', () => {
    // Generator for valid AWS service names
    const validService = fc.oneof(
      // Common AWS services
      fc.constantFrom(
        's3',
        'lambda',
        'dynamodb',
        'sqs',
        'sns',
        'iam',
        'kms',
        'secretsmanager',
        'rds',
        'ec2',
        'ecs',
        'eks',
        'cloudformation',
        'cloudwatch',
        'logs',
        'apigateway',
        'cognito-idp',
        'cognito-identity',
        'elasticloadbalancing',
        'autoscaling',
        'route53',
        'cloudfront',
        'acm',
        'ssm',
        'events',
        'states',
        'batch',
        'glue',
        'athena',
        'kinesis',
        'firehose',
        'redshift',
        'elasticache',
        'elasticsearch',
        'opensearch'
      ),
      // Custom service names (any non-empty string without colons)
      fc
        .string({ minLength: 1, maxLength: 30 })
        .filter((s) => !s.includes(':') && s.trim().length > 0)
        .map((s) => s || 'custom-service')
    );

    // Generator for valid AWS regions (may be empty for global services)
    const validRegion = fc.oneof(
      fc.constant(''), // Empty for global services like IAM, S3
      fc.constantFrom(
        'us-east-1',
        'us-east-2',
        'us-west-1',
        'us-west-2',
        'eu-west-1',
        'eu-west-2',
        'eu-central-1',
        'ap-northeast-1',
        'ap-southeast-1',
        'ap-southeast-2',
        'ap-south-1',
        'ca-central-1',
        'sa-east-1'
      )
    );

    // Generator for valid AWS account IDs (may be empty for some resources)
    const validAccountId = fc.oneof(
      fc.constant(''), // Empty for some resources like S3 buckets
      fc.integer({ min: 100000000000, max: 999999999999 }).map(String)
    );

    // Generator for valid resource identifiers
    const validResource = fc.oneof(
      // Simple resource names
      fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => /^[a-zA-Z0-9._/-]+$/.test(s))
        .map((s) => s || 'my-resource'),
      // Resource with type prefix (e.g., "table/my-table", "function:my-function")
      fc
        .tuple(
          fc.constantFrom(
            'table',
            'function',
            'key',
            'secret',
            'role',
            'user',
            'policy',
            'instance'
          ),
          fc.oneof(fc.constant('/'), fc.constant(':')),
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter((s) => /^[a-zA-Z0-9._-]+$/.test(s))
            .map((s) => s || 'resource-name')
        )
        .map(([type, separator, name]) => `${type}${separator}${name}`),
      // S3-style resources
      fc
        .tuple(
          fc
            .string({ minLength: 3, maxLength: 20 })
            .filter((s) => /^[a-z0-9.-]+$/.test(s))
            .map((s) => s || 'my-bucket'),
          fc.oneof(
            fc.constant(undefined),
            fc
              .string({ minLength: 1, maxLength: 30 })
              .filter((s) => /^[a-zA-Z0-9._/-]+$/.test(s))
              .map((s) => s || 'my-object')
          )
        )
        .map(([bucket, object]) => (object ? `${bucket}/${object}` : bucket)),
      // Complex resource paths
      fc
        .array(
          fc
            .string({ minLength: 1, maxLength: 15 })
            .filter((s) => /^[a-zA-Z0-9._-]+$/.test(s))
            .map((s) => s || 'part'),
          { minLength: 1, maxLength: 4 }
        )
        .map((parts) => parts.join('/'))
    );

    // Generator for valid generic ARNs
    const validGenericArn = fc
      .tuple(validService, validRegion, validAccountId, validResource)
      .map(
        ([service, region, accountId, resource]) =>
          `arn:aws:${service}:${region}:${accountId}:${resource}`
      );

    it('when value matches generic ARN pattern, parsed result contains service extracted from the ARN', () => {
      fc.assert(
        fc.property(validGenericArn, (arn) => {
          const parsed = parseArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected service from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);

            const expectedService = parts[2];
            expect(parsed.service).toBe(expectedService);
            expect(parsed.service.length).toBeGreaterThan(0);
            expect(parsed.service).not.toContain(':');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains region extracted from the ARN (may be empty string)', () => {
      fc.assert(
        fc.property(validGenericArn, (arn) => {
          const parsed = parseArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected region from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);

            const expectedRegion = parts[3];
            expect(parsed.region).toBe(expectedRegion);
            // Region can be empty string for global services
            if (parsed.region !== '') {
              expect(/^[a-z]{2}-[a-z]+-\d$/.test(parsed.region)).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains accountId extracted from the ARN (may be empty string)', () => {
      fc.assert(
        fc.property(validGenericArn, (arn) => {
          const parsed = parseArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected account ID from ARN
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);

            const expectedAccountId = parts[4];
            expect(parsed.accountId).toBe(expectedAccountId);
            // Account ID can be empty string for some resources
            if (parsed.accountId !== '') {
              expect(/^\d{12}$/.test(parsed.accountId)).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains resource extracted from the ARN', () => {
      fc.assert(
        fc.property(validGenericArn, (arn) => {
          const parsed = parseArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected resource from ARN (everything after the 5th colon)
            const parts = arn.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(6);

            const expectedResource = parts.slice(5).join(':');
            expect(parsed.resource).toBe(expectedResource);
            expect(parsed.resource.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('parsed value contains original value', () => {
      fc.assert(
        fc.property(validGenericArn, (arn) => {
          const parsed = parseArn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid generic ARNs return null', () => {
      const invalidArns = fc.oneof(
        // Wrong partition (not aws)
        fc
          .tuple(validService, validRegion, validAccountId, validResource)
          .map(
            ([service, region, accountId, resource]) =>
              `arn:azure:${service}:${region}:${accountId}:${resource}`
          ),
        // Missing parts (incomplete ARN)
        fc
          .tuple(validService, validRegion)
          .map(([service, region]) => `arn:aws:${service}:${region}`),
        // Empty service
        fc
          .tuple(validRegion, validAccountId, validResource)
          .map(
            ([region, accountId, resource]) =>
              `arn:aws::${region}:${accountId}:${resource}`
          ),
        // Empty resource
        fc
          .tuple(validService, validRegion, validAccountId)
          .map(
            ([service, region, accountId]) =>
              `arn:aws:${service}:${region}:${accountId}:`
          ),
        // Not an ARN at all
        fc
          .string()
          .filter((s) => !s.startsWith('arn:aws:')),
        // Wrong format (doesn't start with arn:aws:)
        fc
          .tuple(validService, validRegion, validAccountId, validResource)
          .map(
            ([service, region, accountId, resource]) =>
              `aws:${service}:${region}:${accountId}:${resource}`
          ),
        // Too few parts
        fc.constantFrom(
          'arn:aws',
          'arn:aws:s3',
          'arn:aws:s3:',
          'arn:aws:s3::',
          'arn:aws:s3:::',
          'not-an-arn'
        )
      );

      fc.assert(
        fc.property(invalidArns, (invalidArn) => {
          const parsed = parseArn(invalidArn);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    // Test specific ARN formats to ensure they work with the generic parser
    it('parses specific AWS service ARNs correctly', () => {
      const specificArns = [
        // S3 bucket ARN
        'arn:aws:s3:::my-bucket',
        // S3 object ARN
        'arn:aws:s3:::my-bucket/my-object',
        // Lambda function ARN
        'arn:aws:lambda:us-east-1:123456789012:function:my-function',
        // DynamoDB table ARN
        'arn:aws:dynamodb:us-east-1:123456789012:table/my-table',
        // IAM role ARN
        'arn:aws:iam::123456789012:role/my-role',
        // KMS key ARN
        'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        // SNS topic ARN
        'arn:aws:sns:us-east-1:123456789012:my-topic',
        // SQS queue ARN
        'arn:aws:sqs:us-east-1:123456789012:my-queue',
      ];

      specificArns.forEach((arn) => {
        const parsed = parseArn(arn);
        expect(parsed).not.toBeNull();
        if (parsed) {
          expect(parsed.value).toBe(arn);
          expect(parsed.service).toBeTruthy();
          expect(parsed.resource).toBeTruthy();
          // Verify the ARN can be reconstructed
          const reconstructed = `arn:aws:${parsed.service}:${parsed.region}:${parsed.accountId}:${parsed.resource}`;
          expect(reconstructed).toBe(arn);
        }
      });
    });
  });
});
