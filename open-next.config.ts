import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = {
  ...defineCloudflareConfig({
    enableCacheInterception: true,
  }),
  buildCommand: "npm run build:next",
};

export default config;
