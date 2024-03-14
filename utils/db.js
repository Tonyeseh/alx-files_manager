import {MongoClient} from 'mongodb'

const DB_HOST = process.env.DB_HOST || 'localhost'
const DB_PORT = process.env.DB_PORT || 27017
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager'

class DBClient {
    constructor () {
        this._client = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`, { useUnifiedTopology: true })
        this._client.connect()
    }

    isAlive () {
        return this._client.isConnected()
    }

    async nbUsers () {
        return this._client.db().collection('users').countDocuments()
    }

    async nbFiles () {
        return this._client.db().collection('files').countDocuments()
    }
}

const dbClient = new DBClient()
export default dbClient
