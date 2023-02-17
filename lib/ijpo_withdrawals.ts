import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";

export class IJPOWithdrawals extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    if (!process.env.BUCKET_NAME) {
      throw new Error("Missing one or more required environment variable");
    }

    const removeArticlesFromS3 = new NodejsFunction(
      this,
      "remove-articles-from-s3",
      {
        functionName: `${id}-remove-articles-from-s3`,
        timeout: cdk.Duration.seconds(5),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(__dirname, `/../lambda/removeArticlesFromS3/index.ts`),
        environment: {
          BUCKET_NAME: process.env.BUCKET_NAME,
        },
      }
    );

    const allowS3Delete = new iam.PolicyStatement({
      actions: ["s3:deleteObject"],
      resources: [`arn:aws:s3:::${process.env.BUCKET_NAME}/*`],
    });

    // Attach the policy to the Lambda
    removeArticlesFromS3.addToRolePolicy(allowS3Delete);
  }
}
