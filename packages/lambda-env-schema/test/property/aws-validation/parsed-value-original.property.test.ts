import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseArn } from '../../../src/aws/arn-validators';
import { parseDynamoDBTableArn } from '../../../src/aws/dynamodb-validators';
import { parseIAMRoleArn } from '../../../src/aws/iam-validators';
import { parseKMSKeyArn } from '../../../src/aws/kms-validators';
import { parseLambdaFunctionArn } from '../../../src/aws/lambda-validators';
import { parseRDSEndpoint } from '../../../src/aws/rds-validators';
import { parseS3Arn, parseS3Uri } from '../../../src/aws/s3-validators';
import { parseSecretsManagerArn } from '../../../src/aws/secrets-manager-validators';
import { parseSNSTopicArn } from '../../../src/aws/sns-validators';
import {
  parseSQSQueueArn,
  parseSQSQueueUrl,
} from '../../../src/aws/sqs-validators';

describe('Parsed value original value property tests', () => {
  describe('Property 1: Parsed Value Contains Original Value', () => {
    // Simple generators using constantFrom for speed
    const awsRegion = fc.constantFrom(
      'us-east-1',
      'eu-west-1',
      'ap-southeast-1'
    );
    const awsAccountId = fc.constantFrom('123456789012', '987654321098');
    const simpleName = fc.constantFrom('test', 'example', 'demo');
    const simpleKey = fc.constantFrom(
      'file.txt',
      'data/test.json',
      'images/photo.png'
    );
    const keyId = fc.constantFrom(
      '12345678-1234-1234-1234-123456789012',
      'abcdef12-3456-7890-abcd-ef1234567890'
    );

    // Simple ARN/URL generators
    const validS3Arn = fc.oneof(
      simpleName.map((bucket) => `arn:aws:s3:::${bucket}`),
      fc
        .tuple(simpleName, simpleKey)
        .map(([bucket, key]) => `arn:aws:s3:::${bucket}/${key}`)
    );

    const validS3Uri = fc
      .tuple(simpleName, simpleKey)
      .map(([bucket, key]) => `s3://${bucket}/${key}`);

    const validSQSQueueUrl = fc
      .tuple(awsRegion, awsAccountId, simpleName)
      .map(
        ([region, accountId, queueName]) =>
          `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
      );

    const validSQSQueueArn = fc
      .tuple(awsRegion, awsAccountId, simpleName)
      .map(
        ([region, accountId, queueName]) =>
          `arn:aws:sqs:${region}:${accountId}:${queueName}`
      );

    const validSNSTopicArn = fc
      .tuple(awsRegion, awsAccountId, simpleName)
      .map(
        ([region, accountId, topicName]) =>
          `arn:aws:sns:${region}:${accountId}:${topicName}`
      );

    const validDynamoDBTableArn = fc
      .tuple(awsRegion, awsAccountId, simpleName)
      .map(
        ([region, accountId, tableName]) =>
          `arn:aws:dynamodb:${region}:${accountId}:table/${tableName}`
      );

    const validRDSEndpoint = awsRegion.map(
      (region) => `test-instance.abc123.${region}.rds.amazonaws.com`
    );

    const validLambdaFunctionArn = fc
      .tuple(awsRegion, awsAccountId, simpleName)
      .map(
        ([region, accountId, functionName]) =>
          `arn:aws:lambda:${region}:${accountId}:function:${functionName}`
      );

    const validKMSKeyArn = fc
      .tuple(awsRegion, awsAccountId, keyId)
      .map(
        ([region, accountId, keyId]) =>
          `arn:aws:kms:${region}:${accountId}:key/${keyId}`
      );

    const validSecretsManagerArn = fc
      .tuple(awsRegion, awsAccountId, simpleName)
      .map(
        ([region, accountId, secretName]) =>
          `arn:aws:secretsmanager:${region}:${accountId}:secret:${secretName}-AbCdEf`
      );

    const validIAMRoleArn = fc
      .tuple(awsAccountId, simpleName)
      .map(
        ([accountId, roleName]) => `arn:aws:iam::${accountId}:role/${roleName}`
      );

    const validGenericArn = fc
      .tuple(awsRegion, awsAccountId, simpleName)
      .map(
        ([region, accountId, resource]) =>
          `arn:aws:s3:${region}:${accountId}:${resource}`
      );

    it('S3 ARN parsed value contains original value', () => {
      fc.assert(
        fc.property(validS3Arn, (arn) => {
          const parsed = parseS3Arn(arn);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('S3 URI parsed value contains original value', () => {
      fc.assert(
        fc.property(validS3Uri, (uri) => {
          const parsed = parseS3Uri(uri);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(uri);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('SQS Queue URL parsed value contains original value', () => {
      fc.assert(
        fc.property(validSQSQueueUrl, (url) => {
          const parsed = parseSQSQueueUrl(url);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(url);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('SQS Queue ARN parsed value contains original value', () => {
      fc.assert(
        fc.property(validSQSQueueArn, (arn) => {
          const parsed = parseSQSQueueArn(arn);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('SNS Topic ARN parsed value contains original value', () => {
      fc.assert(
        fc.property(validSNSTopicArn, (arn) => {
          const parsed = parseSNSTopicArn(arn);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('DynamoDB Table ARN parsed value contains original value', () => {
      fc.assert(
        fc.property(validDynamoDBTableArn, (arn) => {
          const parsed = parseDynamoDBTableArn(arn);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('RDS Endpoint parsed value contains original value', () => {
      fc.assert(
        fc.property(validRDSEndpoint, (endpoint) => {
          const parsed = parseRDSEndpoint(endpoint);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(endpoint);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('Lambda Function ARN parsed value contains original value', () => {
      fc.assert(
        fc.property(validLambdaFunctionArn, (arn) => {
          const parsed = parseLambdaFunctionArn(arn);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('KMS Key ARN parsed value contains original value', () => {
      fc.assert(
        fc.property(validKMSKeyArn, (arn) => {
          const parsed = parseKMSKeyArn(arn);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('Secrets Manager ARN parsed value contains original value', () => {
      fc.assert(
        fc.property(validSecretsManagerArn, (arn) => {
          const parsed = parseSecretsManagerArn(arn);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('IAM Role ARN parsed value contains original value', () => {
      fc.assert(
        fc.property(validIAMRoleArn, (arn) => {
          const parsed = parseIAMRoleArn(arn);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('Generic ARN parsed value contains original value', () => {
      fc.assert(
        fc.property(validGenericArn, (arn) => {
          const parsed = parseArn(arn);
          expect(parsed).not.toBeNull();
          if (parsed) {
            expect(parsed.value).toBe(arn);
          }
        }),
        { numRuns: 20 }
      );
    });
  });
});
