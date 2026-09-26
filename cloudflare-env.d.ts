// Cloudflare Workers environment bindings (see wrangler.jsonc).
// This file is local-only typing sugar; the real values are injected by the
// Workers runtime and must never be exposed to the client bundle.
interface CloudflareEnv {
  VAULTS_BUCKET: {
    head(key: string): Promise<unknown>;
    get(key: string): Promise<unknown>;
    put(key: string, value: unknown, options?: unknown): Promise<unknown>;
    delete(key: string): Promise<void>;
  };
}
