import redis from 'redis'
import {promisify} from 'util'
class RedisClient {
    constructor () {
        this.client = redis.createClient()
        this.isConnected = true
        this.client.on('error', (error) => {
            console.log(`Connection failed: ${error}`)
            this.isConnected = false
        })
    }

    isAlive() {
        return this.isConnected
    }

    async get (key) {
        return promisify(this.client.GET).bind(this.client)(key)
    }

    async set (key, value, duration) {
        await promisify(this.client.SETEX).bind(this.client)(key, duration, value)
    }

    async del (key) {
        await promisify(this.client.DEL).bind(this.client)(key)
    }
}

const redisClient = new RedisClient()
export default redisClient