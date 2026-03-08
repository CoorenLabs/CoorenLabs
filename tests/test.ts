import { getCloudflareClearance } from "../src/providers/yflix/lib/cf-bypass";

const data = await getCloudflareClearance("https://yflix.to/home");

console.log(data);