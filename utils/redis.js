import redis from 'redis';
import { promisify } from 'util';

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
    return promisify(this._client.GET).bind(this._client)(key);
  }

  async set(key, value, duration) {
    await promisify(this._client.SETEX).bind(this._client)(key, duration, value);
  }

  async del(key) {
    await promisify(this._client.DEL).bind(this._client)(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
