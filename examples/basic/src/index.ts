import { version } from '@kawaaaas/lambda-env-schema';
import 'dotenv/config';

console.log('lambda-env-schema version:', version);
console.log('process.env.PORT:', process.env.PORT);
console.log('process.env.API_KEY:', process.env.API_KEY);
console.log('process.env.DEBUG:', process.env.DEBUG);

// TODO: createEnv が実装されたら以下のように使用
// import { createEnv } from '@kawaaaas/lambda-env-schema';
//
// const env = createEnv({
//   PORT: { type: 'number', default: 3000 },
//   API_KEY: { type: 'string', required: true },
//   DEBUG: { type: 'boolean' }
// });
//
// console.log('PORT:', env.PORT);
// console.log('AWS Region:', env.aws.region);
