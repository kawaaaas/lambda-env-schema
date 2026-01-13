# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-13

### Added

- Initial release
- `createEnv()` function for type-safe environment variable validation
- Automatic type coercion for `string`, `number`, `boolean`, `array`, and `json` types
- AWS Lambda environment variable support via `env.aws` namespace
- 30+ AWS-specific validators (ARNs, resource IDs, etc.)
- Parsed types for ARNs returning structured objects with extracted properties
- Secret masking in error logs
- `namingStrategy` option for camelCase key transformation
- `EnvironmentValidationError` for detailed validation error handling
- Validation options: `enum`, `pattern`, `min`, `max`, `minLength`, `maxLength`
- Zero dependencies for minimal cold start impact

[Unreleased]: https://github.com/kawaaaas/lambda-env-schema/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kawaaaas/lambda-env-schema/releases/tag/v0.1.0
