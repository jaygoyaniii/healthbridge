import Redis from 'ioredis';

let redisClient = null;

export const connectRedis = async () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
      lazyConnect: true,
    });

    await redisClient.connect();
    console.log('✅ Redis Connected');

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
  } catch (error) {
    console.warn(`⚠️  Redis Connection Failed: ${error.message}`);
    console.warn('   Slot locking will use in-memory fallback.');
    redisClient = null;
  }
};

export const getRedis = () => redisClient;

export default { connectRedis, getRedis };
