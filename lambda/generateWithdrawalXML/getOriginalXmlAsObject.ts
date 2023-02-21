import * as AWS from "aws-sdk";
import * as xml2js from "xml2js";

export const getOriginalXmlAsObject = async (
  parser: xml2js.Parser,
  s3: AWS.S3,
  bucket: string,
  articleKey: string
) => {
  const originalXml = await s3
    .getObject({
      Bucket: bucket,
      Key: articleKey,
    })
    .promise();

  if (!originalXml.Body) {
    throw new Error("Original article XML file is empty");
  }

  const originalXmlText = originalXml.Body.toString("utf-8");

  return parser.parseStringPromise(originalXmlText);
};
