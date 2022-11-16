import { DisqusData, generateSignature } from "./generateSignature";

describe("generateSignature", () => {
  beforeAll(() => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2020, 3, 1));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("generates a valid Disqus SSO signature", () => {
    const user: DisqusData = {
      id: "3380ec0f-cae9-4927-b8d4-fc5d0fa012fd",
      username: "Test User",
      email: "test@test.com",
    };

    const signature = generateSignature(user, "SECRET_KEY");

    expect(signature).toBe(
      "eyJpZCI6IjMzODBlYzBmLWNhZTktNDkyNy1iOGQ0LWZjNWQwZmEwMTJmZCIsInVzZXJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0= 1df49f9f32fcd4bbba7d58684cf586d2c10f842b 1585695600"
    );
  });
});
