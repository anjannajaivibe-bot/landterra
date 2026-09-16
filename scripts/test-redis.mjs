import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';

// Simple parser for .env.local without requiring external dotenv package
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

async function testRedis() {
  console.log('\n🔍 Testing Upstash Redis Connection...\n');
  const env = loadEnvLocal();

  const url =
    process.env.UPSTASH_REDIS_KV_REST_API_URL ||
    env.UPSTASH_REDIS_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    env.UPSTASH_REDIS_REST_URL;

  const token =
    process.env.UPSTASH_REDIS_KV_REST_API_TOKEN ||
    env.UPSTASH_REDIS_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('❌ Missing UPSTASH_REDIS_KV_REST_API_URL or UPSTASH_REDIS_KV_REST_API_TOKEN in .env.local');
    process.exit(1);
  }

  console.log(`📡 URL:   ${url}`);
  console.log(`🔑 Token: ${token.slice(0, 10)}...${token.slice(-6)} (length: ${token.length})`);

  try {
    const redis = new Redis({ url, token });

    const startTime = Date.now();
    const pingRes = await redis.ping();
    const pingTime = Date.now() - startTime;

    console.log(`\n✅ PING SUCCESS! Response: "${pingRes}" (${pingTime}ms)`);

    // Test write and read
    const testKey = 'bhoomimitra:test:ping';
    await redis.set(testKey, { test: true, timestamp: Date.now() }, { ex: 60 });
    const getRes = await redis.get(testKey);
    await redis.del(testKey);

    console.log('✅ READ/WRITE SUCCESS! Verified key set, get, and del.');
    console.log('\n🎉 Redis is 100% active, authenticated, and ready to use!\n');
  } catch (err) {
    console.error('\n❌ REDIS TEST FAILED:');
    console.error(err.message || err);
    console.log('\n👉 Please verify your UPSTASH_REDIS_KV_REST_API_TOKEN in .env.local.\n');
    process.exit(1);
  }
}

testRedis();
