import * as AWS from "aws-sdk";

export const deleteOriginalFiles = (
  s3: AWS.S3,
  bucket: string,
  keys: string[]
) => {
  const removalObjects = keys.map((key) => {
    return {
      Key: key,
    };
  });

  const params: AWS.S3.DeleteObjectsRequest = {
    Bucket: bucket,
    Delete: {
      Objects: removalObjects,
    },
  };

  return s3.deleteObjects(params).promise();
};
