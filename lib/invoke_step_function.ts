import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import * as sns from "aws-cdk-lib/aws-sns";

interface InvokeStepFunctionParams {
  stateMachineArn: string;
}

export class InvokeStepFunction extends Construct {
  public lambda: NodejsFunction;

  constructor(scope: Construct, id: string, params: InvokeStepFunctionParams) {
    super(scope, id);

    const { stateMachineArn } = params;

    // Lambda to trigger state machine when email added to S3
    const invokeStepFunction = new NodejsFunction(
      this,
      "invoke-step-function",
      {
        timeout: cdk.Duration.seconds(3),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(__dirname, `/../lambda/invokeStepFunction/index.ts`),
        environment: {
          // Pass in the comment state machine to invoke
          STATE_MACHINE_ARN: stateMachineArn,
          NAME_PREFIX: "IJP-Comment",
        },
      }
    );

    // Create a policy statement to allow state machine invokation
    const invokeCommentStepFunctionPolicy = new iam.PolicyStatement({
      actions: ["states:StartExecution"],
      resources: [stateMachineArn],
    });

    // Attach the policy to the Lambda
    invokeStepFunction.addToRolePolicy(invokeCommentStepFunctionPolicy);

    this.lambda = invokeStepFunction;
  }
}
