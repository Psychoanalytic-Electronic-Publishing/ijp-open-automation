import * as AWS from "aws-sdk";
import { createRemovalBackups } from "./createRemovalBackups";
import { deleteOriginalFiles } from "./deleteOriginalFiles";

const s3 = new AWS.S3();

interface Event {
  keys: string[];
  articleId: string;
}

export async function main(event: Event) {
  if (!process.env.BUCKET_NAME) {
    throw new Error("Missing environment variable: BUCKET_NAME");
  }

  const { keys, articleId } = event;

  const filteredKeys = keys.filter((key) => {
    return !key.includes("(bEXP_ARCH1).xml");
  });

  await createRemovalBackups(s3, process.env.BUCKET_NAME, filteredKeys);

  await deleteOriginalFiles(s3, process.env.BUCKET_NAME, keys);

  return {
    articleId,
    keys: filteredKeys,
  };
}
