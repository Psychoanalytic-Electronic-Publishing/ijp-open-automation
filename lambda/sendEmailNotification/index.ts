import * as AWS from "aws-sdk";
import { constructEmailParams } from "./constructEmailParams";

const ses = new AWS.SES();

export interface StepFunctionError {
  Cause: string;
  Error: string;
}

interface ErrorEvent {
  manuscriptId?: string;
  error: StepFunctionError;
}

export async function main(event: ErrorEvent) {
  console.log("Event", event);

  const params = constructEmailParams(event.error, event.manuscriptId);

  await ses.sendEmail(params).promise();
}
