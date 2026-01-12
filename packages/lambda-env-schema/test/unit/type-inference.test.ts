import { describe, expectTypeOf, it } from 'vitest';
import type {
  ParsedArn,
  ParsedDynamoDBTableArn,
  ParsedIAMRoleArn,
  ParsedKMSKeyArn,
  ParsedLambdaFunctionArn,
  ParsedRDSEndpoint,
  ParsedS3Arn,
  ParsedS3Uri,
  ParsedSecretsManagerArn,
  ParsedSNSTopicArn,
  ParsedSQSQueueArn,
  ParsedSQSQueueUrl,
} from '../../src/aws/parsed-types';
import { createEnv } from '../../src/core/create-env';
import type {
  InferEnv,
  InferValue,
  ParsedValueMap,
} from '../../src/share/types';

describe('type inference', () => {
  describe('InferValue for primitive types', () => {
    it('infers string type', () => {
      type Result = InferValue<{ type: 'string' }>;
      expectTypeOf<Result>().toEqualTypeOf<string>();
    });

    it('infers number type', () => {
      type Result = InferValue<{ type: 'number' }>;
      expectTypeOf<Result>().toEqualTypeOf<number>();
    });

    it('infers boolean type', () => {
      type Result = InferValue<{ type: 'boolean' }>;
      expectTypeOf<Result>().toEqualTypeOf<boolean>();
    });

    it('infers string array type', () => {
      type Result = InferValue<{ type: 'array'; itemType: 'string' }>;
      expectTypeOf<Result>().toEqualTypeOf<string[]>();
    });

    it('infers number array type', () => {
      type Result = InferValue<{ type: 'array'; itemType: 'number' }>;
      expectTypeOf<Result>().toEqualTypeOf<number[]>();
    });

    it('infers enum string type', () => {
      type Result = InferValue<{
        type: 'string';
        enum: readonly ['dev', 'prod'];
      }>;
      expectTypeOf<Result>().toEqualTypeOf<'dev' | 'prod'>();
    });
  });

  describe('InferValue for AWS validation-only types', () => {
    it('infers string for aws-region', () => {
      type Result = InferValue<{ type: 'aws-region' }>;
      expectTypeOf<Result>().toEqualTypeOf<string>();
    });

    it('infers string for aws-account-id', () => {
      type Result = InferValue<{ type: 'aws-account-id' }>;
      expectTypeOf<Result>().toEqualTypeOf<string>();
    });

    it('infers string for s3-bucket-name', () => {
      type Result = InferValue<{ type: 's3-bucket-name' }>;
      expectTypeOf<Result>().toEqualTypeOf<string>();
    });

    it('infers string for dynamodb-table-name', () => {
      type Result = InferValue<{ type: 'dynamodb-table-name' }>;
      expectTypeOf<Result>().toEqualTypeOf<string>();
    });

    it('infers string for lambda-function-name', () => {
      type Result = InferValue<{ type: 'lambda-function-name' }>;
      expectTypeOf<Result>().toEqualTypeOf<string>();
    });

    it('infers string for iam-user-arn', () => {
      type Result = InferValue<{ type: 'iam-user-arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<string>();
    });
  });

  describe('InferValue for AWS parsed types', () => {
    it('infers ParsedS3Arn for s3-arn', () => {
      type Result = InferValue<{ type: 's3-arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedS3Arn>();
    });

    it('infers ParsedS3Uri for s3-uri', () => {
      type Result = InferValue<{ type: 's3-uri' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedS3Uri>();
    });

    it('infers ParsedSQSQueueUrl for sqs-queue-url', () => {
      type Result = InferValue<{ type: 'sqs-queue-url' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedSQSQueueUrl>();
    });

    it('infers ParsedSQSQueueArn for sqs-queue-arn', () => {
      type Result = InferValue<{ type: 'sqs-queue-arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedSQSQueueArn>();
    });

    it('infers ParsedSNSTopicArn for sns-topic-arn', () => {
      type Result = InferValue<{ type: 'sns-topic-arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedSNSTopicArn>();
    });

    it('infers ParsedDynamoDBTableArn for dynamodb-table-arn', () => {
      type Result = InferValue<{ type: 'dynamodb-table-arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedDynamoDBTableArn>();
    });

    it('infers ParsedRDSEndpoint for rds-endpoint', () => {
      type Result = InferValue<{ type: 'rds-endpoint' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedRDSEndpoint>();
    });

    it('infers ParsedLambdaFunctionArn for lambda-function-arn', () => {
      type Result = InferValue<{ type: 'lambda-function-arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedLambdaFunctionArn>();
    });

    it('infers ParsedKMSKeyArn for kms-key-arn', () => {
      type Result = InferValue<{ type: 'kms-key-arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedKMSKeyArn>();
    });

    it('infers ParsedSecretsManagerArn for secrets-manager-arn', () => {
      type Result = InferValue<{ type: 'secrets-manager-arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedSecretsManagerArn>();
    });

    it('infers ParsedIAMRoleArn for iam-role-arn', () => {
      type Result = InferValue<{ type: 'iam-role-arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedIAMRoleArn>();
    });

    it('infers ParsedArn for arn', () => {
      type Result = InferValue<{ type: 'arn' }>;
      expectTypeOf<Result>().toEqualTypeOf<ParsedArn>();
    });
  });

  describe('ParsedValueMap completeness', () => {
    it('maps all AWS parsed types correctly', () => {
      expectTypeOf<ParsedValueMap['s3-arn']>().toEqualTypeOf<ParsedS3Arn>();
      expectTypeOf<ParsedValueMap['s3-uri']>().toEqualTypeOf<ParsedS3Uri>();
      expectTypeOf<
        ParsedValueMap['sqs-queue-url']
      >().toEqualTypeOf<ParsedSQSQueueUrl>();
      expectTypeOf<
        ParsedValueMap['sqs-queue-arn']
      >().toEqualTypeOf<ParsedSQSQueueArn>();
      expectTypeOf<
        ParsedValueMap['sns-topic-arn']
      >().toEqualTypeOf<ParsedSNSTopicArn>();
      expectTypeOf<
        ParsedValueMap['dynamodb-table-arn']
      >().toEqualTypeOf<ParsedDynamoDBTableArn>();
      expectTypeOf<
        ParsedValueMap['rds-endpoint']
      >().toEqualTypeOf<ParsedRDSEndpoint>();
      expectTypeOf<
        ParsedValueMap['lambda-function-arn']
      >().toEqualTypeOf<ParsedLambdaFunctionArn>();
      expectTypeOf<
        ParsedValueMap['kms-key-arn']
      >().toEqualTypeOf<ParsedKMSKeyArn>();
      expectTypeOf<
        ParsedValueMap['secrets-manager-arn']
      >().toEqualTypeOf<ParsedSecretsManagerArn>();
      expectTypeOf<
        ParsedValueMap['iam-role-arn']
      >().toEqualTypeOf<ParsedIAMRoleArn>();
      expectTypeOf<ParsedValueMap['arn']>().toEqualTypeOf<ParsedArn>();
    });
  });

  describe('InferEnv for schema objects', () => {
    it('infers correct types for mixed schema', () => {
      const schema = {
        PORT: { type: 'number' as const },
        API_KEY: { type: 'string' as const },
        DEBUG: { type: 'boolean' as const },
      };
      type Result = InferEnv<typeof schema>;
      expectTypeOf<Result>().toMatchTypeOf<{
        PORT: number | undefined;
        API_KEY: string | undefined;
        DEBUG: boolean | undefined;
      }>();
    });

    it('infers required fields without undefined', () => {
      const schema = {
        PORT: { type: 'number' as const, required: true as const },
      };
      type Result = InferEnv<typeof schema>;
      expectTypeOf<Result>().toMatchTypeOf<{ PORT: number }>();
    });

    it('infers fields with default without undefined', () => {
      const schema = {
        PORT: { type: 'number' as const, default: 3000 },
      };
      type Result = InferEnv<typeof schema>;
      expectTypeOf<Result>().toMatchTypeOf<{ PORT: number }>();
    });

    it('infers AWS parsed types in schema', () => {
      const schema = {
        QUEUE_URL: { type: 'sqs-queue-url' as const, required: true as const },
        BUCKET_ARN: { type: 's3-arn' as const },
      };
      type Result = InferEnv<typeof schema>;
      expectTypeOf<Result>().toMatchTypeOf<{
        QUEUE_URL: ParsedSQSQueueUrl;
        BUCKET_ARN: ParsedS3Arn | undefined;
      }>();
    });

    it('converts keys to camelCase when specified', () => {
      const schema = {
        MY_VAR: { type: 'string' as const },
        API_KEY: { type: 'string' as const },
      };
      type Result = InferEnv<typeof schema, 'camelCase'>;
      expectTypeOf<Result>().toMatchTypeOf<{
        myVar: string | undefined;
        apiKey: string | undefined;
      }>();
    });
  });

  describe('createEnv return type inference', () => {
    it('infers correct types from createEnv result', () => {
      const env = createEnv(
        {
          PORT: { type: 'number', required: true },
          API_KEY: { type: 'string' },
          QUEUE_URL: { type: 'sqs-queue-url', required: true },
        } as const,
        {
          env: {
            PORT: '3000',
            API_KEY: 'secret',
            QUEUE_URL:
              'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
          },
        }
      );

      expectTypeOf(env.PORT).toEqualTypeOf<number>();
      expectTypeOf(env.API_KEY).toEqualTypeOf<string | undefined>();
      expectTypeOf(env.QUEUE_URL).toEqualTypeOf<ParsedSQSQueueUrl>();
    });

    it('infers parsed value properties correctly', () => {
      const env = createEnv(
        {
          QUEUE_URL: { type: 'sqs-queue-url', required: true },
        } as const,
        {
          env: {
            QUEUE_URL:
              'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
          },
        }
      );

      expectTypeOf(env.QUEUE_URL.queueName).toEqualTypeOf<string>();
      expectTypeOf(env.QUEUE_URL.region).toEqualTypeOf<string>();
      expectTypeOf(env.QUEUE_URL.accountId).toEqualTypeOf<string>();
      expectTypeOf(env.QUEUE_URL.isFifo).toEqualTypeOf<boolean>();
      expectTypeOf(env.QUEUE_URL.value).toEqualTypeOf<string>();
    });

    it('infers S3 ARN properties correctly', () => {
      const env = createEnv(
        {
          S3_ARN: { type: 's3-arn', required: true },
        } as const,
        { env: { S3_ARN: 'arn:aws:s3:::my-bucket/path/to/object' } }
      );

      expectTypeOf(env.S3_ARN.bucketName).toEqualTypeOf<string>();
      expectTypeOf(env.S3_ARN.key).toEqualTypeOf<string | undefined>();
      expectTypeOf(env.S3_ARN.isObject).toEqualTypeOf<boolean>();
    });

    it('infers Lambda Function ARN properties correctly', () => {
      const env = createEnv(
        {
          FUNCTION_ARN: { type: 'lambda-function-arn', required: true },
        } as const,
        {
          env: {
            FUNCTION_ARN:
              'arn:aws:lambda:us-east-1:123456789012:function:my-function',
          },
        }
      );

      expectTypeOf(env.FUNCTION_ARN.functionName).toEqualTypeOf<string>();
      expectTypeOf(env.FUNCTION_ARN.alias).toEqualTypeOf<string | undefined>();
      expectTypeOf(env.FUNCTION_ARN.qualifier).toEqualTypeOf<
        string | undefined
      >();
      expectTypeOf(env.FUNCTION_ARN.region).toEqualTypeOf<string>();
      expectTypeOf(env.FUNCTION_ARN.accountId).toEqualTypeOf<string>();
    });

    it('infers RDS Endpoint properties correctly', () => {
      const env = createEnv(
        {
          RDS_ENDPOINT: { type: 'rds-endpoint', required: true },
        } as const,
        {
          env: { RDS_ENDPOINT: 'mydb.abc123xyz.us-east-1.rds.amazonaws.com' },
        }
      );

      expectTypeOf(env.RDS_ENDPOINT.hostname).toEqualTypeOf<string>();
      expectTypeOf(env.RDS_ENDPOINT.port).toEqualTypeOf<number | undefined>();
      expectTypeOf(env.RDS_ENDPOINT.socketAddress).toEqualTypeOf<string>();
      expectTypeOf(env.RDS_ENDPOINT.region).toEqualTypeOf<string>();
    });

    it('infers IAM Role ARN properties correctly', () => {
      const env = createEnv(
        {
          ROLE_ARN: { type: 'iam-role-arn', required: true },
        } as const,
        { env: { ROLE_ARN: 'arn:aws:iam::123456789012:role/MyRole' } }
      );

      expectTypeOf(env.ROLE_ARN.roleName).toEqualTypeOf<string>();
      expectTypeOf(env.ROLE_ARN.accountId).toEqualTypeOf<string>();
      expectTypeOf(env.ROLE_ARN.path).toEqualTypeOf<string | undefined>();
    });

    it('infers generic ARN properties correctly', () => {
      const env = createEnv(
        {
          RESOURCE_ARN: { type: 'arn', required: true },
        } as const,
        {
          env: {
            RESOURCE_ARN:
              'arn:aws:lambda:us-east-1:123456789012:function:my-function',
          },
        }
      );

      expectTypeOf(env.RESOURCE_ARN.service).toEqualTypeOf<string>();
      expectTypeOf(env.RESOURCE_ARN.region).toEqualTypeOf<string>();
      expectTypeOf(env.RESOURCE_ARN.accountId).toEqualTypeOf<string>();
      expectTypeOf(env.RESOURCE_ARN.resource).toEqualTypeOf<string>();
    });
  });

  describe('camelCase naming strategy type inference', () => {
    it('infers camelCase keys correctly', () => {
      const env = createEnv(
        {
          MY_VAR: { type: 'string' },
          QUEUE_URL: { type: 'sqs-queue-url', required: true },
        } as const,
        {
          env: {
            MY_VAR: 'value',
            QUEUE_URL:
              'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
          },
          namingStrategy: 'camelCase',
        }
      );

      expectTypeOf(env.myVar).toEqualTypeOf<string | undefined>();
      expectTypeOf(env.queueUrl).toEqualTypeOf<ParsedSQSQueueUrl>();
    });
  });
});
