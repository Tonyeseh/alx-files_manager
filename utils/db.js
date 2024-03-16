import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    this._client = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`, { useUnifiedTopology: true });
    this._client.connect((err, client) => {
      if (!err) {
        this.db = client;
      } else {
        console.log(err);
        this.db = false;
      }
    });
  }

  isAlive() {
    if (this.db) {
      console.log('returning true');
      return true;
    }
    console.log('returning false');
    return false;
  }

  async nbUsers() {
    return this._client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    return this._client.db().collection('files').countDocuments();
  }

  async usersCollection() {
    return this._client.db().collection('users');
  }

  async filesCollection() {
    return this._client.db().collection('files');
  }
}

const dbClient = new DBClient();
export default dbClient;
