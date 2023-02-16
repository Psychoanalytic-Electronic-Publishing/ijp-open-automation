import { AxiosError, AxiosResponse } from "axios";
import { main } from ".";
import { getThreadFromId } from "./getThreadFromId";
import { postComment } from "./postComment";

jest.mock("./getThreadFromId.ts", () => ({
  getThreadFromId: jest.fn().mockResolvedValue("thread1234"),
}));
jest.mock("./postComment.ts", () => ({
  postComment: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("./createThread.ts", () => ({
  createThread: jest.fn().mockResolvedValue("new-thread-id"),
}));

const parsedEmailEvent = {
  manuscriptId: "IJP-22-123",
  text: "Hello, World!!!",
  articleId: "IJPOPEN.001.0001C",
};

describe("postDisqusComment", () => {
  beforeEach(() => {
    process.env.DISQUS_SECRET = "SECRET_KEY";
    process.env.DISQUS_PUBLIC = "PUBLIC_KEY";
    process.env.DISQUS_FORUM = "pepweb";
  });

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 3, 1));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("Posts a comment", async () => {
    await main(parsedEmailEvent);

    expect(getThreadFromId).toHaveBeenCalledWith("ijpopen.001.0001a");
    expect(postComment).toHaveBeenCalledWith(
      parsedEmailEvent.text,
      "thread1234",
      "eyJpZCI6IjNjMTc0NmY2LWU2MzctNDJmYi04M2MwLTZiNGQ4OTE4MTUzZSIsInVzZXJuYW1lIjoiSUpQTyBPcGVuIENvbW1lbnRzIiwiZW1haWwiOiJwbGFjZWhvbGRlckBpanBfZW1haWwuY29tIn0= dc81b2301a433701318874c4d0b75d3d1aff7b7c 1585699200"
    );
  });

  it("Generates a thread ID to post to if one does not exist", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    getThreadFromId.mockRejectedValueOnce(
      new AxiosError("Mock not found", undefined, undefined, undefined, {
        status: 400,
        data: {
          response: "Invalid argument, 'thread': Unable to find thread",
        },
      } as AxiosResponse)
    );

    await main(parsedEmailEvent);

    expect(postComment).toHaveBeenCalledWith(
      parsedEmailEvent.text,
      "new-thread-id",
      "eyJpZCI6IjNjMTc0NmY2LWU2MzctNDJmYi04M2MwLTZiNGQ4OTE4MTUzZSIsInVzZXJuYW1lIjoiSUpQTyBPcGVuIENvbW1lbnRzIiwiZW1haWwiOiJwbGFjZWhvbGRlckBpanBfZW1haWwuY29tIn0= dc81b2301a433701318874c4d0b75d3d1aff7b7c 1585699200"
    );
  });
});
