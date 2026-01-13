import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseS3Uri } from '../../../src/aws/s3-validators';

describe('S3 URI parsing property tests', () => {
  describe('Property 3: S3 URI Parsing', () => {
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

    // Generator for valid object keys (non-empty, doesn't start with /)
    const validObjectKey = fc
      .string({ minLength: 1, maxLength: 1024 })
      .filter((key) => key.length > 0 && !key.startsWith('/'))
      .map((key) => key || 'default-key'); // Ensure non-empty

    // Generator for valid S3 URIs
    const validS3Uri = fc
      .tuple(validBucketName, validObjectKey)
      .map(([bucket, key]) => `s3://${bucket}/${key}`);

    it('when value matches s3://<bucket>/<key>, the value is accepted', () => {
      fc.assert(
        fc.property(validS3Uri, (uri) => {
          const parsed = parseS3Uri(uri);
          expect(parsed).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains bucket property', () => {
      fc.assert(
        fc.property(validS3Uri, (uri) => {
          const parsed = parseS3Uri(uri);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected bucket from URI
            const match = uri.match(/^s3:\/\/([^/]+)\//);
            expect(match).not.toBeNull();
            if (match) {
              expect(parsed.bucket).toBe(match[1]);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains key property', () => {
      fc.assert(
        fc.property(validS3Uri, (uri) => {
          const parsed = parseS3Uri(uri);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected key from URI
            const match = uri.match(/^s3:\/\/[^/]+\/(.+)$/);
            expect(match).not.toBeNull();
            if (match) {
              expect(parsed.key).toBe(match[1]);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value does not match the pattern, validation error is collected', () => {
      const invalidS3Uris = fc.oneof(
        // Missing s3:// scheme
        fc
          .tuple(validBucketName, validObjectKey)
          .map(([bucket, key]) => `${bucket}/${key}`),
        // Wrong scheme
        fc
          .tuple(validBucketName, validObjectKey)
          .map(([bucket, key]) => `https://${bucket}/${key}`),
        // Missing key (bucket only)
        validBucketName.map((bucket) => `s3://${bucket}`),
        // Empty key
        validBucketName.map((bucket) => `s3://${bucket}/`),
        // Invalid bucket names
        fc.constant('s3://ab/key'), // bucket too short
        fc.constant('s3://-bucket/key'), // bucket starts with hyphen
        fc.constant('s3://bucket-/key'), // bucket ends with hyphen
        fc.constant('s3://my--bucket/key'), // consecutive hyphens in bucket
        fc.constant('s3://192.168.1.1/key'), // IP address format bucket
        // Not a URI at all
        fc
          .string()
          .filter((s) => !s.startsWith('s3://'))
      );

      fc.assert(
        fc.property(invalidS3Uris, (invalidUri) => {
          const parsed = parseS3Uri(invalidUri);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('parsed value contains original value', () => {
      fc.assert(
        fc.property(validS3Uri, (uri) => {
          const parsed = parseS3Uri(uri);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(uri);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
