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

  if (!process.env.INGESTION_EMAIL_ADDRESS) {
    throw new Error(
      "Missing required environment variable: INGESTION_EMAIL_ADDRESS"
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
    Source: process.env.INGESTION_EMAIL_ADDRESS,
  };
};
