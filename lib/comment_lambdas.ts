import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";

export class CommentLambdas extends Construct {
  public parseEmailNotification: NodejsFunction;
  public getArticleFromSolr: NodejsFunction;
  public postDisqusComment: NodejsFunction;
  public sendEmailNotification: NodejsFunction;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    if (
      !process.env.EMAIL_NOTIFICATION_RECIPIENT ||
      !process.env.COMMENT_EMAIL_ADDRESS ||
      !process.env.DISQUS_SECRET ||
      !process.env.DISQUS_PUBLIC ||
      !process.env.DISQUS_FORUM ||
      !process.env.PEP_API_BASE_URL ||
      !process.env.PEP_API_KEY ||
      !process.env.EMAIL_WHITELIST
    ) {
      throw new Error("Missing one or more required environment variable");
    }

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
          "/../lambda/comment/parseEmailNotification/index.ts"
        ),
        environment: {
          EMAIL_WHITELIST: process.env.EMAIL_WHITELIST,
        },
      }
    );

    const getArticleFromSolr = new NodejsFunction(
      this,
      "get-article-from-solr",
      {
        functionName: `${id}-fetch-article-id`,
        timeout: cdk.Duration.seconds(10),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(
          __dirname,
          "/../lambda/comment/getArticleFromSolr/index.ts"
        ),
        environment: {
          PEP_API_BASE_URL: process.env.PEP_API_BASE_URL,
          PEP_API_KEY: process.env.PEP_API_KEY,
        },
      }
    );

    const postDisqusComment = new NodejsFunction(this, "post-disqus-comment", {
      functionName: `${id}-post-disqus-comment`,
      timeout: cdk.Duration.seconds(3),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "main",
      entry: path.join(
        __dirname,
        "/../lambda/comment/postDisqusComment/index.ts"
      ),
      environment: {
        DISQUS_SECRET: process.env.DISQUS_SECRET,
        DISQUS_PUBLIC: process.env.DISQUS_PUBLIC,
        DISQUS_FORUM: process.env.DISQUS_FORUM,
      },
    });

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
          "/../lambda/comment/sendEmailNotification/index.ts"
        ),
        environment: {
          EMAIL_NOTIFICATION_RECIPIENT:
            process.env.EMAIL_NOTIFICATION_RECIPIENT,
          COMMENT_EMAIL_ADDRESS: process.env.COMMENT_EMAIL_ADDRESS,
        },
      }
    );

    const sendEmailPolicy = new iam.PolicyStatement({
      actions: ["ses:SendEmail", "ses:SendRawEmail"],
      resources: ["*"],
    });

    sendEmailNotification.addToRolePolicy(sendEmailPolicy);

    this.parseEmailNotification = parseEmailNotification;
    this.getArticleFromSolr = getArticleFromSolr;
    this.postDisqusComment = postDisqusComment;
    this.sendEmailNotification = sendEmailNotification;
  }
}
