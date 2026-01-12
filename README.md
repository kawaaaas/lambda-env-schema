<div align="center">

# lambda-env-schema

**Zero-dependency, strictly typed environment variable validator tailored for AWS Lambda**

[![npm version](https://img.shields.io/npm/v/@kawaaaas/lambda-env-schema.svg)](https://www.npmjs.com/package/@kawaaaas/lambda-env-schema)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

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
  
  // AWS-specific validation
  QUEUE_ARN: { type: 'string', validation: 'sqs-queue-arn', required: true },
  BUCKET_NAME: { type: 'string', validation: 's3-bucket-name', required: true },
});

// Type-safe access with auto-completion
console.log(env.PORT); // number
console.log(env.API_KEY); // string
console.log(env.DEBUG); // boolean
console.log(env.ALLOWED_ORIGINS); // string[]
console.log(env.DATABASE_CONFIG); // unknown

// AWS-validated resources
console.log(env.QUEUE_ARN); // string (validated SQS ARN format)
console.log(env.BUCKET_NAME); // string (validated S3 bucket name)

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

// Validate environment at module initialization (cold start)
const env = createEnv({
  // DynamoDB table with ARN validation
  TABLE_ARN: { type: 'string', validation: 'dynamodb-table-arn', required: true },
  
  // SQS queue with ARN validation
  QUEUE_ARN: { type: 'string', validation: 'sqs-queue-arn', required: true },
  
  // S3 bucket with bucket name validation
  BUCKET_NAME: { type: 'string', validation: 's3-bucket-name', required: true },
  
  // API key (marked as secret)
  API_KEY: { type: 'string', required: true, secret: true },
  
  // Debug flag
  DEBUG: { type: 'boolean', default: false },
});

// Initialize AWS clients with validated resources
const dynamodb = new DynamoDBClient({ region: env.aws.region });
const sqs = new SQSClient({ region: env.aws.region });

export const handler: APIGatewayProxyHandler = async (event) => {
  // Use validated AWS resources
  console.log('Table ARN:', env.TABLE_ARN);
  console.log('Queue ARN:', env.QUEUE_ARN);
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

Validate AWS resource identifiers with 30+ built-in validators:

```typescript
const env = createEnv({
  // Identity & Access
  AWS_REGION: { type: 'string', validation: 'aws-region', required: true },
  AWS_ACCOUNT_ID: { type: 'string', validation: 'aws-account-id', required: true },
  ROLE_ARN: { type: 'string', validation: 'iam-role-arn', required: true },
  
  // Storage
  BUCKET_NAME: { type: 'string', validation: 's3-bucket-name', required: true },
  S3_ARN: { type: 'string', validation: 's3-arn', required: true },
  
  // Database
  TABLE_NAME: { type: 'string', validation: 'dynamodb-table-name', required: true },
  TABLE_ARN: { type: 'string', validation: 'dynamodb-table-arn', required: true },
  
  // Messaging
  QUEUE_URL: { type: 'string', validation: 'sqs-queue-url', required: true },
  QUEUE_ARN: { type: 'string', validation: 'sqs-queue-arn', required: true },
  TOPIC_ARN: { type: 'string', validation: 'sns-topic-arn', required: true },
  
  // Security
  KMS_KEY_ID: { type: 'string', validation: 'kms-key-id', required: true },
  SECRET_ARN: { type: 'string', validation: 'secrets-manager-arn', required: true },
});
```

**Available validators:** `aws-region`, `aws-account-id`, `iam-role-arn`, `iam-user-arn`, `s3-bucket-name`, `s3-arn`, `dynamodb-table-name`, `dynamodb-table-arn`, `lambda-function-name`, `sqs-queue-url`, `sqs-queue-arn`, `sns-topic-arn`, `kms-key-id`, `kms-key-arn`, `secrets-manager-arn`, and more.

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
