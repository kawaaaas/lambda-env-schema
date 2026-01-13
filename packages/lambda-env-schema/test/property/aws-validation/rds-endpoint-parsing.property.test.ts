import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseRDSEndpoint } from '../../../src/aws/rds-validators';

describe('RDS Endpoint parsing property tests', () => {
  describe('Property 8: RDS Endpoint Parsing', () => {
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

    // Generator for valid RDS identifier (alphanumeric and hyphens)
    const validIdentifier = fc
      .string({ minLength: 1, maxLength: 30 })
      .filter((s) => /^[a-zA-Z0-9-]+$/.test(s))
      .filter(
        (s) => !s.startsWith('-') && !s.endsWith('-') && !s.includes('--')
      )
      .map((s) => s || 'mydb'); // Ensure non-empty

    // Generator for random ID portion
    const randomId = fc
      .string({ minLength: 5, maxLength: 15 })
      .filter((s) => /^[a-zA-Z0-9-]+$/.test(s))
      .map((s) => s || 'abc123xyz'); // Ensure non-empty

    // Generator for valid port numbers (1-65535)
    const validPort = fc.integer({ min: 1, max: 65535 });

    // Generator for RDS endpoints without port
    const rdsEndpointWithoutPort = fc
      .tuple(validIdentifier, randomId, validRegion)
      .map(
        ([identifier, randomId, region]) =>
          `${identifier}.${randomId}.${region}.rds.amazonaws.com`
      );

    // Generator for RDS endpoints with port
    const rdsEndpointWithPort = fc
      .tuple(validIdentifier, randomId, validRegion, validPort)
      .map(
        ([identifier, randomId, region, port]) =>
          `${identifier}.${randomId}.${region}.rds.amazonaws.com:${port}`
      );

    // Generator for all valid RDS endpoints
    const validRDSEndpoint = fc.oneof(
      rdsEndpointWithoutPort,
      rdsEndpointWithPort
    );

    it('when value is valid, parsed result contains hostname extracted from the endpoint', () => {
      fc.assert(
        fc.property(validRDSEndpoint, (endpoint) => {
          const parsed = parseRDSEndpoint(endpoint);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected hostname (everything before the last colon, if any)
            const colonIndex = endpoint.lastIndexOf(':');
            let expectedHostname: string;

            if (colonIndex !== -1) {
              const potentialPort = endpoint.slice(colonIndex + 1);
              if (/^\d+$/.test(potentialPort)) {
                expectedHostname = endpoint.slice(0, colonIndex);
              } else {
                expectedHostname = endpoint;
              }
            } else {
              expectedHostname = endpoint;
            }

            expect(parsed.hostname).toBe(expectedHostname);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value contains a port, parsed result contains port as number', () => {
      fc.assert(
        fc.property(rdsEndpointWithPort, (endpoint) => {
          const parsed = parseRDSEndpoint(endpoint);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected port from endpoint
            const colonIndex = endpoint.lastIndexOf(':');
            expect(colonIndex).toBeGreaterThan(-1);

            const portStr = endpoint.slice(colonIndex + 1);
            const expectedPort = Number.parseInt(portStr, 10);

            expect(parsed.port).toBe(expectedPort);
            expect(typeof parsed.port).toBe('number');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value does not contain a port, parsed result has port as undefined', () => {
      fc.assert(
        fc.property(rdsEndpointWithoutPort, (endpoint) => {
          const parsed = parseRDSEndpoint(endpoint);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.port).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains socketAddress in hostname:port format', () => {
      fc.assert(
        fc.property(validRDSEndpoint, (endpoint) => {
          const parsed = parseRDSEndpoint(endpoint);

          expect(parsed).not.toBeNull();
          if (parsed) {
            if (parsed.port !== undefined) {
              // If port is specified, socketAddress should be hostname:port
              expect(parsed.socketAddress).toBe(
                `${parsed.hostname}:${parsed.port}`
              );
            } else {
              // If port is not specified, socketAddress should use default port 5432
              expect(parsed.socketAddress).toBe(`${parsed.hostname}:5432`);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('when value is valid, parsed result contains region extracted from the endpoint', () => {
      fc.assert(
        fc.property(validRDSEndpoint, (endpoint) => {
          const parsed = parseRDSEndpoint(endpoint);

          expect(parsed).not.toBeNull();
          if (parsed) {
            // Extract expected region from hostname
            const hostname = parsed.hostname;
            const parts = hostname.split('.');
            // Expected parts: [identifier, random, region, 'rds', 'amazonaws', 'com']
            expect(parts.length).toBeGreaterThanOrEqual(6);
            expect(parts[parts.length - 3]).toBe('rds');

            const expectedRegion = parts[parts.length - 4];
            expect(parsed.region).toBe(expectedRegion);
            expect(/^[a-z]{2}-[a-z]+-\d$/.test(parsed.region)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('parsed value contains original value', () => {
      fc.assert(
        fc.property(validRDSEndpoint, (endpoint) => {
          const parsed = parseRDSEndpoint(endpoint);

          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(endpoint);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('invalid RDS endpoints return null', () => {
      const invalidEndpoints = fc.oneof(
        // Wrong service
        fc
          .tuple(validIdentifier, randomId, validRegion)
          .map(
            ([identifier, randomId, region]) =>
              `${identifier}.${randomId}.${region}.ec2.amazonaws.com`
          ),
        // Invalid region format
        fc
          .tuple(validIdentifier, randomId)
          .map(
            ([identifier, randomId]) =>
              `${identifier}.${randomId}.invalid-region.rds.amazonaws.com`
          ),
        // Missing random ID part
        fc
          .tuple(validIdentifier, validRegion)
          .map(
            ([identifier, region]) =>
              `${identifier}.${region}.rds.amazonaws.com`
          ),
        // Invalid port (non-numeric)
        fc
          .tuple(validIdentifier, randomId, validRegion)
          .map(
            ([identifier, randomId, region]) =>
              `${identifier}.${randomId}.${region}.rds.amazonaws.com:abc`
          ),
        // Invalid port (out of range)
        fc
          .tuple(validIdentifier, randomId, validRegion)
          .map(
            ([identifier, randomId, region]) =>
              `${identifier}.${randomId}.${region}.rds.amazonaws.com:99999`
          ),
        // Not an endpoint at all
        fc
          .string()
          .filter((s) => !s.includes('.rds.amazonaws.com'))
      );

      fc.assert(
        fc.property(invalidEndpoints, (invalidEndpoint) => {
          const parsed = parseRDSEndpoint(invalidEndpoint);
          expect(parsed).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
