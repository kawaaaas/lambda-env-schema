import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
    isValidEc2InstanceId,
    isValidSecurityGroupId,
    isValidSubnetId,
    isValidVpcId,
} from '../../../src/aws/vpc-validators';

// Character sets for generators
const HEX_CHARS = '0123456789abcdef'.split('');

// Helper to create a string from an array of characters
const charArrayToString = (chars: string[]): string => chars.join('');

describe('vpc-id validation', () => {
  // Generator for valid VPC IDs (vpc- followed by 8 or 17 hex characters)
  const validVpcIdArb = fc.oneof(
    // Legacy format: vpc-xxxxxxxx (8 hex chars)
    fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
      .map((chars) => `vpc-${charArrayToString(chars)}`),
    // New format: vpc-xxxxxxxxxxxxxxxxx (17 hex chars)
    fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 17, maxLength: 17 })
      .map((chars) => `vpc-${charArrayToString(chars)}`)
  );

  it('accepts valid VPC IDs', () => {
    fc.assert(
      fc.property(validVpcIdArb, (id) => {
        expect(isValidVpcId(id)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong prefix', () => {
    const wrongPrefixArb = fc.oneof(
      fc
        .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
        .map((chars) => `subnet-${charArrayToString(chars)}`),
      fc
        .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
        .map((chars) => `sg-${charArrayToString(chars)}`),
      fc
        .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
        .map((chars) => `i-${charArrayToString(chars)}`)
    );

    fc.assert(
      fc.property(wrongPrefixArb, (id) => {
        expect(isValidVpcId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong hex length', () => {
    // Generate IDs with hex length != 8 and != 17
    const wrongLengthArb = fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 1, maxLength: 20 })
      .map(charArrayToString)
      .filter((s) => s.length !== 8 && s.length !== 17)
      .map((hex) => `vpc-${hex}`);

    fc.assert(
      fc.property(wrongLengthArb, (id) => {
        expect(isValidVpcId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with uppercase hex characters', () => {
    const UPPER_HEX = 'ABCDEF'.split('');
    
    const withUppercaseArb = fc
      .tuple(
        fc.array(fc.constantFrom(...HEX_CHARS), { minLength: 0, maxLength: 7 }),
        fc.constantFrom(...UPPER_HEX),
        fc.array(fc.constantFrom(...HEX_CHARS), { minLength: 0, maxLength: 7 })
      )
      .map(([prefix, upper, suffix]) => {
        const combined = [...prefix, upper, ...suffix];
        return `vpc-${combined.slice(0, 8).join('')}`;
      })
      .filter((s) => /[A-F]/.test(s));

    fc.assert(
      fc.property(withUppercaseArb, (id) => {
        expect(isValidVpcId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('subnet-id validation', () => {
  // Generator for valid Subnet IDs (subnet- followed by 8 or 17 hex characters)
  const validSubnetIdArb = fc.oneof(
    // Legacy format: subnet-xxxxxxxx (8 hex chars)
    fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
      .map((chars) => `subnet-${charArrayToString(chars)}`),
    // New format: subnet-xxxxxxxxxxxxxxxxx (17 hex chars)
    fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 17, maxLength: 17 })
      .map((chars) => `subnet-${charArrayToString(chars)}`)
  );

  it('accepts valid Subnet IDs', () => {
    fc.assert(
      fc.property(validSubnetIdArb, (id) => {
        expect(isValidSubnetId(id)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong prefix', () => {
    const wrongPrefixArb = fc.oneof(
      fc
        .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
        .map((chars) => `vpc-${charArrayToString(chars)}`),
      fc
        .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
        .map((chars) => `sg-${charArrayToString(chars)}`)
    );

    fc.assert(
      fc.property(wrongPrefixArb, (id) => {
        expect(isValidSubnetId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong hex length', () => {
    const wrongLengthArb = fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 1, maxLength: 20 })
      .map(charArrayToString)
      .filter((s) => s.length !== 8 && s.length !== 17)
      .map((hex) => `subnet-${hex}`);

    fc.assert(
      fc.property(wrongLengthArb, (id) => {
        expect(isValidSubnetId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('security-group-id validation', () => {
  // Generator for valid Security Group IDs (sg- followed by 8 or 17 hex characters)
  const validSecurityGroupIdArb = fc.oneof(
    // Legacy format: sg-xxxxxxxx (8 hex chars)
    fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
      .map((chars) => `sg-${charArrayToString(chars)}`),
    // New format: sg-xxxxxxxxxxxxxxxxx (17 hex chars)
    fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 17, maxLength: 17 })
      .map((chars) => `sg-${charArrayToString(chars)}`)
  );

  it('accepts valid Security Group IDs', () => {
    fc.assert(
      fc.property(validSecurityGroupIdArb, (id) => {
        expect(isValidSecurityGroupId(id)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong prefix', () => {
    const wrongPrefixArb = fc.oneof(
      fc
        .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
        .map((chars) => `vpc-${charArrayToString(chars)}`),
      fc
        .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
        .map((chars) => `subnet-${charArrayToString(chars)}`)
    );

    fc.assert(
      fc.property(wrongPrefixArb, (id) => {
        expect(isValidSecurityGroupId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong hex length', () => {
    const wrongLengthArb = fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 1, maxLength: 20 })
      .map(charArrayToString)
      .filter((s) => s.length !== 8 && s.length !== 17)
      .map((hex) => `sg-${hex}`);

    fc.assert(
      fc.property(wrongLengthArb, (id) => {
        expect(isValidSecurityGroupId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('ec2-instance-id validation', () => {
  // Generator for valid EC2 Instance IDs (i- followed by 8 or 17 hex characters)
  const validEc2InstanceIdArb = fc.oneof(
    // Legacy format: i-xxxxxxxx (8 hex chars)
    fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
      .map((chars) => `i-${charArrayToString(chars)}`),
    // New format: i-xxxxxxxxxxxxxxxxx (17 hex chars)
    fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 17, maxLength: 17 })
      .map((chars) => `i-${charArrayToString(chars)}`)
  );

  it('accepts valid EC2 Instance IDs', () => {
    fc.assert(
      fc.property(validEc2InstanceIdArb, (id) => {
        expect(isValidEc2InstanceId(id)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong prefix', () => {
    const wrongPrefixArb = fc.oneof(
      fc
        .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
        .map((chars) => `vpc-${charArrayToString(chars)}`),
      fc
        .array(fc.constantFrom(...HEX_CHARS), { minLength: 8, maxLength: 8 })
        .map((chars) => `sg-${charArrayToString(chars)}`)
    );

    fc.assert(
      fc.property(wrongPrefixArb, (id) => {
        expect(isValidEc2InstanceId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects IDs with wrong hex length', () => {
    const wrongLengthArb = fc
      .array(fc.constantFrom(...HEX_CHARS), { minLength: 1, maxLength: 20 })
      .map(charArrayToString)
      .filter((s) => s.length !== 8 && s.length !== 17)
      .map((hex) => `i-${hex}`);

    fc.assert(
      fc.property(wrongLengthArb, (id) => {
        expect(isValidEc2InstanceId(id)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
