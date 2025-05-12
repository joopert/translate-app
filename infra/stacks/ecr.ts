import * as ecr from "aws-cdk-lib/aws-ecr";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { config } from "../config";

export class EcrStack extends cdk.Stack {
  public readonly backendRepo: ecr.IRepository;
  public readonly frontendRepo: ecr.IRepository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.backendRepo = ecr.Repository.fromRepositoryAttributes(
      this,
      "BackendRepo",
      {
        repositoryName: `${config.appName}-backend`,
        repositoryArn: `arn:aws:ecr:${this.region}:${config.sharedServicesAccountNumber}:repository/${config.appName}-backend`,
      }
    );

    this.frontendRepo = ecr.Repository.fromRepositoryAttributes(
      this,
      "FrontendRepo",
      {
        repositoryName: `${config.appName}-frontend`,
        repositoryArn: `arn:aws:ecr:${this.region}:${config.sharedServicesAccountNumber}:repository/${config.appName}-frontend`,
      }
    );
  }
}
