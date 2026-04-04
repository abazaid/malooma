import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient() {
  if (!process.env.REDIS_URL) return null;
  if (redisClient) return redisClient;

  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
  });

  return redisClient;
}
