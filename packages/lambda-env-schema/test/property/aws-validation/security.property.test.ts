import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AWS_REGIONS } from '../../../src/aws/aws-regions';
import {
  extractAccountIdFromKMSKeyArn,
  extractRegionFromKMSKeyArn,
  isValidKMSKeyArn,
  isValidKMSKeyId,
} from '../../../src/aws/kms-validators';
import {
  extractAccountIdFromSecretsManagerArn,
  extractRegionFromSecretsManagerArn,
  isValidSecretsManagerArn,
} from '../../../src/aws/secrets-manager-validators';
import { isValidSSMParameterName } from '../../../src/aws/ssm-validators';

// Character sets for generators
const DIGITS = '0123456789'.split('');
const HEX_LOWER = '0123456789abcdef'.split('');
const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALPHANUM = [...UPPER_ALPHA, ...LOWER_ALPHA, ...DIGITS];

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

// Generator for valid AWS regions
const validRegionArb = fc.constantFrom(...AWS_REGIONS);

// Generator for valid 12-digit account IDs
const validAccountIdArb = fc
  .array(fc.constantFrom(...DIGITS), { minLength: 12, maxLength: 12 })
  .map(charArrayToString);

// Generator for valid UUID (8-4-4-4-12 hex format)
const validUuidArb = fc
  .tuple(
    fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 8, maxLength: 8 }),
    fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 4, maxLength: 4 }),
    fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 4, maxLength: 4 }),
    fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 4, maxLength: 4 }),
    fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 12, maxLength: 12 })
  )
  .map(
    ([p1, p2, p3, p4, p5]) =>
      `${charArrayToString(p1)}-${charArrayToString(p2)}-${charArrayToString(p3)}-${charArrayToString(p4)}-${charArrayToString(p5)}`
  );

describe('kms-key-id validation', () => {
  it('accepts valid KMS Key IDs (UUID format)', () => {
    fc.assert(
      fc.property(validUuidArb, (keyId) => {
        expect(isValidKMSKeyId(keyId)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects UUIDs without hyphens', () => {
    const noHyphensArb = fc
      .array(fc.constantFrom(...HEX_LOWER), { minLength: 32, maxLength: 32 })
      .map(charArrayToString);

    fc.assert(
      fc.property(noHyphensArb, (value) => {
        expect(isValidKMSKeyId(value)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects UUIDs with wrong segment lengths', () => {
    // Generate UUIDs with wrong segment lengths (e.g., 7-4-4-4-12 instead of 8-4-4-4-12)
    const wrongLengthArb = fc
      .tuple(
        fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 7, maxLength: 7 }),
        fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 4, maxLength: 4 }),
        fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 4, maxLength: 4 }),
        fc.array(fc.constantFrom(...HEX_LOWER), { minLength: 4, maxLength: 4 }),
        fc.array(fc.constantFrom(...HEX_LOWER), {
          minLength: 12,
          maxLength: 12,
        })
      )
      .map(
        ([p1, p2, p3, p4, p5]) =>
          `${charArrayToString(p1)}-${charArrayToString(p2)}-${charArrayToString(p3)}-${charArrayToString(p4)}-${charArrayToString(p5)}`
      );

    fc.assert(
      fc.property(wrongLengthArb, (value) => {
        expect(isValidKMSKeyId(value)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('kms-key-arn validation', () => {
  // Generator for valid KMS Key ARNs
  const validKMSKeyArnArb = fc
    .tuple(validRegionArb, validAccountIdArb, validUuidArb)
    .map(
      ([region, accountId, keyId]) =>
        `arn:aws:kms:${region}:${accountId}:key/${keyId}`
    );

  it('accepts valid KMS Key ARNs', () => {
    fc.assert(
      fc.property(validKMSKeyArnArb, (arn) => {
        expect(isValidKMSKeyArn(arn)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with wrong service', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validUuidArb,
        (region, accountId, keyId) => {
          const wrongServiceArn = `arn:aws:s3:${region}:${accountId}:key/${keyId}`;
          expect(isValidKMSKeyArn(wrongServiceArn)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with invalid account ID', () => {
    const invalidAccountIdArb = fc
      .array(fc.constantFrom(...DIGITS), { minLength: 1, maxLength: 20 })
      .map(charArrayToString)
      .filter((s) => s.length !== 12);

    fc.assert(
      fc.property(
        validRegionArb,
        invalidAccountIdArb,
        validUuidArb,
        (region, invalidAccountId, keyId) => {
          const invalidArn = `arn:aws:kms:${region}:${invalidAccountId}:key/${keyId}`;
          expect(isValidKMSKeyArn(invalidArn)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts region correctly from valid KMS Key ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validUuidArb,
        (region, accountId, keyId) => {
          const arn = `arn:aws:kms:${region}:${accountId}:key/${keyId}`;
          expect(extractRegionFromKMSKeyArn(arn)).toBe(region);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts account ID correctly from valid KMS Key ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validUuidArb,
        (region, accountId, keyId) => {
          const arn = `arn:aws:kms:${region}:${accountId}:key/${keyId}`;
          expect(extractAccountIdFromKMSKeyArn(arn)).toBe(accountId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('secrets-manager-arn validation', () => {
  // Characters allowed in secret names
  const SECRET_NAME_CHARS = [...ALPHANUM, '_', '/', '+', '=', '.', '@', '-'];

  // Generator for valid secret names (without the random suffix)
  const validSecretNameArb = fc
    .array(fc.constantFrom(...SECRET_NAME_CHARS), {
      minLength: 1,
      maxLength: 50,
    })
    .map(charArrayToString);

  // Generator for valid 6-character alphanumeric random suffix
  const validRandomSuffixArb = fc
    .array(fc.constantFrom(...ALPHANUM), { minLength: 6, maxLength: 6 })
    .map(charArrayToString);

  // Generator for valid Secrets Manager ARNs
  const validSecretsManagerArnArb = fc
    .tuple(
      validRegionArb,
      validAccountIdArb,
      validSecretNameArb,
      validRandomSuffixArb
    )
    .map(
      ([region, accountId, secretName, randomSuffix]) =>
        `arn:aws:secretsmanager:${region}:${accountId}:secret:${secretName}-${randomSuffix}`
    );

  it('accepts valid Secrets Manager ARNs', () => {
    fc.assert(
      fc.property(validSecretsManagerArnArb, (arn) => {
        expect(isValidSecretsManagerArn(arn)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs without random suffix', () => {
    // Generate secret names that don't end with -XXXXXX pattern
    // to ensure they are rejected without the random suffix
    const secretNameWithoutSuffixPatternArb = fc
      .array(fc.constantFrom(...ALPHANUM, '_', '/', '+', '=', '.', '@'), {
        minLength: 1,
        maxLength: 50,
      })
      .map(charArrayToString)
      .filter((s) => !/[A-Za-z0-9]{6}$/.test(s)); // Ensure it doesn't end with 6 alphanumeric chars

    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        secretNameWithoutSuffixPatternArb,
        (region, accountId, secretName) => {
          const arnWithoutSuffix = `arn:aws:secretsmanager:${region}:${accountId}:secret:${secretName}`;
          expect(isValidSecretsManagerArn(arnWithoutSuffix)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with wrong random suffix length', () => {
    const wrongSuffixLengthArb = fc
      .array(fc.constantFrom(...ALPHANUM), { minLength: 1, maxLength: 10 })
      .map(charArrayToString)
      .filter((s) => s.length !== 6);

    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validSecretNameArb,
        wrongSuffixLengthArb,
        (region, accountId, secretName, wrongSuffix) => {
          const invalidArn = `arn:aws:secretsmanager:${region}:${accountId}:secret:${secretName}-${wrongSuffix}`;
          expect(isValidSecretsManagerArn(invalidArn)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects ARNs with wrong service', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validSecretNameArb,
        validRandomSuffixArb,
        (region, accountId, secretName, randomSuffix) => {
          const wrongServiceArn = `arn:aws:s3:${region}:${accountId}:secret:${secretName}-${randomSuffix}`;
          expect(isValidSecretsManagerArn(wrongServiceArn)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts region correctly from valid Secrets Manager ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validSecretNameArb,
        validRandomSuffixArb,
        (region, accountId, secretName, randomSuffix) => {
          const arn = `arn:aws:secretsmanager:${region}:${accountId}:secret:${secretName}-${randomSuffix}`;
          expect(extractRegionFromSecretsManagerArn(arn)).toBe(region);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extracts account ID correctly from valid Secrets Manager ARN', () => {
    fc.assert(
      fc.property(
        validRegionArb,
        validAccountIdArb,
        validSecretNameArb,
        validRandomSuffixArb,
        (region, accountId, secretName, randomSuffix) => {
          const arn = `arn:aws:secretsmanager:${region}:${accountId}:secret:${secretName}-${randomSuffix}`;
          expect(extractAccountIdFromSecretsManagerArn(arn)).toBe(accountId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('ssm-parameter-name validation', () => {
  // Characters allowed in SSM parameter names (after the leading /)
  const SSM_PARAM_CHARS = [...ALPHANUM, '_', '-', '.', '/'];

  // Generator for valid SSM parameter names (starting with /)
  const validSSMParameterNameArb = fc
    .array(fc.constantFrom(...SSM_PARAM_CHARS), {
      minLength: 1,
      maxLength: 100,
    })
    .map((chars) => `/${charArrayToString(chars)}`);

  it('accepts valid SSM parameter names', () => {
    fc.assert(
      fc.property(validSSMParameterNameArb, (paramName) => {
        expect(isValidSSMParameterName(paramName)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects parameter names not starting with /', () => {
    const noLeadingSlashArb = fc
      .array(fc.constantFrom(...SSM_PARAM_CHARS), {
        minLength: 1,
        maxLength: 100,
      })
      .map(charArrayToString)
      .filter((s) => !s.startsWith('/'));

    fc.assert(
      fc.property(noLeadingSlashArb, (paramName) => {
        expect(isValidSSMParameterName(paramName)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects parameter names with invalid characters', () => {
    const invalidCharsArb = fc
      .tuple(
        fc
          .array(fc.constantFrom(...SSM_PARAM_CHARS), {
            minLength: 1,
            maxLength: 50,
          })
          .map(charArrayToString),
        fc.constantFrom('@', '#', '$', '%', '&', '*', '!', ' ', '\\', '?'),
        fc
          .array(fc.constantFrom(...SSM_PARAM_CHARS), {
            minLength: 1,
            maxLength: 50,
          })
          .map(charArrayToString)
      )
      .map(
        ([before, invalidChar, after]) => `/${before}${invalidChar}${after}`
      );

    fc.assert(
      fc.property(invalidCharsArb, (paramName) => {
        expect(isValidSSMParameterName(paramName)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('accepts hierarchical parameter names', () => {
    // Generate hierarchical paths like /prod/db/password
    const hierarchicalNameArb = fc
      .array(
        fc
          .array(fc.constantFrom(...ALPHANUM, '_', '-', '.'), {
            minLength: 1,
            maxLength: 20,
          })
          .map(charArrayToString),
        { minLength: 1, maxLength: 5 }
      )
      .map((segments) => `/${segments.join('/')}`);

    fc.assert(
      fc.property(hierarchicalNameArb, (paramName) => {
        expect(isValidSSMParameterName(paramName)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
