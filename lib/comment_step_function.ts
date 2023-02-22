import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { CommentLambdas } from "./comment_lambdas";
import { IJPOWithdrawals } from "./ijpo_withdrawals";

interface Params {
  commentLambdas: CommentLambdas;
  withdrawalLambdas: IJPOWithdrawals;
}
export class CommentStepFunction extends Construct {
  public StateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, params: Params) {
    super(scope, id);

    // Destructure the lambdas from the params
    const {
      commentLambdas: {
        parseEmailNotification,
        getArticleFromSolr,
        postDisqusComment,
        sendEmailNotification,
      },
      withdrawalLambdas: {
        fetchFileKeys,
        markFilesAsRemoved,
        generateWithdrawalXML,
      },
    } = params;

    // Define flow routing task
    const routeToFlowTask = new sfn.Choice(
      this,
      "Route to correct flow based on action"
    );

    // Define notification task
    const notifyUnrecoverableTask = new tasks.LambdaInvoke(
      this,
      "Send error email",
      {
        lambdaFunction: sendEmailNotification,
        outputPath: "$.Payload",
      }
    );

    // Define withdrawal tasks
    const fetchFileKeysTask = new tasks.LambdaInvoke(
      this,
      "Fetch file keys for article",
      {
        lambdaFunction: fetchFileKeys,
        outputPath: "$.Payload",
      }
    );

    const markFilesAsRemovedTask = new tasks.LambdaInvoke(
      this,
      "Mark files as removed",
      {
        lambdaFunction: markFilesAsRemoved,
        outputPath: "$.Payload",
      }
    );

    const generateWithdrawalXMLTask = new tasks.LambdaInvoke(
      this,
      "Generate and upload withdrawal XML",
      {
        lambdaFunction: generateWithdrawalXML,
        outputPath: "$.Payload",
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

    // Define parallel states for each action with a single branch to simplfiy error handling
    const disqusCommentContainer = new sfn.Parallel(this, "Post to Disqus", {
      resultPath: "$.Payload",
    });

    const withdrawalContainer = new sfn.Parallel(this, "Withdraw article", {
      resultPath: "$.Payload",
    });

    // Define withdrawal flow
    const withdrawArticleFlow = disqusCommentContainer
      .branch(
        fetchFileKeysTask
          .next(markFilesAsRemovedTask)
          .next(generateWithdrawalXMLTask)
      )
      .addCatch(notifyUnrecoverableTask, {
        resultPath: "$.error",
      });

    // Define comment flow
    const disqusCommentFlow = withdrawalContainer
      .branch(
        hasIJPOConsent.when(
          sfn.Condition.booleanEquals("$.consent", true),
          getArticleFromSolrTask.next(
            isVersionLive
              .when(
                sfn.Condition.stringEquals("$.articleId", ""),
                wait1Day.next(getArticleFromSolrTask)
              )
              .otherwise(
                postDisqusCommentTask.addRetry({
                  errors: ["DisqusTimeout"],
                  interval: cdk.Duration.seconds(5),
                  maxAttempts: 3,
                })
              )
          )
        )
      )
      .addCatch(notifyUnrecoverableTask, {
        resultPath: "$.error",
      });

    // Create step function definition
    const defintion = parseEmailNotificationTask.next(
      routeToFlowTask
        .when(
          sfn.Condition.stringEquals("$.action", "withdraw"),
          withdrawArticleFlow
        )
        .when(
          sfn.Condition.stringEquals("$.action", "comment"),
          disqusCommentFlow
        )
        .otherwise(new sfn.Succeed(this, "No action required"))
    );

    this.StateMachine = new sfn.StateMachine(this, "StateMachine", {
      definition: defintion,
      stateMachineName: "IJPO-Automation",
    });
  }
}
