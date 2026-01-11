import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient() {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn("REDIS_URL not set, using mock redis");
    return null;
  }

  return new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 100, 3000);
    },
  });
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds = 3600,
): Promise<void> {
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;
  await redis.del(key);
}

export default redis;
