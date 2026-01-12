/**
 * AWS Lambda environment variables interface.
 * Provides type-safe access to AWS-provided environment variables.
 */
export interface AWSLambdaEnv {
  /** AWS region where the Lambda function is running */
  region: string | undefined;
  /** Name of the Lambda function */
  functionName: string | undefined;
  /** Version of the Lambda function */
  functionVersion: string | undefined;
  /** Memory limit in MB configured for the function */
  memoryLimitInMB: number | undefined;
  /** CloudWatch Log group name */
  logGroupName: string | undefined;
  /** CloudWatch Log stream name */
  logStreamName: string | undefined;
  /** AWS execution environment identifier */
  executionEnv: string | undefined;
  /** AWS access key ID from the execution role */
  accessKeyId: string | undefined;
  /** AWS secret access key from the execution role */
  secretAccessKey: string | undefined;
  /** AWS session token from the execution role */
  sessionToken: string | undefined;
  /** Lambda runtime API endpoint */
  runtimeApi: string | undefined;
  /** Path to the Lambda task root directory */
  taskRoot: string | undefined;
  /** Handler function name */
  handler: string | undefined;
}

/**
 * Mapping from AWSLambdaEnv property names to actual environment variable names.
 */
export const AWS_ENV_MAPPING: Record<keyof AWSLambdaEnv, string> = {
  region: 'AWS_REGION',
  functionName: 'AWS_LAMBDA_FUNCTION_NAME',
  functionVersion: 'AWS_LAMBDA_FUNCTION_VERSION',
  memoryLimitInMB: 'AWS_LAMBDA_FUNCTION_MEMORY_SIZE',
  logGroupName: 'AWS_LAMBDA_LOG_GROUP_NAME',
  logStreamName: 'AWS_LAMBDA_LOG_STREAM_NAME',
  executionEnv: 'AWS_EXECUTION_ENV',
  accessKeyId: 'AWS_ACCESS_KEY_ID',
  secretAccessKey: 'AWS_SECRET_ACCESS_KEY',
  sessionToken: 'AWS_SESSION_TOKEN',
  runtimeApi: 'AWS_LAMBDA_RUNTIME_API',
  taskRoot: 'LAMBDA_TASK_ROOT',
  handler: '_HANDLER',
};

/**
 * Retrieves AWS Lambda environment variables from the given environment object.
 * Returns undefined for properties when running outside AWS Lambda.
 *
 * @param env - Environment object to read from (defaults to process.env)
 * @returns AWSLambdaEnv object with all AWS Lambda environment variables
 *
 * @example
 * ```typescript
 * const aws = getAWSLambdaEnv();
 * console.log(aws.region); // 'us-east-1' or undefined
 * console.log(aws.functionName); // 'my-function' or undefined
 * ```
 */
export function getAWSLambdaEnv(
  env: Record<string, string | undefined> = process.env
): AWSLambdaEnv {
  const memoryStr = env[AWS_ENV_MAPPING.memoryLimitInMB];
  const memoryLimitInMB =
    memoryStr !== undefined ? Number.parseInt(memoryStr, 10) : undefined;

  return {
    region: env[AWS_ENV_MAPPING.region],
    functionName: env[AWS_ENV_MAPPING.functionName],
    functionVersion: env[AWS_ENV_MAPPING.functionVersion],
    memoryLimitInMB: Number.isNaN(memoryLimitInMB)
      ? undefined
      : memoryLimitInMB,
    logGroupName: env[AWS_ENV_MAPPING.logGroupName],
    logStreamName: env[AWS_ENV_MAPPING.logStreamName],
    executionEnv: env[AWS_ENV_MAPPING.executionEnv],
    accessKeyId: env[AWS_ENV_MAPPING.accessKeyId],
    secretAccessKey: env[AWS_ENV_MAPPING.secretAccessKey],
    sessionToken: env[AWS_ENV_MAPPING.sessionToken],
    runtimeApi: env[AWS_ENV_MAPPING.runtimeApi],
    taskRoot: env[AWS_ENV_MAPPING.taskRoot],
    handler: env[AWS_ENV_MAPPING.handler],
  };
}
