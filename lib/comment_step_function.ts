import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { CommentLambdas } from "./comment_lambdas";

interface Params {
  commentLambdas: CommentLambdas;
}
export class CommentStepFunction extends Construct {
  public StateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, params: Params) {
    super(scope, id);

    const {
      commentLambdas: {
        parseEmailNotification,
        getArticleFromSolr,
        postDisqusComment,
        sendEmailNotification,
      },
    } = params;

    const parseEmailNotificationTask = new tasks.LambdaInvoke(
      this,
      "Parse email notification",
      {
        lambdaFunction: parseEmailNotification,
        outputPath: "$.Payload",
      }
    );

    const wait1Day = new sfn.Wait(this, "Wait 1 Day", {
      time: sfn.WaitTime.duration(cdk.Duration.days(1)),
    });

    const hasIJPOConsent = new sfn.Choice(
      this,
      "Has IJPO consent been provided?"
    );

    const getArticleFromSolrTask = new tasks.LambdaInvoke(
      this,
      "Get article from PEP-Web Solr instance",
      {
        lambdaFunction: getArticleFromSolr,
        outputPath: "$.Payload",
      }
    );

    const isVersionLive = new sfn.Choice(
      this,
      "Is the version live on PEP-Web?"
    );

    const postDisqusCommentTask = new tasks.LambdaInvoke(
      this,
      "Post Disqus comment",
      {
        lambdaFunction: postDisqusComment,
        outputPath: "$.Payload",
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

    const end = new sfn.Succeed(this, "Success");

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

    this.StateMachine = new sfn.StateMachine(this, "StateMachine", {
      definition: defintion,
      stateMachineName: "IJPO-Automation",
    });
  }
}
