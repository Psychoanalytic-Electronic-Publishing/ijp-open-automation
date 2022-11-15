import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const stepFunctions = new AWS.StepFunctions();

export async function main() {
  if (!process.env.STATE_MACHINE_ARN || !process.env.NAME_PREFIX) return;

  const testInput = {
    maxNumber: 10,
    numberToCheck: 5,
  };

  const params = {
    stateMachineArn: process.env.STATE_MACHINE_ARN,
    input: JSON.stringify(testInput),
    name: `${process.env.NAME_PREFIX}-${uuidv4()}`,
  };

  await stepFunctions.startExecution(params).promise();
}
