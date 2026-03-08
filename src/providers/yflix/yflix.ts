import { yflix } from "../origins";
import { fetcher } from "./lib/fetcher";
import { extractHomeData } from "./parser/home";

export class yFlix {
  static async home() {
    const url = yflix + "/home";

    const data = await fetcher(url, true);
    if (!data || !data.text) return;

    return extractHomeData(data.text);
  }

  static async search(_query: string) {
    return "GARBAGE";
  }
}
