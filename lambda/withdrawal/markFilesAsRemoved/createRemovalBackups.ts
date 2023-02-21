import * as AWS from "aws-sdk";

export const createRemovalBackups = (
  s3: AWS.S3,
  bucket: string,
  keys: string[]
) => {
  const copyParams = keys.map((key) => {
    return {
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: key
        .replace(".pdf", "(bRemoved).pdf")
        .replace("(bKBD3)", "(bRemoved)"),
    } as AWS.S3.CopyObjectRequest;
  });

  return Promise.all(
    copyParams.map((params) => {
      return s3.copyObject(params).promise();
    })
  );
};
