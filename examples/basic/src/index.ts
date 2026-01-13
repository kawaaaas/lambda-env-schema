/**
 * lambda-env-schema - Basic Example
 *
 * This example demonstrates the key features:
 * - Basic type coercion (string, number, boolean, array, json)
 * - AWS Parsed Types (NEW!)
 * - AWS Lambda environment access
 */

import { createEnv } from '@kawaaaas/lambda-env-schema';
import 'dotenv/config';

console.log('='.repeat(60));
console.log('lambda-env-schema - Basic Example');
console.log('='.repeat(60));
console.log();

// =============================================================================
// Example 1: Basic Types
// =============================================================================

console.log('📦 Example 1: Basic Types');
console.log('-'.repeat(60));

const env = createEnv({
  // String
  API_KEY: { type: 'string', required: true, secret: true },
  LOG_LEVEL: { type: 'string', default: 'info' },

  // Number (auto-coerced from string)
  PORT: { type: 'number', default: 3000 },
  MAX_CONNECTIONS: { type: 'number', required: true },

  // Boolean (auto-coerced from string)
  DEBUG: { type: 'boolean', default: false },

  // Array (auto-split by comma)
  ALLOWED_ORIGINS: { type: 'array', itemType: 'string', required: true },

  // JSON (auto-parsed)
  DATABASE_CONFIG: { type: 'json', required: true },
});

console.log('✅ Basic types validated!');
console.log('  API_KEY:', `${env.API_KEY.substring(0, 3)}***`);
console.log('  PORT:', env.PORT, '(type:', typeof env.PORT, ')');
console.log('  DEBUG:', env.DEBUG, '(type:', typeof env.DEBUG, ')');
console.log('  ALLOWED_ORIGINS:', env.ALLOWED_ORIGINS);
console.log('  DATABASE_CONFIG:', env.DATABASE_CONFIG);
console.log();

// =============================================================================
// Example 2: AWS Parsed Types (NEW!)
// =============================================================================

console.log('📦 Example 2: AWS Parsed Types (NEW!)');
console.log('-'.repeat(60));

const awsEnv = createEnv({
  // Validation-only types (return string)
  BUCKET_NAME: { type: 's3-bucket-name', required: true },
  TABLE_NAME: { type: 'dynamodb-table-name', required: true },
  AWS_REGION: { type: 'aws-region', required: true },

  // Parsed types (return object with properties)
  QUEUE_ARN: { type: 'sqs-queue-arn', required: true },
  QUEUE_URL: { type: 'sqs-queue-url', required: true },
  TABLE_ARN: { type: 'dynamodb-table-arn', required: true },
  S3_ARN: { type: 's3-arn', required: true },
  ROLE_ARN: { type: 'iam-role-arn', required: true },
});

console.log('✅ AWS types validated!');
console.log();

console.log('Validation-only types (string):');
console.log('  BUCKET_NAME:', awsEnv.BUCKET_NAME);
console.log('  TABLE_NAME:', awsEnv.TABLE_NAME);
console.log('  AWS_REGION:', awsEnv.AWS_REGION);
console.log();

console.log('Parsed types (object with properties):');
console.log('  QUEUE_ARN:');
console.log('    - queueName:', awsEnv.QUEUE_ARN.queueName);
console.log('    - accountId:', awsEnv.QUEUE_ARN.accountId);
console.log('    - region:', awsEnv.QUEUE_ARN.region);
console.log();

console.log('  QUEUE_URL:');
console.log('    - queueName:', awsEnv.QUEUE_URL.queueName);
console.log('    - accountId:', awsEnv.QUEUE_URL.accountId);
console.log('    - region:', awsEnv.QUEUE_URL.region);
console.log();

console.log('  TABLE_ARN:');
console.log('    - tableName:', awsEnv.TABLE_ARN.tableName);
console.log('    - accountId:', awsEnv.TABLE_ARN.accountId);
console.log('    - region:', awsEnv.TABLE_ARN.region);
console.log();

console.log('  S3_ARN:');
console.log('    - bucketName:', awsEnv.S3_ARN.bucketName);
console.log('    - key:', awsEnv.S3_ARN.key);
console.log('    - isObject:', awsEnv.S3_ARN.isObject);
console.log();

console.log('  ROLE_ARN:');
console.log('    - roleName:', awsEnv.ROLE_ARN.roleName);
console.log('    - accountId:', awsEnv.ROLE_ARN.accountId);
console.log('    - path:', awsEnv.ROLE_ARN.path);
console.log();

// =============================================================================
// Example 3: AWS Lambda Environment
// =============================================================================

console.log('📦 Example 3: AWS Lambda Environment');
console.log('-'.repeat(60));

console.log('AWS Lambda environment variables:');
console.log('  Region:', env.aws.region);
console.log('  Function Name:', env.aws.functionName);
console.log('  Function Version:', env.aws.functionVersion);
console.log('  Memory Size:', env.aws.memoryLimitInMB);
console.log();

// =============================================================================
// Summary
// =============================================================================

console.log('='.repeat(60));
console.log('✨ All examples completed successfully!');
console.log('='.repeat(60));
console.log();
console.log('Key features demonstrated:');
console.log(
	'  ✓ Automatic type coercion (string → number, boolean, array, json)',
);
console.log('  ✓ AWS Parsed Types (ARNs, URLs → structured objects)');
console.log('  ✓ Type-safe property access with auto-completion');
console.log('  ✓ Built-in AWS Lambda environment support');
console.log();
