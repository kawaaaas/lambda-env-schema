# Contributing to lambda-env-schema

Thank you for your interest in contributing to lambda-env-schema! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- **Node.js**: 16 or later
- **pnpm**: 8 or later
- **Git**: Latest version

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/lambda-env-schema.git
cd lambda-env-schema
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/kawaaaas/lambda-env-schema.git
```

## Development Setup

### Install Dependencies

```bash
# Install all dependencies
pnpm install
```

### Build the Library

```bash
# Build the lambda-env-schema package
pnpm --filter lambda-env-schema build
```

### Run Tests

```bash
# Run all tests
pnpm --filter lambda-env-schema test

# Run tests in watch mode
pnpm --filter lambda-env-schema test:watch

# Run specific test file
pnpm --filter lambda-env-schema test -- src/core/create-env.test.ts
```

### Run Examples

```bash
# Navigate to the example
cd examples/basic

# Copy environment file
cp .env.example .env

# Install dependencies (if not already installed)
pnpm install

# Build and run
pnpm build
pnpm start
```

## Project Structure

```
lambda-env-schema/
├── .husky/                    # Git hooks
├── .kiro/                     # Kiro AI configuration (Japanese docs)
│   └── steering/              # Development guidelines
├── packages/
│   └── lambda-env-schema/     # Main library package
│       ├── src/               # Source code
│       │   ├── core/          # Core functionality (createEnv)
│       │   ├── aws/           # AWS Lambda environment support
│       │   ├── share/         # Shared types and utilities
│       │   └── index.ts       # Public API exports
│       ├── test/              # Test files
│       ├── dist/              # Build output (generated)
│       ├── package.json       # Package configuration
│       ├── tsconfig.json      # TypeScript configuration
│       └── vitest.config.ts   # Test configuration
├── examples/
│   └── basic/                 # Basic usage example
├── biome.json                 # Biome configuration (linting/formatting)
├── pnpm-workspace.yaml        # pnpm workspace configuration
├── tsconfig.base.json         # Base TypeScript configuration
├── README.md                  # Project README
└── CONTRIBUTING.md            # This file
```

### Key Directories

- **`packages/lambda-env-schema/src/`**: Main source code
  - `core/`: Core validation and type inference logic
  - `aws/`: AWS Lambda-specific functionality
  - `share/`: Shared types, errors, and utilities
- **`packages/lambda-env-schema/test/`**: Test files (mirrors src structure)
- **`examples/`**: Example projects demonstrating library usage
- **`.kiro/steering/`**: Development guidelines (in Japanese)

## Development Workflow

### Branch Naming Convention

We follow a simple branch naming convention aligned with [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>/<short-description>
```

**Branch Types:**
- `feat/` - New features (e.g., `feat/custom-validators`)
- `fix/` - Bug fixes (e.g., `fix/array-coercion`)
- `docs/` - Documentation changes (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/error-handling`)
- `test/` - Test additions or updates (e.g., `test/edge-cases`)
- `chore/` - Maintenance tasks (e.g., `chore/update-deps`)

### 1. Create a Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create a branch (use type prefix matching your change)
git checkout -b feat/your-feature-name
git checkout -b fix/issue-description
git checkout -b docs/update-readme
```

### 2. Make Changes

- Write code following the [Code Style Guidelines](#code-style-guidelines)
- Add tests for new features or bug fixes
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run tests
pnpm --filter lambda-env-schema test

# Run linter
pnpm --filter lambda-env-schema lint

# Build to ensure no errors
pnpm --filter lambda-env-schema build
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat: add support for custom validators"
git commit -m "fix: correct type inference for optional arrays"
git commit -m "docs: update API reference for new features"
git commit -m "test: add tests for edge cases in number coercion"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feat/your-feature-name
```

Then create a pull request on GitHub.

## Code Style Guidelines

### Language Policy

- **Code**: English (comments, JSDoc, variable names, function names)
- **Documentation**: 
  - `.kiro/` files: Japanese
  - README, CONTRIBUTING, etc.: English
- **Commit messages**: English

### TypeScript

- Use strict type checking
- Prefer `type` over `interface` for type aliases
- Use `const` assertions for literal types
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// ✅ Good
const schema = {
  LOG_LEVEL: { type: 'string', enum: ['debug', 'info'] as const }
} as const;

type Config = {
  port: number;
  host: string;
};

// ❌ Bad
const schema = {
  LOG_LEVEL: { type: 'string', enum: ['debug', 'info'] }
};

interface Config {
  port: number;
  host: string;
}
```

### JSDoc Comments

Follow standard JSDoc conventions:

```typescript
/**
 * Creates a typed environment configuration from the given schema.
 * 
 * @param schema - The environment variable schema definition
 * @param options - Optional configuration options
 * @returns A typed environment object with validated values
 * @throws {EnvironmentValidationError} When validation fails
 * 
 * @example
 * ```typescript
 * const env = createEnv({
 *   PORT: { type: 'number', default: 3000 },
 *   API_KEY: { type: 'string', required: true }
 * });
 * ```
 */
export function createEnv<S extends EnvSchema>(
  schema: S,
  options?: CreateEnvOptions
): EnvResult<S> {
  // ...
}
```

### Code Formatting

We use Biome for linting and formatting:

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### File Naming

- Use kebab-case for file names: `create-env.ts`, `aws-env.ts`
- Test files: `*.test.ts`
- Type files: `types.ts`, `errors.ts`

## Testing

### Testing Philosophy

- Write tests for all new features
- Write tests for bug fixes to prevent regressions
- Test edge cases and error conditions
- Keep tests focused and readable

### Test Structure

```typescript
// ✅ Good: Clear, descriptive test names
describe('createEnv', () => {
  describe('number coercion', () => {
    it('converts valid numeric strings to numbers', () => {
      process.env.PORT = '3000';
      const env = createEnv({
        PORT: { type: 'number', required: true },
      });
      expect(env.PORT).toBe(3000);
      expect(typeof env.PORT).toBe('number');
    });
    
    it('throws validation error for non-numeric strings', () => {
      process.env.PORT = 'abc';
      expect(() => {
        createEnv({
          PORT: { type: 'number', required: true },
        });
      }).toThrow(EnvironmentValidationError);
    });
  });
});

// ❌ Bad: Unclear test names, requirement numbers
describe('Requirement 1.1: number coercion', () => {
  it('validates requirement 1.1.1', () => {
    // ...
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm --filter lambda-env-schema test

# Run tests in watch mode
pnpm --filter lambda-env-schema test:watch

# Run specific test file
pnpm --filter lambda-env-schema test -- src/core/create-env.test.ts

# Run with coverage
pnpm --filter lambda-env-schema test -- --coverage
```

### Test Environment

- Tests use vitest
- Environment variables are set/unset in `beforeEach`/`afterEach` hooks
- Use property-based testing (fast-check) for complex validation logic

## Submitting Changes

### Pull Request Guidelines

1. **Title**: Use conventional commit format
   - `feat: add custom validator support`
   - `fix: correct array coercion for empty strings`

2. **Description**: Include:
   - What changes were made
   - Why the changes were necessary
   - Any breaking changes
   - Related issues (if any)

3. **Checklist**:
   - [ ] Tests pass locally
   - [ ] Code follows style guidelines
   - [ ] Documentation updated (if needed)
   - [ ] Commit messages follow conventional commits
   - [ ] No breaking changes (or clearly documented)

### Pull Request Template

```markdown
## Description
Brief description of changes

## Motivation
Why are these changes needed?

## Changes
- Change 1
- Change 2

## Breaking Changes
None / List breaking changes

## Related Issues
Closes #123
```

### Review Process

1. Automated checks will run (tests, linting)
2. Maintainers will review your code
3. Address any feedback
4. Once approved, your PR will be merged

## Release Process

Releases are managed by maintainers:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag
4. Push to GitHub
5. Publish to npm

```bash
# Version bump
pnpm --filter lambda-env-schema version patch  # or minor, major

# Build
pnpm --filter lambda-env-schema build

# Publish
cd packages/lambda-env-schema
npm publish
```

## Questions?

- **Issues**: [GitHub Issues](https://github.com/kawaaaas/lambda-env-schema/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kawaaaas/lambda-env-schema/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to lambda-env-schema! 🎉
