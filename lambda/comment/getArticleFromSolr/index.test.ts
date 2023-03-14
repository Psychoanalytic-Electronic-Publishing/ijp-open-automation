import axios from "axios";
import { main } from ".";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("getArticleFromSolr", () => {
  const event = {
    subject: "abc123@no",
  };

  const manuscriptId = event.subject.split("@")[0];

  beforeEach(() => {
    process.env.PEP_API_BASE_URL = "https://test.com/v2";
    process.env.PEP_API_KEY = "1234";
  });

  it("returns article ID if the article exists", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        documentList: {
          responseSet: [
            {
              documentID: "IJPOPEN.001.0001A",
            },
          ],
        },
      },
    });

    const response = await main(event);

    const url = `${process.env.PEP_API_BASE_URL}/Database/Search?smarttext=meta_xml%3A%22${manuscriptId}%22`;
    const headers = {
      "client-id": "1",
      "x-api-authorize": process.env.PEP_API_KEY,
    };

    expect(axios.get).toBeCalledWith(url, { headers });

    expect(response).toStrictEqual({
      ...event,
      articleId: "IJPOPEN.001.0001A",
    });
  });

  it("throws an error if the API returns multiple documents", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        documentList: {
          responseSet: [
            {
              documentID: "IJPOPEN.001.0001A",
            },
            {
              documentID: "IJPOPEN.001.0001B",
            },
          ],
        },
      },
    });

    await expect(main(event)).rejects.toThrow(
      `Multiple articles found for manuscript ID ${manuscriptId}`
    );
  });

  it("returns an empty string for articleId if article does not exist in Solr", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        documentList: {
          responseSet: [],
        },
      },
    });

    const response = await main(event);

    expect(response).toStrictEqual({ ...event, articleId: "" });
  });

  it("throws an error when PEP_API_BASE_URL variable is not set", async () => {
    process.env.PEP_API_BASE_URL = "";

    await expect(main(event)).rejects.toThrow(
      "Missing one or more required environment variable"
    );
  });

  it("throws an error when PEP_API_KEY variable is not set", async () => {
    process.env.PEP_API_KEY = "";

    await expect(main(event)).rejects.toThrow(
      "Missing one or more required environment variable"
    );
  });
});
