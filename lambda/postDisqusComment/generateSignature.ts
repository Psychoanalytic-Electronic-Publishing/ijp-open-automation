import { HmacSHA1, enc } from "crypto-js";

export interface DisqusData {
  id: string;
  username: string;
  email: string;
}

export const generateSignature = (data: DisqusData) => {
  if (!process.env.DISQUS_SECRET)
    throw new Error("Missing environment variable: DISQUS_SECRET");

  const disqusStr = JSON.stringify(data);
  const timestamp = Math.round(+new Date() / 1000);

  const message = Buffer.from(disqusStr).toString("base64");

  const result = HmacSHA1(message + " " + timestamp, process.env.DISQUS_SECRET);
  const hexsig = enc.Hex.stringify(result);

  return message + " " + hexsig + " " + timestamp;
};
