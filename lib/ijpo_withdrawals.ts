import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
export class IJPOWithdrawals extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    if (
      !process.env.BUCKET_NAME ||
      !process.env.S3_PDF_PREFIX ||
      !process.env.S3_XML_PREFIX ||
      !process.env.REMOVAL_MESSAGE
    ) {
      throw new Error("Missing one or more required environment variable");
    }

    const fetchFileKeys = new NodejsFunction(this, "fetch-file-keys", {
      functionName: `${id}-fetch-file-keys`,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "main",
      entry: path.join(__dirname, `/../lambda/fetchFileKeys/index.ts`),
      environment: {
        BUCKET_NAME: process.env.BUCKET_NAME,
        S3_PDF_PREFIX: process.env.S3_PDF_PREFIX,
        S3_XML_PREFIX: process.env.S3_XML_PREFIX,
      },
    });

    const allowS3List = new iam.PolicyStatement({
      actions: ["s3:ListBucket"],
      resources: [
        `arn:aws:s3:::${process.env.BUCKET_NAME}`,
        `arn:aws:s3:::${process.env.BUCKET_NAME}/*`,
      ],
    });

    // Attach the policy to the Lambda
    fetchFileKeys.addToRolePolicy(allowS3List);

    const markFilesAsRemoved = new NodejsFunction(
      this,
      "mark-files-as-removed",
      {
        functionName: `${id}-mark-files-as-removed`,
        timeout: cdk.Duration.seconds(5),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(__dirname, `/../lambda/markFilesAsRemoved/index.ts`),
        environment: {
          BUCKET_NAME: process.env.BUCKET_NAME,
        },
      }
    );

    const markFilesAsRemovedS3Policy = new iam.PolicyStatement({
      actions: [
        "s3:deleteObject",
        "s3:putObject",
        "s3:putObjectAcl",
        "s3:getObject",
      ],
      resources: [`arn:aws:s3:::${process.env.BUCKET_NAME}/*`],
    });

    // Attach the policy to the Lambda
    markFilesAsRemoved.addToRolePolicy(markFilesAsRemovedS3Policy);

    const generateWithdrawalXML = new NodejsFunction(
      this,
      "generate-withdrawal-xml",
      {
        functionName: `${id}-generate-withdrawal-xml`,
        timeout: cdk.Duration.seconds(5),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "main",
        entry: path.join(
          __dirname,
          `/../lambda/generateWithdrawalXML/index.ts`
        ),
        environment: {
          BUCKET_NAME: process.env.BUCKET_NAME,
          REMOVAL_MESSAGE: process.env.REMOVAL_MESSAGE,
        },
      }
    );

    const generateWithdrawalXMLS3Policy = new iam.PolicyStatement({
      actions: ["s3:putObject", "s3:putObjectAcl", "s3:getObject"],
      resources: [`arn:aws:s3:::${process.env.BUCKET_NAME}/*`],
    });

    // Attach the policy to the Lambda
    generateWithdrawalXML.addToRolePolicy(generateWithdrawalXMLS3Policy);
  }
}
