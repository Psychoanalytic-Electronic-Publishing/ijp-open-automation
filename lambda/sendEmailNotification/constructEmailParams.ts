import * as AWS from "aws-sdk";
import { StepFunctionError } from ".";

export const constructEmailParams = (
  errorEvent: StepFunctionError,
  manuscriptId?: string
): AWS.SES.SendEmailRequest => {
  if (!process.env.EMAIL_NOTIFICATION_RECIPIENT) {
    throw new Error(
      "Missing required environment variable: EMAIL_NOTIFICATION_RECIPIENT"
    );
  }

  if (!process.env.EMAIL_NOTIFICATION_SENDER) {
    throw new Error(
      "Missing required environment variable: EMAIL_NOTIFICATION_SENDER"
    );
  }

  return {
    Destination: {
      ToAddresses: [process.env.EMAIL_NOTIFICATION_RECIPIENT],
    },
    Message: {
      Body: {
        Text: {
          Data: errorEvent.Cause,
          Charset: "UTF-8",
        },
      },
      Subject: {
        Data: `Error posting comment for ${manuscriptId}`,
        Charset: "UTF-8",
      },
    },
    Source: process.env.EMAIL_NOTIFICATION_SENDER,
  };
};
