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
- **Optional Caching**: Redis, enabled by setting `REDIS_URL`.

---

## Tech Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Language**: TypeScript
- **Scraping**: Cheerio, puppeteer-real-browser
- **Cache**: Redis

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

`dev` restarts on file changes. The API overview is served at `/` and the OpenAPI docs at `/docs`.

### Production

```bash
bun run start
```

### Docker

```bash
docker compose up -d --build
```

This starts the API on port `3000` with Chromium and a Redis cache. Values for `PORT`, `SERVER_ORIGIN`, `LOG_LEVEL`, `CORS_ORIGIN` and `CORS_CREDENTIALS` are read from `.env` or your shell; set `SERVER_ORIGIN` to the public URL when deploying.

---

## Configuration

All variables are optional in development; see `.env.example`.

| Variable           | Default                 | Description                                                      |
| ------------------ | ----------------------- | ---------------------------------------------------------------- |
| `PORT`             | `3000`                  | HTTP port.                                                       |
| `NODE_ENV`         | `development`           | `development` or `production`.                                   |
| `SERVER_ORIGIN`    | `http://localhost:PORT` | Public URL used in proxied stream links; required in production. |
| `LOG_LEVEL`        | `info`                  | `debug`, `info`, `warn`, `error` or `silent`.                    |
| `CORS_ORIGIN`      | `*`                     | `*` or a comma-separated list of allowed origins.                |
| `CORS_CREDENTIALS` | `false`                 | Allow credentialed CORS requests.                                |
| `REDIS_URL`        | —                       | Enables caching when set (Bun runtime).                          |

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

## Checks

```bash
bun run typecheck
bun run lint
```

---

## Credits

- The Kwik HLS cipher (`src/providers/anime/animepahe/scraper/decrypt.ts`) is ported from the Dart implementation in mangayomi/aniyomi.

---

## License

This project is licensed under the [GPL-3.0 License](LICENSE).
