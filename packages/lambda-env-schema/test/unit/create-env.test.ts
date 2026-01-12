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
      const env = createEnv({ OPTIONAL: { type: 'string' } }, { env: {} });
      expect(env.OPTIONAL).toBeUndefined();
    });
  });

  describe('enum validation', () => {
    it('accepts valid enum value', () => {
      const env = createEnv(
        {
          NODE_ENV: {
            type: 'string',
            enum: ['development', 'production'] as const,
          },
        },
        { env: { NODE_ENV: 'production' } }
      );
      expect(env.NODE_ENV).toBe('production');
    });

    it('throws for invalid enum value', () => {
      expect(() =>
        createEnv(
          {
            NODE_ENV: {
              type: 'string',
              enum: ['development', 'production'] as const,
            },
          },
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

describe('AWS validation types', () => {
  describe('aws-region validation', () => {
    it('accepts valid AWS region', () => {
      const env = createEnv(
        { AWS_REGION: { type: 'string', validation: 'aws-region' } },
        { env: { AWS_REGION: 'us-east-1' } }
      );
      expect(env.AWS_REGION).toBe('us-east-1');
    });

    it('rejects invalid AWS region', () => {
      expect(() =>
        createEnv(
          { AWS_REGION: { type: 'string', validation: 'aws-region' } },
          { env: { AWS_REGION: 'invalid-region' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('aws-account-id validation', () => {
    it('accepts valid 12-digit account ID', () => {
      const env = createEnv(
        { ACCOUNT_ID: { type: 'string', validation: 'aws-account-id' } },
        { env: { ACCOUNT_ID: '123456789012' } }
      );
      expect(env.ACCOUNT_ID).toBe('123456789012');
    });

    it('rejects account ID with wrong length', () => {
      expect(() =>
        createEnv(
          { ACCOUNT_ID: { type: 'string', validation: 'aws-account-id' } },
          { env: { ACCOUNT_ID: '12345678901' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('iam-role-arn validation', () => {
    it('accepts valid IAM role ARN', () => {
      const env = createEnv(
        { ROLE_ARN: { type: 'string', validation: 'iam-role-arn' } },
        { env: { ROLE_ARN: 'arn:aws:iam::123456789012:role/MyRole' } }
      );
      expect(env.ROLE_ARN).toBe('arn:aws:iam::123456789012:role/MyRole');
    });

    it('rejects invalid IAM role ARN', () => {
      expect(() =>
        createEnv(
          { ROLE_ARN: { type: 'string', validation: 'iam-role-arn' } },
          { env: { ROLE_ARN: 'invalid-arn' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('iam-user-arn validation', () => {
    it('accepts valid IAM user ARN', () => {
      const env = createEnv(
        { USER_ARN: { type: 'string', validation: 'iam-user-arn' } },
        { env: { USER_ARN: 'arn:aws:iam::123456789012:user/MyUser' } }
      );
      expect(env.USER_ARN).toBe('arn:aws:iam::123456789012:user/MyUser');
    });
  });

  describe('access-key-id validation', () => {
    it('accepts valid access key ID starting with AKIA', () => {
      const env = createEnv(
        { ACCESS_KEY: { type: 'string', validation: 'access-key-id' } },
        { env: { ACCESS_KEY: 'AKIAIOSFODNN7EXAMPLE' } }
      );
      expect(env.ACCESS_KEY).toBe('AKIAIOSFODNN7EXAMPLE');
    });

    it('accepts valid access key ID starting with ASIA', () => {
      const env = createEnv(
        { ACCESS_KEY: { type: 'string', validation: 'access-key-id' } },
        { env: { ACCESS_KEY: 'ASIAIOSFODNN7EXAMPLE' } }
      );
      expect(env.ACCESS_KEY).toBe('ASIAIOSFODNN7EXAMPLE');
    });

    it('rejects access key ID with wrong prefix', () => {
      expect(() =>
        createEnv(
          { ACCESS_KEY: { type: 'string', validation: 'access-key-id' } },
          { env: { ACCESS_KEY: 'ABCDIOSFODNN7EXAMPLE' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('secret-access-key validation', () => {
    it('accepts valid secret access key', () => {
      const env = createEnv(
        { SECRET_KEY: { type: 'string', validation: 'secret-access-key' } },
        { env: { SECRET_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' } }
      );
      expect(env.SECRET_KEY).toBe('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
    });

    it('rejects secret access key with wrong length', () => {
      expect(() =>
        createEnv(
          { SECRET_KEY: { type: 'string', validation: 'secret-access-key' } },
          { env: { SECRET_KEY: 'tooshort' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('s3-bucket-name validation', () => {
    it('accepts valid S3 bucket name', () => {
      const env = createEnv(
        { BUCKET: { type: 'string', validation: 's3-bucket-name' } },
        { env: { BUCKET: 'my-bucket-123' } }
      );
      expect(env.BUCKET).toBe('my-bucket-123');
    });

    it('rejects bucket name with uppercase', () => {
      expect(() =>
        createEnv(
          { BUCKET: { type: 'string', validation: 's3-bucket-name' } },
          { env: { BUCKET: 'My-Bucket' } }
        )
      ).toThrow(EnvironmentValidationError);
    });

    it('rejects bucket name starting with hyphen', () => {
      expect(() =>
        createEnv(
          { BUCKET: { type: 'string', validation: 's3-bucket-name' } },
          { env: { BUCKET: '-my-bucket' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('s3-arn validation', () => {
    it('accepts valid S3 bucket ARN', () => {
      const env = createEnv(
        { S3_ARN: { type: 'string', validation: 's3-arn' } },
        { env: { S3_ARN: 'arn:aws:s3:::my-bucket' } }
      );
      expect(env.S3_ARN).toBe('arn:aws:s3:::my-bucket');
    });

    it('accepts valid S3 object ARN', () => {
      const env = createEnv(
        { S3_ARN: { type: 'string', validation: 's3-arn' } },
        { env: { S3_ARN: 'arn:aws:s3:::my-bucket/path/to/object' } }
      );
      expect(env.S3_ARN).toBe('arn:aws:s3:::my-bucket/path/to/object');
    });
  });

  describe('dynamodb-table-name validation', () => {
    it('accepts valid DynamoDB table name', () => {
      const env = createEnv(
        { TABLE_NAME: { type: 'string', validation: 'dynamodb-table-name' } },
        { env: { TABLE_NAME: 'MyTable_123' } }
      );
      expect(env.TABLE_NAME).toBe('MyTable_123');
    });

    it('rejects table name that is too short', () => {
      expect(() =>
        createEnv(
          { TABLE_NAME: { type: 'string', validation: 'dynamodb-table-name' } },
          { env: { TABLE_NAME: 'ab' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('dynamodb-table-arn validation', () => {
    it('accepts valid DynamoDB table ARN', () => {
      const env = createEnv(
        { TABLE_ARN: { type: 'string', validation: 'dynamodb-table-arn' } },
        {
          env: {
            TABLE_ARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable',
          },
        }
      );
      expect(env.TABLE_ARN).toBe(
        'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable'
      );
    });
  });

  describe('rds-endpoint validation', () => {
    it('accepts valid RDS endpoint', () => {
      const env = createEnv(
        { RDS_ENDPOINT: { type: 'string', validation: 'rds-endpoint' } },
        { env: { RDS_ENDPOINT: 'mydb.abc123xyz.us-east-1.rds.amazonaws.com' } }
      );
      expect(env.RDS_ENDPOINT).toBe(
        'mydb.abc123xyz.us-east-1.rds.amazonaws.com'
      );
    });
  });

  describe('rds-cluster-id validation', () => {
    it('accepts valid RDS cluster ID', () => {
      const env = createEnv(
        { CLUSTER_ID: { type: 'string', validation: 'rds-cluster-id' } },
        { env: { CLUSTER_ID: 'my-cluster-123' } }
      );
      expect(env.CLUSTER_ID).toBe('my-cluster-123');
    });

    it('rejects cluster ID not starting with letter', () => {
      expect(() =>
        createEnv(
          { CLUSTER_ID: { type: 'string', validation: 'rds-cluster-id' } },
          { env: { CLUSTER_ID: '123-cluster' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('lambda-function-name validation', () => {
    it('accepts valid Lambda function name', () => {
      const env = createEnv(
        {
          FUNCTION_NAME: { type: 'string', validation: 'lambda-function-name' },
        },
        { env: { FUNCTION_NAME: 'my-function_123' } }
      );
      expect(env.FUNCTION_NAME).toBe('my-function_123');
    });

    it('rejects function name with invalid characters', () => {
      expect(() =>
        createEnv(
          {
            FUNCTION_NAME: {
              type: 'string',
              validation: 'lambda-function-name',
            },
          },
          { env: { FUNCTION_NAME: 'my.function' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('sqs-queue-url validation', () => {
    it('accepts valid SQS queue URL', () => {
      const env = createEnv(
        { QUEUE_URL: { type: 'string', validation: 'sqs-queue-url' } },
        {
          env: {
            QUEUE_URL:
              'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
          },
        }
      );
      expect(env.QUEUE_URL).toBe(
        'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'
      );
    });
  });

  describe('sqs-queue-arn validation', () => {
    it('accepts valid SQS queue ARN', () => {
      const env = createEnv(
        { QUEUE_ARN: { type: 'string', validation: 'sqs-queue-arn' } },
        { env: { QUEUE_ARN: 'arn:aws:sqs:us-east-1:123456789012:my-queue' } }
      );
      expect(env.QUEUE_ARN).toBe('arn:aws:sqs:us-east-1:123456789012:my-queue');
    });
  });

  describe('sns-topic-arn validation', () => {
    it('accepts valid SNS topic ARN', () => {
      const env = createEnv(
        { TOPIC_ARN: { type: 'string', validation: 'sns-topic-arn' } },
        { env: { TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:my-topic' } }
      );
      expect(env.TOPIC_ARN).toBe('arn:aws:sns:us-east-1:123456789012:my-topic');
    });
  });

  describe('event-bus-name validation', () => {
    it('accepts default event bus', () => {
      const env = createEnv(
        { EVENT_BUS: { type: 'string', validation: 'event-bus-name' } },
        { env: { EVENT_BUS: 'default' } }
      );
      expect(env.EVENT_BUS).toBe('default');
    });

    it('accepts custom event bus name', () => {
      const env = createEnv(
        { EVENT_BUS: { type: 'string', validation: 'event-bus-name' } },
        { env: { EVENT_BUS: 'my-custom-bus' } }
      );
      expect(env.EVENT_BUS).toBe('my-custom-bus');
    });
  });

  describe('api-gateway-id validation', () => {
    it('accepts valid API Gateway ID', () => {
      const env = createEnv(
        { API_ID: { type: 'string', validation: 'api-gateway-id' } },
        { env: { API_ID: 'abc1234567' } }
      );
      expect(env.API_ID).toBe('abc1234567');
    });

    it('rejects API Gateway ID with uppercase', () => {
      expect(() =>
        createEnv(
          { API_ID: { type: 'string', validation: 'api-gateway-id' } },
          { env: { API_ID: 'ABC1234567' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('vpc-id validation', () => {
    it('accepts valid VPC ID (legacy format)', () => {
      const env = createEnv(
        { VPC_ID: { type: 'string', validation: 'vpc-id' } },
        { env: { VPC_ID: 'vpc-12345678' } }
      );
      expect(env.VPC_ID).toBe('vpc-12345678');
    });

    it('accepts valid VPC ID (new format)', () => {
      const env = createEnv(
        { VPC_ID: { type: 'string', validation: 'vpc-id' } },
        { env: { VPC_ID: 'vpc-1234567890abcdef0' } }
      );
      expect(env.VPC_ID).toBe('vpc-1234567890abcdef0');
    });
  });

  describe('subnet-id validation', () => {
    it('accepts valid Subnet ID', () => {
      const env = createEnv(
        { SUBNET_ID: { type: 'string', validation: 'subnet-id' } },
        { env: { SUBNET_ID: 'subnet-12345678' } }
      );
      expect(env.SUBNET_ID).toBe('subnet-12345678');
    });
  });

  describe('security-group-id validation', () => {
    it('accepts valid Security Group ID', () => {
      const env = createEnv(
        { SG_ID: { type: 'string', validation: 'security-group-id' } },
        { env: { SG_ID: 'sg-12345678' } }
      );
      expect(env.SG_ID).toBe('sg-12345678');
    });
  });

  describe('ec2-instance-id validation', () => {
    it('accepts valid EC2 Instance ID', () => {
      const env = createEnv(
        { INSTANCE_ID: { type: 'string', validation: 'ec2-instance-id' } },
        { env: { INSTANCE_ID: 'i-12345678' } }
      );
      expect(env.INSTANCE_ID).toBe('i-12345678');
    });
  });

  describe('cloudfront-dist-id validation', () => {
    it('accepts valid CloudFront Distribution ID', () => {
      const env = createEnv(
        { DIST_ID: { type: 'string', validation: 'cloudfront-dist-id' } },
        { env: { DIST_ID: 'E1A2B3C4D5E6F7' } }
      );
      expect(env.DIST_ID).toBe('E1A2B3C4D5E6F7');
    });

    it('rejects CloudFront Distribution ID with lowercase', () => {
      expect(() =>
        createEnv(
          { DIST_ID: { type: 'string', validation: 'cloudfront-dist-id' } },
          { env: { DIST_ID: 'e1a2b3c4d5e6f7' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('kms-key-id validation', () => {
    it('accepts valid KMS Key ID (UUID)', () => {
      const env = createEnv(
        { KMS_KEY_ID: { type: 'string', validation: 'kms-key-id' } },
        { env: { KMS_KEY_ID: '12345678-1234-1234-1234-123456789012' } }
      );
      expect(env.KMS_KEY_ID).toBe('12345678-1234-1234-1234-123456789012');
    });
  });

  describe('kms-key-arn validation', () => {
    it('accepts valid KMS Key ARN', () => {
      const env = createEnv(
        { KMS_KEY_ARN: { type: 'string', validation: 'kms-key-arn' } },
        {
          env: {
            KMS_KEY_ARN:
              'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
          },
        }
      );
      expect(env.KMS_KEY_ARN).toBe(
        'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'
      );
    });
  });

  describe('secrets-manager-arn validation', () => {
    it('accepts valid Secrets Manager ARN', () => {
      const env = createEnv(
        { SECRET_ARN: { type: 'string', validation: 'secrets-manager-arn' } },
        {
          env: {
            SECRET_ARN:
              'arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret-AbCdEf',
          },
        }
      );
      expect(env.SECRET_ARN).toBe(
        'arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret-AbCdEf'
      );
    });
  });

  describe('ssm-parameter-name validation', () => {
    it('accepts valid SSM Parameter name', () => {
      const env = createEnv(
        { PARAM_NAME: { type: 'string', validation: 'ssm-parameter-name' } },
        { env: { PARAM_NAME: '/my/parameter/name' } }
      );
      expect(env.PARAM_NAME).toBe('/my/parameter/name');
    });

    it('rejects SSM Parameter name not starting with /', () => {
      expect(() =>
        createEnv(
          { PARAM_NAME: { type: 'string', validation: 'ssm-parameter-name' } },
          { env: { PARAM_NAME: 'my/parameter' } }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });

  describe('scoped validation', () => {
    it('accepts ARN with matching region scope', () => {
      const env = createEnv(
        {
          TABLE_ARN: {
            type: 'string',
            validation: 'dynamodb-table-arn',
            scope: { region: 'us-east-1' },
          },
        },
        {
          env: {
            TABLE_ARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable',
          },
        }
      );
      expect(env.TABLE_ARN).toBe(
        'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable'
      );
    });

    it('rejects ARN with mismatched region scope', () => {
      expect(() =>
        createEnv(
          {
            TABLE_ARN: {
              type: 'string',
              validation: 'dynamodb-table-arn',
              scope: { region: 'ap-northeast-1' },
            },
          },
          {
            env: {
              TABLE_ARN:
                'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable',
            },
          }
        )
      ).toThrow(EnvironmentValidationError);
    });

    it('accepts ARN with matching accountId scope', () => {
      const env = createEnv(
        {
          TABLE_ARN: {
            type: 'string',
            validation: 'dynamodb-table-arn',
            scope: { accountId: '123456789012' },
          },
        },
        {
          env: {
            TABLE_ARN: 'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable',
          },
        }
      );
      expect(env.TABLE_ARN).toBe(
        'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable'
      );
    });

    it('rejects ARN with mismatched accountId scope', () => {
      expect(() =>
        createEnv(
          {
            TABLE_ARN: {
              type: 'string',
              validation: 'dynamodb-table-arn',
              scope: { accountId: '999999999999' },
            },
          },
          {
            env: {
              TABLE_ARN:
                'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable',
            },
          }
        )
      ).toThrow(EnvironmentValidationError);
    });
  });
});
