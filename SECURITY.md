# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT open a public GitHub issue** for security vulnerabilities
2. Send an email to [security@example.com](mailto:security@example.com) with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 7 days
- **Resolution Timeline**: We aim to resolve critical issues within 30 days
- **Disclosure**: We will coordinate with you on public disclosure timing

### Security Best Practices

When using `lambda-env-schema`:

1. **Mark sensitive variables as secrets**: Use `secret: true` for API keys, passwords, and tokens
2. **Validate at cold start**: Call `createEnv()` at module initialization, not in handlers
3. **Use environment-specific schemas**: Different validation rules for dev/staging/production
4. **Review error logs**: Ensure no sensitive data leaks through validation errors

## Security Features

This library includes built-in security features:

- **Secret Masking**: Variables marked with `secret: true` are never logged in error messages
- **Fail-Fast Validation**: Invalid configurations fail immediately at cold start
- **Type Safety**: TypeScript ensures type-safe access to environment variables

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who report valid vulnerabilities.
