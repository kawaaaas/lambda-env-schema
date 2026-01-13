/**
 * VPC (Virtual Private Cloud) resource validators.
 *
 * Validates VPC-related resource IDs including VPC IDs, Subnet IDs,
 * Security Group IDs, and EC2 Instance IDs.
 */

/**
 * Regular expression pattern for VPC ID validation.
 *
 * VPC IDs follow the format: vpc-<8 or 17 hexadecimal characters>
 * - Legacy format: vpc-xxxxxxxx (8 hex chars)
 * - New format: vpc-xxxxxxxxxxxxxxxxx (17 hex chars)
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/resource-ids.html
 */
const VPC_ID_PATTERN = /^vpc-[0-9a-f]{8}([0-9a-f]{9})?$/;

/**
 * Validates a VPC ID.
 *
 * VPC IDs follow the format: vpc-<8 or 17 hexadecimal characters>
 * - Legacy format: vpc-xxxxxxxx (8 hex chars)
 * - New format: vpc-xxxxxxxxxxxxxxxxx (17 hex chars)
 *
 * @param value - The VPC ID to validate
 * @returns true if the value is a valid VPC ID, false otherwise
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/resource-ids.html
 *
 * @example
 * ```typescript
 * isValidVpcId('vpc-12345678');           // true (legacy format)
 * isValidVpcId('vpc-1234567890abcdef0');  // true (new format)
 * isValidVpcId('vpc-abcdef12');           // true
 * isValidVpcId('vpc-1234567');            // false (7 hex chars)
 * isValidVpcId('vpc-123456789');          // false (9 hex chars)
 * isValidVpcId('subnet-12345678');        // false (wrong prefix)
 * isValidVpcId('vpc-ABCDEF12');           // false (uppercase)
 * ```
 */
export function isValidVpcId(value: string): boolean {
  return VPC_ID_PATTERN.test(value);
}

/**
 * Regular expression pattern for Subnet ID validation.
 *
 * Subnet IDs follow the format: subnet-<8 or 17 hexadecimal characters>
 * - Legacy format: subnet-xxxxxxxx (8 hex chars)
 * - New format: subnet-xxxxxxxxxxxxxxxxx (17 hex chars)
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/resource-ids.html
 */
const SUBNET_ID_PATTERN = /^subnet-[0-9a-f]{8}([0-9a-f]{9})?$/;

/**
 * Validates a Subnet ID.
 *
 * Subnet IDs follow the format: subnet-<8 or 17 hexadecimal characters>
 * - Legacy format: subnet-xxxxxxxx (8 hex chars)
 * - New format: subnet-xxxxxxxxxxxxxxxxx (17 hex chars)
 *
 * @param value - The Subnet ID to validate
 * @returns true if the value is a valid Subnet ID, false otherwise
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/resource-ids.html
 *
 * @example
 * ```typescript
 * isValidSubnetId('subnet-12345678');           // true (legacy format)
 * isValidSubnetId('subnet-1234567890abcdef0');  // true (new format)
 * isValidSubnetId('subnet-abcdef12');           // true
 * isValidSubnetId('subnet-1234567');            // false (7 hex chars)
 * isValidSubnetId('subnet-123456789');          // false (9 hex chars)
 * isValidSubnetId('vpc-12345678');              // false (wrong prefix)
 * isValidSubnetId('subnet-ABCDEF12');           // false (uppercase)
 * ```
 */
export function isValidSubnetId(value: string): boolean {
  return SUBNET_ID_PATTERN.test(value);
}

/**
 * Regular expression pattern for Security Group ID validation.
 *
 * Security Group IDs follow the format: sg-<8 or 17 hexadecimal characters>
 * - Legacy format: sg-xxxxxxxx (8 hex chars)
 * - New format: sg-xxxxxxxxxxxxxxxxx (17 hex chars)
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/resource-ids.html
 */
const SECURITY_GROUP_ID_PATTERN = /^sg-[0-9a-f]{8}([0-9a-f]{9})?$/;

/**
 * Validates a Security Group ID.
 *
 * Security Group IDs follow the format: sg-<8 or 17 hexadecimal characters>
 * - Legacy format: sg-xxxxxxxx (8 hex chars)
 * - New format: sg-xxxxxxxxxxxxxxxxx (17 hex chars)
 *
 * @param value - The Security Group ID to validate
 * @returns true if the value is a valid Security Group ID, false otherwise
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/resource-ids.html
 *
 * @example
 * ```typescript
 * isValidSecurityGroupId('sg-12345678');           // true (legacy format)
 * isValidSecurityGroupId('sg-1234567890abcdef0');  // true (new format)
 * isValidSecurityGroupId('sg-abcdef12');           // true
 * isValidSecurityGroupId('sg-1234567');            // false (7 hex chars)
 * isValidSecurityGroupId('sg-123456789');          // false (9 hex chars)
 * isValidSecurityGroupId('vpc-12345678');          // false (wrong prefix)
 * isValidSecurityGroupId('sg-ABCDEF12');           // false (uppercase)
 * ```
 */
export function isValidSecurityGroupId(value: string): boolean {
  return SECURITY_GROUP_ID_PATTERN.test(value);
}

/**
 * Regular expression pattern for EC2 Instance ID validation.
 *
 * EC2 Instance IDs follow the format: i-<8 or 17 hexadecimal characters>
 * - Legacy format: i-xxxxxxxx (8 hex chars)
 * - New format: i-xxxxxxxxxxxxxxxxx (17 hex chars)
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/resource-ids.html
 */
const EC2_INSTANCE_ID_PATTERN = /^i-[0-9a-f]{8}([0-9a-f]{9})?$/;

/**
 * Validates an EC2 Instance ID.
 *
 * EC2 Instance IDs follow the format: i-<8 or 17 hexadecimal characters>
 * - Legacy format: i-xxxxxxxx (8 hex chars)
 * - New format: i-xxxxxxxxxxxxxxxxx (17 hex chars)
 *
 * @param value - The EC2 Instance ID to validate
 * @returns true if the value is a valid EC2 Instance ID, false otherwise
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/resource-ids.html
 *
 * @example
 * ```typescript
 * isValidEc2InstanceId('i-12345678');           // true (legacy format)
 * isValidEc2InstanceId('i-1234567890abcdef0');  // true (new format)
 * isValidEc2InstanceId('i-abcdef12');           // true
 * isValidEc2InstanceId('i-1234567');            // false (7 hex chars)
 * isValidEc2InstanceId('i-123456789');          // false (9 hex chars)
 * isValidEc2InstanceId('vpc-12345678');         // false (wrong prefix)
 * isValidEc2InstanceId('i-ABCDEF12');           // false (uppercase)
 * ```
 */
export function isValidEc2InstanceId(value: string): boolean {
  return EC2_INSTANCE_ID_PATTERN.test(value);
}
