import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { AWS_REGIONS, isValidAWSRegion } from '../../../src/aws/aws-regions';

describe('aws-region validation', () => {
  it('accepts all valid AWS regions', () => {
    fc.assert(
      fc.property(fc.constantFrom(...AWS_REGIONS), (region) => {
        expect(isValidAWSRegion(region)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects strings not in the AWS regions list', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1 })
          .filter(
            (s) => !AWS_REGIONS.includes(s as (typeof AWS_REGIONS)[number])
          ),
        (invalidRegion) => {
          expect(isValidAWSRegion(invalidRegion)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects empty strings', () => {
    expect(isValidAWSRegion('')).toBe(false);
  });

  it('rejects region-like strings with typos', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'us-east-99',
          'ap-northeast-99',
          'eu-west-99',
          'us-weast-1',
          'ap-north-1',
          'eu-central-99'
        ),
        (typoRegion) => {
          expect(isValidAWSRegion(typoRegion)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
