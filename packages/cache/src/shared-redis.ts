import { type RedisClientType, createClient } from "redis";

let sharedRedisClient: RedisClientType | null = null;

/**
 * Get or create a shared Redis client instance.
 * Uses lazy connect — the client connects on first command, not at import time.
 * Falls back to no-op client if REDIS_URL is not set.
 */
export function getSharedRedisClient(): RedisClientType {
  if (sharedRedisClient) {
    return sharedRedisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("[Redis] REDIS_URL not set — using no-op client");
    return {
      get: async () => null,
      set: async () => null,
      setEx: async () => null,
      del: async () => null,
      exists: async () => 0,
      expire: async () => false,
      keys: async () => [],
      connect: async () => {},
      disconnect: async () => {},
      ping: async () => "PONG",
      isOpen: false,
      on: () => {},
    } as any;
  }

  sharedRedisClient = createClient({
    url: redisUrl,
    socket: {
      // Use IPv4 on Vercel, not IPv6 (IPv6 was for Fly.io 6PN)
      family: 4,
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.error("[Redis] Max reconnection attempts reached");
          return false;
        }
        const delay = Math.min(100 * 2 ** retries, 3000);
        return delay;
      },
    },
  });

  sharedRedisClient.on("error", (err) => {
    console.error("[Redis] Error:", err.message);
  });

  // Lazy connect — connects on first command, not at module load time.
  // This prevents EBUSY errors from too many eager connections in serverless.
  sharedRedisClient.connect().catch((err) => {
    console.error("[Redis] Connection error:", err.message);
    // Reset so next invocation tries again
    sharedRedisClient = null;
  });

  return sharedRedisClient;
}
