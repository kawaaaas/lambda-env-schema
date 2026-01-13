# Basic Example

This example demonstrates all major features of `lambda-env-schema`.

## Features Demonstrated

- ✅ **Type Coercion**: Automatic conversion from string to number, boolean, array, and JSON
- ✅ **Required vs Optional**: Fields with `required: true` or `default` values
- ✅ **Default Values**: Fallback values when environment variables are not set
- ✅ **AWS Lambda Environment**: Type-safe access to AWS Lambda environment variables
- ✅ **Error Handling**: Validation errors with secret masking
- ✅ **Edge Cases**: Empty strings, zero values, false booleans, empty arrays/objects

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the example:
   ```bash
   pnpm build
   ```

4. Run the example:
   ```bash
   pnpm start
   ```

## What to Expect

The example will:

1. **Validate environment variables** using the schema
2. **Display type-coerced values** (strings → numbers, booleans, arrays, JSON)
3. **Show AWS Lambda environment access** (will be `undefined` in local environment)
4. **Demonstrate error handling** by intentionally triggering a validation error
5. **Test edge cases** like empty strings, zero, false, empty arrays
6. **Show default values** for variables not set in `.env`

## Key Code Snippets

### Basic Usage

```typescript
import { createEnv } from '@kawaaaas/lambda-env-schema';

const env = createEnv({
  PORT: { type: 'number', default: 3000 },
  API_KEY: { type: 'string', required: true, secret: true },
  DEBUG: { type: 'boolean', default: false },
  ALLOWED_ORIGINS: { type: 'array', itemType: 'string', required: true },
  DATABASE_CONFIG: { type: 'json', required: true },
});

// Type-safe access with auto-completion
console.log(env.PORT); // number
console.log(env.API_KEY); // string
console.log(env.DEBUG); // boolean
console.log(env.ALLOWED_ORIGINS); // string[]
console.log(env.DATABASE_CONFIG); // unknown (can be typed with generics)
```

### AWS Lambda Environment

```typescript
// Access AWS Lambda environment variables in a type-safe way
console.log(env.aws.region); // string | undefined
console.log(env.aws.functionName); // string | undefined
console.log(env.aws.memoryLimitInMB); // string | undefined
```

### Error Handling

```typescript
try {
  const env = createEnv({
    REQUIRED_VAR: { type: 'string', required: true, secret: true },
  });
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.error(error.message); // Secrets are automatically masked
    console.error(error.errors); // Array of validation errors
  }
}
```

## Environment Variables

See `.env.example` for all available environment variables and their expected formats.

### AWS Lambda Runtime Variables

The following AWS Lambda environment variables are automatically available through `env.aws`:

- `AWS_REGION`: AWS region where the Lambda function is running
- `AWS_LAMBDA_FUNCTION_NAME`: Name of the Lambda function
- `AWS_LAMBDA_FUNCTION_VERSION`: Version of the Lambda function
- `AWS_LAMBDA_FUNCTION_MEMORY_SIZE`: Memory allocated to the function
- `AWS_LAMBDA_LOG_GROUP_NAME`: CloudWatch Logs group name
- `AWS_LAMBDA_LOG_STREAM_NAME`: CloudWatch Logs stream name

**Note**: In local development, these will be `undefined` unless you set them in your `.env` file to simulate the Lambda environment.

### Required Variables

- `API_KEY`: Your API key (will be masked in error messages)
- `MAX_CONNECTIONS`: Maximum number of connections (will be coerced to number)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `DATABASE_CONFIG`: JSON configuration for database connection
- `FEATURE_FLAGS`: JSON object with feature flags

### Optional Variables

- `PORT`: Server port (default: 3000)
- `DEBUG`: Enable debug mode (default: false)
- `LOG_LEVEL`: Logging level (default: 'info')
- `TIMEOUT_MS`: Request timeout in milliseconds
- `ENABLE_CACHE`: Enable caching
- `ENABLE_METRICS`: Enable metrics collection
- `TAGS`: Comma-separated list of tags
- `OPTIONAL_VALUE`: Optional string value
- `CACHE_TTL`: Cache time-to-live in seconds

## Learn More

- [Main Documentation](../../packages/lambda-env-schema/README.md)
- [API Reference](../../packages/lambda-env-schema/docs/api.md)
