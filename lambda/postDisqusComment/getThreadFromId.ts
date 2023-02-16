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

  const params = {
    api_key: process.env.DISQUS_PUBLIC,
    thread: `ident:${id}`,
    forum: process.env.DISQUS_FORUM,
  };

  const searchParams = new URLSearchParams(params);

  const resp = await axios.get<ThreadDetailsResponse>(
    `${COMMENT_ENDPOINT}?${searchParams}`
  );

  return resp.data.response.id;
};
