import { AxiosError } from "axios";
import { DisqusData, generateSignature } from "./generateSignature";
import { getThreadFromId } from "./getThreadFromId";
import { postComment } from "./postComment";
import { createThread } from "./createThread";

interface Event {
  manuscriptId: string;
  articleId?: string;
  text: string;
}

const AUTOMATED_COMMENT_USER: DisqusData = {
  id: "3c1746f6-e637-42fb-83c0-6b4d8918153e",
  username: "IJPO Open Comments",
  email: "placeholder@ijp_email.com",
} as const;

const threadNotFound = (e: unknown) =>
  e instanceof AxiosError &&
  e.response?.data?.response.includes("Unable to find thread");

export async function main(event: Event) {
  if (!event.articleId) throw new Error("Missing expected articleId");

  const threadId = (event.articleId.slice(0, -1) + "A").toLowerCase(); // Use the original article ID to preserve comments across versions

  const signature = generateSignature(AUTOMATED_COMMENT_USER);

  let thread = "";

  try {
    thread = await getThreadFromId(threadId);
  } catch (e) {
    if (!threadNotFound(e)) {
      throw e;
    }

    thread = await createThread(threadId, signature);
  }

  await postComment(event.text, thread, signature);
}
