import * as AWS from "aws-sdk";
import * as xml2js from "xml2js";

export const saveToS3 = async (
  builder: xml2js.Builder,
  s3: AWS.S3,
  bucket: string,
  articleKey: string,
  parsedXml: object
) => {
  const xml = builder.buildObject(parsedXml);

  return s3
    .putObject({
      Bucket: bucket,
      Key: articleKey.replace("(bRemoved).xml", "(bKBD3).xml"),
      Body: xml,
      ContentType: "application/xml",
    })
    .promise();
};
