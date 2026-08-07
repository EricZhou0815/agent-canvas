// open-next.config.ts - Cloudflare OpenNext adapter configuration
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal config: no ISR, no next/image, no incremental cache needed
export default defineCloudflareConfig({});
