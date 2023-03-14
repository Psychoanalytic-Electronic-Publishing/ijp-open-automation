const MOCK_UUID = "cf29e381-25f3-44c6-b82f-693c1d596941";
jest.mock("uuid", () => ({ v4: () => MOCK_UUID }));

import { SNSEvent } from "aws-lambda";
import { main } from ".";
import { StepFunctions } from "../../../__mocks__/aws-sdk";

const sf = new StepFunctions();

describe("invokeStepFunction", () => {
  const eventStub: SNSEvent = {
    Records: [
      {
        EventSource: "aws:sns",
        EventVersion: "1.0",
        EventSubscriptionArn:
          "arn:aws:sns:us-east-1:286790923970:DisqusCommentServiceStack-DisqusCommentServiceStackEmailTopic99687142-BWeyvXWJLmJT:3ca5dc5d-ba88-4c7c-ad5f-cb772a661fa0",
        Sns: {
          Message: JSON.stringify({
            notificationType: "Received",
            content:
              "Date: Wed, 16 Nov 2022 17:37:42 +0000\r\nTo: recipient@example.com\r\nFrom: Amazon Web Services <no-reply-aws@amazon.com>\r\nSubject: Amazon SES Setup Notification\r\n\r\nHello,\r\n\r\nYou received this message because you attempted to set up Amazon SES to deliver emails to this SNS topic.\r\n\r\nPlease note that the rule that you configured to deliver emails to this SNS topic is only valid if the entire setup process is successful. For more information about\r\nsetting up email-receiving rules, see the Amazon SES Developer Guide at http://docs.aws.amazon.com/ses/latest/DeveloperGuide/Welcome.html .\r\n\r\nThank you for using Amazon SES!\r\n\r\nThe Amazon SES Team\n",
          }),
        },
      },
      {
        EventSource: "aws:sns",
        EventVersion: "1.0",
        EventSubscriptionArn:
          "arn:aws:sns:us-east-1:286790923970:DisqusCommentServiceStack-DisqusCommentServiceStackEmailTopic99687142-BWeyvXWJLmJT:3ca5dc5d-ba88-4c7c-ad5f-cb772a661fa0",
        Sns: {
          Message: JSON.stringify({
            notificationType: "Received",
            content:
              "Date: Wed, 16 Nov 2022 17:37:42 +0000\r\nTo: recipient@example.com\r\nFrom: Amazon Web Services <no-reply-aws@amazon.com>\r\nSubject: Second email\r\n\r\nHello,\r\n\r\nYou received this message because you attempted to set up Amazon SES to deliver emails to this SNS topic.\r\n\r\nPlease note that the rule that you configured to deliver emails to this SNS topic is only valid if the entire setup process is successful. For more information about\r\nsetting up email-receiving rules, see the Amazon SES Developer Guide at http://docs.aws.amazon.com/ses/latest/DeveloperGuide/Welcome.html .\r\n\r\nThank you for using Amazon SES!\r\n\r\nThe Amazon SES Team\n",
          }),
        },
      },
    ],
  } as SNSEvent;

  it("throws an error when STATE_MACHINE_ARN variable is not set", async () => {
    process.env.STATE_MACHINE_ARN = "";
    process.env.NAME_PREFIX = "Comments";

    await expect(main(eventStub)).rejects.toThrow(
      "Missing environment variable: STATE_MACHINE_ARN"
    );

    expect(sf.startExecution).toHaveBeenCalledTimes(0);
  });

  it("throws an error when NAME_PREFIX variable is not set", async () => {
    process.env.STATE_MACHINE_ARN =
      "arn:aws:states:us-east-1:111122223333:stateMachine:HelloWorld-StateMachine";
    process.env.NAME_PREFIX = "";

    await expect(main(eventStub)).rejects.toThrow(
      "Missing environment variable: NAME_PREFIX"
    );

    expect(sf.startExecution).toHaveBeenCalledTimes(0);
  });

  it("executes the state machine with the correct input paramters", async () => {
    process.env.STATE_MACHINE_ARN =
      "arn:aws:states:us-east-1:111122223333:stateMachine:HelloWorld-StateMachine";
    process.env.NAME_PREFIX = "Comments";

    await main(eventStub);

    expect(sf.startExecution).toHaveBeenNthCalledWith(1, {
      input: eventStub.Records[0].Sns.Message,
      stateMachineArn: process.env.STATE_MACHINE_ARN,
      name: `${process.env.NAME_PREFIX}-${MOCK_UUID}`,
    });

    expect(sf.startExecution).toHaveBeenLastCalledWith({
      input: eventStub.Records[1].Sns.Message,
      stateMachineArn: process.env.STATE_MACHINE_ARN,
      name: `${process.env.NAME_PREFIX}-${MOCK_UUID}`,
    });

    expect(sf.startExecution).toHaveBeenCalledTimes(2);
  });
});
