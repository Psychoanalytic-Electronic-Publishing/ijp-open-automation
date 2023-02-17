import * as AWS from "aws-sdk";

const s3 = new AWS.S3();

interface Event {
  filesToRemove: string[];
  articleId: string;
}

export async function main(event: Event) {
  if (!process.env.BUCKET_NAME) {
    throw new Error("Missing environment variable: BUCKET_NAME");
  }

  const { filesToRemove, articleId } = event;

  const removalObjects = filesToRemove.map((file) => {
    return {
      Key: file,
    };
  });

  const params: AWS.S3.DeleteObjectsRequest = {
    Bucket: process.env.BUCKET_NAME,
    Delete: {
      Objects: removalObjects,
    },
  };

  await s3.deleteObjects(params).promise();

  return {
    articleId,
  };
}
