import axios from "axios";
import { createThread } from "./createThread";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const data = {
  threadId: "1234",
  signature: "ABCD",
};

describe("createThread", () => {
  beforeEach(() => {
    process.env.DISQUS_PUBLIC = "PUBLIC_KEY";
    process.env.DISQUS_FORUM = "FORUM_NAME";
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("makes a valid request to the Disqus thread API", async () => {
    mockedAxios.post.mockResolvedValue({ status: 200 });

    await createThread(data.threadId, data.signature);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `https://disqus.com/api/3.0/threads/create.json?forum=${process.env.DISQUS_FORUM}&api_key=${process.env.DISQUS_PUBLIC}&title=${data.threadId}&identifier=${data.threadId}&remote_auth=${data.signature}`
    );
  });

  it("throws an error when DISQUS_PUBLIC variable is not set", async () => {
    process.env.DISQUS_PUBLIC = "";

    mockedAxios.post.mockResolvedValue({ status: 200 });

    await expect(createThread(data.threadId, data.signature)).rejects.toThrow(
      "Missing environment variable: DISQUS_PUBLIC"
    );
  });

  it("throws an error when DISQUS_FORUM variable is not set", async () => {
    process.env.DISQUS_FORUM = "";

    mockedAxios.post.mockResolvedValue({ status: 200 });

    await expect(createThread(data.threadId, data.signature)).rejects.toThrow(
      "Missing environment variable: DISQUS_FORUM"
    );
  });
});
