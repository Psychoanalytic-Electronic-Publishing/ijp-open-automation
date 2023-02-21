import { SESMessage } from "aws-lambda";
import { simpleParser } from "mailparser";

interface SESNotification extends SESMessage {
  content: string;
  notificationType: string;
}

interface Response {
  manuscriptId: string;
  consent: boolean;
  text: string;
}

const isSenderAllowed = (email: string) => {
  if (!process.env.EMAIL_WHITELIST) return false;

  const whitelist = process.env.EMAIL_WHITELIST.split(",");

  const domain = email.split("@")[1];

  return whitelist.includes(domain) || whitelist.includes(email);
};

export async function main(
  event: SESNotification
): Promise<Response | undefined> {
  console.log("Event", event);

  if (!isSenderAllowed(event.mail.source)) return;

  if (event.notificationType !== "Received") return;

  const { subject, text } = await simpleParser(event.content, {
    skipHtmlToText: true,
    skipImageLinks: true,
    skipTextToHtml: true,
  });

  if (!subject || !text) return;

  const splitSubject = subject.split("@");

  const manuscriptId = splitSubject[0];
  const optOutOfIJPO = splitSubject[1].toLowerCase();

  const consent = optOutOfIJPO === "yes" ? false : true;

  return {
    manuscriptId,
    consent,
    text,
  };
}
