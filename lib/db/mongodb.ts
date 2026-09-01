import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless invocations in production Next.js.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastFailedAt: number;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  lastFailedAt: 0,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

mongoose.set('bufferCommands', false);

// Cooldown time (in ms) before retrying a failed connection attempt
const RETRY_COOLDOWN_MS = 30000;

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI || MONGODB_URI.includes('<username>') || MONGODB_URI.includes('<password>')) {
    return null;
  }

  // If already connected and ready, return existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a recent attempt failed within the last 30s, prevent blocking page requests
  const now = Date.now();
  if (cached.lastFailedAt && now - cached.lastFailedAt < RETRY_COOLDOWN_MS && !cached.promise) {
    return null;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // 5s timeout
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      family: 4,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      cached.lastFailedAt = 0;
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    cached.lastFailedAt = 0;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    cached.lastFailedAt = Date.now();
    console.warn(
      '[MongoDB Notice] Live database unavailable. Using fast local cache fallback. (Will retry in 30s)'
    );
    return null;
  }
}

export function isMongoConfigured(): boolean {
  return Boolean(
    process.env.MONGODB_URI &&
    process.env.MONGODB_URI.startsWith('mongodb') &&
    !process.env.MONGODB_URI.includes('<username>') &&
    !process.env.MONGODB_URI.includes('<password>')
  );
}
