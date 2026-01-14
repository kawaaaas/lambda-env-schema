import { describe, expect, it } from 'vitest';
import { AWS_ENV_MAPPING, getAWSLambdaEnv } from '../../src/aws/aws-env';

describe('AWS_ENV_MAPPING', () => {
  it('maps region to AWS_REGION', () => {
    expect(AWS_ENV_MAPPING.region).toBe('AWS_REGION');
  });

  it('maps functionName to AWS_LAMBDA_FUNCTION_NAME', () => {
    expect(AWS_ENV_MAPPING.functionName).toBe('AWS_LAMBDA_FUNCTION_NAME');
  });

  it('maps functionVersion to AWS_LAMBDA_FUNCTION_VERSION', () => {
    expect(AWS_ENV_MAPPING.functionVersion).toBe('AWS_LAMBDA_FUNCTION_VERSION');
  });

  it('maps memoryLimitInMB to AWS_LAMBDA_FUNCTION_MEMORY_SIZE', () => {
    expect(AWS_ENV_MAPPING.memoryLimitInMB).toBe(
      'AWS_LAMBDA_FUNCTION_MEMORY_SIZE'
    );
  });

  it('maps logGroupName to AWS_LAMBDA_LOG_GROUP_NAME', () => {
    expect(AWS_ENV_MAPPING.logGroupName).toBe('AWS_LAMBDA_LOG_GROUP_NAME');
  });

  it('maps logStreamName to AWS_LAMBDA_LOG_STREAM_NAME', () => {
    expect(AWS_ENV_MAPPING.logStreamName).toBe('AWS_LAMBDA_LOG_STREAM_NAME');
  });

  it('maps executionEnv to AWS_EXECUTION_ENV', () => {
    expect(AWS_ENV_MAPPING.executionEnv).toBe('AWS_EXECUTION_ENV');
  });

  it('maps sessionToken to AWS_SESSION_TOKEN', () => {
    expect(AWS_ENV_MAPPING.sessionToken).toBe('AWS_SESSION_TOKEN');
  });

  it('maps runtimeApi to AWS_LAMBDA_RUNTIME_API', () => {
    expect(AWS_ENV_MAPPING.runtimeApi).toBe('AWS_LAMBDA_RUNTIME_API');
  });

  it('maps taskRoot to LAMBDA_TASK_ROOT', () => {
    expect(AWS_ENV_MAPPING.taskRoot).toBe('LAMBDA_TASK_ROOT');
  });

  it('maps handler to _HANDLER', () => {
    expect(AWS_ENV_MAPPING.handler).toBe('_HANDLER');
  });
});

describe('getAWSLambdaEnv', () => {
  describe('when running inside AWS Lambda', () => {
    const mockLambdaEnv = {
      AWS_REGION: 'us-east-1',
      AWS_LAMBDA_FUNCTION_NAME: 'my-function',
      AWS_LAMBDA_FUNCTION_VERSION: '$LATEST',
      AWS_LAMBDA_FUNCTION_MEMORY_SIZE: '128',
      AWS_LAMBDA_LOG_GROUP_NAME: '/aws/lambda/my-function',
      AWS_LAMBDA_LOG_STREAM_NAME: '2024/01/01/[$LATEST]abc123',
      AWS_EXECUTION_ENV: 'AWS_Lambda_nodejs20.x',
      AWS_SESSION_TOKEN: 'FwoGZXIvYXdzEBY...',
      AWS_LAMBDA_RUNTIME_API: '127.0.0.1:9001',
      LAMBDA_TASK_ROOT: '/var/task',
      _HANDLER: 'index.handler',
    };

    it('returns region from AWS_REGION', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.region).toBe('us-east-1');
    });

    it('returns functionName from AWS_LAMBDA_FUNCTION_NAME', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.functionName).toBe('my-function');
    });

    it('returns functionVersion from AWS_LAMBDA_FUNCTION_VERSION', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.functionVersion).toBe('$LATEST');
    });

    it('converts memoryLimitInMB to number', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.memoryLimitInMB).toBe(128);
      expect(typeof aws.memoryLimitInMB).toBe('number');
    });

    it('returns logGroupName from AWS_LAMBDA_LOG_GROUP_NAME', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.logGroupName).toBe('/aws/lambda/my-function');
    });

    it('returns logStreamName from AWS_LAMBDA_LOG_STREAM_NAME', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.logStreamName).toBe('2024/01/01/[$LATEST]abc123');
    });

    it('returns executionEnv from AWS_EXECUTION_ENV', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.executionEnv).toBe('AWS_Lambda_nodejs20.x');
    });

    it('returns sessionToken from AWS_SESSION_TOKEN', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.sessionToken).toBe('FwoGZXIvYXdzEBY...');
    });

    it('returns runtimeApi from AWS_LAMBDA_RUNTIME_API', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.runtimeApi).toBe('127.0.0.1:9001');
    });

    it('returns taskRoot from LAMBDA_TASK_ROOT', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.taskRoot).toBe('/var/task');
    });

    it('returns handler from _HANDLER', () => {
      const aws = getAWSLambdaEnv(mockLambdaEnv);
      expect(aws.handler).toBe('index.handler');
    });
  });

  describe('when running outside AWS Lambda', () => {
    const emptyEnv = {};

    it('returns undefined for all properties without throwing', () => {
      const aws = getAWSLambdaEnv(emptyEnv);

      expect(aws.region).toBeUndefined();
      expect(aws.functionName).toBeUndefined();
      expect(aws.functionVersion).toBeUndefined();
      expect(aws.memoryLimitInMB).toBeUndefined();
      expect(aws.logGroupName).toBeUndefined();
      expect(aws.logStreamName).toBeUndefined();
      expect(aws.executionEnv).toBeUndefined();
      expect(aws.sessionToken).toBeUndefined();
      expect(aws.runtimeApi).toBeUndefined();
      expect(aws.taskRoot).toBeUndefined();
      expect(aws.handler).toBeUndefined();
    });
  });

  describe('memoryLimitInMB edge cases', () => {
    it('returns undefined for invalid memory value', () => {
      const aws = getAWSLambdaEnv({
        AWS_LAMBDA_FUNCTION_MEMORY_SIZE: 'invalid',
      });
      expect(aws.memoryLimitInMB).toBeUndefined();
    });

    it('handles various valid memory sizes', () => {
      expect(
        getAWSLambdaEnv({ AWS_LAMBDA_FUNCTION_MEMORY_SIZE: '256' })
          .memoryLimitInMB
      ).toBe(256);
      expect(
        getAWSLambdaEnv({ AWS_LAMBDA_FUNCTION_MEMORY_SIZE: '512' })
          .memoryLimitInMB
      ).toBe(512);
      expect(
        getAWSLambdaEnv({ AWS_LAMBDA_FUNCTION_MEMORY_SIZE: '1024' })
          .memoryLimitInMB
      ).toBe(1024);
      expect(
        getAWSLambdaEnv({ AWS_LAMBDA_FUNCTION_MEMORY_SIZE: '10240' })
          .memoryLimitInMB
      ).toBe(10240);
    });
  });
});
