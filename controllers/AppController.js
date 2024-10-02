import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function getStatus(req, res) {
  const redisStatus = await redisClient.isAlive();
  const dbStatus = await dbClient.isAlive();

  const response = { redis: redisStatus, db: dbStatus };

  if (redisStatus && dbStatus) return res.json(response);
  return res.json(response).status(400);
}

async function getStats(req, res) {
  const nbFiles = await dbClient.nbFiles();
  const nbUsers = await dbClient.nbUsers();

  return res.json({ users: nbUsers, files: nbFiles });
}

export default {
  getStatus,
  getStats,
};
