import { main } from ".";

import { S3 } from "../../__mocks__/aws-sdk";

const s3 = new S3();

describe("removeArticlesFromS3", () => {
  const eventStub = {
    articleId: "1234",
  };

  beforeEach(() => {
    process.env.BUCKET_NAME = "test-bucket";
    process.env.S3_PREFIX = "test";
    s3.listObjectsV2.mockClear();
  });

  it("throws an error when BUCKET_NAME variable is not set", async () => {
    process.env.BUCKET_NAME = "";

    await expect(main(eventStub)).rejects.toThrow(
      "Missing one or more required environment variable"
    );

    expect(s3.listObjectsV2).toHaveBeenCalledTimes(0);
  });

  it("throws an error when S3_PREFIX variable is not set", async () => {
    process.env.S3_PREFIX = "";

    await expect(main(eventStub)).rejects.toThrow(
      "Missing one or more required environment variable"
    );
  });

  it("returns a list of article version keys from S3", async () => {
    s3.listObjectsV2.mockImplementationOnce((_, cb) => {
      cb(null, {
        Contents: [
          {
            Key: "test/1234C.xml",
          },
          {
            Key: "test/1234B.xml",
          },
          {
            Key: "test/1234A.xml",
          },
          {
            Key: "test/nope.xml",
          },
        ],
      });
    });

    const result = await main(eventStub);

    expect(result).toEqual([
      "test/1234C.xml",
      "test/1234B.xml",
      "test/1234A.xml",
    ]);
  });

  it("propagates errors from S3", async () => {
    s3.listObjectsV2.mockImplementationOnce((_, cb) => {
      cb(new Error("S3 error"));
    });

    await expect(main(eventStub)).rejects.toThrow("S3 error");
  });

  it("throws an error if no matching articles are found", async () => {
    s3.listObjectsV2.mockImplementationOnce((_, cb) => {
      cb(null, {
        Contents: [],
      });
    });

    await expect(main(eventStub)).rejects.toThrow("No matching articles found");
  });

  it("handles truncated results", async () => {
    s3.listObjectsV2.mockImplementationOnce((params, cb) => {
      if (!params.ContinuationToken) {
        cb(null, {
          Contents: [
            {
              Key: "test/1234C.xml",
            },
          ],
          IsTruncated: true,
          NextContinuationToken: "continue",
        });
      }

      if (params.ContinuationToken === "continue") {
        cb(null, {
          Contents: [
            {
              Key: "test/1234B.xml",
            },
            {
              Key: "test/1234A.xml",
            },
            {
              Key: "test/nope.xml",
            },
          ],
        });
      }
    });

    const result = await main(eventStub);

    expect(result).toEqual([
      "test/1234C.xml",
      "test/1234B.xml",
      "test/1234A.xml",
    ]);
  });
});
