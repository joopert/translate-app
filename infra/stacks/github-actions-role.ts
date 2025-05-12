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
      // this role name is used in the github actions workflows, also in shared account cdk code
      roleName: "githubActionsRole",
      assumedBy: new iam.FederatedPrincipal(
        `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": repos, // TODO: this is not secure for a public repo.
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });
  }
}
