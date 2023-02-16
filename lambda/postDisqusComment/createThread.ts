import axios from "axios";
import { URLSearchParams } from "url";

interface CreateThreadResponse {
  response: {
    id: string;
  };
}

const CREATE_THREAD_ENDPOINT =
  "https://disqus.com/api/3.0/threads/create.json" as const;

export const createThread = async (threadId: string, signature: string) => {
  if (!process.env.DISQUS_PUBLIC)
    throw new Error("Missing environment variable: DISQUS_PUBLIC");

  if (!process.env.DISQUS_FORUM)
    throw new Error("Missing environment variable: DISQUS_FORUM");

  const params = {
    forum: process.env.DISQUS_FORUM,
    api_key: process.env.DISQUS_PUBLIC,
    title: threadId,
    identifier: threadId,
    remote_auth: signature,
  };

  const searchParams = new URLSearchParams(params);

  return await axios.post<CreateThreadResponse>(
    `${CREATE_THREAD_ENDPOINT}?${searchParams}`
  );
};
