export {};

declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      UPLOADS: R2Bucket;
    }
  }
}
