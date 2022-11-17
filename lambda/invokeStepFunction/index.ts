import { SNSEvent } from "aws-lambda";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const stepFunctions = new AWS.StepFunctions();

export async function main(event: SNSEvent) {
  console.log("Event", event);

  if (!process.env.STATE_MACHINE_ARN)
    throw new Error("Missing environment variable: STATE_MACHINE_ARN");

  if (!process.env.NAME_PREFIX)
    throw new Error("Missing environment variable: NAME_PREFIX");

  const invocations = [];

  for (const notification of event.Records) {
    const params = {
      stateMachineArn: process.env.STATE_MACHINE_ARN,
      input: notification.Sns.Message,
      name: `${process.env.NAME_PREFIX}-${uuidv4()}`,
    };

    invocations.push(stepFunctions.startExecution(params).promise());
  }

  await Promise.all(invocations);
}
