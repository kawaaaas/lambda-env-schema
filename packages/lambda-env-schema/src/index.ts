/**
 * lambda-env-schema - A lightweight environment variable validator for AWS Lambda.
 *
 * @packageDocumentation
 */

// =============================================================================
// Main API
// =============================================================================

export { createEnv } from './core/create-env';
export type { CreateEnvOptions, EnvResult } from './core/create-env';

// =============================================================================
// Schema Types
// =============================================================================

export type {
  ArraySchema,
  BooleanSchema,
  EnvSchema,
  InferEnv,
  JsonSchema,
  NumberSchema,
  // Schema item types for defining schemas
  StringSchema
} from './share/types';

// =============================================================================
// AWS Lambda Environment
// =============================================================================

export type { AWSLambdaEnv } from './aws/aws-env';

// =============================================================================
// Error Handling
// =============================================================================

export { EnvironmentValidationError } from './share/errors';
export type { ValidationError } from './share/errors';

// =============================================================================
// AWS Validators
// =============================================================================


// Service-specific Validators
export { isValidApiGatewayId } from './aws/api-gateway-validators';
// AWS Regions & Account
export {
  AWS_REGIONS, isValidAWSAccountId,
  isValidAWSRegion, type AWSRegion
} from './aws/aws-regions';
// Validation Types
export type {
  AWSValidationType,
  ValidationRule
} from './aws/aws-validation-types';
export { isValidCloudFrontDistId } from './aws/cloudfront-validators';
export {
  extractAccountIdFromDynamoDBArn,
  extractRegionFromDynamoDBArn,
  isValidDynamoDBTableArn,
  isValidDynamoDBTableName
} from './aws/dynamodb-validators';
export { isValidEventBusName } from './aws/eventbridge-validators';
export {
  extractAccountIdFromIAMArn,
  extractRegionFromIAMArn,
  isValidIAMRoleArn,
  isValidIAMUserArn
} from './aws/iam-validators';
export {
  extractAccountIdFromKMSKeyArn,
  extractRegionFromKMSKeyArn,
  isValidKMSKeyArn,
  isValidKMSKeyId
} from './aws/kms-validators';
export { isValidLambdaFunctionName } from './aws/lambda-validators';
export {
  extractRegionFromRDSEndpoint,
  isValidRDSClusterId,
  isValidRDSEndpoint
} from './aws/rds-validators';
export { isValidS3Arn, isValidS3BucketName } from './aws/s3-validators';
export {
  extractAccountIdFromSecretsManagerArn,
  extractRegionFromSecretsManagerArn,
  isValidSecretsManagerArn
} from './aws/secrets-manager-validators';
export {
  extractAccountIdFromSNSTopicArn,
  extractRegionFromSNSTopicArn,
  isValidSNSTopicArn
} from './aws/sns-validators';
export {
  extractAccountIdFromSQSQueueArn,
  extractAccountIdFromSQSQueueUrl,
  extractRegionFromSQSQueueArn,
  extractRegionFromSQSQueueUrl,
  isValidSQSQueueArn,
  isValidSQSQueueUrl
} from './aws/sqs-validators';
export { isValidSSMParameterName } from './aws/ssm-validators';
export {
  isValidEc2InstanceId,
  isValidSecurityGroupId,
  isValidSubnetId,
  isValidVpcId
} from './aws/vpc-validators';

