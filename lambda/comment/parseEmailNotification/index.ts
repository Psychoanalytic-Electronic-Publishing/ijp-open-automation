import { SESMessage } from "aws-lambda";
import { simpleParser } from "mailparser";

interface SESNotification extends SESMessage {
  content: string;
  notificationType: string;
}

interface Response {
  action: string;
  subject?: string;
  text?: string;
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

  const { subject, text, to } = await simpleParser(event.content, {
    skipHtmlToText: true,
    skipImageLinks: true,
    skipTextToHtml: true,
  });

  if (!to) throw new Error("No from address");

  const action = event.mail.destination[0].split("@")[0];

  return {
    action,
    subject,
    text,
  };
}
