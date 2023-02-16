import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";

export class CommentStepFunction extends Construct {
  public StateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    if (
      !process.env.EMAIL_NOTIFICATION_RECIPIENT ||
      !process.env.INGESTION_EMAIL_ADDRESS ||
      !process.env.DISQUS_SECRET ||
      !process.env.DISQUS_PUBLIC ||
      !process.env.DISQUS_FORUM ||
      !process.env.PEP_API_BASE_URL ||
      !process.env.PEP_API_KEY ||
      !process.env.EMAIL_WHITELIST
    ) {
      throw new Error("Missing one or more required environment variable");
    }

    // PARSE SNS EMAIL NOTIFICATION
    const parseEmailNotification = new NodejsFunction(
      this,
      "parse-email-notification",
      {
        functionName: `${id}-parse-email-notification`,
        timeout: cdk.Duration.seconds(3),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(
          __dirname,
          "/../lambda/parseEmailNotification/index.ts"
        ),
        environment: {
          EMAIL_WHITELIST: process.env.EMAIL_WHITELIST,
        },
      }
    );

    const parseEmailNotificationTask = new tasks.LambdaInvoke(
      this,
      "Parse email notification",
      {
        lambdaFunction: parseEmailNotification,
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

    // FETCH ARTICLE ID FROM SOLR
    const getArticleFromSolr = new NodejsFunction(
      this,
      "get-article-from-solr",
      {
        functionName: `${id}-fetch-article-id`,
        timeout: cdk.Duration.seconds(10),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(__dirname, "/../lambda/getArticleFromSolr/index.ts"),
        environment: {
          PEP_API_BASE_URL: process.env.PEP_API_BASE_URL,
          PEP_API_KEY: process.env.PEP_API_KEY,
        },
      }
    );

    const getArticleFromSolrTask = new tasks.LambdaInvoke(
      this,
      "Get article from PEP-Web Solr instance",
      {
        lambdaFunction: getArticleFromSolr,
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
      environment: {
        DISQUS_SECRET: process.env.DISQUS_SECRET,
        DISQUS_PUBLIC: process.env.DISQUS_PUBLIC,
        DISQUS_FORUM: process.env.DISQUS_FORUM,
      },
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
        environment: {
          EMAIL_NOTIFICATION_RECIPIENT:
            process.env.EMAIL_NOTIFICATION_RECIPIENT,
          INGESTION_EMAIL_ADDRESS: process.env.INGESTION_EMAIL_ADDRESS,
        },
      }
    );

    // Create a policy statement to allow email sending
    const sendEmailPolicy = new iam.PolicyStatement({
      actions: ["ses:SendEmail", "ses:SendRawEmail"],
      resources: ["*"],
    });

    // Attach the policy to the Lambda
    sendEmailNotification.addToRolePolicy(sendEmailPolicy);

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
    const defintion = parseEmailNotificationTask
      .addCatch(notifyUnrecoverableTask, {
        resultPath: "$.error",
      })
      .next(
        hasIJPOConsent
          .when(
            sfn.Condition.booleanEquals("$.consent", true),
            getArticleFromSolrTask
              .addCatch(notifyUnrecoverableTask, {
                resultPath: "$.error",
              })
              .next(
                isVersionLive
                  .when(
                    sfn.Condition.stringEquals("$.articleId", ""),
                    wait1Day.next(getArticleFromSolrTask)
                  )
                  .otherwise(
                    postDisqusCommentTask
                      .addRetry({
                        errors: ["DisqusTimeout"],
                        interval: cdk.Duration.seconds(5),
                        maxAttempts: 3,
                      })
                      .addCatch(notifyUnrecoverableTask, {
                        resultPath: "$.error",
                      })
                      .next(end)
                  )
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
