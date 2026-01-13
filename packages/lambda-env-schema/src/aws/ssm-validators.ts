/**
 * SSM (Systems Manager) Parameter Store validators.
 */

/**
 * Regular expression pattern for SSM Parameter name validation.
 *
 * SSM Parameter names must:
 * - Start with a forward slash (/)
 * - Contain only alphanumeric characters, hyphens, underscores, periods, and forward slashes
 *
 * @see https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-paramstore-su-create.html
 */
const SSM_PARAMETER_NAME_PATTERN = /^\/[\w./-]+$/;

/**
 * Validates an SSM Parameter Store parameter name.
 *
 * SSM Parameter names must:
 * - Start with a forward slash (/)
 * - Contain only alphanumeric characters (a-z, A-Z, 0-9), hyphens (-), underscores (_), periods (.), and forward slashes (/)
 *
 * @param value - The SSM parameter name to validate
 * @returns true if the value is a valid SSM parameter name, false otherwise
 *
 * @see https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-paramstore-su-create.html
 *
 * @example
 * ```typescript
 * isValidSSMParameterName('/my/parameter'); // true
 * isValidSSMParameterName('/prod/db/password'); // true
 * isValidSSMParameterName('/my-app/config_v1'); // true
 * isValidSSMParameterName('/my.app/setting'); // true
 * isValidSSMParameterName('my/parameter'); // false (doesn't start with /)
 * isValidSSMParameterName('/my parameter'); // false (contains space)
 * isValidSSMParameterName('/my@parameter'); // false (invalid character)
 * ```
 */
export function isValidSSMParameterName(value: string): boolean {
  return SSM_PARAMETER_NAME_PATTERN.test(value);
}
