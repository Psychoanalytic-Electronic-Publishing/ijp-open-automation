const searchAsyncFn = jest.fn();

const solrMock = {
  createClient: jest.fn().mockImplementation(() => {
    return {
      searchAsync: searchAsyncFn,
      query: jest.fn().mockImplementation(() => {
        return {
          q: jest.fn().mockImplementation(() => {
            return {
              rows: jest.fn(),
            };
          }),
        };
      }),
    };
  }),
};

jest.mock("solr-client", () => {
  return solrMock;
});

import { main } from ".";

describe("determineVersionStatus", () => {
  const event = {
    manuscriptId: "abc123",
  };

  beforeEach(() => {
    process.env.SOLR_HOST = "54.170.156.204";
    process.env.SOLR_PORT = "8983";
    process.env.SOLR_DOC_CORE = "pepwebdocs";
  });

  it("returns isLive true if article exists in Solr", async () => {
    searchAsyncFn.mockResolvedValueOnce({
      response: {
        numFound: 1,
      },
    });

    const response = await main(event);

    expect(response).toStrictEqual({ ...event, isLive: true });
  });

  it("returns isLive false if article does not exist in Solr", async () => {
    searchAsyncFn.mockResolvedValueOnce({
      response: {
        numFound: 0,
      },
    });

    const response = await main(event);

    expect(response).toStrictEqual({ ...event, isLive: false });
  });

  it("throws an error when SOLR_HOST variable is not set", async () => {
    process.env.SOLR_HOST = "";

    await expect(main(event)).rejects.toThrow(
      "Missing one or more required environment variable"
    );
  });

  it("throws an error when SOLR_PORT variable is not set", async () => {
    process.env.SOLR_PORT = "";

    await expect(main(event)).rejects.toThrow(
      "Missing one or more required environment variable"
    );
  });

  it("throws an error when SOLR_DOC_CORE variable is not set", async () => {
    process.env.SOLR_DOC_CORE = "";

    await expect(main(event)).rejects.toThrow(
      "Missing one or more required environment variable"
    );
  });
});
