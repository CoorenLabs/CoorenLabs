type Init = {
  method?: string;
  headers?: HeadersInit;
  body?: string | null;
  signal?: AbortSignal;
  redirect?: "follow" | "manual" | "error";
};

export type ImpersonatedResponse = {
  ok: boolean;
  status: number;
  url: string;
  headers: { get(name: string): string | null; has(name: string): boolean };
  body: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
};

export async function browserFetch(url: string, init: Init = {}): Promise<ImpersonatedResponse> {
  const { fetch } = await import("wreq-js");
  const response = await fetch(url, {
    ...init,
    headers: Object.fromEntries(new Headers(init.headers)),
    browser: "chrome_149",
    os: "windows",
  });
  return response as unknown as ImpersonatedResponse;
}
