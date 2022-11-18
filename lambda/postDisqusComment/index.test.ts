import { main } from ".";
import { getThreadFromId } from "./getThreadFromId";
import { postComment } from "./postComment";

jest.mock("./getThreadFromId.ts", () => ({
  getThreadFromId: jest.fn().mockResolvedValue("thread1234"),
}));
jest.mock("./postComment.ts", () => ({
  postComment: jest.fn().mockResolvedValue(undefined),
}));

describe("postDisqusComment", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 3, 1));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("Posts a comment", async () => {
    const parsedEmailEvent = {
      articleId: "ijpopen.001.0001a",
      consent: "yes",
      text: "Hello, World!!!",
    } as any;

    process.env.DISQUS_SECRET = "SECRET_KEY";
    process.env.DISQUS_PUBLIC = "PUBLIC_KEY";
    process.env.DISQUS_FORUM = "pepweb";

    await main(parsedEmailEvent);

    expect(getThreadFromId).toHaveBeenCalledWith("ijpopen.001.0001a");
    expect(postComment).toHaveBeenCalledWith(
      parsedEmailEvent.text,
      "thread1234",
      "eyJpZCI6IjNjMTc0NmY2LWU2MzctNDJmYi04M2MwLTZiNGQ4OTE4MTUzZSIsInVzZXJuYW1lIjoiSUpQTyBPcGVuIENvbW1lbnRzIiwiZW1haWwiOiJwbGFjZWhvbGRlckBpanBfZW1haWwuY29tIn0= dc81b2301a433701318874c4d0b75d3d1aff7b7c 1585699200"
    );
  });
});
