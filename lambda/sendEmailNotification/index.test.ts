import { main } from ".";
import { SES } from "../../__mocks__/aws-sdk";

const ses = new SES();

describe("sendEmailNotification", () => {
  const errorEvent = {
    manuscriptId: "IJP-22-123",
    error: {
      Error: "AxiosError",
      Cause:
        '{"errorType":"AxiosError","errorMessage":"Request failed with status code 400","trace":["AxiosError: Request failed with status code 400","    at settle (/var/task/index.js:15673:12)","    at IncomingMessage.handleStreamEnd (/var/task/index.js:16579:11)","    at IncomingMessage.emit (node:events:539:35)","    at endReadableNT (node:internal/streams/readable:1345:12)","    at processTicksAndRejections (node:internal/process/task_queues:83:21)"]}',
    },
  };

  it("sends an email notification via SES", async () => {
    process.env.EMAIL_NOTIFICATION_RECIPIENT = "recipient@test.com";
    process.env.EMAIL_NOTIFICATION_SENDER = "sender@test.com";

    await main(errorEvent);

    expect(ses.sendEmail).toHaveBeenCalledWith({
      Destination: { ToAddresses: [process.env.EMAIL_NOTIFICATION_RECIPIENT] },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: errorEvent.error.Cause,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `Error posting comment for ${errorEvent.manuscriptId}`,
        },
      },
      Source: process.env.EMAIL_NOTIFICATION_SENDER,
    });
  });
});
