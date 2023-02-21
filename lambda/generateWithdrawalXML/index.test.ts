import { main } from ".";

import { S3 } from "../../__mocks__/aws-sdk";
import { outputXml, testXml } from "./testXml";
import * as xml2js from "xml2js";

const parser = new xml2js.Parser();
const builder = new xml2js.Builder({
  doctype: { pepkbd3: "http://peparchive.org/pepa1dtd/pepkbd3.dtd" },
});

const s3 = new S3();

describe("generateWithdrawalXML", () => {
  s3.getObject.mockImplementation(() => {
    return {
      promise: () => {
        return Promise.resolve({
          Body: Buffer.from(testXml),
        });
      },
    };
  });

  beforeEach(() => {
    process.env.BUCKET_NAME = "test-bucket";
    process.env.REMOVAL_MESSAGE = "Test removal message";

    s3.putObject.mockClear();
    s3.getObject.mockClear();
  });

  it("throws an error when BUCKET_NAME variable is not set", async () => {
    process.env.BUCKET_NAME = "";

    await expect(
      main({
        articleKey: "test/1234A(bKBD3).xml",
      })
    ).rejects.toThrow("Missing one or more expected environment variable");

    expect(s3.getObject).toHaveBeenCalledTimes(0);
    expect(s3.putObject).toHaveBeenCalledTimes(0);
  });

  it("throws an error when REMOVAL_MESSAGE variable is not set", async () => {
    process.env.REMOVAL_MESSAGE = "";

    await expect(
      main({
        articleKey: "test/1234A(bKBD3).xml",
      })
    ).rejects.toThrow("Missing one or more expected environment variable");

    expect(s3.getObject).toHaveBeenCalledTimes(0);
    expect(s3.putObject).toHaveBeenCalledTimes(0);
  });

  it("fetches the article XML file from S3", async () => {
    await main({
      articleKey: "test/1234A(bKBD3).xml",
    });

    expect(s3.getObject).toHaveBeenCalledTimes(1);
    expect(s3.getObject).toHaveBeenCalledWith({
      Bucket: process.env.BUCKET_NAME,
      Key: "test/1234A(bKBD3).xml",
    });
  });

  it("throws an error if the original XML file is empty", async () => {
    s3.getObject.mockImplementationOnce(() => {
      return {
        promise: () => {
          return Promise.resolve({
            Body: undefined,
          });
        },
      };
    });

    await expect(
      main({
        articleKey: "test/1234A(bKBD3).xml",
      })
    ).rejects.toThrow("Original article XML file is empty");

    expect(s3.getObject).toHaveBeenCalledTimes(1);
    expect(s3.putObject).toHaveBeenCalledTimes(0);
  });

  it("creates a new XML file with the removal message", async () => {
    await main({
      articleKey: "test/1234A(bKBD3).xml",
    });

    // Run the expected XML string through the parser and builder to normalise formatting for test
    const parsedOutputXml = await parser.parseStringPromise(outputXml);
    const newXml = builder.buildObject(parsedOutputXml);

    expect(s3.putObject).toHaveBeenCalledTimes(1);
    expect(s3.putObject).toHaveBeenCalledWith({
      Bucket: process.env.BUCKET_NAME,
      Key: "test/1234A(bKBD3).xml",
      Body: newXml,
      ContentType: "application/xml",
    });
  });
});
