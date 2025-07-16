// ✅ Version corrigée des deux fichiers dans une seule stack (si ECS et ALB sont dans la même stack)

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';

export class AlbConfigStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'ImportedVPC', {
      vpcId: 'vpc-0cc4e0a8f59f1538a'
    });

    // Cluster ECS
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc: vpc,
      clusterName: 'Projet4Clusterr'
    });

    // Repo ECR
    const repository = ecr.Repository.fromRepositoryName(this, 'EcrRepo', 'project4-repository');

    const logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Tâche Fargate
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'AppTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const container = taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'App',
        logGroup: logGroup,
      }),
      environment: {
        NODE_ENV: 'production',
      },
    });

    container.addPortMappings({
      containerPort: 80,
    });

    // SG pour l'ALB
    const albSg = new ec2.SecurityGroup(this, 'AlbSG', {
      vpc,
      description: 'Allow HTTP from anywhere',
      allowAllOutbound: true,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');

    // SG pour ECS
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsServiceSG', {
      vpc,
      description: 'SG pour ECS Fargate',
      allowAllOutbound: true,
    });
    ecsSecurityGroup.addIngressRule(albSg, ec2.Port.tcp(80), 'Allow ALB to reach ECS');

    // Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'AppALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
    });

    const listener = lb.addListener('AppListener', {
      port: 80,
      open: true,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'AppTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    listener.addTargetGroups('TG', {
      targetGroups: [targetGroup],
    });

    // Fargate Service attache au TG
    const service = new ecs.FargateService(this, 'FargateService', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      assignPublicIp: false,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      serviceName: 'MonServiceApp',
    });

    service.attachToApplicationTargetGroup(targetGroup);

    const scalableTarget = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 5,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScalingPolicy', {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: lb.loadBalancerDnsName,
      description: 'Public URL of the Application Load Balancer',
    });
  }
}
