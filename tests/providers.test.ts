import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { Animepahe } from "../src/providers/anime/animepahe/animepahe";
import { AnimeSalt } from "../src/providers/anime/animesalt/animesalt";
import { ScrapeHomePage } from "../src/providers/anime/toonstream/scrapers/home";
import { allmanga } from "../src/providers/manga/allmanga/allmanga";
import { atsu } from "../src/providers/manga/atsu/atsu";
import { mangaball } from "../src/providers/manga/mangaball/mangaball";
import { Primesrc } from "../src/providers/movie-tv/primesrc/primesrc";
import { tidal } from "../src/providers/music/tidal/tidal";
import { vidcore } from "../src/providers/stream/vidcore/vidcore";
import { vidfast } from "../src/providers/stream/vidfast/vidfast";

vi.mock("../src/providers/anime/animepahe/animepahe", () => ({ Animepahe: { search: vi.fn() } }));
vi.mock("../src/providers/anime/toonstream/scrapers/home", () => ({ ScrapeHomePage: vi.fn() }));
vi.mock("../src/providers/anime/animesalt/animesalt", () => ({ AnimeSalt: { home: vi.fn() } }));
vi.mock("../src/providers/manga/mangaball/mangaball", () => ({
  mangaball: { parseHome: vi.fn() },
}));
vi.mock("../src/providers/manga/allmanga/allmanga", () => ({ allmanga: { parseHome: vi.fn() } }));
vi.mock("../src/providers/manga/atsu/atsu", () => ({ atsu: { parseHome: vi.fn() } }));
vi.mock("../src/providers/movie-tv/primesrc/primesrc", () => ({
  Primesrc: { getMovieSource: vi.fn() },
}));
vi.mock("../src/providers/music/tidal/tidal", () => ({
  tidal: { search: vi.fn(), cleanMetadata: vi.fn((item: unknown) => item) },
}));
vi.mock("../src/providers/stream/vidcore/vidcore", () => ({ vidcore: { fetchMovie: vi.fn() } }));
vi.mock("../src/providers/stream/vidfast/vidfast", () => ({ vidfast: { fetchMovie: vi.fn() } }));

let app: Awaited<ReturnType<typeof createApp>>;

const request = (path: string) => app.handle(new Request(`http://localhost${path}`));

async function getJson(path: string) {
  const res = await request(path);
  expect(res.status, path).toBe(200);
  return res.json();
}

beforeAll(async () => {
  app = await createApp();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("core", () => {
  it("reports status on /", async () => {
    expect(await getJson("/")).toMatchObject({ name: "Cooren API", status: "operational" });
  });

  it("lists proxy endpoints", async () => {
    expect((await getJson("/proxy")).endpoints).toHaveLength(4);
  });

  it("rejects /mappings without an id", async () => {
    expect((await request("/mappings")).status).toBe(400);
  });

  it("collapses duplicate slashes", async () => {
    const res = await request("//anime//?x=1");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("http://localhost/anime/?x=1");
  });
});

describe("proxy", () => {
  const upstream = (body: string) =>
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(body));

  const proxied = (kind: string, url: string, headers?: object) =>
    `/proxy/${kind}?url=${encodeURIComponent(url)}` +
    (headers ? `&headers=${encodeURIComponent(JSON.stringify(headers))}` : "");

  it("rewrites master playlist variants and renditions as playlists", async () => {
    upstream(
      [
        "#EXTM3U",
        '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="a",URI="audio/en.m3u8"',
        "#EXT-X-STREAM-INF:BANDWIDTH=800000",
        "720/index",
      ].join("\n"),
    );
    const headers = { Referer: "https://site.test/?a=%20b" };
    const res = await request(proxied("m3u8-proxy", "https://cdn.test/v/master.m3u8", headers));
    const lines = (await res.text()).split("\n");

    expect(res.headers.get("content-type")).toBe("application/vnd.apple.mpegurl");
    expect(lines[1]).toContain(
      `URI="${proxied("m3u8-proxy", "https://cdn.test/v/audio/en.m3u8", headers)}"`,
    );
    expect(lines[3]).toBe(proxied("m3u8-proxy", "https://cdn.test/v/720/index", headers));
  });

  it("rewrites media playlist segments and keys as files", async () => {
    upstream(
      [
        "#EXTM3U",
        '#EXT-X-KEY:METHOD=AES-128,URI="/keys/k1"',
        '#EXT-X-MAP:URI="data:application/octet-stream;base64,AAAA"',
        "#EXTINF:4.0,",
        "seg-1.jpg",
      ].join("\n"),
    );
    const res = await request(proxied("m3u8-proxy", "https://cdn.test/v/720/index.m3u8"));
    const lines = (await res.text()).split("\n");

    expect(lines[1]).toContain(`URI="${proxied("fetch", "https://cdn.test/keys/k1")}"`);
    expect(lines[2]).toContain('URI="data:application/octet-stream;base64,AAAA"');
    expect(lines[4]).toBe(proxied("ts-segment", "https://cdn.test/v/720/seg-1.jpg"));
  });

  it("forwards range requests for video", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response("abc", { status: 206, headers: { "content-range": "bytes 0-2/10" } }),
      );
    const res = await app.handle(
      new Request(`http://localhost${proxied("mp4-proxy", "https://cdn.test/v.mp4")}`, {
        headers: { range: "bytes=0-2" },
      }),
    );

    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 0-2/10");
    expect(new Headers(fetchSpy.mock.calls[0][1]?.headers).get("range")).toBe("bytes=0-2");
  });

  it("rejects malformed headers", async () => {
    const res = await request("/proxy/fetch?url=https%3A%2F%2Fcdn.test%2Fa&headers=%7Bnope");
    expect(res.status).toBe(400);
  });

  it.each([
    "file:///etc/passwd",
    "http://127.0.0.1:3000/",
    "http://localhost/",
    "http://[::1]/",
    "http://169.254.169.254/latest/meta-data/",
    "http://2130706433/",
    "http://10.0.0.8/",
  ])("refuses to fetch %s", async (url) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await request(proxied("fetch", url))).status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not follow redirects to internal hosts", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 302, headers: { location: "http://127.0.0.1/secret" } }),
    );
    expect((await request(proxied("fetch", "https://cdn.test/a"))).status).toBe(403);
  });
});

describe("providers", () => {
  const sentinel = (name: string) => ({ provider: name }) as any;

  const cases: [string, () => void, string, (json: any) => unknown][] = [
    [
      "animepahe",
      () => vi.mocked(Animepahe.search).mockResolvedValue(sentinel("animepahe")),
      "/anime/animepahe/search/test",
      (json) => json.results,
    ],
    [
      "toonstream",
      () => vi.mocked(ScrapeHomePage).mockResolvedValue(sentinel("toonstream")),
      "/anime/toonstream/home",
      (json) => json.data,
    ],
    [
      "animesalt",
      () => vi.mocked(AnimeSalt.home).mockResolvedValue(sentinel("animesalt")),
      "/anime/animesalt/home",
      (json) => json.results,
    ],
    [
      "mangaball",
      () => vi.mocked(mangaball.parseHome).mockResolvedValue(sentinel("mangaball")),
      "/manga/mangaball/home",
      (json) => json.data,
    ],
    [
      "allmanga",
      () => vi.mocked(allmanga.parseHome).mockResolvedValue(sentinel("allmanga")),
      "/manga/allmanga/home",
      (json) => json.data,
    ],
    [
      "atsu",
      () => vi.mocked(atsu.parseHome).mockResolvedValue(sentinel("atsu")),
      "/manga/atsu/home",
      (json) => json.data,
    ],
    [
      "primesrc",
      () =>
        vi
          .mocked(Primesrc.getMovieSource)
          .mockResolvedValue({ success: true, status: 200, data: sentinel("primesrc") }),
      "/movie-tv/primesrc/movie/550",
      (json) => json.data,
    ],
    [
      "tidal",
      () => vi.mocked(tidal.search).mockResolvedValue(sentinel("tidal")),
      "/music/tidal/search?q=test",
      (json) => json.data,
    ],
    [
      "vidcore",
      () => vi.mocked(vidcore.fetchMovie).mockResolvedValue(sentinel("vidcore")),
      "/stream/vidcore/movie/550",
      (json) => json.data,
    ],
    [
      "vidfast",
      () => vi.mocked(vidfast.fetchMovie).mockResolvedValue(sentinel("vidfast")),
      "/stream/vidfast/movie/550",
      (json) => json,
    ],
  ];

  it.each(cases)("%s", async (name, arrange, path, pick) => {
    arrange();
    expect(pick(await getJson(path))).toEqual({ provider: name });
  });
});
