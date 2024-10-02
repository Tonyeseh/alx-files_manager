import redis from 'redis';

class RedisClient {
  constructor() {
    this._connected = false;
    this._client = redis.createClient();
    this._client.on('error', (error) => {
      console.log(error);
    });

    this._client.on('connect', () => {
      this._connected = true;
    });
  }

  isAlive() {
    return this._connected;
  }

  async get(key) {
    const value = await this._client.get(key);
    return value;
  }

  async set(key, value, duration) {
    await this._client.set(key, value, { EX: duration });
  }

  async del(key) {
    await this._client.del(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
