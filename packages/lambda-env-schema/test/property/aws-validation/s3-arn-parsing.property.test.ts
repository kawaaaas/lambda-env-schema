import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseS3Arn } from '../../../src/aws/s3-validators';

describe('S3 ARN parsing property tests', () => {
  describe('Property 2: S3 ARN Parsing', () => {
    // Generator for valid S3 bucket names
    const validBucketName = fc
      .string({ minLength: 3, maxLength: 63 })
      .filter((name) => {
        // Must contain only lowercase letters, numbers, and hyphens
        if (!/^[a-z0-9-]+$/.test(name)) return false;
        // Must not start or end with hyphen
        if (name.startsWith('-') || name.endsWith('-')) return false;
        // Must not contain consecutive hyphens
        if (name.includes('--')) return false;
        // Must not be formatted as IP address
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(name)) return false;
        // Must not start with xn--
        if (name.startsWith('xn--')) return false;
        // Must not end with -s3alias or --ol-s3
        if (name.endsWith('-s3alias') || name.endsWith('--ol-s3')) return false;
        return true;
      })
      .map((name) => {
        // Ensure it starts and ends with alphanumeric
        let result = name;
        if (!/^[a-z0-9]/.test(result)) {
          result = `a${result.slice(1)}`;
        }
        if (!/[a-z0-9]$/.test(result)) {
          result = `${result.slice(0, -1)}a`;
        }
        return result;
      });

    // Generator for valid object keys
    const validObjectKey = fc
      .string({ minLength: 1, maxLength: 1024 })
      .filter((key) => key.length > 0 && !key.startsWith('/'));

    // Generator for bucket-only S3 ARNs
    const bucketOnlyArn = validBucketName.map(
      (bucket) => `arn:aws:s3:::${bucket}`
    );

    // Generator for object S3 ARNs
    const objectArn = fc
      .tuple(validBucketName, validObjectKey)
      .map(([bucket, key]) => `arn:aws:s3:::${bucket}/${key}`);

    // Generator for all valid S3 ARNs
    const validS3Arn = fc.oneof(bucketOnlyArn, objectArn);

    it('parsed result contains bucketName matching the bucket portion of the ARN', () => {
      fc.assert(
        fc.property(validS3Arn, (arn) => {
          const parsed = parseS3Arn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected bucket name from ARN
            const match = arn.match(/^arn:aws:s3:::([^/]+)/);
            expect(match).not.toBeNull();
            if (match) {
              expect(parsed.bucketName).toBe(match[1]);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when ARN contains object key, key property contains the key and isObject is true', () => {
      fc.assert(
        fc.property(objectArn, (arn) => {
          const parsed = parseS3Arn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected key from ARN
            const match = arn.match(/^arn:aws:s3:::([^/]+)\/(.*)$/);
            expect(match).not.toBeNull();
            if (match) {
              expect(parsed.key).toBe(match[2]);
              expect(parsed.isObject).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when ARN is bucket-only, key is undefined and isObject is false', () => {
      fc.assert(
        fc.property(bucketOnlyArn, (arn) => {
          const parsed = parseS3Arn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.key).toBeUndefined();
            expect(parsed.isObject).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('parsed value contains original value', () => {
      fc.assert(
        fc.property(validS3Arn, (arn) => {
          const parsed = parseS3Arn(arn);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid S3 ARNs return null', () => {
      const invalidArns = fc.oneof(
        // Wrong service
        validBucketName.map((bucket) => `arn:aws:dynamodb:::${bucket}`),
        // Missing arn prefix
        validBucketName.map((bucket) => `aws:s3:::${bucket}`),
        // Invalid bucket names
        fc.constant('arn:aws:s3:::ab'), // too short
        fc.constant('arn:aws:s3:::-bucket'), // starts with hyphen
        fc.constant('arn:aws:s3:::bucket-'), // ends with hyphen
        fc.constant('arn:aws:s3:::my--bucket'), // consecutive hyphens
        fc.constant('arn:aws:s3:::192.168.1.1'), // IP address format
        // Not an ARN at all
        fc
          .string()
          .filter((s) => !s.startsWith('arn:aws:s3:::'))
      );

      fc.assert(
        fc.property(invalidArns, (invalidArn) => {
          const parsed = parseS3Arn(invalidArn);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
