/**
 * API Gateway validators.
 */

/**
 * Regular expression pattern for API Gateway REST API ID validation.
 *
 * API Gateway REST API IDs are exactly 10 lowercase alphanumeric characters.
 *
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-call-api.html
 */
const API_GATEWAY_ID_PATTERN = /^[a-z0-9]{10}$/;

/**
 * Validates an API Gateway REST API ID.
 *
 * API Gateway REST API IDs are exactly 10 lowercase alphanumeric characters.
 *
 * @param value - The API Gateway ID to validate
 * @returns true if the value is a valid API Gateway ID, false otherwise
 *
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-call-api.html
 *
 * @example
 * ```typescript
 * isValidApiGatewayId('abc1234567'); // true
 * isValidApiGatewayId('1234567890'); // true
 * isValidApiGatewayId('abcdefghij'); // true
 * isValidApiGatewayId('ABC1234567'); // false (uppercase)
 * isValidApiGatewayId('abc123456');  // false (9 characters)
 * isValidApiGatewayId('abc12345678'); // false (11 characters)
 * isValidApiGatewayId('abc-123456'); // false (contains hyphen)
 * ```
 */
export function isValidApiGatewayId(value: string): boolean {
  return API_GATEWAY_ID_PATTERN.test(value);
}
