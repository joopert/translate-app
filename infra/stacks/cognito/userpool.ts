import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { config } from "../../config";
import { CrossAccountRoute53RecordSet } from "cdk-cross-account-route53";

interface UserPoolStackProps extends cdk.StackProps {
  hostedZone: route53.IHostedZone;
  certificate: acm.ICertificate;
}

export class UserPoolStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: UserPoolStackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, "UserPool", {
      //set scp for user pool delete in prod. And maybe also for deleting a user?
      // what if a user wants to delete themselves?
      // but we do not want our system to delete all kinds of users

      userPoolName: `${config.appName}-user-pool`,
      selfSignUpEnabled: true,
      signInCaseSensitive: true,
      userVerification: {
        emailSubject: "Verify your new account",
      },
      keepOriginal: {
        email: true,
      },
      deletionProtection: true,
      // customAttributes: {
      //   isAdmin: new cognito.StringAttribute({  // TODO: test if this is writable or not
      //     mutable: true,
      //   })
      // },

      signInAliases: {
        email: true, // only set email to make sure the username == email
      },
      // attributes items that are required at sign up. So in case we want phonenumber, first / lastname, we'll need to enable.
      // standardAttributes: {
      //   email: {
      //     required: true,
      //     mutable: true,
      //   },
      // },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      autoVerify: {
        email: true,
      },
      email: cognito.UserPoolEmail.withCognito(`hello@${config.domain}`),
    });

    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
      this,
      "GoogleProvider",
      {
        userPool: userPool,
        clientId: ssm.StringParameter.fromStringParameterName(
          this,
          "clientId",
          "/oauth/google/clientId"
        ).stringValue,
        clientSecret: ssm.StringParameter.fromStringParameterName(
          this,
          "clientSecret",
          "/oauth/google/clientSecret"
        ).stringValue,
        // clientSecretValue: SecretValue.ssmSecure('/oauth/google/clientSecret').toString(), // ssmSecure method does not work ... so this can still show in cloudformation. Unbelievable.
        scopes: ["profile", "email", "openid"], // Only standard OAuth scopes for Google
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
          emailVerified: cognito.ProviderAttribute.GOOGLE_EMAIL_VERIFIED,
          familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
          givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        },
      }
    );

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: userPool,
      generateSecret: true,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.COGNITO_ADMIN, // See docs for security implications
        ],
        callbackUrls: config.callbackUrls,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      accessTokenValidity: cdk.Duration.minutes(15),
      idTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30),
      enableTokenRevocation: true,
      preventUserExistenceErrors: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      userPoolClientName: "user-pool-client",
    });
    userPoolClient.node.addDependency(googleProvider);

    // Resource handler returned message: "Invalid request provided: AWS::Cognito::UserPoolDomain" (RequestToken: 956827dd-6582-b77b-eaf0-748de69e047c, HandlerErrorCode: InvalidRequest)
    //https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-add-custom-domain.html#cognito-user-pools-add-custom-domain-adding
    // simply, just create a A Record pointing to 127.0.0.1

    const crossAccountARecord = new CrossAccountRoute53RecordSet(
      this,
      "ARecord",
      {
        delegationRoleName: `${config.sharedServicesRoute53CrossAccountDomainRole}-${config.environment}`, // CDK deployment failed? See note above!
        delegationRoleAccount: config.sharedServicesAccountNumber,
        hostedZoneId: config.sharedServicesHostedZoneId,
        resourceRecordSets: [
          {
            Name: config.domain, // if domain is auth.domain.com, you need a ARecord on domain.com: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-add-custom-domain.html#cognito-user-pools-add-custom-domain-adding
            Type: "A",
            TTL: 300, // Time-to-live in seconds
            ResourceRecords: [
              {
                Value: "127.0.0.1",
              },
            ],
          },
        ],
      }
    );

    const userPoolDomain = userPool.addDomain("AuthDomain", {
      customDomain: {
        domainName: config.authDomain,
        certificate: props.certificate,
      },
    });
    userPoolDomain.node.addDependency(
      crossAccountARecord,
      userPoolClient,
      userPool
    );

    // new route53.CnameRecord(this, "UserPoolAliasRecord", {
    //   zone: props.hostedZone,
    //   recordName: config.authDomain,
    //   domainName: userPoolDomain.cloudFrontEndpoint, // TODO: it works, is this correct?
    // });

    new CrossAccountRoute53RecordSet(this, "AuthDomainToCloudFront", {
      delegationRoleName: `${config.sharedServicesRoute53CrossAccountDomainRole}-${config.environment}`,
      delegationRoleAccount: config.sharedServicesAccountNumber,
      hostedZoneId: config.sharedServicesHostedZoneId,
      resourceRecordSets: [
        {
          Name: config.authDomain,
          Type: "A",
          AliasTarget: {
            DNSName: userPoolDomain.cloudFrontEndpoint,
            HostedZoneId: "Z2FDTNDATAQYW2", // hardcoded by AWS: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-route53-recordset-aliastarget.html#cfn-route53-recordset-aliastarget-hostedzoneid
            EvaluateTargetHealth: false,
          },
        },
      ],
    });
  }
}
