import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as ses from "aws-cdk-lib/aws-ses";
import * as actions from "aws-cdk-lib/aws-ses-actions";

export class EmailIngestion extends Construct {
  public Topic = new sns.Topic(this, "Topic");

  constructor(scope: Construct, id: string) {
    super(scope, id);

    if (!process.env.RECIPIENT_EMAIL) {
      throw new Error("Missing required environment variable: RECIPIENT_EMAIL");
    }

    const ruleSet = new ses.ReceiptRuleSet(this, "RuleSet");

    // Create a rule for the recipient email address
    const awsRule = ruleSet.addRule("Rule", {
      recipients: [process.env.RECIPIENT_EMAIL],
    });

    // Saves the received email to the S3 bucket
    awsRule.addAction(
      new actions.Sns({
        topic: this.Topic,
      })
    );
  }
}
