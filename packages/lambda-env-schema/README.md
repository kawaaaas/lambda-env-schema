<div align="center">

# lambda-env-schema

**Zero-dependency, strictly typed environment variable validator tailored for AWS Lambda**

[![npm version](https://img.shields.io/npm/v/@kawaaaas/lambda-env-schema.svg)](https://www.npmjs.com/package/@kawaaaas/lambda-env-schema)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-%3C%201KB-brightgreen.svg)](https://bundlephobia.com/package/@kawaaaas/lambda-env-schema)

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

- 🪶 **Lightweight**: < 1KB minified - perfect for Lambda cold starts
- 🔒 **Type-safe**: Full TypeScript inference from schema to runtime
- 🚀 **Zero dependencies**: No external packages, minimal bundle size
- 🔐 **Secure by default**: Automatic secret masking in error logs
- ⚡ **Lambda-optimized**: Built-in AWS Lambda environment support
- 🎯 **Zero-config coercion**: Automatic type conversion from environment strings
- ✅ **Fail-fast**: Validation at cold start, not during request handling
- 🛡️ **Production-ready**: Battle-tested validation and error handling

### Comparison with Alternatives

| Feature | lambda-env-schema | Zod | envalid |
|---------|-------------------|-----|---------|
| Bundle size | **< 1KB** | ~13KB+ | ~5KB |
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
});

// Type-safe access with auto-completion
console.log(env.PORT); // number
console.log(env.API_KEY); // string
console.log(env.DEBUG); // boolean
console.log(env.ALLOWED_ORIGINS); // string[]
console.log(env.DATABASE_CONFIG); // unknown

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

Validate AWS resource identifiers:

```typescript
const env = createEnv({
  // Validate ARN format
  QUEUE_ARN: { 
    type: 'string', 
    validation: 'arn',
    required: true
  },
  
  // Validate ARN with scope (region/account)
  TABLE_ARN: { 
    type: 'string', 
    validation: 'arn',
    scope: { region: 'us-east-1', accountId: '123456789012' },
    required: true
  },
  
  // Validate S3 bucket name
  BUCKET_NAME: { 
    type: 'string', 
    validation: 's3-bucket',
    required: true
  },
});
```

### Error Handling

```typescript
import { createEnv, EnvironmentValidationError } from '@kawaaaas/lambda-env-schema';

try {
  const env = createEnv({
    API_KEY: { type: 'string', required: true, secret: true },
  });
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Errors:', error.errors);
    // error.errors: Array<{ key: string; message: string }>
  }
}
```

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

### Table of Contents

- [API Reference](#api-reference)
  - [createEnv()](#createenvschema-options)
  - [Schema Types](#schema-types)
  - [Type Inference](#type-inference)
- [Advanced Usage](#advanced-usage)
  - [Custom Validation](#custom-validation)
  - [Environment-specific Configuration](#environment-specific-configuration)
  - [Testing Strategies](#testing-strategies)
- [Error Handling](#error-handling-1)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## API Reference

### `createEnv(schema, options?)`

Creates a validated and typed environment object.

#### Parameters

- `schema`: `EnvSchema` - Schema definition for environment variables
- `options?`: `CreateEnvOptions` - Optional configuration
  - `namingStrategy?`: `'preserve' | 'camelCase'` - Naming strategy for keys (default: `'preserve'`)

#### Returns

`EnvResult<S, Strategy>` - Validated environment object with:
- All schema-defined variables (typed according to schema)
- `aws`: AWS Lambda environment variables

#### Throws

`EnvironmentValidationError` - When validation fails

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
  validation?: 'arn' | 's3-bucket' | 'lambda-function-name' | ...;
  scope?: { region?: string; accountId?: string };
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

// Validate environment at module initialization (cold start)
const env = createEnv({
  TABLE_NAME: { type: 'string', required: true },
  API_KEY: { type: 'string', required: true, secret: true },
  DEBUG: { type: 'boolean', default: false },
});

export const handler: APIGatewayProxyHandler = async (event) => {
  // Use validated environment variables
  console.log('Table:', env.TABLE_NAME);
  console.log('Debug mode:', env.DEBUG);
  
  // Access Lambda environment
  console.log('Function:', env.aws.functionName);
  console.log('Region:', env.aws.region);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' }),
  };
};
```

### With DynamoDB

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createEnv } from '@kawaaaas/lambda-env-schema';

const env = createEnv({
  TABLE_NAME: { type: 'string', required: true },
  AWS_REGION: { type: 'string', default: 'us-east-1' },
});

const client = new DynamoDBClient({ region: env.AWS_REGION });
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

// Type-safe environment check
if (env.NODE_ENV === 'production') {
  // Production-specific logic
}
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
  API_KEY: { type: 'string', required: true, secret: true }, // ✅
  DATABASE_PASSWORD: { type: 'string', required: true, secret: true }, // ✅
  TABLE_NAME: { type: 'string', required: true }, // ✅ Not a secret
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

---

## 🔷 TypeScript Support

This library is written in TypeScript and provides full type safety:

```typescript
const env = createEnv({
  PORT: { type: 'number', default: 3000 },
  API_KEY: { type: 'string', required: true },
  DEBUG: { type: 'boolean', default: false },
});

// ✅ Type-safe access
const port: number = env.PORT;
const apiKey: string = env.API_KEY;
const debug: boolean = env.DEBUG;

// ❌ TypeScript error: Property 'UNKNOWN' does not exist
const unknown = env.UNKNOWN;
```

---

## 🔧 Advanced Usage

### Custom Validation

Combine built-in validation with custom logic:

```typescript
const env = createEnv({
  API_ENDPOINT: { 
    type: 'string', 
    pattern: /^https:\/\//,
    required: true 
  },
});

// Additional custom validation
if (!env.API_ENDPOINT.endsWith('/api')) {
  throw new Error('API_ENDPOINT must end with /api');
}
```

### Environment-specific Configuration

```typescript
const baseSchema = {
  LOG_LEVEL: { type: 'string', default: 'info' },
  API_KEY: { type: 'string', required: true, secret: true },
} as const;

const developmentSchema = {
  ...baseSchema,
  DEBUG: { type: 'boolean', default: true },
  MOCK_EXTERNAL_APIS: { type: 'boolean', default: true },
} as const;

const productionSchema = {
  ...baseSchema,
  DEBUG: { type: 'boolean', default: false },
  SENTRY_DSN: { type: 'string', required: true, secret: true },
} as const;

const env = createEnv(
  process.env.NODE_ENV === 'production' 
    ? productionSchema 
    : developmentSchema
);
```

### Testing Strategies

```typescript
// test/env.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnv, EnvironmentValidationError } from '@kawaaaas/lambda-env-schema';

describe('Environment validation', () => {
  beforeEach(() => {
    // Reset environment
    delete process.env.API_KEY;
  });

  it('should validate required variables', () => {
    process.env.API_KEY = 'test-key';
    
    const env = createEnv({
      API_KEY: { type: 'string', required: true },
    });
    
    expect(env.API_KEY).toBe('test-key');
  });

  it('should throw on missing required variables', () => {
    expect(() => {
      createEnv({
        API_KEY: { type: 'string', required: true },
      });
    }).toThrow(EnvironmentValidationError);
  });
});
```

---

## 🚨 Error Handling

### Validation Errors

```typescript
import { createEnv, EnvironmentValidationError } from '@kawaaaas/lambda-env-schema';

try {
  const env = createEnv({
    PORT: { type: 'number', min: 1024, max: 65535, required: true },
    API_KEY: { type: 'string', required: true, secret: true },
  });
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.error('Environment validation failed:');
    console.error('Message:', error.message);
    console.error('Errors:', error.errors);
    
    // error.errors structure:
    // [
    //   { key: 'PORT', message: 'Environment variable "PORT" is required but not set' },
    //   { key: 'API_KEY', message: 'Environment variable "API_KEY" is required but not set' }
    // ]
    
    // In Lambda, this will prevent the function from starting
    process.exit(1);
  }
}
```

### Error Messages

The library provides clear, actionable error messages:

```typescript
// Missing required variable
// ❌ Environment variable "API_KEY" is required but not set

// Invalid type coercion
// ❌ Environment variable "PORT" must be a valid number, got "abc"

// Out of range
// ❌ Environment variable "PORT" must be between 1024 and 65535, got 80

// Pattern mismatch
// ❌ Environment variable "EMAIL" does not match the required pattern

// Invalid enum value
// ❌ Environment variable "LOG_LEVEL" must be one of: debug, info, warn, error

// Array length violation
// ❌ Environment variable "TAGS" must have at least 1 items, got 0
```

### Secret Masking

Sensitive values are automatically masked in error messages:

```typescript
// Environment: API_KEY=super-secret-key-12345

const env = createEnv({
  API_KEY: { type: 'string', required: true, secret: true },
  DATABASE_URL: { type: 'string', required: true, secret: true },
});

// If validation fails, the actual values are never logged:
// ❌ Environment variable "API_KEY" is required but not set
// (not: "API_KEY with value 'super-secret-key-12345' is invalid")
```

---

## 🎓 Best Practices

### 1. Validate at Module Initialization

**✅ Good: Validate during cold start**

```typescript
// handler.ts
import { createEnv } from '@kawaaaas/lambda-env-schema';

// Validation happens once during cold start
const env = createEnv({
  TABLE_NAME: { type: 'string', required: true },
  API_KEY: { type: 'string', required: true, secret: true },
});

export const handler = async (event) => {
  // Use validated env here
  console.log('Table:', env.TABLE_NAME);
};
```

**❌ Bad: Validate on every invocation**

```typescript
export const handler = async (event) => {
  // This runs on EVERY invocation - wasteful!
  const env = createEnv({
    TABLE_NAME: { type: 'string', required: true },
  });
};
```

### 2. Mark Secrets Appropriately

```typescript
const env = createEnv({
  // ✅ Secrets: API keys, passwords, tokens
  API_KEY: { type: 'string', required: true, secret: true },
  DATABASE_PASSWORD: { type: 'string', required: true, secret: true },
  JWT_SECRET: { type: 'string', required: true, secret: true },
  
  // ✅ Not secrets: table names, regions, feature flags
  TABLE_NAME: { type: 'string', required: true },
  AWS_REGION: { type: 'string', default: 'us-east-1' },
  ENABLE_CACHE: { type: 'boolean', default: false },
});
```

### 3. Use Type Inference

**✅ Good: Let TypeScript infer the type**

```typescript
const env = createEnv({
  PORT: { type: 'number', default: 3000 },
  API_KEY: { type: 'string', required: true },
});

// TypeScript knows: env.PORT is number, env.API_KEY is string
```

**❌ Bad: Manual type annotation (redundant)**

```typescript
const env: { PORT: number; API_KEY: string } = createEnv({
  PORT: { type: 'number', default: 3000 },
  API_KEY: { type: 'string', required: true },
});
```

### 4. Provide Defaults for Optional Values

```typescript
const env = createEnv({
  // ✅ Good: Clear default value
  TIMEOUT_MS: { type: 'number', default: 30000 },
  LOG_LEVEL: { type: 'string', default: 'info' },
  ENABLE_CACHE: { type: 'boolean', default: false },
  
  // ⚠️ Acceptable: Explicitly optional (use with caution)
  CACHE_TTL: { type: 'number' }, // number | undefined
  OPTIONAL_FEATURE: { type: 'string' }, // string | undefined
});
```

### 5. Use Enums for Fixed Values

```typescript
const env = createEnv({
  // ✅ Good: Type-safe enum
  LOG_LEVEL: { 
    type: 'string', 
    enum: ['debug', 'info', 'warn', 'error'] as const,
    default: 'info'
  },
  
  NODE_ENV: { 
    type: 'string', 
    enum: ['development', 'staging', 'production'] as const,
    default: 'development'
  },
});

// TypeScript knows the exact values
if (env.LOG_LEVEL === 'debug') { // ✅ Type-safe
  // ...
}
```

### 6. Organize by Feature

```typescript
// ✅ Good: Group related variables
const env = createEnv({
  // Database
  DB_HOST: { type: 'string', required: true },
  DB_PORT: { type: 'number', default: 5432 },
  DB_NAME: { type: 'string', required: true },
  DB_PASSWORD: { type: 'string', required: true, secret: true },
  
  // Cache
  CACHE_ENABLED: { type: 'boolean', default: false },
  CACHE_TTL: { type: 'number', default: 3600 },
  
  // External APIs
  STRIPE_API_KEY: { type: 'string', required: true, secret: true },
  SENDGRID_API_KEY: { type: 'string', required: true, secret: true },
});
```

### 7. Document Complex Schemas

```typescript
const env = createEnv({
  // API endpoint for external service
  // Format: https://api.example.com/v1
  API_ENDPOINT: { 
    type: 'string', 
    pattern: /^https:\/\/.+\/v\d+$/,
    required: true,
    description: 'External API endpoint (must be HTTPS with version)'
  },
  
  // Comma-separated list of allowed CORS origins
  // Example: https://app.example.com,https://admin.example.com
  ALLOWED_ORIGINS: { 
    type: 'array', 
    itemType: 'string',
    required: true,
    description: 'Allowed CORS origins'
  },
});
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Module not found" error**

```bash
# Make sure the package is installed
npm install @kawaaaas/lambda-env-schema

# Check your package.json
cat package.json | grep lambda-env-schema
```

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

console.log(env.CACHE_TTL); // undefined if not set

// ✅ Solution: Add default or check for undefined
const env = createEnv({
  CACHE_TTL: { type: 'number', default: 3600 }
});

// Or handle undefined
if (env.CACHE_TTL !== undefined) {
  // Use env.CACHE_TTL
}
```

**Issue: Array not splitting correctly**

```typescript
// Environment: TAGS=tag1,tag2,tag3

// ❌ Problem: Wrong separator
const env = createEnv({
  TAGS: { type: 'array', itemType: 'string', separator: ';' }
});
console.log(env.TAGS); // ['tag1,tag2,tag3'] - not split!

// ✅ Solution: Use correct separator (default is ',')
const env = createEnv({
  TAGS: { type: 'array', itemType: 'string' } // separator defaults to ','
});
console.log(env.TAGS); // ['tag1', 'tag2', 'tag3']
```

**Issue: JSON parsing fails**

```typescript
// Environment: CONFIG={"key":"value"}

// ✅ Make sure JSON is valid
const env = createEnv({
  CONFIG: { type: 'json', required: true }
});

// If parsing fails, check the JSON format:
// - Use double quotes, not single quotes
// - Escape special characters
// - Validate JSON with: echo $CONFIG | jq
```

### Lambda-specific Issues

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
} else {
  console.log('Running locally');
}
```

**Issue: Cold start validation failures**

```typescript
// If validation fails during cold start, Lambda won't start
// Check CloudWatch Logs for validation errors

// ✅ Solution: Test locally first
// 1. Create .env file with all required variables
// 2. Run locally: node dist/handler.js
// 3. Fix any validation errors before deploying
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
if (env2.LOG_LEVEL === 'debug') { // ✅ Type-safe
  // ...
}
```

### Advanced Type Inference

```typescript
import type { InferEnv } from '@kawaaaas/lambda-env-schema';

// Define schema
const schema = {
  PORT: { type: 'number', default: 3000 },
  API_KEY: { type: 'string', required: true },
  DEBUG: { type: 'boolean', default: false },
} as const;

// Infer type
type Env = InferEnv<typeof schema>;
// { PORT: number; API_KEY: string; DEBUG: boolean }

// Use in function signatures
function initializeApp(env: Env) {
  console.log('Starting on port:', env.PORT);
}

const env = createEnv(schema);
initializeApp(env); // ✅ Type-safe
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
