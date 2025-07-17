// bin/ecr.ts

import * as cdk from 'aws-cdk-lib';
import { EcrStack } from '../lib/ecr-stack';

const app = new cdk.App();

new EcrStack(app, 'EcrStack', {
  env: {
    account: '385776610522',  
    region: 'eu-west-3',      
  },
});
