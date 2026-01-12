/**
 * Represents a single validation error for an environment variable.
 */
export interface ValidationError {
  /** The environment variable name that failed validation */
  key: string;
  /** Human-readable error message */
  message: string;
  /** The received value (masked if secret) */
  received?: string;
  /** The expected value or type */
  expected?: string;
}

/**
 * Formats a value for display in error messages.
 * Masks secret values with "***".
 *
 * @param value - The value to format
 * @param isSecret - Whether the value should be masked
 * @returns Formatted string representation
 */
export function formatValue(value: unknown, isSecret: boolean): string {
  if (isSecret) return '***';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

/**
 * Formats an array of validation errors into a human-readable message.
 *
 * @param errors - Array of validation errors
 * @returns Formatted error message
 */
export function formatErrorMessage(errors: ValidationError[]): string {
  const count = errors.length;
  const lines = errors.map((e) => `  ✗ ${e.key}: ${e.message}`);

  return [
    `EnvironmentValidationError: ${count} environment variable(s) failed validation:`,
    '',
    ...lines,
    '',
    'Set these in your Lambda configuration or .env file.',
  ].join('\n');
}

/**
 * Custom error class for environment validation failures.
 * Aggregates multiple validation errors into a single throwable error.
 *
 * @example
 * ```typescript
 * const errors: ValidationError[] = [
 *   { key: 'PORT', message: 'Expected number, got "abc"' },
 *   { key: 'API_KEY', message: 'Required but not set' }
 * ];
 * throw new EnvironmentValidationError(errors);
 * ```
 */
export class EnvironmentValidationError extends Error {
  readonly name = 'EnvironmentValidationError' as const;
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = formatErrorMessage(errors);
    super(message);
    this.errors = errors;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnvironmentValidationError);
    }
  }
}
