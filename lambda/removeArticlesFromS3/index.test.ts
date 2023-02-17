import { main } from ".";

import { S3 } from "../../__mocks__/aws-sdk";

const s3 = new S3();

describe("removeArticlesFromS3", () => {
  const eventStub = {
    filesToRemove: ["test/1234C.xml", "test/1235B.xml", "test/1235A.xml"],
    articleId: "1234C",
  };

  beforeEach(() => {
    process.env.BUCKET_NAME = "test-bucket";
    s3.deleteObjects.mockClear();
  });

  it("throws an error when BUCKET_NAME variable is not set", async () => {
    process.env.BUCKET_NAME = "";

    await expect(main(eventStub)).rejects.toThrow(
      "Missing environment variable: BUCKET_NAME"
    );

    expect(s3.deleteObjects).toHaveBeenCalledTimes(0);
  });

  it("passes through the provided articleId", async () => {
    const result = await main(eventStub);

    expect(result.articleId).toBe(eventStub.articleId);
  });

  it("deletes the listed files from S3", async () => {
    await main(eventStub);

    expect(s3.deleteObjects).toHaveBeenCalledTimes(1);

    const params = s3.deleteObjects.mock.calls[0][0];

    expect(params.Bucket).toBe(process.env.BUCKET_NAME);
    expect(params.Delete.Objects).toEqual([
      {
        Key: "test/1234C.xml",
      },
      {
        Key: "test/1235B.xml",
      },
      {
        Key: "test/1235A.xml",
      },
    ]);
  });
});
