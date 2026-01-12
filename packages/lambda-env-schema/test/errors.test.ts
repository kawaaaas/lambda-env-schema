import { describe, expect, it } from 'vitest';
import type { ValidationError } from '../src/errors';
import {
  EnvironmentValidationError,
  formatErrorMessage,
  formatValue,
} from '../src/errors';

describe('formatValue', () => {
  it('masks secret values with ***', () => {
    expect(formatValue('my-secret-key', true)).toBe('***');
  });

  it('returns undefined as string for undefined values', () => {
    expect(formatValue(undefined, false)).toBe('undefined');
  });

  it('wraps string values in quotes', () => {
    expect(formatValue('hello', false)).toBe('"hello"');
  });

  it('converts non-string values to string', () => {
    expect(formatValue(123, false)).toBe('123');
    expect(formatValue(true, false)).toBe('true');
  });
});

describe('formatErrorMessage', () => {
  it('formats a single error correctly', () => {
    const errors: ValidationError[] = [
      { key: 'PORT', message: 'Expected number, got "abc"' },
    ];

    const message = formatErrorMessage(errors);

    expect(message).toContain('1 environment variable(s) failed validation');
    expect(message).toContain('✗ PORT: Expected number, got "abc"');
    expect(message).toContain(
      'Set these in your Lambda configuration or .env file.'
    );
  });

  it('formats multiple errors correctly', () => {
    const errors: ValidationError[] = [
      { key: 'PORT', message: 'Expected number, got "abc"' },
      { key: 'API_KEY', message: 'Required but not set' },
      {
        key: 'NODE_ENV',
        message: 'Must be one of ["development", "production"]',
      },
    ];

    const message = formatErrorMessage(errors);

    expect(message).toContain('3 environment variable(s) failed validation');
    expect(message).toContain('✗ PORT: Expected number, got "abc"');
    expect(message).toContain('✗ API_KEY: Required but not set');
    expect(message).toContain(
      '✗ NODE_ENV: Must be one of ["development", "production"]'
    );
  });
});

describe('EnvironmentValidationError', () => {
  it('extends Error class', () => {
    const error = new EnvironmentValidationError([]);
    expect(error).toBeInstanceOf(Error);
  });

  it('has name property set to EnvironmentValidationError', () => {
    const error = new EnvironmentValidationError([]);
    expect(error.name).toBe('EnvironmentValidationError');
  });

  it('stores errors array', () => {
    const errors: ValidationError[] = [
      { key: 'PORT', message: 'Expected number' },
      { key: 'API_KEY', message: 'Required but not set', expected: 'string' },
    ];

    const error = new EnvironmentValidationError(errors);

    expect(error.errors).toHaveLength(2);
    expect(error.errors[0]).toEqual({
      key: 'PORT',
      message: 'Expected number',
    });
    expect(error.errors[1]).toEqual({
      key: 'API_KEY',
      message: 'Required but not set',
      expected: 'string',
    });
  });

  it('generates human-readable message from errors', () => {
    const errors: ValidationError[] = [
      { key: 'DB_PORT', message: 'Expected number, got "abc"' },
      { key: 'API_KEY', message: 'Required but not set' },
    ];

    const error = new EnvironmentValidationError(errors);

    expect(error.message).toContain(
      '2 environment variable(s) failed validation'
    );
    expect(error.message).toContain('✗ DB_PORT: Expected number, got "abc"');
    expect(error.message).toContain('✗ API_KEY: Required but not set');
  });

  it('preserves ValidationError structure with optional fields', () => {
    const errors: ValidationError[] = [
      {
        key: 'PORT',
        message: 'Expected number',
        received: '"abc"',
        expected: 'number',
      },
    ];

    const error = new EnvironmentValidationError(errors);

    expect(error.errors[0].received).toBe('"abc"');
    expect(error.errors[0].expected).toBe('number');
  });
});
