import * as dotenv from "dotenv";
dotenv.config();

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CommentStepFunction } from "./comment_step_function";
import { EmailIngestion } from "./ijp_email_ingestion";
import { InvokeStepFunction } from "./invoke_step_function";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import { IJPOWithdrawals } from "./ijpo_withdrawals";
import { CommentLambdas } from "./comment_lambdas";

export class IJPOAutomationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const emailIngestion = new EmailIngestion(this, id + "-Email");

    const commentLambdas = new CommentLambdas(this, id + "-Comment");

    const commentStepFunction = new CommentStepFunction(this, id + "-SF", {
      commentLambdas,
    });

    const invoke = new InvokeStepFunction(this, id + "-Invoke", {
      stateMachineArn: commentStepFunction.StateMachine.stateMachineArn,
    });

    new IJPOWithdrawals(this, id + "-Withdrawals");

    // Trigger step function invocation lambda from inbound email notification
    emailIngestion.Topic.addSubscription(
      new subs.LambdaSubscription(invoke.lambda)
    );
  }
}
