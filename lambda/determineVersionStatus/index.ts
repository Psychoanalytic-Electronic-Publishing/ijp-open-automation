import { createClient } from "solr-client";

const client = createClient({
  host: process.env.SOLR_HOST,
  port: parseInt(process.env.SOLR_PORT || ""),
  core: process.env.SOLR_DOC_CORE,
  secure: false,
});

interface Event {
  articleId: string;
}

interface SearchResult {
  response: {
    numFound: number;
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

  const query = client.query().q({ id: event.articleId.toUpperCase() }).rows(0);

  const result = (await client.searchAsync(query)) as SearchResult;

  const isLive = result.response.numFound >= 1;

  return { ...event, isLive };
}
