import axios from "axios";
import { URLSearchParams } from "url";

const COMMENT_ENDPOINT =
  "https://disqus.com/api/3.0/posts/create.json" as const;

export const postComment = async (
  message: string,
  thread: string,
  signature: string
) => {
  if (!process.env.DISQUS_PUBLIC)
    throw new Error("Missing environment variable: DISQUS_PUBLIC");

  const params = {
    message,
    api_key: process.env.DISQUS_PUBLIC,
    thread,
    remote_auth: signature,
  };

  const searchParams = new URLSearchParams(params);

  await axios.post(`${COMMENT_ENDPOINT}?${searchParams}`);
};
