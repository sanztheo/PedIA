import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error("❌ REDIS_URL not set");
  process.exit(1);
}

const redis = new Redis(REDIS_URL);

async function clearCache() {
  const pattern = process.argv[2] || "graph:*";
  
  console.log(`🔍 Searching for keys matching: ${pattern}`);
  
  const keys = await redis.keys(pattern);
  
  if (keys.length === 0) {
    console.log("✅ No cache entries found");
  } else {
    console.log(`📦 Found ${keys.length} entries:`);
    keys.forEach((key) => console.log(`   - ${key}`));
    
    await redis.del(...keys);
    console.log(`🗑️  Deleted ${keys.length} cache entries`);
  }
  
  await redis.quit();
}

clearCache().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
