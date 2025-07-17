import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, 'MonAppRepository', {
      repositoryName: 'project4-repository',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🎯 Ajouter des tags au dépôt ECR
    cdk.Tags.of(repository).add('Project', 'PROJET-4');
    cdk.Tags.of(repository).add('Owner', 'Yemame');
    cdk.Tags.of(repository).add('Environment', 'Dev');
    cdk.Tags.of(repository).add('Service', 'ECR');
  }
}
