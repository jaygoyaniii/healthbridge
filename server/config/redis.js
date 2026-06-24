import Redis from "ioredis";

let redisClient = null;

export const connectRedis = async () => {
  return new Promise((resolve) => {
    try {
      const client = new Redis(
        process.env.REDIS_URL || "redis://localhost:6379",
        {
          maxRetriesPerRequest: 1,
          retryStrategy() {
            return null; // No retries — fail fast
          },
          lazyConnect: true,
          enableOfflineQueue: false,
        },
      );

      // Handle errors silently — don't crash
      client.on("error", () => {
        redisClient = null;
        resolve(); // Resolve anyway so server starts
      });

      client
        .connect()
        .then(() => {
          redisClient = client;
          console.log("✅ Redis Connected");
          resolve();
        })
        .catch(() => {
          console.warn("⚠️  Redis unavailable, using in-memory fallback.");
          redisClient = null;
          resolve(); // Resolve anyway
        });
    } catch (error) {
      console.warn("⚠️  Redis init failed:", error.message);
      redisClient = null;
      resolve();
    }
  });
};

export const getRedis = () => redisClient;
export default { connectRedis, getRedis };
