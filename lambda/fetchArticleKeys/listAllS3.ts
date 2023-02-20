import * as AWS from "aws-sdk";

const s3 = new AWS.S3();

export const listAllS3 = (
  bucket: string,
  prefix: string
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: undefined,
    };

    const keys: string[] = [];

    function listKeys() {
      s3.listObjectsV2(params, (err, data) => {
        if (err) {
          return reject(err);
        }

        if (!data.Contents) {
          return reject(new Error("No matching articles found"));
        }

        data.Contents.forEach((content) => {
          if (content.Key) {
            keys.push(content.Key);
          }
        });

        if (!data.IsTruncated) {
          return resolve(keys);
        }

        params.ContinuationToken = data.NextContinuationToken;
        listKeys();
      });
    }

    listKeys();
  });
};
