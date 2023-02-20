import { main } from ".";

import { S3 } from "../../__mocks__/aws-sdk";

const s3 = new S3();

const xmlResults = [
  {
    Key: "xml/1234C.xml",
  },
  {
    Key: "xml/1234B.xml",
  },
  {
    Key: "xml/1234A.xml",
  },
  {
    Key: "xml/nope.xml",
  },
];

const pdfResults = [
  {
    Key: "pdf/1234C.pdf",
  },
  {
    Key: "pdf/1234B.pdf",
  },
  {
    Key: "pdf/1234A.pdf",
  },
];

describe("removeArticlesFromS3", () => {
  const eventStub = {
    articleId: "1234",
  };

  beforeEach(() => {
    s3.listObjectsV2.mockImplementation((params, cb) => {
      if (params.Prefix === "xml") {
        cb(null, {
          Contents: xmlResults,
        });
      }

      if (params.Prefix === "pdf") {
        cb(null, {
          Contents: pdfResults,
        });
      }
    });

    process.env.BUCKET_NAME = "test-bucket";
    process.env.S3_PDF_PREFIX = "pdf";
    process.env.S3_XML_PREFIX = "xml";
    s3.listObjectsV2.mockClear();
  });

  it("throws an error when BUCKET_NAME variable is not set", async () => {
    process.env.BUCKET_NAME = "";

    await expect(main(eventStub)).rejects.toThrow(
      "Missing one or more required environment variable"
    );

    expect(s3.listObjectsV2).toHaveBeenCalledTimes(0);
  });

  it("throws an error when S3_PDF_PREFIX variable is not set", async () => {
    process.env.S3_PDF_PREFIX = "";

    await expect(main(eventStub)).rejects.toThrow(
      "Missing one or more required environment variable"
    );
  });

  it("throws an error when S3_XML_PREFIX variable is not set", async () => {
    process.env.S3_XML_PREFIX = "";

    await expect(main(eventStub)).rejects.toThrow(
      "Missing one or more required environment variable"
    );
  });

  it("returns a list of article version keys from S3", async () => {
    const result = await main(eventStub);

    expect(result).toEqual({
      pdfKeys: ["pdf/1234C.pdf", "pdf/1234B.pdf", "pdf/1234A.pdf"],
      xmlKeys: ["xml/1234C.xml", "xml/1234B.xml", "xml/1234A.xml"],
    });
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
    s3.listObjectsV2.mockImplementation((params, cb) => {
      const [xmlHead, ...xmlTail] = xmlResults;

      if (params.Prefix === "xml" && !params.ContinuationToken) {
        cb(null, {
          Contents: [xmlHead],
          IsTruncated: true,
          NextContinuationToken: "continue",
        });
      } else if (
        params.Prefix === "xml" &&
        params.ContinuationToken === "continue"
      ) {
        cb(null, {
          Contents: xmlTail,
        });
      } else if (params.Prefix === "pdf") {
        cb(null, {
          Contents: pdfResults,
        });
      }
    });

    const result = await main(eventStub);

    expect(result).toEqual({
      pdfKeys: ["pdf/1234C.pdf", "pdf/1234B.pdf", "pdf/1234A.pdf"],
      xmlKeys: ["xml/1234C.xml", "xml/1234B.xml", "xml/1234A.xml"],
    });
  });
});
