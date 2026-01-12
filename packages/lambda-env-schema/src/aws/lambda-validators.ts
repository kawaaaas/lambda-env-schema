/**
 * Lambda validators.
 */

/**
 * Regular expression pattern for Lambda function name validation.
 *
 * Lambda function names must:
 * - Be 1-64 characters long
 * - Contain only alphanumeric characters, hyphens (-), and underscores (_)
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html
 */
const LAMBDA_FUNCTION_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Validates a Lambda function name against AWS naming rules.
 *
 * Lambda function names must:
 * - Be 1-64 characters long
 * - Contain only alphanumeric characters (a-z, A-Z, 0-9), hyphens (-), and underscores (_)
 *
 * @param value - The function name to validate
 * @returns true if the function name is valid, false otherwise
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html
 *
 * @example
 * ```typescript
 * isValidLambdaFunctionName('my-function');           // true
 * isValidLambdaFunctionName('MyFunction_123');        // true
 * isValidLambdaFunctionName('a');                     // true (minimum 1 character)
 * isValidLambdaFunctionName('my_function-name');      // true
 * isValidLambdaFunctionName('');                      // false (empty)
 * isValidLambdaFunctionName('a'.repeat(65));          // false (too long)
 * isValidLambdaFunctionName('my function');           // false (contains space)
 * isValidLambdaFunctionName('my.function');           // false (contains period)
 * isValidLambdaFunctionName('my@function');           // false (invalid character)
 * ```
 */
export function isValidLambdaFunctionName(value: string): boolean {
  return LAMBDA_FUNCTION_NAME_PATTERN.test(value);
}
