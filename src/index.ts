import app from "./app";
import { PORT } from "./core/config";
import { Logger } from "./core/logger";
import { deno } from "./core/runtime";

if (deno) deno.serve({ port: PORT }, app.fetch);
else app.listen(PORT);
Logger.info(`Started at http://localhost:${PORT}`);
