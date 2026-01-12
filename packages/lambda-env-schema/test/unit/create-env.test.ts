import { describe, expect, it } from 'vitest';
import { createEnv, toCamelCase } from '../../src/core/create-env';
import { EnvironmentValidationError } from '../../src/share/errors';

describe('createEnv', () => {
  describe('basic type coercion', () => {
    it('coerces string values', () => {
      const env = createEnv(
        { API_KEY: { type: 'string' } },
        { env: { API_KEY: 'my-secret-key' } }
      );
      expect(env.API_KEY).toBe('my-secret-key');
    });

    it('coerces number values', () => {
      const env = createEnv(
        { PORT: { type: 'number' } },
        { env: { PORT: '3000' } }
      );
      expect(env.PORT).toBe(3000);
    });

    it('coerces boolean values', () => {
      const env = createEnv(
        { DEBUG: { type: 'boolean' } },
        { env: { DEBUG: 'true' } }
      );
      expect(env.DEBUG).toBe(true);
    });

    it('coerces array values', () => {
      const env = createEnv(
        { HOSTS: { type: 'array', itemType: 'string' } },
        { env: { HOSTS: 'a,b,c' } }
      );
      expect(env.HOSTS).toEqual(['a', 'b', 'c']);
    });

    it('coerces json values', () => {
      const env = createEnv(
        { CONFIG: { type: 'json' } },
        { env: { CONFIG: '{"key":"value"}' } }
      );
      expect(env.CONFIG).toEqual({ key: 'value' });
    });
  });

  describe('required validation', () => {
    it('throws when required variable is missing', () => {
      expect(() =>
        createEnv({ API_KEY: { type: 'string', required: true } }, { env: {} })
      ).toThrow(EnvironmentValidationError);
    });

    it('passes when required variable is provided', () => {
      const env = createEnv(
        { API_KEY: { type: 'string', required: true } },
        { env: { API_KEY: 'secret' } }
      );
      expect(env.API_KEY).toBe('secret');
    });

    it('passes when required variable has default', () => {
      const env = createEnv(
        { PORT: { type: 'number', required: true, default: 3000 } },
        { env: {} }
      );
      expect(env.PORT).toBe(3000);
    });
  });

  describe('default values', () => {
    it('uses default when variable is not set', () => {
      const env = createEnv(
        { PORT: { type: 'number', default: 8080 } },
        { env: {} }
      );
      expect(env.PORT).toBe(8080);
    });

    it('uses provided value over default', () => {
      const env = createEnv(
        { PORT: { type: 'number', default: 8080 } },
        { env: { PORT: '3000' } }
      );
      expect(env.PORT).toBe(3000);
    });

    it('returns undefined when no value and no default', () => {
      const env = createEnv(
        { OPTIONAL: { type: 'string' } },
        { env: {} }
      );
      expect(env.OPTIONAL).toBeUndefined();
    });
  });

  describe('enum validation', () => {
    it('accepts valid enum value', () => {
      const env = createEnv(
        { NODE_ENV: { type: 'string', enum: ['development', 'production'] as const } },
        { env: { NODE_ENV: 'production' } }
      );
      expect(env.NODE_ENV).toBe('production');
    });

    it('throws for invalid enum value', () => {
      expect(() =>
        createEnv(
          { NODE_ENV: { type: 'string', enum: ['development', 'production'] as const } },
          { env: { NODE_ENV: 'staging' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('constraint validation', () => {
    it('validates number min constraint', () => {
      expect(() =>
        createEnv(
          { PORT: { type: 'number', min: 1024 } },
          { env: { PORT: '80' } }
        )
      ).toThrow(EnvironmentValidationError);
    });

    it('validates number max constraint', () => {
      expect(() =>
        createEnv(
          { PORT: { type: 'number', max: 65535 } },
          { env: { PORT: '70000' } }
        )
      ).toThrow(EnvironmentValidationError);
    });

    it('validates string minLength constraint', () => {
      expect(() =>
        createEnv(
          { TOKEN: { type: 'string', minLength: 10 } },
          { env: { TOKEN: 'short' } }
        )
      ).toThrow(EnvironmentValidationError);
    });

    it('validates string maxLength constraint', () => {
      expect(() =>
        createEnv(
          { CODE: { type: 'string', maxLength: 5 } },
          { env: { CODE: 'toolongvalue' } }
        )
      ).toThrow(EnvironmentValidationError);
    });

    it('validates string pattern constraint', () => {
      expect(() =>
        createEnv(
          { EMAIL: { type: 'string', pattern: /^[^@]+@[^@]+$/ } },
          { env: { EMAIL: 'invalid-email' } }
        )
      ).toThrow(EnvironmentValidationError);
    });

    it('validates array minLength constraint', () => {
      expect(() =>
        createEnv(
          { HOSTS: { type: 'array', itemType: 'string', minLength: 3 } },
          { env: { HOSTS: 'a,b' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });


  describe('error aggregation', () => {
    it('collects multiple errors in single throw', () => {
      try {
        createEnv(
          {
            API_KEY: { type: 'string', required: true },
            PORT: { type: 'number', required: true },
            DEBUG: { type: 'boolean', required: true },
          },
          { env: {} }
        );
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(EnvironmentValidationError);
        const error = e as EnvironmentValidationError;
        expect(error.errors).toHaveLength(3);
        expect(error.errors.map((err) => err.key)).toContain('API_KEY');
        expect(error.errors.map((err) => err.key)).toContain('PORT');
        expect(error.errors.map((err) => err.key)).toContain('DEBUG');
      }
    });
  });

  describe('naming strategy', () => {
    it('preserves original keys by default', () => {
      const env = createEnv(
        { MY_VAR: { type: 'string' } },
        { env: { MY_VAR: 'value' } }
      );
      expect(env.MY_VAR).toBe('value');
      expect((env as Record<string, unknown>).myVar).toBeUndefined();
    });

    it('converts to camelCase when specified', () => {
      const env = createEnv(
        { MY_VAR: { type: 'string' } },
        { env: { MY_VAR: 'value' }, namingStrategy: 'camelCase' }
      );
      expect(env.myVar).toBe('value');
    });

    it('handles multiple underscores in camelCase', () => {
      const env = createEnv(
        { MY_LONG_VAR_NAME: { type: 'string' } },
        { env: { MY_LONG_VAR_NAME: 'value' }, namingStrategy: 'camelCase' }
      );
      expect(env.myLongVarName).toBe('value');
    });
  });

  describe('AWS Lambda environment', () => {
    it('includes aws property in result', () => {
      const env = createEnv(
        { PORT: { type: 'number' } },
        { env: { PORT: '3000' } }
      );
      expect(env.aws).toBeDefined();
    });

    it('populates aws.region when AWS_REGION is set', () => {
      const env = createEnv(
        { PORT: { type: 'number' } },
        { env: { PORT: '3000', AWS_REGION: 'us-east-1' } }
      );
      expect(env.aws.region).toBe('us-east-1');
    });

    it('populates aws.functionName when AWS_LAMBDA_FUNCTION_NAME is set', () => {
      const env = createEnv(
        { PORT: { type: 'number' } },
        { env: { PORT: '3000', AWS_LAMBDA_FUNCTION_NAME: 'my-function' } }
      );
      expect(env.aws.functionName).toBe('my-function');
    });
  });

  describe('secret masking', () => {
    it('masks secret values in error messages', () => {
      try {
        createEnv(
          { API_KEY: { type: 'string', secret: true, minLength: 100 } },
          { env: { API_KEY: 'short-secret' } }
        );
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(EnvironmentValidationError);
        const error = e as EnvironmentValidationError;
        expect(error.message).not.toContain('short-secret');
      }
    });
  });

  describe('custom env source', () => {
    it('reads from custom env object', () => {
      const customEnv = { CUSTOM_VAR: 'custom-value' };
      const env = createEnv(
        { CUSTOM_VAR: { type: 'string' } },
        { env: customEnv }
      );
      expect(env.CUSTOM_VAR).toBe('custom-value');
    });
  });
});

describe('toCamelCase', () => {
  it('converts SNAKE_CASE to camelCase', () => {
    expect(toCamelCase('MY_VAR')).toBe('myVar');
    expect(toCamelCase('API_KEY')).toBe('apiKey');
    expect(toCamelCase('PORT')).toBe('port');
  });

  it('handles multiple underscores', () => {
    expect(toCamelCase('MY_LONG_VAR_NAME')).toBe('myLongVarName');
  });

  it('handles single word', () => {
    expect(toCamelCase('PORT')).toBe('port');
  });
});
