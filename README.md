<div align="center">

# lambda-env-schema

**Zero-dependency, strictly typed environment variable validator tailored for AWS Lambda**

[![npm version](https://img.shields.io/npm/v/@kawaaaas/lambda-env-schema.svg)](https://www.npmjs.com/package/@kawaaaas/lambda-env-schema)
[![CI](https://github.com/kawaaaas/lambda-env-schema/actions/workflows/ci.yml/badge.svg)](https://github.com/kawaaaas/lambda-env-schema/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@kawaaaas/lambda-env-schema)](https://bundlephobia.com/package/@kawaaaas/lambda-env-schema)

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Examples](#-examples) • [Contributing](./CONTRIBUTING.md)

</div>

---

## 🎯 Why lambda-env-schema?

**Stop worrying about environment variables. Start building.**

```typescript
// Before: Manual parsing, no type safety, runtime errors
const port = parseInt(process.env.PORT || '3000');
const debug = process.env.DEBUG === 'true';
const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];

// After: Type-safe, validated, zero boilerplate
const env = createEnv({
  PORT: { type: 'number', default: 3000 },
  DEBUG: { type: 'boolean', default: false },
  ALLOWED_ORIGINS: { type: 'array', itemType: 'string', required: true },
});
```

### Key Benefits

- ⚡ **Lambda-optimized**: Built-in AWS Lambda environment support with type-safe access
- 🔒 **Type-safe**: Full TypeScript inference from schema to runtime
- 🎯 **Zero-config coercion**: Automatic type conversion from environment strings
- 🔐 **Secure by default**: Automatic secret masking in error logs
- ✅ **Fail-fast**: Validation at cold start, not during request handling
- 🚀 **Zero dependencies**: No external packages, minimal impact on cold starts
- 🛡️ **Production-ready**: Battle-tested validation and error handling
- 🎨 **Developer-friendly**: Minimal boilerplate, maximum productivity

### Comparison with Alternatives

| Feature | lambda-env-schema | Zod | envalid |
|---------|-------------------|-----|---------|
| Lambda env vars | **Built-in** | Manual | Manual |
| Type coercion | **Automatic** | Manual (`z.coerce`) | Automatic |
| Secret masking | **Built-in** | Manual | Manual |
| AWS validation | **Built-in** | Manual | Manual |
| Dependencies | **Zero** | Zero | 1+ |
| Focus | **Lambda DX** | General validation | Env vars |
| Cold start impact | **Minimal** | Moderate | Moderate |

---

## 📦 Installation

```bash
npm install @kawaaaas/lambda-env-schema
```

```bash
pnpm add @kawaaaas/lambda-env-schema
```

```bash
yarn add @kawaaaas/lambda-env-schema
```

**Requirements:**
- Node.js 16+ (Lambda runtime: nodejs16.x or later)
- TypeScript 5.0+ (for type inference)

---

## 🚀 Quick Start

```typescript
import { createEnv } from '@kawaaaas/lambda-env-schema';

// Define your schema
const env = createEnv({
  // String with default value
  LOG_LEVEL: { type: 'string', default: 'info' },
  
  // Required string (marked as secret)
  API_KEY: { type: 'string', required: true, secret: true },
  
  // Number (auto-coerced from string)
  PORT: { type: 'number', default: 3000 },
  
  // Boolean (auto-coerced from string)
  DEBUG: { type: 'boolean', default: false },
  
  // Array (auto-split by comma)
  ALLOWED_ORIGINS: { type: 'array', itemType: 'string', required: true },
  
  // JSON (auto-parsed)
  DATABASE_CONFIG: { type: 'json', required: true },
  
  // AWS-specific validation (parsed types)
  QUEUE_ARN: { type: 'sqs-queue-arn', required: true },
  TABLE_ARN: { type: 'dynamodb-table-arn', required: true },
});

// Type-safe access with auto-completion
console.log(env.PORT); // number
console.log(env.API_KEY); // string
console.log(env.DEBUG); // boolean
console.log(env.ALLOWED_ORIGINS); // string[]
console.log(env.DATABASE_CONFIG); // unknown

// AWS-validated resources (parsed types)
console.log(env.QUEUE_ARN.queueName); // string (parsed from ARN)
console.log(env.TABLE_ARN.tableName); // string (parsed from ARN)

// Access AWS Lambda environment variables
console.log(env.aws.region); // string | undefined
console.log(env.aws.functionName); // string | undefined
```

### Lambda Handler Example

```typescript
import { createEnv } from '@kawaaaas/lambda-env-schema';
import type { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';

// ⚠️ IMPORTANT: Call createEnv OUTSIDE the handler!
// This ensures validation runs during cold start (initialization phase),
// not during request handling. Invalid config fails fast before any
// requests are processed.
const env = createEnv({
  // DynamoDB table with parsed ARN
  TABLE_ARN: { type: 'dynamodb-table-arn', required: true },
  
  // SQS queue with parsed ARN
  QUEUE_ARN: { type: 'sqs-queue-arn', required: true },
  
  // S3 bucket with validation
  BUCKET_NAME: { type: 's3-bucket-name', required: true },
  
  // API key (marked as secret)
  API_KEY: { type: 'string', required: true, secret: true },
  
  // Debug flag
  DEBUG: { type: 'boolean', default: false },
});

// Initialize AWS clients with validated resources
const dynamodb = new DynamoDBClient({ region: env.aws.region });
const sqs = new SQSClient({ region: env.aws.region });

export const handler: APIGatewayProxyHandler = async (event) => {
  // Use validated AWS resources with parsed properties
  console.log('Table name:', env.TABLE_ARN.tableName);
  console.log('Table region:', env.TABLE_ARN.region);
  console.log('Queue name:', env.QUEUE_ARN.queueName);
  console.log('Bucket:', env.BUCKET_NAME);
  console.log('Function:', env.aws.functionName);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' }),
  };
};
```

---

## ✨ Features

### Automatic Type Coercion

Environment variables are always strings. `lambda-env-schema` automatically converts them to the correct type:

```typescript
// Environment: PORT=3000
const env = createEnv({
  PORT: { type: 'number', default: 8080 },
});

console.log(typeof env.PORT); // "number"
console.log(env.PORT); // 3000
```

### Required vs Optional

```typescript
const env = createEnv({
  // Required: must be set in environment
  API_KEY: { type: 'string', required: true },
  
  // Optional with default: uses default if not set
  PORT: { type: 'number', default: 3000 },
  
  // Optional without default: can be undefined
  CACHE_TTL: { type: 'number' },
});

// TypeScript types:
// env.API_KEY: string
// env.PORT: number
// env.CACHE_TTL: number | undefined
```

### Secret Masking

Protect sensitive values in error logs:

```typescript
const env = createEnv({
  API_KEY: { type: 'string', required: true, secret: true },
  DATABASE_URL: { type: 'string', required: true, secret: true },
});

// If validation fails, secrets are automatically masked:
// ❌ Environment variable "API_KEY" is required but not set
// (actual value is never logged)
```

### AWS Lambda Environment

Access AWS Lambda runtime variables in a type-safe way:

```typescript
const env = createEnv({
  // Your custom variables
  API_KEY: { type: 'string', required: true },
});

// AWS Lambda environment (automatically available)
console.log(env.aws.region); // AWS_REGION
console.log(env.aws.functionName); // AWS_LAMBDA_FUNCTION_NAME
console.log(env.aws.functionVersion); // AWS_LAMBDA_FUNCTION_VERSION
console.log(env.aws.memoryLimitInMB); // AWS_LAMBDA_FUNCTION_MEMORY_SIZE
console.log(env.aws.logGroupName); // AWS_LAMBDA_LOG_GROUP_NAME
console.log(env.aws.logStreamName); // AWS_LAMBDA_LOG_STREAM_NAME
```

### Validation Options

Add constraints to your environment variables:

```typescript
const env = createEnv({
  // String with enum
  LOG_LEVEL: { 
    type: 'string', 
    enum: ['debug', 'info', 'warn', 'error'] as const,
    default: 'info'
  },
  
  // String with pattern
  EMAIL: { 
    type: 'string', 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    required: true
  },
  
  // String with length constraints
  USERNAME: { 
    type: 'string', 
    minLength: 3, 
    maxLength: 20,
    required: true
  },
  
  // Number with range
  PORT: { 
    type: 'number', 
    min: 1024, 
    max: 65535,
    default: 3000
  },
  
  // Array with length constraints
  TAGS: { 
    type: 'array', 
    itemType: 'string',
    minLength: 1,
    maxLength: 10
  },
});
```

### AWS-Specific Validation

Validate AWS resource identifiers with 30+ built-in validators. AWS types come in two flavors:

**Validation-only types** (return string):
```typescript
const env = createEnv({
  // Identity & Access
  AWS_REGION: { type: 'aws-region', required: true },
  AWS_ACCOUNT_ID: { type: 'aws-account-id', required: true },
  
  // Storage
  BUCKET_NAME: { type: 's3-bucket-name', required: true },
  
  // Database
  TABLE_NAME: { type: 'dynamodb-table-name', required: true },
  RDS_CLUSTER: { type: 'rds-cluster-id', required: true },
  
  // Compute
  FUNCTION_NAME: { type: 'lambda-function-name', required: true },
  
  // Networking
  VPC_ID: { type: 'vpc-id', required: true },
  SUBNET_ID: { type: 'subnet-id', required: true },
  SECURITY_GROUP: { type: 'security-group-id', required: true },
  INSTANCE_ID: { type: 'ec2-instance-id', required: true },
  
  // Other Services
  EVENT_BUS: { type: 'event-bus-name', required: true },
  API_ID: { type: 'api-gateway-id', required: true },
  DIST_ID: { type: 'cloudfront-dist-id', required: true },
  KMS_KEY: { type: 'kms-key-id', required: true },
  PARAM_NAME: { type: 'ssm-parameter-name', required: true },
  USER_ARN: { type: 'iam-user-arn', required: true },
});

console.log(env.BUCKET_NAME); // string
console.log(env.AWS_REGION); // string
```

**Parsed types** (return structured objects with extracted properties):
```typescript
const env = createEnv({
  // ARNs with parsed components
  ROLE_ARN: { type: 'iam-role-arn', required: true },
  TABLE_ARN: { type: 'dynamodb-table-arn', required: true },
  QUEUE_ARN: { type: 'sqs-queue-arn', required: true },
  TOPIC_ARN: { type: 'sns-topic-arn', required: true },
  FUNCTION_ARN: { type: 'lambda-function-arn', required: true },
  KMS_ARN: { type: 'kms-key-arn', required: true },
  SECRET_ARN: { type: 'secrets-manager-arn', required: true },
  
  // URLs and URIs with parsed components
  QUEUE_URL: { type: 'sqs-queue-url', required: true },
  S3_ARN: { type: 's3-arn', required: true },
  S3_URI: { type: 's3-uri', required: true },
  DB_ENDPOINT: { type: 'rds-endpoint', required: true },
  
  // Generic ARN parser
  GENERIC_ARN: { type: 'arn', required: true },
});

// Access parsed properties
console.log(env.ROLE_ARN.accountId); // string
console.log(env.ROLE_ARN.roleName); // string
console.log(env.ROLE_ARN.path); // string | undefined

console.log(env.QUEUE_URL.accountId); // string
console.log(env.QUEUE_URL.region); // string
console.log(env.QUEUE_URL.queueName); // string

console.log(env.S3_ARN.bucketName); // string
console.log(env.S3_ARN.key); // string | undefined
```

**Available validators:**
- **Identity & Access**: `aws-region`, `aws-account-id`, `iam-role-arn`, `iam-user-arn`
- **Storage**: `s3-bucket-name`, `s3-arn`, `s3-uri`
- **Database**: `dynamodb-table-name`, `dynamodb-table-arn`, `rds-cluster-id`, `rds-endpoint`
- **Compute**: `lambda-function-name`, `lambda-function-arn`
- **Messaging**: `sqs-queue-url`, `sqs-queue-arn`, `sns-topic-arn`
- **Security**: `kms-key-id`, `kms-key-arn`, `secrets-manager-arn`
- **Networking**: `vpc-id`, `subnet-id`, `security-group-id`, `ec2-instance-id`
- **Other**: `event-bus-name`, `api-gateway-id`, `cloudfront-dist-id`, `ssm-parameter-name`, `arn`

---

## 📚 Documentation

### Full Documentation

For comprehensive documentation including API reference, advanced usage, best practices, and troubleshooting, see:

**[📖 Complete Documentation](./packages/lambda-env-schema/README.md)**

### Quick Links

- [API Reference](./packages/lambda-env-schema/README.md#api-reference)
- [Schema Types](./packages/lambda-env-schema/README.md#schema-types)
- [Advanced Usage](./packages/lambda-env-schema/README.md#-advanced-usage)
- [Error Handling](./packages/lambda-env-schema/README.md#-error-handling)
- [Best Practices](./packages/lambda-env-schema/README.md#-best-practices)
- [Troubleshooting](./packages/lambda-env-schema/README.md#-troubleshooting)
- [TypeScript Support](./packages/lambda-env-schema/README.md#-typescript-support)

---

## 💡 Examples

### Basic Example

Check out the [basic example](./examples/basic) for a complete demonstration of all features:

```bash
cd examples/basic
cp .env.example .env
pnpm install
pnpm build
pnpm start
```

### More Examples

```typescript
// With DynamoDB
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const env = createEnv({
  TABLE_NAME: { type: 'string', required: true },
  AWS_REGION: { type: 'string', default: 'us-east-1' },
});

const client = new DynamoDBClient({ region: env.AWS_REGION });
```

```typescript
// With Multiple Environments
const env = createEnv({
  NODE_ENV: { 
    type: 'string', 
    enum: ['development', 'staging', 'production'] as const,
    default: 'development'
  },
  API_ENDPOINT: { type: 'string', required: true },
});

if (env.NODE_ENV === 'production') {
  // Production-specific logic
}
```

```typescript
// With CamelCase Naming
const env = createEnv(
  {
    API_KEY: { type: 'string', required: true },
    DATABASE_URL: { type: 'string', required: true },
  },
  { namingStrategy: 'camelCase' }
);

console.log(env.apiKey); // instead of env.API_KEY
console.log(env.databaseUrl); // instead of env.DATABASE_URL
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on:

- Development setup
- Code style guidelines
- Testing requirements
- Pull request process

---

## 📄 License

MIT © [kawaaaas](https://github.com/kawaaaas)

---

## 🔗 Links

- **[📦 npm Package](https://www.npmjs.com/package/@kawaaaas/lambda-env-schema)**
- **[📖 Full Documentation](./packages/lambda-env-schema/README.md)**
- **[💡 Examples](./examples/basic)**
- **[🤝 Contributing Guide](./CONTRIBUTING.md)**
- **[🐛 Report Issues](https://github.com/kawaaaas/lambda-env-schema/issues)**
- **[💬 Discussions](https://github.com/kawaaaas/lambda-env-schema/discussions)**

---

## 🙏 Acknowledgments

Inspired by:
- [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation
- [envalid](https://github.com/af/envalid) - Environment variable validation
- [t3-env](https://github.com/t3-oss/t3-env) - Type-safe environment variables

---

<div align="center">

**Made with ❤️ for AWS Lambda developers**

[⬆ Back to top](#lambda-env-schema)

</div>
