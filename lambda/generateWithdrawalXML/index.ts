import * as AWS from "aws-sdk";
import * as xml2js from "xml2js";
import { getOriginalXmlAsObject } from "./getOriginalXmlAsObject";
import { saveToS3 } from "./saveToS3";

const s3 = new AWS.S3();

interface Event {
  articleKey: string;
}

const parser = new xml2js.Parser();
const builder = new xml2js.Builder({
  doctype: { pepkbd3: "http://peparchive.org/pepa1dtd/pepkbd3.dtd" },
});

export async function main(event: Event) {
  if (!process.env.BUCKET_NAME || !process.env.REMOVAL_MESSAGE) {
    throw new Error("Missing one or more expected environment variable");
  }

  const { articleKey } = event;

  const parsedXml = await getOriginalXmlAsObject(
    parser,
    s3,
    process.env.BUCKET_NAME,
    articleKey
  );

  delete parsedXml.pepkbd3.bib;
  parsedXml.pepkbd3.body = [
    {
      p: process.env.REMOVAL_MESSAGE,
    },
  ];

  await saveToS3(builder, s3, process.env.BUCKET_NAME, articleKey, parsedXml);
}
