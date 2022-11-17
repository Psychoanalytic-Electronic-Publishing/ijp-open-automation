import * as AWS from "aws-sdk";
import { constructEmailParams } from "./constructEmailParams";

const ses = new AWS.SES();

interface StepFunctionError {
  Error: string;
  Cause: string;
}

export async function main(event: StepFunctionError) {
  console.log("Event", event);

  const params = constructEmailParams(event);

  await ses.sendEmail(params).promise();
}
