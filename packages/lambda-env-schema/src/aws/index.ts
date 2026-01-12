/**
 * AWS validators subpath export.
 *
 * This module provides AWS-specific validation functions that can be imported
 * separately from the main package to enable tree-shaking.
 *
 * @example
 * ```typescript
 * import { isValidS3BucketName, isValidAWSRegion } from '@kawaaaas/lambda-env-schema/aws';
 *
 * if (isValidS3BucketName(bucketName)) {
 *   // ...
 * }
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// AWS Regions & Account
// =============================================================================

export {
    AWS_REGIONS, isValidAWSAccountId,
    isValidAWSRegion, type AWSRegion
} from './aws-regions';

// =============================================================================
// Validation Types
// =============================================================================

export type {
    AWSValidationType,
    ValidationRule,
    ValidationScope
} from './aws-validation-types';

// =============================================================================
// Service-specific Validators
// =============================================================================

// API Gateway
export { isValidApiGatewayId } from './api-gateway-validators';

// CloudFront
export { isValidCloudFrontDistId } from './cloudfront-validators';

// DynamoDB
export {
    extractAccountIdFromDynamoDBArn,
    extractRegionFromDynamoDBArn,
    isValidDynamoDBTableArn,
    isValidDynamoDBTableName
} from './dynamodb-validators';

// EventBridge
export { isValidEventBusName } from './eventbridge-validators';

// IAM
export {
    extractAccountIdFromIAMArn,
    extractRegionFromIAMArn,
    isValidIAMRoleArn,
    isValidIAMUserArn
} from './iam-validators';

// KMS
export {
    extractAccountIdFromKMSKeyArn,
    extractRegionFromKMSKeyArn,
    isValidKMSKeyArn,
    isValidKMSKeyId
} from './kms-validators';

// Lambda
export { isValidLambdaFunctionName } from './lambda-validators';

// RDS
export {
    extractRegionFromRDSEndpoint,
    isValidRDSClusterId,
    isValidRDSEndpoint
} from './rds-validators';

// S3
export { isValidS3Arn, isValidS3BucketName } from './s3-validators';

// Secrets Manager
export {
    extractAccountIdFromSecretsManagerArn,
    extractRegionFromSecretsManagerArn,
    isValidSecretsManagerArn
} from './secrets-manager-validators';

// SNS
export {
    extractAccountIdFromSNSTopicArn,
    extractRegionFromSNSTopicArn,
    isValidSNSTopicArn
} from './sns-validators';

// SQS
export {
    extractAccountIdFromSQSQueueArn,
    extractAccountIdFromSQSQueueUrl,
    extractRegionFromSQSQueueArn,
    extractRegionFromSQSQueueUrl,
    isValidSQSQueueArn,
    isValidSQSQueueUrl
} from './sqs-validators';

// SSM
export { isValidSSMParameterName } from './ssm-validators';

// VPC & EC2
export {
    isValidEc2InstanceId,
    isValidSecurityGroupId,
    isValidSubnetId,
    isValidVpcId
} from './vpc-validators';

// =============================================================================
// Scoped Validation
// =============================================================================

export {
    formatScopeError,
    supportsScope,
    validateScope
} from './scoped-validation';
export type { ScopeValidationResult } from './scoped-validation';

