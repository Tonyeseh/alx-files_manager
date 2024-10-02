import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '27017';
const database = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    this._client = new MongoClient(`mongodb://${host}:${port}/${database}`, { useUnifiedTopology: true });
    this._client.connect((error, client) => {
      if (!error) this.db = client.db();
      else {
        console.log(error);
        this.db = null;
      }
    });
  }

  isAlive() {
    if (this.db) return true;
    return false;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
