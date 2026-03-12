import { Elysia } from "elysia";
import { tidalRoutes } from "./tidal/route";

export const musicRoutes = new Elysia({ prefix: "/music" })
  .use(tidalRoutes)
  
  // ─── Overview Endpoint ────────────────────────────────────────────────────────
  .get("/", () => ({
    service: "music",
    description: "Unified Music API — provider-isolated route architecture",
    providers: ["tidal"],
    endpoints: {
      tidal: [
        "GET /music/tidal/search?q=...         → Search music",
        "GET /music/tidal/tracks/:id           → Track details",
        "GET /music/tidal/featured             → Featured highlights"
      ]
    }
  }), {
    detail: { tags: ['music'], summary: 'Music API Overview' }
  });
