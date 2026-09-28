import { createApp } from "./app";
import { PORT, validateConfig } from "./core/config";
import { Logger } from "./core/logger";
import { remapManager } from "./core/remapManager";
import { deno, env } from "./core/runtime";

validateConfig();
await remapManager.init();

const app = await createApp();

if (env.VERCEL !== "1") {
  if (deno) deno.serve({ port: PORT }, app.fetch);
  else app.listen(PORT);
  Logger.info(`Started at http://localhost:${PORT}`);
}

export default app;
