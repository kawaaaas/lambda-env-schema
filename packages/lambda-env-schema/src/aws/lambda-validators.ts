/**
 * Lambda validators and parsers.
 */

import type { ParsedLambdaFunctionArn } from './parsed-types';

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
 * Regular expression pattern for Lambda Function ARN validation.
 *
 * Lambda Function ARNs follow the format:
 * arn:aws:lambda:<region>:<account-id>:function:<function-name>[:<alias>]
 *
 * Where:
 * - region: AWS region (e.g., us-east-1, ap-northeast-1)
 * - account-id: 12-digit AWS account ID
 * - function-name: 1-64 characters (alphanumeric, hyphens, underscores)
 * - alias: Optional alias or version (alphanumeric, hyphens, underscores, or $LATEST)
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/lambda-api-permissions-ref.html
 */
const LAMBDA_FUNCTION_ARN_PATTERN =
  /^arn:aws:lambda:([a-z]{2}-[a-z]+-\d):(\d{12}):function:([a-zA-Z0-9_-]{1,64})(?::([a-zA-Z0-9_-]+|\$LATEST))?$/;

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

/**
 * Validates a Lambda Function ARN.
 *
 * Lambda Function ARNs follow the format:
 * arn:aws:lambda:<region>:<account-id>:function:<function-name>[:<alias>]
 *
 * @param value - The Lambda Function ARN to validate
 * @returns true if the value is a valid Lambda Function ARN, false otherwise
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/lambda-api-permissions-ref.html
 *
 * @example
 * ```typescript
 * // Valid ARNs
 * isValidLambdaFunctionArn('arn:aws:lambda:us-east-1:123456789012:function:my-function');           // true
 * isValidLambdaFunctionArn('arn:aws:lambda:ap-northeast-1:123456789012:function:MyFunction');      // true
 * isValidLambdaFunctionArn('arn:aws:lambda:us-east-1:123456789012:function:my-function:prod');     // true (with alias)
 * isValidLambdaFunctionArn('arn:aws:lambda:us-east-1:123456789012:function:my-function:$LATEST');  // true (with $LATEST)
 * isValidLambdaFunctionArn('arn:aws:lambda:us-east-1:123456789012:function:my-function:1');        // true (with version)
 *
 * // Invalid ARNs
 * isValidLambdaFunctionArn('arn:aws:lambda:us-east-1:123456789012:function:');                     // false (no function name)
 * isValidLambdaFunctionArn('arn:aws:lambda:invalid:123456789012:function:my-function');            // false (invalid region)
 * isValidLambdaFunctionArn('arn:aws:lambda:us-east-1:12345:function:my-function');                 // false (invalid account ID)
 * isValidLambdaFunctionArn('my-function');                                                         // false (not an ARN)
 * ```
 */
export function isValidLambdaFunctionArn(value: string): boolean {
  return LAMBDA_FUNCTION_ARN_PATTERN.test(value);
}

/**
 * Parses a Lambda Function ARN into its components.
 *
 * @param value - The Lambda Function ARN to parse
 * @returns Parsed Lambda Function ARN object, or null if invalid
 *
 * @example
 * ```typescript
 * parseLambdaFunctionArn('arn:aws:lambda:us-east-1:123456789012:function:my-function');
 * // {
 * //   value: 'arn:aws:lambda:us-east-1:123456789012:function:my-function',
 * //   functionName: 'my-function',
 * //   alias: undefined,
 * //   qualifier: undefined,
 * //   region: 'us-east-1',
 * //   accountId: '123456789012'
 * // }
 *
 * parseLambdaFunctionArn('arn:aws:lambda:us-east-1:123456789012:function:my-function:prod');
 * // {
 * //   value: 'arn:aws:lambda:us-east-1:123456789012:function:my-function:prod',
 * //   functionName: 'my-function',
 * //   alias: 'prod',
 * //   qualifier: 'prod',
 * //   region: 'us-east-1',
 * //   accountId: '123456789012'
 * // }
 *
 * parseLambdaFunctionArn('invalid');
 * // null
 * ```
 */
export function parseLambdaFunctionArn(value: string): ParsedLambdaFunctionArn | null {
  const match = value.match(LAMBDA_FUNCTION_ARN_PATTERN);
  if (!match) return null;

  const alias = match[4] || undefined;

  return {
    value,
    region: match[1],
    accountId: match[2],
    functionName: match[3],
    alias,
    qualifier: alias,
  };
}
