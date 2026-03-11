import { fetcher } from "../../core/lib/fetcher";
import { yflix } from "../origins";
import { extractHomeData } from "./parser/home";
import { extractSearchData } from "./parser/search";

export class yFlix {
  static async home() {
    const url = yflix + "/home";

    const data = await fetcher(url, true, "yflix");
    if (!data || !data.text) return;

    return extractHomeData(data.text);
  }

  static async search(_query: string, page: number = 1, type: string = null) {
    const query = _query.replaceAll(" ", "+");

    const url = yflix +
      "/browser?keyword=" + encodeURIComponent(query)
      + (page > 1 ? "&page=" + page : "")
      + (type ? "&type%5B%5D=" + type : "")

    const data = await fetcher(url, true, "yflix");

    if (data && data.success) {
      const { success, status, text } = data;

      const searchResults = extractSearchData(text);
      // console.log(searchResults);
      return {
        success: true,
        query: query.replaceAll("+", " "),
        page,
        type: type ? type : "all",
        data: searchResults
      };

    } else {
      return {
        success: false,
        query: query.replaceAll("+", " "),
        page
      };
    }
  }
}
