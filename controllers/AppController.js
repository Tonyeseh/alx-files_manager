import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const getStatus = (req, res) => {
  const redis = redisClient.isAlive();
  const db = dbClient.isAlive();

  res.status(200).json({ redis, db });
};

const getStats = async (req, res) => {
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();

  res.status(200).json({ users, files });
};

const AppController = {
  getStats,
  getStatus,
};
export default AppController;
