/**
 * lambda-env-schema - Basic Example
 *
 * This example demonstrates all major features of the library:
 * - Type coercion (string, number, boolean, array, json)
 * - Required vs optional fields
 * - Default values
 * - AWS Lambda environment access
 * - Error handling and masking
 */

import { createEnv } from '@kawaaaas/lambda-env-schema';
import 'dotenv/config';

console.log('='.repeat(60));
console.log('lambda-env-schema - Basic Example');
console.log('='.repeat(60));
console.log();

// =============================================================================
// Example 1: Basic Usage with Type Coercion
// =============================================================================

console.log('📦 Example 1: Basic Usage with Type Coercion');
console.log('-'.repeat(60));

const env = createEnv({
  // String type (no coercion needed)
  API_KEY: { type: 'string', required: true, secret: true },
  LOG_LEVEL: { type: 'string', default: 'info' },

  // Number type (automatic coercion from string)
  PORT: { type: 'number', default: 3000 },
  MAX_CONNECTIONS: { type: 'number', required: true },
  TIMEOUT_MS: { type: 'number' },

  // Boolean type (automatic coercion from string)
  DEBUG: { type: 'boolean', default: false },
  ENABLE_CACHE: { type: 'boolean' },
  ENABLE_METRICS: { type: 'boolean' },

  // Array type (automatic split by comma)
  ALLOWED_ORIGINS: { type: 'array', itemType: 'string', required: true },
  TAGS: { type: 'array', itemType: 'string', default: [] },

  // JSON type (automatic parse)
  DATABASE_CONFIG: { type: 'json', required: true },
  FEATURE_FLAGS: { type: 'json' },

  // Optional values
  OPTIONAL_VALUE: { type: 'string' },
  CACHE_TTL: { type: 'number' },
});

console.log('✅ Environment validated successfully!');
console.log();

// Type-safe access with auto-completion
console.log('String values:');
console.log(
  '  API_KEY:',
  typeof env.API_KEY === 'string'
    ? env.API_KEY.substring(0, 3) + '***'
    : env.API_KEY
); // Masked for security
console.log('  LOG_LEVEL:', env.LOG_LEVEL);
console.log();

console.log('Number values:');
console.log('  PORT:', env.PORT, '(type:', typeof env.PORT, ')');
console.log(
  '  MAX_CONNECTIONS:',
  env.MAX_CONNECTIONS,
  '(type:',
  typeof env.MAX_CONNECTIONS,
  ')'
);
console.log(
  '  TIMEOUT_MS:',
  env.TIMEOUT_MS,
  '(type:',
  typeof env.TIMEOUT_MS,
  ')'
);
console.log();

console.log('Boolean values:');
console.log('  DEBUG:', env.DEBUG, '(type:', typeof env.DEBUG, ')');
console.log(
  '  ENABLE_CACHE:',
  env.ENABLE_CACHE,
  '(type:',
  typeof env.ENABLE_CACHE,
  ')'
);
console.log(
  '  ENABLE_METRICS:',
  env.ENABLE_METRICS,
  '(type:',
  typeof env.ENABLE_METRICS,
  ')'
);
console.log();

console.log('Array values:');
console.log('  ALLOWED_ORIGINS:', env.ALLOWED_ORIGINS);
console.log('  TAGS:', env.TAGS);
console.log();

console.log('JSON values:');
console.log('  DATABASE_CONFIG:', env.DATABASE_CONFIG);
console.log('  FEATURE_FLAGS:', env.FEATURE_FLAGS);
console.log();

console.log('Optional values:');
console.log('  OPTIONAL_VALUE:', env.OPTIONAL_VALUE);
console.log('  CACHE_TTL:', env.CACHE_TTL);
console.log();

// =============================================================================
// Example 2: AWS Lambda Environment Access
// =============================================================================

console.log('📦 Example 2: AWS Lambda Environment Access');
console.log('-'.repeat(60));

console.log('AWS Lambda environment variables:');
console.log('  Region:', env.aws.region);
console.log('  Function Name:', env.aws.functionName);
console.log('  Function Version:', env.aws.functionVersion);
console.log('  Memory Size:', env.aws.memoryLimitInMB);
console.log('  Log Group:', env.aws.logGroupName);
console.log('  Log Stream:', env.aws.logStreamName);
console.log();

// =============================================================================
// Example 3: Error Handling
// =============================================================================

console.log('📦 Example 3: Error Handling');
console.log('-'.repeat(60));

try {
  // This will fail because MISSING_REQUIRED is required but not set
  createEnv({
    MISSING_REQUIRED: { type: 'string', required: true, secret: true },
  });
  console.log('❌ This should not be reached');
} catch (error) {
  if (error instanceof Error) {
    console.log('✅ Validation error caught as expected:');
    console.log('  Error name:', error.name);
    console.log('  Error message:', error.message);
    if ('errors' in error) {
      console.log('  Validation errors:', error.errors);
    }
  }
  console.log();
}

// =============================================================================
// Example 4: Type Coercion Edge Cases
// =============================================================================

console.log('📦 Example 4: Type Coercion Edge Cases');
console.log('-'.repeat(60));

// Set up test environment variables
process.env.TEST_EMPTY_STRING = '';
process.env.TEST_ZERO = '0';
process.env.TEST_FALSE = 'false';
process.env.TEST_EMPTY_ARRAY = '';
process.env.TEST_EMPTY_JSON = '{}';

const edgeCaseEnv = createEnv({
  TEST_EMPTY_STRING: { type: 'string' },
  TEST_ZERO: { type: 'number' },
  TEST_FALSE: { type: 'boolean' },
  TEST_EMPTY_ARRAY: { type: 'array', itemType: 'string' },
  TEST_EMPTY_JSON: { type: 'json' },
});

console.log('Edge case values:');
console.log('  Empty string:', JSON.stringify(edgeCaseEnv.TEST_EMPTY_STRING));
console.log('  Zero:', edgeCaseEnv.TEST_ZERO);
console.log('  False:', edgeCaseEnv.TEST_FALSE);
console.log('  Empty array:', edgeCaseEnv.TEST_EMPTY_ARRAY);
console.log('  Empty JSON:', edgeCaseEnv.TEST_EMPTY_JSON);
console.log();

// =============================================================================
// Example 5: Default Values
// =============================================================================

console.log('📦 Example 5: Default Values');
console.log('-'.repeat(60));

const defaultEnv = createEnv({
  WITH_DEFAULT: { type: 'string', default: 'default-value' },
  WITH_DEFAULT_NUMBER: { type: 'number', default: 42 },
  WITH_DEFAULT_BOOLEAN: { type: 'boolean', default: true },
  WITH_DEFAULT_ARRAY: {
    type: 'array',
    itemType: 'string',
    default: ['a', 'b', 'c'],
  },
  WITH_DEFAULT_JSON: { type: 'json', default: { key: 'value' } },
});

console.log('Default values (when env var is not set):');
console.log('  WITH_DEFAULT:', defaultEnv.WITH_DEFAULT);
console.log('  WITH_DEFAULT_NUMBER:', defaultEnv.WITH_DEFAULT_NUMBER);
console.log('  WITH_DEFAULT_BOOLEAN:', defaultEnv.WITH_DEFAULT_BOOLEAN);
console.log('  WITH_DEFAULT_ARRAY:', defaultEnv.WITH_DEFAULT_ARRAY);
console.log('  WITH_DEFAULT_JSON:', defaultEnv.WITH_DEFAULT_JSON);
console.log();

// =============================================================================
// Summary
// =============================================================================

console.log('='.repeat(60));
console.log('✨ All examples completed successfully!');
console.log('='.repeat(60));
console.log();
console.log('Key takeaways:');
console.log('  ✓ Type-safe environment variable access');
console.log('  ✓ Automatic type coercion (no manual parsing needed)');
console.log('  ✓ Built-in AWS Lambda environment support');
console.log('  ✓ Validation errors with secret masking');
console.log('  ✓ Zero dependencies, minimal bundle size');
console.log();
