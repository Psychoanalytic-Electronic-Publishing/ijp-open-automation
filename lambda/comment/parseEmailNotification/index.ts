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

  if (!isSenderAllowed(event.mail.source))
    throw new Error("Sender not allowed");

  if (event.notificationType !== "Received") return;

  const { subject, text, to } = await simpleParser(event.content, {
    skipHtmlToText: true,
    skipImageLinks: true,
    skipTextToHtml: true,
  });

  if (!subject) throw new Error("No subject");

  if (!to) throw new Error("No from address");

  const action = event.mail.destination[0].split("@")[0];

  // Convert everything after @ to lowercase
  const subjectWithNormalisedConsent = subject.replace(/(@)(\S)/g, (s) =>
    s.toLowerCase()
  );

  return {
    action,
    subject: subjectWithNormalisedConsent,
    text,
  };
}
