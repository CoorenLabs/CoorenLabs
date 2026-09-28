type DenoRuntime = {
  env: { get(key: string): string | undefined };
  serve(
    options: { port: number },
    handler: (request: Request) => Response | Promise<Response>,
  ): unknown;
};

export const deno = (globalThis as { Deno?: DenoRuntime }).Deno;
export const isBun = typeof Bun !== "undefined";
export const isNode = !isBun && !deno;

export const env = new Proxy({} as Record<string, string | undefined>, {
  get: (_, key: string) => (deno ? deno.env.get(key) : process.env[key]),
});
