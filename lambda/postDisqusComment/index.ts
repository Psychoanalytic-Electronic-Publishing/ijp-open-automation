import { DisqusData, generateSignature } from "./generateSignature";
import { getThreadFromId } from "./getThreadFromId";
import { postComment } from "./postComment";

const AUTOMATED_COMMENT_USER: DisqusData = {
  id: "3c1746f6-e637-42fb-83c0-6b4d8918153e",
  username: "IJPO Open Comments",
  email: "placeholder@ijp_email.com",
} as const;

export async function main(event: any) {
  console.log("Event", event);

  const signature = generateSignature(AUTOMATED_COMMENT_USER);

  const articleId = event.subject.split("@")[0].toLowerCase();

  const thread = await getThreadFromId(articleId);

  await postComment(event.text, thread, signature);
}
