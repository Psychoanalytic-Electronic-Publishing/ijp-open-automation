import { main } from ".";

import { S3 } from "../../../__mocks__/aws-sdk";

const s3 = new S3();

describe("removeArticlesFromS3", () => {
  const eventStub = {
    keys: [
      "test/1234A(bKBD3).xml",
      "test/1235A(bEXP_ARCH1).xml",
      "test/1235A.pdf",
    ],
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

  it("creates bRemoved copies of the PDFs and KBD3 XMLs", async () => {
    await main(eventStub);

    expect(s3.copyObject).toHaveBeenCalledTimes(2);

    expect(s3.copyObject.mock.calls).toEqual([
      [
        {
          Bucket: process.env.BUCKET_NAME,
          CopySource: "test-bucket/test/1234A(bKBD3).xml",
          Key: "test/1234A(bRemoved).xml",
        },
      ],
      [
        {
          Bucket: process.env.BUCKET_NAME,
          CopySource: "test-bucket/test/1235A.pdf",
          Key: "test/1235A(bRemoved).pdf",
        },
      ],
    ]);
  });

  it("deletes the original files", async () => {
    await main(eventStub);

    expect(s3.deleteObjects).toHaveBeenCalledTimes(1);

    const params = s3.deleteObjects.mock.calls[0][0];

    expect(params.Bucket).toBe(process.env.BUCKET_NAME);
    expect(params.Delete.Objects).toEqual([
      {
        Key: eventStub.keys[0],
      },
      {
        Key: eventStub.keys[1],
      },
      {
        Key: eventStub.keys[2],
      },
    ]);
  });

  it("returns the provided articleId", () => {
    expect(main(eventStub)).resolves.toEqual({
      articleId: eventStub.articleId,
    });
  });
});
