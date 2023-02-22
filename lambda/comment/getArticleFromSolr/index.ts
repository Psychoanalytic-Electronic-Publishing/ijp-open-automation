import axios from "axios";
import { URLSearchParams } from "url";

interface Event {
  subject: string;
}

interface Document {
  documentID: string;
}

interface QueryResponse {
  documentList: {
    responseSet: Document[];
  };
}

export async function main(event: Event) {
  if (!process.env.PEP_API_BASE_URL || !process.env.PEP_API_KEY) {
    throw new Error("Missing one or more required environment variable");
  }

  const headers = {
    "client-id": "1",
    "x-api-authorize": process.env.PEP_API_KEY,
  };

  const manuscriptId = event.subject.split("@")[0];

  const data = {
    smarttext: `meta_xml:"${manuscriptId}"`,
  };

  const searchParams = new URLSearchParams(data);

  const url = `${process.env.PEP_API_BASE_URL}/Database/Search?${searchParams}`;

  const response = await axios.get<QueryResponse>(url, { headers });

  let articleId = "";

  if (response.data.documentList.responseSet.length > 1) {
    throw new Error(
      `Multiple articles found for manuscript ID ${manuscriptId}`
    );
  }

  if (response.data.documentList.responseSet.length >= 1) {
    articleId = response.data.documentList.responseSet[0].documentID;
  }

  return { ...event, articleId };
}
