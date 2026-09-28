# Cooren API

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![Node.js](https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Deno](https://img.shields.io/badge/Deno-000000.svg?style=for-the-badge&logo=deno&logoColor=white)](https://deno.land)
[![ElysiaJS](https://img.shields.io/badge/ElysiaJS-%23FEEB00.svg?style=for-the-badge&logo=elysiajs&logoColor=black)](https://elysiajs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](LICENSE)

Cooren is an open-source, high-performance, and scalable scraping engine designed to collect, organize, and deliver structured data from across the world of anime, movies, manga, and music.

Developed and maintained by [CoorenLabs](https://coorenlabs.com).

---

## Quick Links

- [Website](https://coorenlabs.com)
- [Documentation](https://docs.coorenlabs.com)
- [GitHub](https://github.com/CoorenLabs/CoorenLabs)

---

## Features

- **Multi-Runtime**: Runs on Bun, Node.js, and Deno.
- **Unified Media Ecosystem**: Anime, Manga, Movies, TV, and Music.
- **High Performance**: Native speed powered by Bun and ElysiaJS.
- **Built-in Stream Proxy**: HLS, MP4 and file proxy with playlist rewriting and byte-range support.
- **Optional Caching**: Redis (Bun) or Upstash Redis.

---

## Tech Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Language**: TypeScript
- **Scraping**: Cheerio, puppeteer-real-browser
- **Cache**: Redis / Upstash Redis
- **Testing**: Vitest

---

## Getting Started

### Prerequisites

Install [Bun](https://bun.sh).

### Installation

```bash
git clone https://github.com/CoorenLabs/CoorenLabs.git
cd CoorenLabs
bun install
cp .env.example .env
```

### Running the Server

```bash
bun run dev
```

Use `bun run hot` for hot reload, `bun run dev:node` for Node.js or `bun run dev:deno` for Deno. The API overview is served at `/` and the OpenAPI docs at `/docs`.

### Build for Production

```bash
bun run build:bun
bun run build:node
```

`build:node` produces `dist/index.js`, which `bun run start:node` runs with Node.js.

---

## Configuration

| Variable                                              | Default                  | Description                                                                        |
| ----------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `PORT`                                                | `3000`                   | HTTP port.                                                                         |
| `NODE_ENV`                                            | `development`            | `development`, `production` or `test`.                                             |
| `SERVER_ORIGIN`                                       | —                        | Public origin of this server (required outside tests); used to build proxied URLs. |
| `LOG_LEVEL`                                           | `info`                   | `debug`, `info`, `warn`, `error` or `silent`.                                      |
| `CORS_ORIGIN`                                         | `*`                      | `*` or a comma-separated list of allowed origins.                                  |
| `CORS_CREDENTIALS`                                    | `false`                  | Allow credentialed CORS requests.                                                  |
| `OPENAPI_ENABLED`                                     | `true`                   | Serve the OpenAPI docs at `/docs`.                                                 |
| `OPENAPI_VERSION`                                     | `3.0.0`                  | Version reported by `/` and the OpenAPI document.                                  |
| `ENABLE_CACHE`                                        | `false`                  | Enable response caching.                                                           |
| `CACHE_PROVIDER`                                      | —                        | `default` (Redis via Bun's client, needs `REDIS_URL`) or `upstash`.                |
| `DEFAULT_CACHE_TTL`                                   | `-1`                     | Default TTL in seconds; `-1` keeps entries forever.                                |
| `REDIS_URL`                                           | —                        | Redis connection URL for the `default` provider.                                   |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | —                        | Credentials for the `upstash` provider.                                            |
| `ANILIST_SPOTLIGHT_IDS`                               | —                        | Comma-separated AniList IDs for the meta spotlight.                                |
| `DATABASE_URL`                                        | —                        | Neon Postgres URL for metadata remaps (optional).                                  |
| `REMAP_REFRESH_INTERVAL`                              | `600000`                 | Remap refresh interval in milliseconds.                                            |
| `WREQ_BROWSER` / `WREQ_OS`                            | `chrome_149` / `windows` | Browser TLS fingerprint used by providers that need impersonated requests.         |

---

## Creating a New Provider

```
src/providers/<category>/<name>/
├── route.ts
├── <name>.ts
└── types.ts
```

Register the provider's routes in `src/providers/<category>/route.ts`.

### Example: route.ts

```ts
import { Elysia, t } from "elysia";
import { Primesrc } from "./primesrc";

export const primesrcRoutes = new Elysia({ prefix: "/primesrc" }).get(
  "/movie/:tmdbid",
  async ({ params: { tmdbid }, set }) => {
    const result = await Primesrc.getMovieSource(Number(tmdbid));
    set.status = result.status;
    return result;
  },
  { params: t.Object({ tmdbid: t.Numeric() }) },
);
```

---

## Testing & Linting

```bash
bun run test
bun run typecheck
bun run lint
bun run lint:fix
bun run format
```

---

## Credits

- The Kwik HLS cipher (`src/providers/anime/animepahe/scraper/decrypt.ts`) is ported from the Dart implementation in mangayomi/aniyomi.

---

## License

This project is licensed under the [GPL-3.0 License](LICENSE).
