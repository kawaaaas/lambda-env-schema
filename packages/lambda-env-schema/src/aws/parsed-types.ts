/**
 * Base interface for all parsed AWS resource values.
 * Every parsed value includes the original string value.
 */
export interface BaseParsedValue {
  /** Original string value */
  value: string;
}

/**
 * Parsed S3 ARN value.
 * Format: arn:aws:s3:::<bucket-name>[/<object-key>]
 */
export interface ParsedS3Arn extends BaseParsedValue {
  /** S3 bucket name */
  bucketName: string;
  /** Object key (undefined for bucket-only ARNs) */
  key: string | undefined;
  /** Whether this ARN references an object (has a key) */
  isObject: boolean;
}

/**
 * Parsed S3 URI value.
 * Format: s3://<bucket>/<key>
 */
export interface ParsedS3Uri extends BaseParsedValue {
  /** S3 bucket name */
  bucket: string;
  /** Object key */
  key: string;
}

/**
 * Parsed SQS Queue URL value.
 * Format: https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>
 */
export interface ParsedSQSQueueUrl extends BaseParsedValue {
  /** Queue name */
  queueName: string;
  /** AWS account ID */
  accountId: string;
  /** AWS region */
  region: string;
  /** Whether this is a FIFO queue (name ends with .fifo) */
  isFifo: boolean;
}

/**
 * Parsed SQS Queue ARN value.
 * Format: arn:aws:sqs:<region>:<account-id>:<queue-name>
 */
export interface ParsedSQSQueueArn extends BaseParsedValue {
  /** Queue name */
  queueName: string;
  /** AWS account ID */
  accountId: string;
  /** AWS region */
  region: string;
  /** Whether this is a FIFO queue (name ends with .fifo) */
  isFifo: boolean;
}

/**
 * Parsed SNS Topic ARN value.
 * Format: arn:aws:sns:<region>:<account-id>:<topic-name>
 */
export interface ParsedSNSTopicArn extends BaseParsedValue {
  /** Topic name */
  topicName: string;
  /** AWS region */
  region: string;
  /** AWS account ID */
  accountId: string;
}

/**
 * Parsed DynamoDB Table ARN value.
 * Format: arn:aws:dynamodb:<region>:<account-id>:table/<table-name>
 */
export interface ParsedDynamoDBTableArn extends BaseParsedValue {
  /** Table name */
  tableName: string;
  /** AWS region */
  region: string;
  /** AWS account ID */
  accountId: string;
}

/**
 * Parsed RDS Endpoint value.
 * Format: <instance-id>.<random>.<region>.rds.amazonaws.com[:port]
 */
export interface ParsedRDSEndpoint extends BaseParsedValue {
  /** Hostname (without port) */
  hostname: string;
  /** Port number (undefined if not specified) */
  port: number | undefined;
  /** Socket address in hostname:port format (uses default 5432 if port not specified) */
  socketAddress: string;
  /** AWS region */
  region: string;
}

/**
 * Parsed Lambda Function ARN value.
 * Format: arn:aws:lambda:<region>:<account-id>:function:<function-name>[:<alias>]
 */
export interface ParsedLambdaFunctionArn extends BaseParsedValue {
  /** Function name */
  functionName: string;
  /** Alias or version (undefined if not specified) */
  alias: string | undefined;
  /** Qualifier (same as alias, for SDK compatibility) */
  qualifier: string | undefined;
  /** AWS region */
  region: string;
  /** AWS account ID */
  accountId: string;
}

/**
 * Parsed KMS Key ARN value.
 * Format: arn:aws:kms:<region>:<account-id>:key/<key-id>
 */
export interface ParsedKMSKeyArn extends BaseParsedValue {
  /** Key ID (UUID format) */
  keyId: string;
  /** AWS region */
  region: string;
  /** AWS account ID */
  accountId: string;
}

/**
 * Parsed Secrets Manager ARN value.
 * Format: arn:aws:secretsmanager:<region>:<account-id>:secret:<secret-name>-<random>
 */
export interface ParsedSecretsManagerArn extends BaseParsedValue {
  /** Secret name (without random suffix) */
  secretName: string;
  /** AWS region */
  region: string;
  /** AWS account ID */
  accountId: string;
}

/**
 * Parsed IAM Role ARN value.
 * Format: arn:aws:iam::<account-id>:role[/path]/role-name
 */
export interface ParsedIAMRoleArn extends BaseParsedValue {
  /** Role name */
  roleName: string;
  /** AWS account ID */
  accountId: string;
  /** Path (undefined if not specified) */
  path: string | undefined;
}

/**
 * Parsed generic ARN value.
 * Format: arn:aws:<service>:<region>:<account-id>:<resource>
 */
export interface ParsedArn extends BaseParsedValue {
  /** AWS service name */
  service: string;
  /** AWS region (may be empty string for global services) */
  region: string;
  /** AWS account ID (may be empty string for some resources) */
  accountId: string;
  /** Resource identifier */
  resource: string;
}
