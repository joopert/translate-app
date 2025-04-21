import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
// https://github.com/aws/aws-cdk/issues/31215
// cannot use cloudmap from ecs services. It is apparently not exposed.

export interface HttpApiStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  cloudmap: servicediscovery.INamespace;
  vpcLink: apigw.VpcLink;
  frontendService: ecs.Ec2Service;
  backendService: ecs.Ec2Service;
}

export class HttpApiStack extends cdk.Stack {
  public readonly httpApi: apigw.HttpApi;

  constructor(scope: Construct, id: string, props: HttpApiStackProps) {
    super(scope, id, props);

    // const x = new apigw.HttpIntegration(this, "asd", {
    //   httpApi: props.httpApi,
    //   integrationType: apigw.HttpIntegrationType.HTTP_PROXY,
    //   connectionType: apigw.HttpConnectionType.VPC_LINK,

    // });
    // const serviceDiscoveryInt =
    //   new integrations.HttpUrlIntegration(
    //     "HttpServiceDiscovery",
    //     "http://amfyapp.com",
    //     {
    //       vpcLink: props.vpcLink,

    //       //   method: apigw.HttpMethod.ANY,
    //     }
    //   );

    this.httpApi = new apigw.HttpApi(this, "ApiGw", {
      apiName: "amfyapp.com",
      createDefaultStage: true,
      disableExecuteApiEndpoint: true,
      //   defaultIntegration: serviceDiscoveryInt,

      //   defaultDomainMapping: {
      //     domainName: apigwDomainName,
      //   },
      //   defaultIntegration: new integrations.HttpServiceDiscoveryIntegration(
      //     "DefaultIntegration",
      //     serviceDiscoveryInt,
      //     { vpcLink: props.vpcLink }
      //   ),
      //   defaultIntegration: new integrations.HttpServiceDiscoveryIntegration(
      //     "DefaultIntegration",
      //     //@ts-ignore
      //     props.backendService.cloudMapService,
      //     {
      //       vpcLink: props.vpcLink,
      //     }
      //   ),
      // });
      // this.httpApi.addRoutes({
      //   path: "/api/v1/{proxy+}",
      //   integration: ,
      // });
    });
  }
}
