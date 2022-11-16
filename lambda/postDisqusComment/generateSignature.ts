import { HmacSHA1, enc } from "crypto-js";

export interface DisqusData {
  id: string;
  username: string;
  email: string;
}

export const generateSignature = (data: DisqusData, DISQUS_SECRET: string) => {
  const disqusStr = JSON.stringify(data);
  const timestamp = Math.round(+new Date() / 1000);

  const message = Buffer.from(disqusStr).toString("base64");

  const result = HmacSHA1(message + " " + timestamp, DISQUS_SECRET);
  const hexsig = enc.Hex.stringify(result);

  return message + " " + hexsig + " " + timestamp;
};
