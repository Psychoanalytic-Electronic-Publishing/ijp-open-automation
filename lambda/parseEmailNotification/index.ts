import { SESMessage } from "aws-lambda";
import { simpleParser } from "mailparser";

interface SESNotification extends SESMessage {
  content: string;
  notificationType: string;
}

interface Response {
  articleId: string;
  consent: string;
  text: string;
}

export async function main(
  event: SESNotification
): Promise<Response | undefined> {
  console.log("Event", event);

  if (event.notificationType !== "Received") return;

  const { subject, text } = await simpleParser(event.content, {
    skipHtmlToText: true,
    skipImageLinks: true,
    skipTextToHtml: true,
  });

  if (!subject || !text) return;

  const splitSubject = subject.split("@");

  const articleId = splitSubject[0].toLowerCase();
  const consent = splitSubject[1].toLowerCase();

  return {
    articleId,
    consent,
    text,
  };
}
