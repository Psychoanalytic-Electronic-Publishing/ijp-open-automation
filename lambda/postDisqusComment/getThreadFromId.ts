import axios from "axios";
import { URLSearchParams } from "url";

interface ThreadDetailsResponse {
  response: {
    id: string;
  };
}

const COMMENT_ENDPOINT =
  "https://disqus.com/api/3.0/threads/details.json" as const;

export const getThreadFromId = async (id: string): Promise<string> => {
  if (!process.env.DISQUS_PUBLIC)
    throw new Error("Missing environment variable: DISQUS_PUBLIC");

  if (!process.env.DISQUS_FORUM)
    throw new Error("Missing environment variable: DISQUS_FORUM");

  const threadId = id.slice(0, -1) + "A"; // Use the original article ID to preserve comments across versions

  const params = {
    api_key: process.env.DISQUS_PUBLIC,
    thread: `ident:${threadId}`,
    forum: process.env.DISQUS_FORUM,
  };

  const searchParams = new URLSearchParams(params);

  const resp = await axios.get<ThreadDetailsResponse>(
    `${COMMENT_ENDPOINT}?${searchParams}`
  );

  return resp.data.response.id;
};
