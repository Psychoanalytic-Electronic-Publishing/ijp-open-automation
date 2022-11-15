import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CommentStepFunction } from "./comment_step_function";
import { EmailIngestion } from "./ijp_email_ingestion";
import { InvokeStepFunction } from "./invoke_step_function";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

export class DisqusCommentServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const emailIngestion = new EmailIngestion(this, id + "-Email");

    const commentStepFunction = new CommentStepFunction(this, id + "-Comment");

    const invoke = new InvokeStepFunction(this, id + "-Invoke", {
      stateMachineArn: commentStepFunction.StateMachine.stateMachineArn,
    });

    // Trigger step function invocation lambda from inbound email notification
    emailIngestion.Topic.addSubscription(
      new subs.LambdaSubscription(invoke.lambda)
    );
  }
}
