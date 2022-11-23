import { createClient } from "solr-client";

const client = createClient({
  host: process.env.SOLR_HOST,
  port: parseInt(process.env.SOLR_PORT || ""),
  core: process.env.SOLR_DOC_CORE,
  secure: false,
});

interface Event {
  manuscriptId: string;
}

interface Document {
  id: string;
}

interface SearchResult {
  response: {
    numFound: number;
    docs?: Document[];
  };
}

export async function main(event: Event) {
  console.log("Event", event);

  if (
    !process.env.SOLR_HOST ||
    !process.env.SOLR_PORT ||
    !process.env.SOLR_DOC_CORE
  ) {
    throw new Error("Missing one or more required environment variable");
  }

  const query = client
    .query()
    .q({ mc_id: event.manuscriptId.toUpperCase() })
    .rows(1);

  const result = (await client.searchAsync(query)) as SearchResult;

  console.log(result);

  let articleId = "";

  if (result.response.docs && result.response.docs.length >= 1) {
    articleId = result.response.docs[0].id.toLowerCase();
  }

  return { ...event, articleId };
}
