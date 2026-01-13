import { describe, expect, it } from 'vitest';
import type { ValidationError } from '../../src/share/errors';
import {
  EnvironmentValidationError,
  formatErrorMessage,
  formatValue,
} from '../../src/share/errors';

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

import {
  AWS_VALIDATION_DESCRIPTIONS,
  formatAWSValidationError,
} from '../../src/core/validation';

describe('formatAWSValidationError', () => {
  it('includes validation type name in the message', () => {
    const error = formatAWSValidationError(
      'AWS_REGION',
      'aws-region',
      'invalid-region',
      false
    );

    expect(error.message).toContain('aws-region');
    expect(error.key).toBe('AWS_REGION');
  });

  it('includes expected format description in the message', () => {
    const error = formatAWSValidationError(
      'BUCKET_NAME',
      's3-bucket-name',
      'Invalid_Bucket',
      false
    );

    expect(error.message).toContain(
      AWS_VALIDATION_DESCRIPTIONS['s3-bucket-name']
    );
    expect(error.expected).toBe(AWS_VALIDATION_DESCRIPTIONS['s3-bucket-name']);
  });

  it('masks secret values with ***', () => {
    const error = formatAWSValidationError(
      'SECRET_KEY',
      'secret-access-key',
      'my-secret-value',
      true
    );

    expect(error.message).toContain('***');
    expect(error.message).not.toContain('my-secret-value');
    expect(error.received).toBe('***');
  });

  it('shows actual value for non-secret values', () => {
    const error = formatAWSValidationError(
      'VPC_ID',
      'vpc-id',
      'invalid-vpc',
      false
    );

    expect(error.message).toContain('"invalid-vpc"');
    expect(error.received).toBe('invalid-vpc');
  });

  it('formats aws-region error with valid region examples', () => {
    const error = formatAWSValidationError(
      'REGION',
      'aws-region',
      'us-invalid-1',
      false
    );

    expect(error.message).toContain('Invalid aws-region');
    expect(error.message).toContain('Must be a valid AWS region');
  });

  it('formats dynamodb-table-arn error with ARN format', () => {
    const error = formatAWSValidationError(
      'TABLE_ARN',
      'dynamodb-table-arn',
      'invalid-arn',
      false
    );

    expect(error.message).toContain('Invalid dynamodb-table-arn');
    expect(error.message).toContain('arn:aws:dynamodb');
  });
});
