/**
 * RDS (Relational Database Service) validators and parsers.
 */

import type { ParsedRDSEndpoint } from './parsed-types';

/**
 * Regular expression pattern for RDS endpoint validation.
 *
 * RDS endpoints follow the format:
 * <db-identifier>.<random-id>.<region>.rds.amazonaws.com
 *
 * Examples:
 * - mydb.abc123xyz.us-east-1.rds.amazonaws.com
 * - my-cluster.cluster-abc123xyz.ap-northeast-1.rds.amazonaws.com
 *
 * @see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ConnectToInstance.html
 */
const RDS_ENDPOINT_PATTERN =
  /^[\w-]+\.[\w-]+\.[a-z]{2}-[a-z]+-\d\.rds\.amazonaws\.com$/;

/**
 * Validates an RDS endpoint.
 *
 * RDS endpoints follow the format:
 * <db-identifier>.<random-id>.<region>.rds.amazonaws.com
 *
 * This includes both RDS instance endpoints and Aurora cluster endpoints.
 *
 * @param value - The RDS endpoint to validate
 * @returns true if the value is a valid RDS endpoint, false otherwise
 *
 * @see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ConnectToInstance.html
 *
 * @example
 * ```typescript
 * isValidRDSEndpoint('mydb.abc123xyz.us-east-1.rds.amazonaws.com'); // true
 * isValidRDSEndpoint('my-cluster.cluster-abc123xyz.ap-northeast-1.rds.amazonaws.com'); // true
 * isValidRDSEndpoint('mydb.us-east-1.rds.amazonaws.com'); // false (missing random id)
 * isValidRDSEndpoint('mydb.abc123xyz.invalid-region.rds.amazonaws.com'); // false (invalid region format)
 * isValidRDSEndpoint('mydb.abc123xyz.us-east-1.ec2.amazonaws.com'); // false (wrong service)
 * ```
 */
export function isValidRDSEndpoint(value: string): boolean {
  return RDS_ENDPOINT_PATTERN.test(value);
}

/**
 * Extracts the AWS region from an RDS endpoint.
 *
 * @param value - The RDS endpoint to extract region from
 * @returns The region code, or undefined if extraction fails
 *
 * @example
 * ```typescript
 * extractRegionFromRDSEndpoint('mydb.abc123xyz.us-east-1.rds.amazonaws.com'); // 'us-east-1'
 * extractRegionFromRDSEndpoint('my-cluster.cluster-abc123xyz.ap-northeast-1.rds.amazonaws.com'); // 'ap-northeast-1'
 * extractRegionFromRDSEndpoint('invalid'); // undefined
 * ```
 */
export function extractRegionFromRDSEndpoint(
  value: string
): string | undefined {
  // RDS endpoint format: <identifier>.<random>.<region>.rds.amazonaws.com
  const parts = value.split('.');
  // Expected parts: [identifier, random, region, 'rds', 'amazonaws', 'com']
  if (parts.length >= 6 && parts[parts.length - 3] === 'rds') {
    const region = parts[parts.length - 4];
    // Basic region format check: xx-xxxx-N
    if (/^[a-z]{2}-[a-z]+-\d$/.test(region)) {
      return region;
    }
  }
  return undefined;
}

/**
 * Validates an RDS cluster identifier.
 *
 * RDS cluster identifiers must:
 * - Be 1-63 characters long
 * - Start with a letter
 * - Contain only alphanumeric characters and hyphens
 * - Not end with a hyphen
 * - Not contain consecutive hyphens
 *
 * @param value - The cluster identifier to validate
 * @returns true if the cluster identifier is valid, false otherwise
 *
 * @see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html
 *
 * @example
 * ```typescript
 * isValidRDSClusterId('my-cluster');           // true
 * isValidRDSClusterId('myCluster123');         // true
 * isValidRDSClusterId('a');                    // true (minimum 1 character)
 * isValidRDSClusterId('my-db-cluster');        // true
 * isValidRDSClusterId('1-cluster');            // false (must start with letter)
 * isValidRDSClusterId('-cluster');             // false (must start with letter)
 * isValidRDSClusterId('cluster-');             // false (cannot end with hyphen)
 * isValidRDSClusterId('my--cluster');          // false (consecutive hyphens)
 * isValidRDSClusterId('a'.repeat(64));         // false (too long)
 * isValidRDSClusterId('my_cluster');           // false (underscore not allowed)
 * ```
 */
export function isValidRDSClusterId(value: string): boolean {
  // Length: 1-63 characters
  if (value.length < 1 || value.length > 63) {
    return false;
  }

  // Must start with a letter
  if (!/^[a-zA-Z]/.test(value)) {
    return false;
  }

  // Only alphanumeric characters and hyphens
  if (!/^[a-zA-Z0-9-]+$/.test(value)) {
    return false;
  }

  // Must not end with a hyphen
  if (value.endsWith('-')) {
    return false;
  }

  // Must not contain consecutive hyphens
  if (value.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Parses an RDS Endpoint into its components.
 *
 * Supports both formats:
 * - Without port: <db-identifier>.<random-id>.<region>.rds.amazonaws.com
 * - With port: <db-identifier>.<random-id>.<region>.rds.amazonaws.com:<port>
 *
 * @param value - The RDS Endpoint to parse
 * @returns Parsed RDS Endpoint object, or null if invalid
 *
 * @example
 * ```typescript
 * parseRDSEndpoint('mydb.abc123xyz.us-east-1.rds.amazonaws.com');
 * // {
 * //   value: 'mydb.abc123xyz.us-east-1.rds.amazonaws.com',
 * //   hostname: 'mydb.abc123xyz.us-east-1.rds.amazonaws.com',
 * //   port: undefined,
 * //   socketAddress: 'mydb.abc123xyz.us-east-1.rds.amazonaws.com:5432',
 * //   region: 'us-east-1'
 * // }
 *
 * parseRDSEndpoint('mydb.abc123xyz.us-east-1.rds.amazonaws.com:3306');
 * // {
 * //   value: 'mydb.abc123xyz.us-east-1.rds.amazonaws.com:3306',
 * //   hostname: 'mydb.abc123xyz.us-east-1.rds.amazonaws.com',
 * //   port: 3306,
 * //   socketAddress: 'mydb.abc123xyz.us-east-1.rds.amazonaws.com:3306',
 * //   region: 'us-east-1'
 * // }
 *
 * parseRDSEndpoint('invalid');
 * // null
 * ```
 */
export function parseRDSEndpoint(value: string): ParsedRDSEndpoint | null {
  // Split hostname and port
  const colonIndex = value.lastIndexOf(':');
  let hostname: string;
  let portStr: string | undefined;

  // Check if there's a port (colon followed by digits at the end)
  if (colonIndex !== -1) {
    const potentialPort = value.slice(colonIndex + 1);
    if (/^\d+$/.test(potentialPort)) {
      hostname = value.slice(0, colonIndex);
      portStr = potentialPort;
    } else {
      hostname = value;
    }
  } else {
    hostname = value;
  }

  if (!isValidRDSEndpoint(hostname)) return null;

  const region = extractRegionFromRDSEndpoint(hostname);
  if (!region) return null;

  const port = portStr ? Number.parseInt(portStr, 10) : undefined;
  const socketAddress = port ? `${hostname}:${port}` : `${hostname}:5432`;

  return {
    value,
    hostname,
    port,
    socketAddress,
    region,
  };
}
