import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class CommentStepFunction extends Construct {
  public StateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // DETERMINE IJPO CONSENT STATUS
    const determineConsentStatus = new NodejsFunction(
      this,
      "determine-ijpo-consent-status",
      {
        functionName: `${id}-consent-status`,
        timeout: cdk.Duration.seconds(3),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(
          __dirname,
          "/../lambda/determineConsentStatus/index.ts"
        ),
      }
    );

    const determineConsentStatusTask = new tasks.LambdaInvoke(
      this,
      "Check for IJPO consent",
      {
        lambdaFunction: determineConsentStatus,
        outputPath: "$.Payload",
      }
    );

    // SLEEP FOR ONE DAY
    const wait1Day = new sfn.Wait(this, "Wait 1 Day", {
      time: sfn.WaitTime.duration(cdk.Duration.days(1)),
    });

    // CHECK IJPO CONSENT STATUS
    const hasIJPOConsent = new sfn.Choice(
      this,
      "Has IJPO consent been provided?"
    );

    // CHECK IJPO ARTICLE VERSION STATUS
    const determineVersionStatus = new NodejsFunction(
      this,
      "determine-ijpo-version-status",
      {
        functionName: `${id}-version-status`,
        timeout: cdk.Duration.seconds(3),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(
          __dirname,
          "/../lambda/determineVersionStatus/index.ts"
        ),
      }
    );

    const determineVersionStatusTask = new tasks.LambdaInvoke(
      this,
      "Check if the IJPO article version is live on PEP-Web",
      {
        lambdaFunction: determineVersionStatus,
        outputPath: "$.Payload",
      }
    );

    // BRANCH BASED ON VERSION STATUS
    const isVersionLive = new sfn.Choice(
      this,
      "Is the version live on PEP-Web?"
    );

    // POST DISQUS COMMENT
    const postDisqusComment = new NodejsFunction(this, "post-disqus-comment", {
      functionName: `${id}-post-disqus-comment`,
      timeout: cdk.Duration.seconds(3),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "main",
      entry: path.join(__dirname, "/../lambda/postDisqusComment/index.ts"),
    });

    const postDisqusCommentTask = new tasks.LambdaInvoke(
      this,
      "Post Disqus comment",
      {
        lambdaFunction: postDisqusComment,
        outputPath: "$.Payload",
      }
    );

    // NOTIFY ON UNRECOVERABLE ERROR
    const sendEmailNotification = new NodejsFunction(
      this,
      "send-email-notification",
      {
        functionName: `${id}-send-email-notification`,
        timeout: cdk.Duration.seconds(3),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(
          __dirname,
          "/../lambda/sendEmailNotification/index.ts"
        ),
      }
    );

    const notifyUnrecoverableTask = new tasks.LambdaInvoke(
      this,
      "Send error email",
      {
        lambdaFunction: sendEmailNotification,
        outputPath: "$.Payload",
      }
    );

    // SUCCESS END STATE
    const end = new sfn.Succeed(this, "Success");

    // WORKFLOW DEFINTION
    const defintion = determineConsentStatusTask.next(
      hasIJPOConsent
        .when(
          sfn.Condition.booleanEquals("$.hasConsent", true),
          determineVersionStatusTask.next(
            isVersionLive
              .when(
                sfn.Condition.booleanEquals("$.isLive", true),
                postDisqusCommentTask
                  .addRetry({
                    errors: ["DisqusTimeout"],
                    interval: cdk.Duration.seconds(5),
                    maxAttempts: 3,
                  })
                  .addCatch(notifyUnrecoverableTask)
                  .next(end)
              )
              .otherwise(wait1Day.next(determineConsentStatusTask))
          )
        )
        .otherwise(end)
    );

    // Create the statemachine
    this.StateMachine = new sfn.StateMachine(this, "StateMachine", {
      definition: defintion,
      stateMachineName: "disqusCommentStateMachine",
    });
  }
}
