import * as AWS from "aws-sdk";

const s3 = new AWS.S3();

export const listAllS3 = (
  articleId: string,
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

        if (!data.Contents || data.Contents.length === 0) {
          return reject(new Error("No matching articles found"));
        }

        data.Contents.forEach((content) => {
          if (content.Key && content.Key.includes(articleId)) {
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

interface Event {
  subject: string;
}

export async function main(event: Event) {
  if (
    !process.env.BUCKET_NAME ||
    !process.env.S3_XML_PREFIX ||
    !process.env.S3_PDF_PREFIX
  ) {
    throw new Error("Missing one or more required environment variable");
  }

  const documentId = event.subject.slice(0, -1);

  const xmlKeys = await listAllS3(
    documentId,
    process.env.BUCKET_NAME,
    process.env.S3_XML_PREFIX
  );

  const pdfKeys = await listAllS3(
    documentId,
    process.env.BUCKET_NAME,
    process.env.S3_PDF_PREFIX
  );

  const keys = [...xmlKeys, ...pdfKeys];

  const filteredKeys = keys.filter((key) => {
    return (
      !key.includes("bRemoved") &&
      (key.includes(".xml") || key.includes(".pdf"))
    );
  });

  return {
    keys: filteredKeys,
    articleId: event.subject,
  };
}
