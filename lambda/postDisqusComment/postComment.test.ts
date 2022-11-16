import axios from "axios";
import { postComment } from "./postComment";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("postComment", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("makes a valid request to the Disqus comment API", async () => {
    process.env.DISQUS_PUBLIC = "PUBLIC_KEY";

    mockedAxios.post.mockResolvedValue({ status: 200 });

    const data = {
      message: "Hello",
      threadId: "1234",
      signature: "ABCD",
    };

    await postComment(data.message, data.threadId, data.signature);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `https://disqus.com/api/3.0/posts/create.json?message=${data.message}&api_key=${process.env.DISQUS_PUBLIC}&thread=${data.threadId}&remote_auth=${data.signature}`
    );
  });

  it("throws an error when DISQUS_PUBLIC variable is not set", async () => {
    process.env.DISQUS_PUBLIC = "";

    mockedAxios.post.mockResolvedValue({ status: 200 });

    const data = {
      message: "Hello",
      threadId: "1234",
      signature: "ABCD",
    };

    await expect(
      postComment(data.message, data.threadId, data.signature)
    ).rejects.toThrow("Missing environment variable: DISQUS_PUBLIC");
  });
});
