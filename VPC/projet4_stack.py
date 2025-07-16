from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput,
    Tags
)
from constructs import Construct

class Projet4Stack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Créer la VPC avec 2 AZs, 2 sous-réseaux publics + 2 privés
        vpc = ec2.Vpc(self, "VPC-projet-4",
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            nat_gateways=1
        )

        #  Ajouter des tags à toutes les ressources
        Tags.of(vpc).add("Projet", "PROJET-4")
        Tags.of(vpc).add("Environnement", "Dev")
        Tags.of(vpc).add("Owner", "GROUP-21003-21008-21027-21032")

        #  Exporter les IDs de la VPC et des sous-réseaux
        CfnOutput(self, "VpcId", value=vpc.vpc_id, export_name="VpcId")

        for i, subnet in enumerate(vpc.public_subnets):
            CfnOutput(self, f"PublicSubnet{i+1}Id", value=subnet.subnet_id, export_name=f"PublicSubnet{i+1}Id")

        for i, subnet in enumerate(vpc.private_subnets):
            CfnOutput(self, f"PrivateSubnet{i+1}Id", value=subnet.subnet_id, export_name=f"PrivateSubnet{i+1}Id")
