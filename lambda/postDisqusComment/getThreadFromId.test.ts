import { getThreadFromId } from "./getThreadFromId";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ARTICLE_ID = "1234B";

describe("getThreadFromId", () => {
  it("throws an error if DISQUS_PUBLIC environment variable is missing", async () => {
    process.env.DISQUS_PUBLIC = "";

    await expect(getThreadFromId(ARTICLE_ID)).rejects.toThrow(
      "Missing environment variable: DISQUS_PUBLIC"
    );
  });

  it("throws an error if DISQUS_FORUM environment variable is missing", async () => {
    process.env.DISQUS_PUBLIC = "PUBLIC_KEY";
    process.env.DISQUS_FORUM = "";

    await expect(getThreadFromId(ARTICLE_ID)).rejects.toThrow(
      "Missing environment variable: DISQUS_FORUM"
    );
  });

  it("returns the thread id for the original version from the Disqus API", async () => {
    process.env.DISQUS_PUBLIC = "PUBLIC_KEY";
    process.env.DISQUS_FORUM = "pepweb";

    const MOCK_THREAD_ID = "1234";

    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        response: {
          id: MOCK_THREAD_ID,
        },
      },
    });

    const threadId = await getThreadFromId(ARTICLE_ID);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `https://disqus.com/api/3.0/threads/details.json?api_key=${
        process.env.DISQUS_PUBLIC
      }&thread=${encodeURIComponent(`ident:${ARTICLE_ID}`)}&forum=${
        process.env.DISQUS_FORUM
      }`
    );

    expect(threadId).toEqual(MOCK_THREAD_ID);
  });
});
