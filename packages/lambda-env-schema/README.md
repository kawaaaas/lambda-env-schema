<div align="center">

# lambda-env-schema

**Zero-dependency, strictly typed environment variable validator tailored for AWS Lambda**

[![npm version](https://img.shields.io/npm/v/@kawaaaas/lambda-env-schema.svg)](https://www.npmjs.com/package/@kawaaaas/lambda-env-schema)
[![CI](https://github.com/kawaaaas/lambda-env-schema/actions/workflows/ci.yml/badge.svg)](https://github.com/kawaaaas/lambda-env-schema/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@kawaaaas/lambda-env-schema)](https://bundlephobia.com/package/@kawaaaas/lambda-env-schema)

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Examples](#-examples)

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

- 🪶 **Lightweight**: ~5KB gzipped - minimal impact on Lambda cold starts
- � **Zereo dependencies**: No external packages
- 🔒 **Type-safe**: Full TypeScript inference from schema to runtime
- 🔐 **Secure by default**: Automatic secret masking in error logs
- ⚡ **Lambda-optimized**: Built-in AWS Lambda environment support
- 🎯 **Zero-config coercion**: Automatic type conversion from environment strings
- ✅ **Fail-fast**: Validation at cold start, not during request handling
- 🛡️ **Production-ready**: Battle-tested validation and error handling

### Comparison with Alternatives

| Feature | lambda-env-schema | Zod | envalid |
|---------|-------------------|-----|---------|
| Type coercion | **Automatic** | Manual (`z.coerce`) | Automatic |
| Lambda env vars | **Built-in** | Manual | Manual |
| Secret masking | **Built-in** | Manual | Manual |
| AWS validation | **Built-in** | Manual | Manual |
| Dependencies | **Zero** | Zero | 1+ |
| Focus | **Env vars only** | General validation | Env vars |

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

### Array Support

Automatically split comma-separated values:

```typescript
// Environment: ALLOWED_ORIGINS=https://example.com,https://api.example.com
const env = createEnv({
  ALLOWED_ORIGINS: { type: 'array', itemType: 'string', required: true },
  PORTS: { type: 'array', itemType: 'number', separator: ',' },
});

console.log(env.ALLOWED_ORIGINS); // ['https://example.com', 'https://api.example.com']
console.log(env.PORTS); // [3000, 3001, 3002] (numbers)
```

### JSON Support

Automatically parse JSON strings:

```typescript
// Environment: DATABASE_CONFIG={"host":"localhost","port":5432}
const env = createEnv({
  DATABASE_CONFIG: { type: 'json', required: true },
  FEATURE_FLAGS: { type: 'json', default: {} },
});

console.log(env.DATABASE_CONFIG); // { host: 'localhost', port: 5432 }
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

### CamelCase Naming Strategy

Convert SNAKE_CASE environment variables to camelCase:

```typescript
const env = createEnv(
  {
    API_KEY: { type: 'string', required: true },
    DATABASE_URL: { type: 'string', required: true },
  },
  { namingStrategy: 'camelCase' }
);

// Access with camelCase
console.log(env.apiKey); // instead of env.API_KEY
console.log(env.databaseUrl); // instead of env.DATABASE_URL
```

---

## 📚 Documentation

### API Reference

#### `createEnv(schema, options?)`

Creates a validated and typed environment object.

**Parameters:**
- `schema`: `EnvSchema` - Schema definition for environment variables
- `options?`: `CreateEnvOptions` - Optional configuration
  - `namingStrategy?`: `'preserve' | 'camelCase'` - Naming strategy for keys (default: `'preserve'`)

**Returns:** `EnvResult<S, Strategy>` - Validated environment object with:
- All schema-defined variables (typed according to schema)
- `aws`: AWS Lambda environment variables

**Throws:** `EnvironmentValidationError` - When validation fails

### Schema Types

#### `StringSchema`

```typescript
{
  type: 'string';
  required?: boolean;
  default?: string;
  secret?: boolean;
  description?: string;
  enum?: readonly string[];
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
}
```

#### `NumberSchema`

```typescript
{
  type: 'number';
  required?: boolean;
  default?: number;
  secret?: boolean;
  description?: string;
  min?: number;
  max?: number;
}
```

#### `BooleanSchema`

```typescript
{
  type: 'boolean';
  required?: boolean;
  default?: boolean;
  secret?: boolean;
  description?: string;
}
```

#### `ArraySchema`

```typescript
{
  type: 'array';
  itemType: 'string' | 'number';
  required?: boolean;
  default?: string[] | number[];
  secret?: boolean;
  description?: string;
  separator?: string; // default: ','
  minLength?: number;
  maxLength?: number;
}
```

#### `JsonSchema`

```typescript
{
  type: 'json';
  required?: boolean;
  default?: T;
  secret?: boolean;
  description?: string;
}
```

### Type Inference

```typescript
import type { InferEnv } from '@kawaaaas/lambda-env-schema';

const schema = {
  PORT: { type: 'number', default: 3000 },
  API_KEY: { type: 'string', required: true },
} as const;

// Infer the type
type Env = InferEnv<typeof schema>;
// { PORT: number; API_KEY: string }

// With camelCase strategy
type EnvCamel = InferEnv<typeof schema, 'camelCase'>;
// { port: number; apiKey: string }
```

---

## 💡 Examples

### Basic Lambda Handler

```typescript
import { createEnv } from '@kawaaaas/lambda-env-schema';
import type { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';

// Validate environment at module initialization (cold start)
const env = createEnv({
  TABLE_ARN: { type: 'dynamodb-table-arn', required: true },
  QUEUE_ARN: { type: 'sqs-queue-arn', required: true },
  BUCKET_NAME: { type: 's3-bucket-name', required: true },
  API_KEY: { type: 'string', required: true, secret: true },
  DEBUG: { type: 'boolean', default: false },
});

// Initialize AWS clients with validated resources
const dynamodb = new DynamoDBClient({ region: env.aws.region });
const sqs = new SQSClient({ region: env.aws.region });

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Table name:', env.TABLE_ARN.tableName);
  console.log('Queue name:', env.QUEUE_ARN.queueName);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' }),
  };
};
```

### With Multiple Environments

```typescript
const env = createEnv({
  NODE_ENV: { 
    type: 'string', 
    enum: ['development', 'staging', 'production'] as const,
    default: 'development'
  },
  API_ENDPOINT: { type: 'string', required: true },
  TIMEOUT_MS: { type: 'number', default: 30000 },
});

if (env.NODE_ENV === 'production') {
  // Production-specific logic
}
```

---

## 🚨 Error Handling

```typescript
import { createEnv, EnvironmentValidationError } from '@kawaaaas/lambda-env-schema';

try {
  const env = createEnv({
    PORT: { type: 'number', min: 1024, max: 65535, required: true },
    API_KEY: { type: 'string', required: true, secret: true },
  });
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Errors:', error.errors);
    // error.errors: Array<{ key: string; message: string }>
    process.exit(1);
  }
}
```

### Error Messages

The library provides clear, actionable error messages:

```
// Missing required variable
❌ Environment variable "API_KEY" is required but not set

// Invalid type coercion
❌ Environment variable "PORT" must be a valid number, got "abc"

// Out of range
❌ Environment variable "PORT" must be between 1024 and 65535, got 80

// Pattern mismatch
❌ Environment variable "EMAIL" does not match the required pattern

// Invalid enum value
❌ Environment variable "LOG_LEVEL" must be one of: debug, info, warn, error
```

---

## 🎓 Best Practices

### 1. Validate at Module Initialization

```typescript
// ✅ Good: Validate during cold start
const env = createEnv({ /* schema */ });

export const handler = async (event) => {
  // Use env here
};

// ❌ Bad: Validate on every invocation
export const handler = async (event) => {
  const env = createEnv({ /* schema */ }); // Wasteful!
};
```

### 2. Mark Secrets Appropriately

```typescript
const env = createEnv({
  // ✅ Secrets: API keys, passwords, tokens
  API_KEY: { type: 'string', required: true, secret: true },
  DATABASE_PASSWORD: { type: 'string', required: true, secret: true },
  
  // ✅ Not secrets: table names, regions, feature flags
  TABLE_NAME: { type: 'string', required: true },
  ENABLE_CACHE: { type: 'boolean', default: false },
});
```

### 3. Use Type Inference

```typescript
// ✅ Good: Let TypeScript infer the type
const env = createEnv({
  PORT: { type: 'number', default: 3000 },
});

// ❌ Bad: Manual type annotation (redundant)
const env: { PORT: number } = createEnv({
  PORT: { type: 'number', default: 3000 },
});
```

### 4. Provide Defaults for Optional Values

```typescript
const env = createEnv({
  // ✅ Good: Clear default value
  TIMEOUT_MS: { type: 'number', default: 30000 },
  
  // ⚠️ Acceptable: Explicitly optional
  CACHE_TTL: { type: 'number' }, // number | undefined
});
```

### 5. Use Enums for Fixed Values

```typescript
const env = createEnv({
  LOG_LEVEL: { 
    type: 'string', 
    enum: ['debug', 'info', 'warn', 'error'] as const,
    default: 'info'
  },
});

if (env.LOG_LEVEL === 'debug') { // ✅ Type-safe
  // ...
}
```

---

## 🔷 TypeScript Support

This library is written in TypeScript and provides full type safety:

```typescript
const env = createEnv({
  PORT: { type: 'number', default: 3000 },
  API_KEY: { type: 'string', required: true },
  DEBUG: { type: 'boolean', default: false },
  TAGS: { type: 'array', itemType: 'string', default: [] },
});

// ✅ Type-safe access with auto-completion
const port: number = env.PORT;
const apiKey: string = env.API_KEY;
const debug: boolean = env.DEBUG;
const tags: string[] = env.TAGS;

// ❌ TypeScript error: Property 'UNKNOWN' does not exist
const unknown = env.UNKNOWN;

// ✅ Enum types are preserved
const env2 = createEnv({
  LOG_LEVEL: { 
    type: 'string', 
    enum: ['debug', 'info', 'warn', 'error'] as const,
    default: 'info'
  },
});

// env2.LOG_LEVEL has type: 'debug' | 'info' | 'warn' | 'error'
```

### Advanced Type Inference

```typescript
import type { InferEnv } from '@kawaaaas/lambda-env-schema';

const schema = {
  PORT: { type: 'number', default: 3000 },
  API_KEY: { type: 'string', required: true },
  DEBUG: { type: 'boolean', default: false },
} as const;

type Env = InferEnv<typeof schema>;
// { PORT: number; API_KEY: string; DEBUG: boolean }

function initializeApp(env: Env) {
  console.log('Starting on port:', env.PORT);
}

const env = createEnv(schema);
initializeApp(env); // ✅ Type-safe
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Type inference not working**

```typescript
// ❌ Bad: Missing 'as const'
const schema = {
  LOG_LEVEL: { type: 'string', enum: ['debug', 'info'] }
};

// ✅ Good: Use 'as const' for literal types
const schema = {
  LOG_LEVEL: { type: 'string', enum: ['debug', 'info'] as const }
} as const;
```

**Issue: Validation passes but value is undefined**

```typescript
// ❌ Problem: Optional without default
const env = createEnv({
  CACHE_TTL: { type: 'number' } // Can be undefined!
});

// ✅ Solution: Add default or check for undefined
const env = createEnv({
  CACHE_TTL: { type: 'number', default: 3600 }
});
```

**Issue: Array not splitting correctly**

```typescript
// Environment: TAGS=tag1,tag2,tag3

// ❌ Problem: Wrong separator
const env = createEnv({
  TAGS: { type: 'array', itemType: 'string', separator: ';' }
});

// ✅ Solution: Use correct separator (default is ',')
const env = createEnv({
  TAGS: { type: 'array', itemType: 'string' }
});
```

**Issue: AWS environment variables not available locally**

```typescript
const env = createEnv({
  TABLE_NAME: { type: 'string', required: true },
});

// AWS Lambda variables are undefined in local development
console.log(env.aws.functionName); // undefined locally

// ✅ Solution: Check before using
if (env.aws.functionName) {
  console.log('Running in Lambda:', env.aws.functionName);
}
```

---

## 🤝 Contributing

Contributions are welcome! Please check out the [contributing guidelines](../../CONTRIBUTING.md) in the main repository.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/kawaaaas/lambda-env-schema.git
cd lambda-env-schema

# Install dependencies
pnpm install

# Run tests
pnpm --filter lambda-env-schema test

# Build
pnpm --filter lambda-env-schema build
```

---

## 📄 License

MIT © [kawaaaas](https://github.com/kawaaaas)

---

## 🔗 Related Projects

- [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation with a broader scope
- [envalid](https://github.com/af/envalid) - Environment variable validation for Node.js
- [dotenv](https://github.com/motdotla/dotenv) - Load environment variables from .env files
- [AWS Lambda Powertools](https://github.com/awslabs/aws-lambda-powertools-typescript) - Suite of utilities for AWS Lambda

---

## 📮 Support

- 🐛 [Report a bug](https://github.com/kawaaaas/lambda-env-schema/issues/new?labels=bug)
- 💡 [Request a feature](https://github.com/kawaaaas/lambda-env-schema/issues/new?labels=enhancement)
- 💬 [Ask a question](https://github.com/kawaaaas/lambda-env-schema/discussions)

---

<div align="center">

**Made with ❤️ for AWS Lambda developers**

[⬆ Back to top](#lambda-env-schema)

</div>
