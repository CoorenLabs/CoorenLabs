import { createApp } from "./app";
import { PORT, validateConfig } from "./core/config";
import { Logger } from "./core/logger";
import { env, isDeno } from "./core/runtime";

import { remapManager } from "./core/remapManager";

validateConfig();
await remapManager.init();

const app = await createApp();

const isVercel = env.VERCEL === "1";

if (!isVercel) {
  if (isDeno) {
    // @ts-expect-error - Deno global
    Deno.serve({ port: PORT }, app.fetch);
  } else {
    app.listen(PORT);
  }
  Logger.info(`Started at http://localhost:${PORT}`);
}

export default app;
