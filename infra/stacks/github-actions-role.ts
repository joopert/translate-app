import { Construct } from "constructs";
import { config } from "../config";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

interface GithubActionsRoleStackProps extends cdk.StackProps {}

export class GithubActionsRoleStack extends cdk.Stack {
  public readonly role: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props: GithubActionsRoleStackProps
  ) {
    super(scope, id, props);

    const repos = config.githubActionsRole.allowedRepositories.map(
      (repo) => `repo:${repo}:*`
    );

    new iam.OpenIdConnectProvider(this, "GithubProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    this.role = new iam.Role(this, "GithubActionsRole", {
      roleName: "githubActionsRole",
      assumedBy: new iam.FederatedPrincipal(
        `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": repos,
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });
  }
}
