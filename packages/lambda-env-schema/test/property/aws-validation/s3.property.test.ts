import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isValidS3Arn, isValidS3BucketName } from '../../../src/aws/s3-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const LOWER_ALPHANUM = [...LOWER_ALPHA, ...DIGITS];
const S3_BUCKET_CHARS = [...LOWER_ALPHA, ...DIGITS, '-'];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

describe('s3-bucket-name validation', () => {
  // Generator for valid S3 bucket names
  // Rules: 3-63 chars, lowercase letters/numbers/hyphens, no start/end hyphen, no consecutive hyphens
  const validS3BucketNameArb = fc
    .tuple(
      // First character: lowercase letter or digit (not hyphen)
      fc.constantFrom(...LOWER_ALPHANUM),
      // Middle characters: lowercase letters, digits, or single hyphens (no consecutive)
      fc
        .array(fc.constantFrom(...S3_BUCKET_CHARS), {
          minLength: 1,
          maxLength: 60,
        })
        .map((chars) => {
          // Remove consecutive hyphens
          const result: string[] = [];
          for (const char of chars) {
            if (char === '-' && result[result.length - 1] === '-') {
              continue;
            }
            result.push(char);
          }
          return result.join('');
        }),
      // Last character: lowercase letter or digit (not hyphen)
      fc.constantFrom(...LOWER_ALPHANUM)
    )
    .map(([first, middle, last]) => first + middle + last)
    .filter((name) => {
      // Ensure length is 3-63
      if (name.length < 3 || name.length > 63) return false;
      // Ensure no consecutive hyphens
      if (name.includes('--')) return false;
      // Ensure no reserved prefixes/suffixes
      if (name.startsWith('xn--')) return false;
      if (name.endsWith('-s3alias') || name.endsWith('--ol-s3')) return false;
      return true;
    });

  it('accepts valid S3 bucket names', () => {
    fc.assert(
      fc.property(validS3BucketNameArb, (bucketName) => {
        expect(isValidS3BucketName(bucketName)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects bucket names shorter than 3 characters', () => {
    const shortNameArb = fc
      .array(fc.constantFrom(...LOWER_ALPHANUM), {
        minLength: 1,
        maxLength: 2,
      })
      .map(charArrayToString);

    fc.assert(
      fc.property(shortNameArb, (shortName) => {
        expect(isValidS3BucketName(shortName)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects bucket names longer than 63 characters', () => {
    const longNameArb = fc
      .array(fc.constantFrom(...LOWER_ALPHANUM), {
        minLength: 64,
        maxLength: 100,
      })
      .map(charArrayToString);

    fc.assert(
      fc.property(longNameArb, (longName) => {
        expect(isValidS3BucketName(longName)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects bucket names starting with hyphen', () => {
    const hyphenStartArb = fc
      .array(fc.constantFrom(...LOWER_ALPHANUM), {
        minLength: 2,
        maxLength: 62,
      })
      .map((chars) => `-${chars.join('')}`);

    fc.assert(
      fc.property(hyphenStartArb, (name) => {
        expect(isValidS3BucketName(name)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects bucket names ending with hyphen', () => {
    const hyphenEndArb = fc
      .array(fc.constantFrom(...LOWER_ALPHANUM), {
        minLength: 2,
        maxLength: 62,
      })
      .map((chars) => `${chars.join('')}-`);

    fc.assert(
      fc.property(hyphenEndArb, (name) => {
        expect(isValidS3BucketName(name)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects bucket names with consecutive hyphens', () => {
    const consecutiveHyphenArb = fc
      .tuple(
        fc
          .array(fc.constantFrom(...LOWER_ALPHANUM), {
            minLength: 1,
            maxLength: 30,
          })
          .map(charArrayToString),
        fc
          .array(fc.constantFrom(...LOWER_ALPHANUM), {
            minLength: 1,
            maxLength: 30,
          })
          .map(charArrayToString)
      )
      .map(([before, after]) => `${before}--${after}`)
      .filter((name) => name.length >= 3 && name.length <= 63);

    fc.assert(
      fc.property(consecutiveHyphenArb, (name) => {
        expect(isValidS3BucketName(name)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects bucket names formatted as IP addresses', () => {
    const ipAddressArb = fc
      .tuple(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      )
      .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

    fc.assert(
      fc.property(ipAddressArb, (ipAddress) => {
        expect(isValidS3BucketName(ipAddress)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects bucket names starting with xn--', () => {
    const xnPrefixArb = fc
      .array(fc.constantFrom(...LOWER_ALPHANUM), {
        minLength: 1,
        maxLength: 59,
      })
      .map((chars) => `xn--${chars.join('')}`)
      .filter((name) => name.length >= 3 && name.length <= 63);

    fc.assert(
      fc.property(xnPrefixArb, (name) => {
        expect(isValidS3BucketName(name)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects bucket names ending with -s3alias', () => {
    const s3aliasSuffixArb = fc
      .array(fc.constantFrom(...LOWER_ALPHANUM), {
        minLength: 1,
        maxLength: 55,
      })
      .map((chars) => `${chars.join('')}-s3alias`)
      .filter((name) => name.length >= 3 && name.length <= 63);

    fc.assert(
      fc.property(s3aliasSuffixArb, (name) => {
        expect(isValidS3BucketName(name)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects bucket names with uppercase characters', () => {
    const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const uppercaseArb = fc
      .array(
        fc.constantFrom(...[...LOWER_ALPHA, ...UPPER_ALPHA, ...DIGITS]),
        { minLength: 3, maxLength: 63 }
      )
      .map(charArrayToString)
      .filter((s) => /[A-Z]/.test(s));

    fc.assert(
      fc.property(uppercaseArb, (name) => {
        expect(isValidS3BucketName(name)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('s3-arn validation', () => {
  // Generator for valid S3 bucket names (simplified for ARN testing)
  const validBucketNameForArnArb = fc
    .tuple(
      fc.constantFrom(...LOWER_ALPHANUM),
      fc
        .array(fc.constantFrom(...[...LOWER_ALPHANUM, '.']), {
          minLength: 1,
          maxLength: 60,
        })
        .map(charArrayToString),
      fc.constantFrom(...LOWER_ALPHANUM)
    )
    .map(([first, middle, last]) => first + middle + last)
    .filter((name) => name.length >= 3 && name.length <= 63);

  // Generator for valid S3 bucket ARNs
  const validS3BucketArnArb = validBucketNameForArnArb.map(
    (bucketName) => `arn:aws:s3:::${bucketName}`
  );

  // Generator for valid S3 object ARNs
  const validS3ObjectArnArb = fc
    .tuple(
      validBucketNameForArnArb,
      fc
        .string({ minLength: 1, maxLength: 100 })
        .filter((s) => !s.includes('\n') && !s.includes('\r'))
    )
    .map(
      ([bucketName, objectKey]) => `arn:aws:s3:::${bucketName}/${objectKey}`
    );

  it('accepts valid S3 bucket ARNs', () => {
    fc.assert(
      fc.property(validS3BucketArnArb, (arn) => {
        expect(isValidS3Arn(arn)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('accepts valid S3 object ARNs', () => {
    fc.assert(
      fc.property(validS3ObjectArnArb, (arn) => {
        expect(isValidS3Arn(arn)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with wrong service', () => {
    const wrongServiceArb = fc
      .constantFrom('dynamodb', 'lambda', 'sqs', 'sns', 'ec2')
      .chain((service) =>
        validBucketNameForArnArb.map(
          (bucketName) => `arn:aws:${service}:::${bucketName}`
        )
      );

    fc.assert(
      fc.property(wrongServiceArb, (arn) => {
        expect(isValidS3Arn(arn)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects non-ARN strings', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1 })
          .filter((s) => !s.startsWith('arn:aws:s3:::')),
        (nonArn) => {
          expect(isValidS3Arn(nonArn)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with bucket names starting with hyphen', () => {
    const invalidBucketArnArb = fc
      .array(fc.constantFrom(...LOWER_ALPHANUM), {
        minLength: 2,
        maxLength: 62,
      })
      .map((chars) => `arn:aws:s3:::-${chars.join('')}`);

    fc.assert(
      fc.property(invalidBucketArnArb, (arn) => {
        expect(isValidS3Arn(arn)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
